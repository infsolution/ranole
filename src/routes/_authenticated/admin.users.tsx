import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listAllUsers, setUserAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listAllUsers);
  const setAdmin = useServerFn(setUserAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => fn() });

  const m = useMutation({
    mutationFn: (v: { userId: string; isAdmin: boolean }) => setAdmin({ data: v }),
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="grid place-items-center py-20"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-surface-elevated text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Nome</th>
            <th className="px-4 py-3 text-left">Criado em</th>
            <th className="px-4 py-3 text-left">Admin</th>
          </tr>
        </thead>
        <tbody>
          {data?.users.map((u: any) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.displayName ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {u.createdAt ? new Date(u.createdAt).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td className="px-4 py-3">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={u.isAdmin}
                    disabled={m.isPending}
                    onChange={(e) => m.mutate({ userId: u.id, isAdmin: e.target.checked })}
                  />
                  <span className={u.isAdmin ? "text-primary-glow" : "text-muted-foreground"}>
                    {u.isAdmin ? "Sim" : "Não"}
                  </span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
