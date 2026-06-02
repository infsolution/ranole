import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createPage, deletePage, duplicatePage, listMyPages, publishPage } from "@/lib/pages.functions";
import { templates } from "@/lib/templates";
import { Input } from "@/components/ui/input";
import { Plus, ExternalLink, Copy, Trash2, Globe, FileText, Loader2, BarChart3, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Indigo" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listMyPages);
  const create = useServerFn(createPage);
  const del = useServerFn(deletePage);
  const dup = useServerFn(duplicatePage);
  const pub = useServerFn(publishPage);

  const { data, isLoading } = useQuery({ queryKey: ["pages"], queryFn: () => list() });
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const mDel = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Página excluída"); qc.invalidateQueries({ queryKey: ["pages"] }); },
  });
  const mDup = useMutation({
    mutationFn: (id: string) => dup({ data: { id } }),
    onSuccess: () => { toast.success("Página duplicada"); qc.invalidateQueries({ queryKey: ["pages"] }); },
  });
  const mPub = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) => pub({ data: { id, publish } }),
    onSuccess: (_, v) => { toast.success(v.publish ? "Publicada" : "Despublicada"); qc.invalidateQueries({ queryKey: ["pages"] }); },
  });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const r = await create({ data: { name: name.trim() } });
      navigate({ to: "/editor/$id", params: { id: r.id } });
    } catch (err: any) {
      toast.error(err.message);
    } finally { setCreating(false); }
  }

  async function createFromTemplate(templateId: string, defaultName: string) {
    const n = prompt("Nome da nova página", defaultName);
    if (!n || !n.trim()) return;
    try {
      const r = await create({ data: { name: n.trim(), templateId } });
      toast.success("Página criada a partir do template");
      navigate({ to: "/editor/$id", params: { id: r.id } });
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Suas páginas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workspace: <span className="text-foreground">{data?.workspace?.name ?? "—"}</span>
            {data?.workspace?.slug && <span className="ml-2 rounded bg-surface-elevated px-1.5 py-0.5 text-xs">{data.workspace.slug}</span>}
          </p>
        </div>
        <form onSubmit={onCreate} className="flex w-full max-w-md items-center gap-2">
          <Input placeholder="Nome da nova página" value={name} onChange={e => setName(e.target.value)} />
          <button disabled={creating} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar
          </button>
        </form>
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Começar com um template</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {templates.map((t) => (
            <button key={t.id} onClick={() => createFromTemplate(t.id, t.name)}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-5 text-left transition hover:border-primary/60 hover:bg-surface-elevated hover:shadow-glow">
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary-glow">{t.category}</span>
              <h3 className="font-semibold">{t.name}</h3>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <span className="mt-auto pt-3 text-xs text-primary opacity-0 transition group-hover:opacity-100">Usar template →</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        {isLoading ? (
          <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !data?.pages.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-medium">Nenhuma página ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie sua primeira página acima.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.pages.map((p: any) => {
              const published = p.status === "published";
              const publicUrl = `/p/${data.workspace!.slug}/${p.slug}`;
              return (
                <div key={p.id} className="group rounded-2xl border border-border bg-surface p-5 transition hover:bg-surface-elevated">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{p.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">/{p.slug}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${published ? "bg-primary/20 text-primary-glow" : "bg-surface-elevated text-muted-foreground"}`}>
                      {published ? "publicada" : "rascunho"}
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Atualizada {new Date(p.updated_at).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Link to="/editor/$id" params={{ id: p.id }} className="inline-flex items-center gap-1 rounded-md bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                      Editar
                    </Link>
                    <button onClick={() => mPub.mutate({ id: p.id, publish: !published })}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs hover:bg-surface">
                      <Globe className="h-3.5 w-3.5" /> {published ? "Despublicar" : "Publicar"}
                    </button>
                    {published && (
                      <a href={publicUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs hover:bg-surface">
                        <ExternalLink className="h-3.5 w-3.5" /> Abrir
                      </a>
                    )}
                    <Link to="/analytics/$id" params={{ id: p.id }} className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground" title="Analytics">
                      <BarChart3 className="h-3.5 w-3.5" />
                    </Link>
                    <button onClick={() => mDup.mutate(p.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground" title="Duplicar">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { if (confirm("Excluir esta página?")) mDel.mutate(p.id); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
