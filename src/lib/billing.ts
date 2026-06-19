// Shared, client-safe billing plan config.
export type PlanId = "free" | "starter" | "pro" | "business";
export type Cycle = "monthly" | "yearly";

export const PLANS: {
  id: PlanId;
  name: string;
  tagline: string;
  features: string[];
  prices: Record<Cycle, { amountUsd: number; priceId: string | null }>;
  highlight?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Para começar a explorar",
    features: [
      "10 páginas publicadas",
      "Editor visual completo",
      "Templates prontos",
      "Tudo do Free",
      "Geração de conteúdo com IA",
      "Analytics de visualizações",
    ],
    prices: {
      monthly: { amountUsd: 0, priceId: null },
      yearly: { amountUsd: 0, priceId: null },
    },
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "Para colocar uma página no ar com sua marca",
    features: [
      "1 página publicada",
      "Domínio personalizado",
      "Templates premium",
      "Geração de conteúdo com IA",
      "Analytics de visualizações",
      "Suporte por e-mail",
    ],
    prices: {
      monthly: { amountUsd: 9, priceId: "price_1Tk1xnI8RpPxMEvQsprIOVdE" },
      yearly: { amountUsd: 90, priceId: "price_1Tk1yPI8RpPxMEvQi0gYLARk" },
    },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Para criadores e freelancers",
    features: [
      "Tudo do Free",
      "Domínio personalizado",
      "10 páginas publicadas",
      "Geração com IA prioritária",
      "Templates premium",
      "Suporte por e-mail",
    ],
    highlight: true,
    prices: {
      monthly: { amountUsd: 19, priceId: "price_1TjJkzI8RpPxMEvQBGoEocSs" },
      yearly: { amountUsd: 190, priceId: "price_1TjJlNI8RpPxMEvQZZ8luI6z" },
    },
  },
  {
    id: "business",
    name: "Business",
    tagline: "Para agências e times",
    features: [
      "Tudo do Pro",
      "100 páginas publicadas",
      "Cobrança anual com 2 meses grátis",
      "Suporte prioritário",
    ],
    prices: {
      monthly: { amountUsd: 49, priceId: "price_1TjJlmI8RpPxMEvQVvpw7Rmm" },
      yearly: { amountUsd: 490, priceId: "price_1TjJmDI8RpPxMEvQor9O3gLN" },
    },
  },
];

export function findPlanByPriceId(priceId: string | null | undefined) {
  if (!priceId) return null;
  for (const p of PLANS) {
    for (const c of ["monthly", "yearly"] as Cycle[]) {
      if (p.prices[c].priceId === priceId) return { plan: p, cycle: c };
    }
  }
  return null;
}
