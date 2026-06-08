import { createFileRoute } from "@tanstack/react-router";
import { findPlanByPriceId } from "@/lib/billing";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_SECRET_KEY;
        const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret || !whSecret) {
          return new Response("Missing Stripe env", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const rawBody = await request.text();

        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(secret, { apiVersion: "2025-08-27.basil" as never });

        let event: import("stripe").Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(rawBody, signature, whSecret);
        } catch (err) {
          console.error("[stripe-webhook] signature verification failed", err);
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        async function syncSubscription(sub: import("stripe").Stripe.Subscription) {
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

          // Resolve workspace_id: prefer subscription metadata, fallback to workspace lookup by customer id
          let workspaceId =
            (sub.metadata?.workspace_id as string | undefined) ||
            undefined;

          if (!workspaceId) {
            const { data: ws } = await supabaseAdmin
              .from("workspaces")
              .select("id")
              .eq("stripe_customer_id", customerId)
              .maybeSingle();
            workspaceId = ws?.id;
          }

          if (!workspaceId) {
            console.warn("[stripe-webhook] no workspace for customer", customerId);
            return;
          }

          // Ensure customer id is stored on the workspace
          await supabaseAdmin
            .from("workspaces")
            .update({ stripe_customer_id: customerId })
            .eq("id", workspaceId);

          const isActive = ["active", "trialing", "past_due"].includes(sub.status);
          const priceId = sub.items.data[0]?.price.id || null;
          const match = findPlanByPriceId(priceId);
          const plan = isActive ? match?.plan.id || "free" : "free";
          const cycle = isActive ? match?.cycle || null : null;

          const item = sub.items.data[0];
          const periodStart = item?.current_period_start ?? null;
          const periodEnd = item?.current_period_end ?? null;

          await supabaseAdmin.from("workspace_subscriptions").upsert(
            {
              workspace_id: workspaceId,
              plan,
              cycle,
              status: sub.status as never,
              stripe_subscription_id: sub.id,
              stripe_price_id: priceId,
              current_period_start: periodStart
                ? new Date(periodStart * 1000).toISOString()
                : null,
              current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
              cancel_at_period_end: sub.cancel_at_period_end,
              trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            },
            { onConflict: "workspace_id" },
          );
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as import("stripe").Stripe.Checkout.Session;
              const workspaceId = session.client_reference_id || undefined;
              const customerId =
                typeof session.customer === "string" ? session.customer : session.customer?.id;

              if (workspaceId && customerId) {
                await supabaseAdmin
                  .from("workspaces")
                  .update({ stripe_customer_id: customerId })
                  .eq("id", workspaceId);
              }

              if (session.subscription) {
                const subId =
                  typeof session.subscription === "string"
                    ? session.subscription
                    : session.subscription.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                if (workspaceId && !sub.metadata?.workspace_id) {
                  await stripe.subscriptions.update(subId, {
                    metadata: { ...sub.metadata, workspace_id: workspaceId },
                  });
                  sub.metadata = { ...sub.metadata, workspace_id: workspaceId };
                }
                await syncSubscription(sub);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
            case "customer.subscription.paused":
            case "customer.subscription.resumed": {
              const sub = event.data.object as import("stripe").Stripe.Subscription;
              await syncSubscription(sub);
              break;
            }
            case "invoice.payment_succeeded":
            case "invoice.payment_failed": {
              const invoice = event.data.object as import("stripe").Stripe.Invoice & {
                subscription?: string | import("stripe").Stripe.Subscription | null;
              };
              const subRef = invoice.subscription;
              if (subRef) {
                const subId = typeof subRef === "string" ? subRef : subRef.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                await syncSubscription(sub);
              }
              break;
            }
            default:
              // Ignore other events
              break;
          }
        } catch (err) {
          console.error("[stripe-webhook] handler error", event.type, err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
