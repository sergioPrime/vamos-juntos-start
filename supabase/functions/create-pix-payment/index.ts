import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PIX-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { planId, billingCycle = 'monthly', customerName, customerDocument, customerAddress } = await req.json();
    if (!planId) throw new Error("planId is required");
    if (!customerName) throw new Error("customerName is required");
    if (!customerDocument) throw new Error("customerDocument is required");
    if (!customerAddress) throw new Error("customerAddress is required");
    
    logStep("Request data received", { planId, billingCycle, customerName });

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch plan details
    const { data: plan, error: planError } = await supabaseService
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      logStep("Plan not found", { planId, error: planError });
      throw new Error("Plan not found or inactive");
    }
    
    logStep("Plan found", { planName: plan.name, price: plan.price });

    // Calculate price based on billing cycle
    const finalPrice = billingCycle === 'annual' ? Math.round(plan.price * 12 * 0.8) : plan.price;
    logStep("Price calculated", { originalPrice: plan.price, finalPrice, billingCycle });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
      
      // Update customer with Brazilian info
      await stripe.customers.update(customerId, {
        name: customerName,
        metadata: {
          supabase_user_id: user.id,
          cpf_cnpj: customerDocument,
        },
        address: {
          line1: customerAddress.line1,
          line2: customerAddress.line2 || "",
          city: customerAddress.city,
          state: customerAddress.state,
          postal_code: customerAddress.postal_code,
          country: "BR",
        },
      });
    } else {
      // Create new customer with Brazilian info
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: customerName,
        metadata: {
          supabase_user_id: user.id,
          cpf_cnpj: customerDocument,
        },
        address: {
          line1: customerAddress.line1,
          line2: customerAddress.line2 || "",
          city: customerAddress.city,
          state: customerAddress.state,
          postal_code: customerAddress.postal_code,
          country: "BR",
        },
      });
      customerId = newCustomer.id;
      logStep("New customer created", { customerId });
    }

    // Create a PaymentIntent for PIX
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalPrice * 100), // Convert to centavos
      currency: "brl",
      customer: customerId,
      payment_method_types: ["pix"],
      payment_method_options: {
        pix: {
          expires_after_seconds: 3600, // 1 hour expiration
        },
      },
      metadata: {
        plan_id: planId,
        user_id: user.id,
        billing_cycle: billingCycle,
        plan_name: plan.name,
        payment_type: "subscription_first_payment",
      },
      description: `${plan.name} - ${billingCycle === 'annual' ? 'Plano Anual (20% desconto)' : 'Plano Mensal'}`,
    });

    logStep("PaymentIntent created", { 
      paymentIntentId: paymentIntent.id, 
      clientSecret: paymentIntent.client_secret 
    });

    // Get PIX QR Code and copy-paste code
    let pixQrCode = null;
    let pixCode = null;

    if (paymentIntent.next_action?.type === "pix_display_qr_code") {
      pixQrCode = paymentIntent.next_action.pix_display_qr_code.image_url_png;
      pixCode = paymentIntent.next_action.pix_display_qr_code.data;
      logStep("PIX QR Code generated", { hasQrCode: !!pixQrCode, hasCode: !!pixCode });
    }

    return new Response(JSON.stringify({ 
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      pixQrCode,
      pixCode,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-pix-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
