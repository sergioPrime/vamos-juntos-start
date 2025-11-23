import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create a Supabase client using the anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { planId, billingCycle = 'monthly' } = await req.json();
    if (!planId) throw new Error("planId is required");
    logStep("Plan ID and billing cycle received", { planId, billingCycle });

    // Create Supabase client with service role key for database access
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch plan details from database
    const { data: plan, error: planError } = await supabaseService
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError) {
      logStep("Database error fetching plan", { planId, error: planError });
      throw new Error(`Database error: ${planError.message}`);
    }
    
    if (!plan) {
      logStep("Plan not found", { planId });
      throw new Error("Plan not found or inactive");
    }
    
    logStep("Plan found", { planName: plan.name, price: plan.price });

    // Calculate price based on billing cycle
    const finalPrice = billingCycle === 'annual' ? Math.round(plan.price * 12 * 0.8) : plan.price;
    const interval = billingCycle === 'annual' ? 'year' : 'month';
    
    logStep("Price calculated", { originalPrice: plan.price, finalPrice, interval, billingCycle });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { 
              name: plan.name,
              description: `${plan.description}${billingCycle === 'annual' ? ' - Plano Anual (20% desconto)' : ' - Plano Mensal'}`
            },
            unit_amount: Math.round(finalPrice * 100), // Convert to centavos
            recurring: { interval: interval as 'month' | 'year' },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      payment_method_types: ["card", "boleto"],
      payment_method_options: {
        boleto: {
          expires_after_days: 7,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      success_url: `${req.headers.get("origin")}/settings?tab=planos&success=true`,
      cancel_url: `${req.headers.get("origin")}/settings?tab=planos&canceled=true`,
      metadata: {
        plan_id: planId,
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});