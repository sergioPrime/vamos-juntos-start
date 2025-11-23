import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) {
      logStep("WARNING: STRIPE_WEBHOOK_SECRET not set, skipping signature verification");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified", { eventType: event.type });
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      event = JSON.parse(body);
      logStep("Processing webhook without signature verification", { eventType: event.type });
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id, 
          customerId: session.customer,
          subscriptionId: session.subscription 
        });

        if (session.mode === "subscription" && session.subscription) {
          const userId = session.metadata?.user_id;
          const planId = session.metadata?.plan_id;
          
          if (!userId || !planId) {
            logStep("Missing metadata in session", { userId, planId });
            break;
          }

          await supabaseClient
            .from("user_organizations")
            .update({
              subscription_plan_id: planId,
              subscription_status: "active",
              subscription_started_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          logStep("Updated subscription for user", { userId, planId });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { 
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: subscription.customer
        });

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if ('email' in customer && customer.email) {
          const { data: userOrg } = await supabaseClient
            .from("user_organizations")
            .select("user_id, org_id")
            .eq("user_id", (await supabaseClient.auth.admin.getUserByEmail(customer.email)).data.user?.id || "")
            .single();

          if (userOrg) {
            const planId = subscription.metadata?.plan_id;
            
            await supabaseClient
              .from("user_organizations")
              .update({
                subscription_plan_id: planId || null,
                subscription_status: subscription.status === "active" ? "active" : 
                                   subscription.status === "trialing" ? "trialing" : "inactive",
              })
              .eq("user_id", userOrg.user_id);

            logStep("Subscription status updated", { 
              userId: userOrg.user_id, 
              status: subscription.status 
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { 
          subscriptionId: subscription.id,
          customerId: subscription.customer
        });

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if ('email' in customer && customer.email) {
          const { data: user } = await supabaseClient.auth.admin.getUserByEmail(customer.email);
          
          if (user.user) {
            await supabaseClient
              .from("user_organizations")
              .update({
                subscription_plan_id: null,
                subscription_status: "inactive",
                subscription_started_at: null,
              })
              .eq("user_id", user.user.id);

            logStep("Subscription removed for user", { userId: user.user.id });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment succeeded", { 
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_paid
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", { 
          invoiceId: invoice.id,
          customerId: invoice.customer,
          attempt: invoice.attempt_count
        });

        const customer = await stripe.customers.retrieve(invoice.customer as string);
        if ('email' in customer && customer.email) {
          const { data: user } = await supabaseClient.auth.admin.getUserByEmail(customer.email);
          
          if (user.user && invoice.attempt_count >= 3) {
            await supabaseClient
              .from("user_organizations")
              .update({
                subscription_status: "past_due",
              })
              .eq("user_id", user.user.id);

            logStep("Subscription marked as past_due", { userId: user.user.id });
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
