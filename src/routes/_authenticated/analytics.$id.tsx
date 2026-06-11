import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Eye, MousePointerClick, Users, Loader2, ExternalLink } from "lucide-react";
import { getPageAnalytics } from "@/lib/pages.functions";

export const Route = createFileRoute("/_authenticated/analytics/$id")({
  head: () => ({ meta: [{ title: "Analytics — Ranole" }] }),
  component: AnalyticsPage,
});

const RANGES = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function AnalyticsPage() {
  const { id } = Route.useParams();
  const fetchAnalytics = useServerFn(getPageAnalytics);
  const [days, setDays] = useState(7);

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", id, days],
    queryFn: () => fetchAnalytics({ data: { id, days } }),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center text-muted-foreground">
        Erro ao carregar analytics: {(error as Error)?.message}
      </div>
    );
  }

  const { page, totals, series, topLinks } = data;
  const ctrPct = (totals.ctr * 100).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold">{page.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            /{page.slug} ·{" "}
            <span className={page.status === "published" ? "text-primary-glow" : ""}>
              {page.status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded px-3 py-1.5 text-xs transition ${
                days === r.days
                  ? "bg-gradient-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Eye className="h-4 w-4" />} label="Visualizações" value={totals.views} />
        <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Cliques" value={totals.clicks} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Sessões únicas" value={totals.sessions} />
        <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="CTR" value={`${ctrPct}%`} />
      </div>

      {/* Chart */}
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Tráfego ao longo do tempo</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--surface-elevated))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                fill="url(#gv)"
                strokeWidth={2}
                name="Views"
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="hsl(var(--accent))"
                fill="url(#gc)"
                strokeWidth={2}
                name="Clicks"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top links */}
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Links mais clicados</h2>
        {topLinks.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sem cliques no período.</p>
        ) : (
          <ul className="divide-y divide-border">
            {topLinks.map((l) => (
              <li key={l.href} className="flex items-center justify-between gap-4 py-3">
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 items-center gap-2 truncate text-sm text-foreground hover:text-primary-glow"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{l.href}</span>
                </a>
                <span className="shrink-0 rounded-full bg-surface-elevated px-2 py-0.5 text-xs text-muted-foreground">
                  {l.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}
