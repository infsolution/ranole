// Shared, client-safe billing plan config.
export type PlanId = "free" | "pro" | "business";
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
    id: "pro",
    name: "Pro",
    tagline: "Para criadores e freelancers",
    features: [
      "100 páginas publicadas",
      "Domínio personalizado",
      "Tudo do Pro",
      "Geração com IA prioritária",
      "Templates premium",
      "Suporte por e-mail",
    ],
    highlight: true,
    prices: {
      monthly: { amountUsd: 19, priceId: "price_1TfdELI8RpPxMEvQLeJMq7NS" },
      yearly: { amountUsd: 190, priceId: "price_1TfdErI8RpPxMEvQCunWUwjP" },
    },
  },
  {
    id: "business",
    name: "Business",
    tagline: "Para agências e times",
    features: [
      "Tudo do Pro",
      "Domínio personalizado",
      "100 páginas publicadas",
      "Cobrança anual com 2 meses grátis",
      "Suporte prioritário",
    ],
    prices: {
      monthly: { amountUsd: 49, priceId: "price_1TfdFFI8RpPxMEvQHJ5gMvJl" },
      yearly: { amountUsd: 490, priceId: "price_1TfdFjI8RpPxMEvQ0UnwLs0z" },
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
