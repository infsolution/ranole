import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OverviewPage,
});

function Stat({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value ?? "—"}</p>
    </div>
  );
}

function OverviewPage() {
  const fn = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });

  if (isLoading) {
    return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Stat label="Usuários" value={data.usersCount} />
      <Stat label="Workspaces" value={data.workspacesCount} />
      <Stat label="Páginas totais" value={data.pagesCount} />
      <Stat label="Páginas publicadas" value={data.publishedCount} />
      <Stat label="Páginas em rascunho" value={data.draftCount} />
      <Stat label="Domínios customizados" value={data.domainsCount} />
      <Stat label="Free" value={data.plansCount.free ?? 0} />
      <Stat label="Pro" value={data.plansCount.pro ?? 0} />
      <Stat label="Business" value={data.plansCount.business ?? 0} />
    </div>
  );
}
