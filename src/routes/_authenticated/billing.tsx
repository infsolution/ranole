import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, type Cycle, type PlanId } from "@/lib/billing";
import {
  createCheckoutSession,
  getMySubscription,
  openCustomerPortal,
  refreshSubscription,
} from "@/lib/billing.functions";

export const Route = createFileRoute("/_authenticated/billing")({
  validateSearch: z.object({
    status: z.enum(["success", "canceled"]).optional(),
    session_id: z.string().optional(),
  }),
  component: BillingPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro ao carregar billing: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Página não encontrada.</div>,
});

function BillingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [cycle, setCycle] = useState<Cycle>("monthly");

  const fetchSub = useServerFn(getMySubscription);
  const refreshFn = useServerFn(refreshSubscription);
  const checkoutFn = useServerFn(createCheckoutSession);
  const portalFn = useServerFn(openCustomerPortal);

  const subQ = useQuery({ queryKey: ["my-subscription"], queryFn: () => fetchSub() });

  const mRefresh = useMutation({
    mutationFn: () => refreshFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-subscription"] }),
  });

  const mCheckout = useMutation({
    mutationFn: (priceId: string) => checkoutFn({ data: { priceId } }),
    onSuccess: ({ url }) => { if (url) window.location.href = url; },
    onError: (e: any) => toast.error(e?.message || "Falha ao iniciar checkout"),
  });

  const mPortal = useMutation({
    mutationFn: () => portalFn(),
    onSuccess: ({ url }) => { if (url) window.location.href = url; },
    onError: (e: any) => toast.error(e?.message || "Falha ao abrir portal"),
  });

  // Auto-sync after returning from Stripe checkout
  useEffect(() => {
    if (search.status === "success") {
      toast.success("Pagamento confirmado! Sincronizando assinatura…");
      mRefresh.mutate();
      const t = setTimeout(() => navigate({ to: "/billing", search: {}, replace: true }), 1500);
      return () => clearTimeout(t);
    }
    if (search.status === "canceled") {
      toast.info("Checkout cancelado.");
      navigate({ to: "/billing", search: {}, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.status]);

  const current = subQ.data?.subscription;
  const currentPlan: PlanId = (current?.plan as PlanId) || "free";

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Billing</p>
          <h1 className="font-display text-3xl">Planos & assinatura</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha o plano ideal para o seu workspace. Cobrança via Stripe.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => mRefresh.mutate()} disabled={mRefresh.isPending}>
            {mRefresh.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sincronizar
          </Button>
          {current && current.plan !== "free" && (
            <Button variant="outline" size="sm" onClick={() => mPortal.mutate()} disabled={mPortal.isPending}>
              {mPortal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Gerenciar
            </Button>
          )}
        </div>
      </header>

      {current && (
        <section className="mb-8 rounded-xl border border-border bg-surface-elevated p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Plano atual</p>
              <p className="font-display text-xl capitalize">
                {current.plan} {current.cycle ? `· ${current.cycle === "monthly" ? "mensal" : "anual"}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Status: <span className="capitalize">{current.status}</span>
                {current.current_period_end && (
                  <> · {current.cancel_at_period_end ? "Encerra em" : "Renova em"}{" "}
                    {new Date(current.current_period_end).toLocaleDateString("pt-BR")}</>
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="mb-6 inline-flex rounded-full border border-border bg-surface-elevated p-1 text-sm">
        {(["monthly", "yearly"] as Cycle[]).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`px-4 py-1.5 rounded-full transition-colors ${cycle === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {c === "monthly" ? "Mensal" : "Anual"}
            {c === "yearly" && <span className="ml-2 text-xs opacity-80">2 meses grátis</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => {
          const price = p.prices[cycle];
          const isCurrent = currentPlan === p.id;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${p.highlight ? "border-primary bg-gradient-to-b from-primary/5 to-transparent" : "border-border bg-surface-elevated"}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> Mais popular
                </div>
              )}
              <div className="mb-4">
                <p className="font-display text-2xl">{p.name}</p>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
              </div>
              <div className="mb-5">
                <span className="font-display text-4xl">${price.amountUsd}</span>
                <span className="ml-1 text-sm text-muted-foreground">
                  /{cycle === "monthly" ? "mês" : "ano"}
                </span>
              </div>
              <ul className="mb-6 space-y-2 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Button variant="outline" disabled className="w-full">Plano atual</Button>
              ) : p.id === "free" ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => mPortal.mutate()}
                  disabled={mPortal.isPending || !current || current.plan === "free"}
                >
                  {currentPlan !== "free" ? "Voltar para Free" : "Plano gratuito"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={p.highlight ? "default" : "secondary"}
                  onClick={() => price.priceId && mCheckout.mutate(price.priceId)}
                  disabled={mCheckout.isPending || !price.priceId}
                >
                  {mCheckout.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {currentPlan !== "free" ? "Mudar para " + p.name : "Assinar " + p.name}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Pagamentos processados com segurança pelo Stripe. Cancele a qualquer momento.
      </p>
    </main>
  );
}
