import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listAllWorkspaces, setWorkspacePlanAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/workspaces")({
  component: WorkspacesPage,
});

function WorkspacesPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listAllWorkspaces);
  const setPlan = useServerFn(setWorkspacePlanAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["admin-workspaces"], queryFn: () => fn() });

  const m = useMutation({
    mutationFn: (v: { workspaceId: string; plan: "free" | "pro" | "business" }) => setPlan({ data: v }),
    onSuccess: () => { toast.success("Plano atualizado"); qc.invalidateQueries({ queryKey: ["admin-workspaces"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Workspace</th>
            <th className="px-4 py-3 text-left">Slug</th>
            <th className="px-4 py-3 text-left">Plano</th>
            <th className="px-4 py-3 text-left">Páginas</th>
            <th className="px-4 py-3 text-left">Domínio</th>
          </tr>
        </thead>
        <tbody>
          {data?.workspaces.map((w: any) => (
            <tr key={w.id} className="border-t border-border">
              <td className="px-4 py-3">{w.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{w.slug}</td>
              <td className="px-4 py-3">
                <select
                  value={w.plan}
                  disabled={m.isPending}
                  onChange={(e) => m.mutate({ workspaceId: w.id, plan: e.target.value as any })}
                  className="rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                </select>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {w.pagesPublished}/{w.pagesTotal}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {w.custom_domain ? (
                  <span>
                    {w.custom_domain}{" "}
                    <span className="ml-1 rounded bg-surface-elevated px-1.5 py-0.5 text-[10px]">
                      {w.custom_domain_status}
                    </span>
                  </span>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
