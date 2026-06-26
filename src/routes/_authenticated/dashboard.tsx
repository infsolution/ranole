import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createPage, deletePage, duplicatePage, listMyPages, publishPage, setHomePage } from "@/lib/pages.functions";
import { templates } from "@/lib/templates";
import { Input } from "@/components/ui/input";
import { Plus, ExternalLink, Copy, Trash2, Globe, FileText, Loader2, BarChart3, LayoutTemplate, Search, Home } from "lucide-react";
import { toast } from "sonner";
import { TemplateThumbnail } from "@/components/TemplateThumbnail";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Ranole" }] }),
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
  const home = useServerFn(setHomePage);

  const { data, isLoading } = useQuery({ queryKey: ["pages"], queryFn: () => list() });
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");

  const filteredPages = useMemo(() => {
    if (!data?.pages) return [];
    let pages = data.pages;
    if (statusFilter !== "all") {
      pages = pages.filter((p: any) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      pages = pages.filter((p: any) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
    }
    return pages;
  }, [data?.pages, statusFilter, search]);

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
  const mHome = useMutation({
    mutationFn: (id: string) => home({ data: { id } }),
    onSuccess: () => { toast.success("Definida como página inicial do domínio"); qc.invalidateQueries({ queryKey: ["pages"] }); },
    onError: (e: any) => toast.error(e?.message || "Falha"),
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold sm:text-3xl whitespace-nowrap">Suas páginas</h1>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            Workspace: <span className="text-foreground">{data?.workspace?.name ?? "—"}</span>
            {data?.workspace?.slug && <span className="ml-2 rounded bg-surface-elevated px-1.5 py-0.5 text-xs">{data.workspace.slug}</span>}
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:max-w-md">
          <Link to="/settings/domains" aria-label="Domínios" className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs hover:bg-surface" title="Domínio customizado">
            <Globe className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Domínios</span>
          </Link>
          <form onSubmit={onCreate} className="flex min-w-0 flex-1 items-center gap-2">
            <Input placeholder="Nome da nova página" value={name} onChange={e => setName(e.target.value)} className="min-w-0 flex-1" />
            <button disabled={creating} aria-label="Criar página" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60 sm:px-4">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} <span className="hidden sm:inline">Criar</span>
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Começar com um template</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {templates.map((t) => (
            <button key={t.id} onClick={() => createFromTemplate(t.id, t.name)}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 text-left transition hover:border-primary/60 hover:bg-surface-elevated hover:shadow-glow">
              <TemplateThumbnail template={t} />
              <div className="flex flex-col gap-1.5 px-1 pb-1">
                <span className="w-fit rounded-full bg-primary/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary-glow">{t.category}</span>
                <h3 className="font-semibold">{t.name}</h3>
                <p className="text-xs text-muted-foreground">{t.description}</p>
                <span className="mt-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">Usar template →</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
            {([["all", "Todas"], ["draft", "Rascunho"], ["published", "Publicada"]] as const).map(([key, label]) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`rounded px-3 py-1.5 text-xs transition ${statusFilter === key ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar páginas..." value={search} onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : !data?.pages.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-medium">Nenhuma página ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie sua primeira página acima.</p>
          </div>
        ) : !filteredPages.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma página encontrada para os filtros atuais.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPages.map((p: any) => {
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
