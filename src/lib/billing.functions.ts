import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader } from "@tanstack/react-start/server";
import { findPlanByPriceId } from "@/lib/billing";

/* Returns the current user's default workspace + subscription summary. */
export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id, name, slug, stripe_customer_id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!ws) return { workspace: null, subscription: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("workspace_subscriptions")
      .select("*")
      .eq("workspace_id", ws.id)
      .maybeSingle();

    return {
      workspace: { id: ws.id, name: ws.name, slug: ws.slug, hasCustomer: !!ws.stripe_customer_id },
      subscription: sub
        ? {
            plan: sub.plan,
            cycle: sub.cycle,
            status: sub.status,
            current_period_end: sub.current_period_end,
            cancel_at_period_end: sub.cancel_at_period_end,
            stripe_price_id: sub.stripe_price_id,
          }
        : null,
    };
  });

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY ausente. Conecte o Stripe primeiro.");
  const Stripe = (await import("stripe")).default;
  return new Stripe(key, { apiVersion: "2025-08-27.basil" as never });
}

function originFrom() {
  const o = getRequestHeader("origin") || getRequestHeader("referer");
  if (!o) return "http://localhost:3000";
  try { return new URL(o).origin; } catch { return "http://localhost:3000"; }
}

/* Create a Stripe Checkout session for the given price. */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ priceId: z.string().min(3) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as any)?.email as string | undefined;

    const { data: ws } = await supabase
      .from("workspaces")
      .select("id, stripe_customer_id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!ws) throw new Error("Workspace não encontrado");

    const stripe = await getStripe();
    let customerId = ws.stripe_customer_id || null;
    if (!customerId && email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data[0]?.id || null;
    }

    const origin = originFrom();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId || undefined,
      customer_email: customerId ? undefined : email,
      client_reference_id: ws.id,
      line_items: [{ price: data.priceId, quantity: 1 }],
      success_url: `${origin}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing?status=canceled`,
      allow_promotion_codes: true,
      subscription_data: { metadata: { workspace_id: ws.id } },
    });

    return { url: session.url };
  });

/* Open Stripe Customer Portal so the user can manage the subscription. */
export const openCustomerPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as any)?.email as string | undefined;

    const { data: ws } = await supabase
      .from("workspaces")
      .select("id, stripe_customer_id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!ws) throw new Error("Workspace não encontrado");

    const stripe = await getStripe();
    let customerId = ws.stripe_customer_id;
    if (!customerId && email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data[0]?.id || null;
    }
    if (!customerId) throw new Error("Nenhuma assinatura encontrada. Faça um upgrade primeiro.");

    const origin = originFrom();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    });
    return { url: portal.url };
  });

/* Pulls subscription state from Stripe and syncs to the DB.
 * Called after checkout success and on the billing page mount. */
export const refreshSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as any)?.email as string | undefined;

    const { data: ws } = await supabase
      .from("workspaces")
      .select("id, stripe_customer_id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!ws) return { synced: false };

    const stripe = await getStripe();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let customerId = ws.stripe_customer_id;
    if (!customerId && email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data[0]?.id || null;
      if (customerId) {
        await supabaseAdmin.from("workspaces").update({ stripe_customer_id: customerId }).eq("id", ws.id);
      }
    }

    if (!customerId) {
      await supabaseAdmin
        .from("workspace_subscriptions")
        .upsert({ workspace_id: ws.id, plan: "free", status: "active", stripe_subscription_id: null, stripe_price_id: null, cycle: null, cancel_at_period_end: false }, { onConflict: "workspace_id" });
      return { synced: true, plan: "free" };
    }

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 5 });
    const active = subs.data.find((s) => ["active", "trialing", "past_due"].includes(s.status));

    if (!active) {
      await supabaseAdmin
        .from("workspace_subscriptions")
        .upsert({ workspace_id: ws.id, plan: "free", status: "active", stripe_subscription_id: null, stripe_price_id: null, cycle: null, cancel_at_period_end: false }, { onConflict: "workspace_id" });
      return { synced: true, plan: "free" };
    }

    const priceId = active.items.data[0]?.price.id || null;
    const match = findPlanByPriceId(priceId);
    const plan = match?.plan.id || "free";
    const cycle = match?.cycle || null;

    await supabaseAdmin.from("workspace_subscriptions").upsert(
      {
        workspace_id: ws.id,
        plan,
        cycle,
        status: active.status as never,
        stripe_subscription_id: active.id,
        stripe_price_id: priceId,
        current_period_start: new Date(active.current_period_start * 1000).toISOString(),
        current_period_end: new Date(active.current_period_end * 1000).toISOString(),
        cancel_at_period_end: active.cancel_at_period_end,
        trial_end: active.trial_end ? new Date(active.trial_end * 1000).toISOString() : null,
      },
      { onConflict: "workspace_id" },
    );

    return { synced: true, plan, cycle };
  });
