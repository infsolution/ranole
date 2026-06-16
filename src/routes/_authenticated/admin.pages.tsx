import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { listAllPages } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  component: PagesPage,
});

function PagesPage() {
  const fn = useServerFn(listAllPages);
  const { data, isLoading } = useQuery({ queryKey: ["admin-pages"], queryFn: () => fn() });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Página</th>
            <th className="px-4 py-3 text-left">Workspace</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Atualizada</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {data?.pages.map((p: any) => {
            const isPub = p.status === "published";
            const url = p.workspace ? `/p/${p.workspace.slug}/${p.slug}` : null;
            return (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">
                  {p.name}
                  <span className="ml-2 text-xs text-muted-foreground">/{p.slug}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.workspace?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${isPub ? "bg-primary/20 text-primary-glow" : "bg-surface-elevated text-muted-foreground"}`}>
                    {isPub ? "publicada" : "rascunho"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right">
                  {isPub && url && (
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Abrir
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
