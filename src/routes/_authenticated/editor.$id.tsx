import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ChevronUp, ChevronDown, Trash2, Save, Globe, Plus, Loader2, GripVertical, Smartphone, Monitor, Tablet, Undo2, Redo2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getPage, publishPage, savePage } from "@/lib/pages.functions";
import { generatePageFromPrompt } from "@/lib/ai.functions";
import { blockList, blockRegistry } from "@/lib/blocks/registry";
import { newId, type PageContent, type Section, type SectionType } from "@/lib/blocks/types";
import { RenderPage } from "@/components/blocks/RenderPage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/editor/$id")({
  head: () => ({ meta: [{ title: "Editor — Ranole" }] }),
  component: Editor,
});

type Device = "desktop" | "tablet" | "mobile";

function Editor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const get = useServerFn(getPage);
  const save = useServerFn(savePage);
  const pub = useServerFn(publishPage);
  const aiGen = useServerFn(generatePageFromPrompt);

  const { data: page, isLoading } = useQuery({ queryKey: ["page", id], queryFn: () => get({ data: { id } }) });

  const [name, setName] = useState("");
  const [content, setContent] = useState<PageContent>({ sections: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMode, setAiMode] = useState<"replace" | "append">("replace");
  const [seo, setSeo] = useState({ title: "", description: "", ogImage: "" });
  const [rightTab, setRightTab] = useState<"block" | "seo">("block");
  const history = useRef<PageContent[]>([]);
  const future = useRef<PageContent[]>([]);
  const dirty = useRef(false);

  useEffect(() => {
    if (page) {
      setName(page.name);
      setContent((page.content as unknown as PageContent) || { sections: [] });
      const pageSeo = (page as any).seo || {};
      setSeo({ title: pageSeo.title || "", description: pageSeo.description || "", ogImage: pageSeo.ogImage || "" });
      history.current = [];
      future.current = [];
      dirty.current = false;
    }
  }, [page]);

  function pushHistory(prev: PageContent) {
    history.current.push(prev);
    if (history.current.length > 50) history.current.shift();
    future.current = [];
  }
  function update(next: PageContent) {
    pushHistory(content);
    setContent(next);
    dirty.current = true;
  }
  function undo() {
    const prev = history.current.pop();
    if (prev) { future.current.push(content); setContent(prev); dirty.current = true; }
  }
  function redo() {
    const nxt = future.current.pop();
    if (nxt) { history.current.push(content); setContent(nxt); dirty.current = true; }
  }

  const mSave = useMutation({
    mutationFn: () => save({ data: { id, content, name, seo } }),
    onSuccess: () => { dirty.current = false; toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["pages"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const mPub = useMutation({
    mutationFn: (publish: boolean) => pub({ data: { id, publish } }),
    onSuccess: (_, publish) => { toast.success(publish ? "Página publicada" : "Despublicada"); qc.invalidateQueries({ queryKey: ["page", id] }); qc.invalidateQueries({ queryKey: ["pages"] }); },
  });
  const mAi = useMutation({
    mutationFn: () => aiGen({ data: { prompt: aiPrompt } }),
    onSuccess: (res) => {
      const generated = res.content as PageContent;
      const next: PageContent = aiMode === "replace"
        ? generated
        : { sections: [...content.sections, ...generated.sections] };
      update(next);
      setAiOpen(false);
      setAiPrompt("");
      toast.success("Página gerada pela IA");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Autosave (debounced)
  useEffect(() => {
    if (!page) return;
    const t = setTimeout(() => { if (dirty.current) mSave.mutate(); }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, name, seo]);

  function addBlock(type: SectionType) {
    const sec: Section = { id: newId(), type, props: { ...blockRegistry[type].defaultProps } };
    update({ sections: [...content.sections, sec] });
    setSelectedId(sec.id);
  }
  function removeBlock(sid: string) {
    update({ sections: content.sections.filter(s => s.id !== sid) });
    if (selectedId === sid) setSelectedId(null);
  }
  function move(sid: string, dir: -1 | 1) {
    const idx = content.sections.findIndex(s => s.id === sid);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= content.sections.length) return;
    update({ sections: arrayMove(content.sections, idx, j) });
  }
  function patchProps(sid: string, patch: Record<string, unknown>) {
    update({
      sections: content.sections.map(s => s.id === sid ? { ...s, props: { ...s.props, ...patch } } : s),
    });
  }

  const selected = useMemo(() => content.sections.find(s => s.id === selectedId) || null, [content, selectedId]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = content.sections.findIndex(s => s.id === active.id);
    const newIdx = content.sections.findIndex(s => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    update({ sections: arrayMove(content.sections, oldIdx, newIdx) });
  }

  if (isLoading || !page) {
    return <div className="grid min-h-[60vh] place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  const published = page.status === "published";
  const publicUrl = page.workspace_slug ? `/p/${page.workspace_slug}/${page.slug}` : null;
  const deviceWidth = device === "mobile" ? 390 : device === "tablet" ? 768 : "100%";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Input value={name} onChange={e => { setName(e.target.value); dirty.current = true; }}
            className="h-8 max-w-xs bg-transparent text-sm font-medium" />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([d, Icon]) => (
            <button key={d} onClick={() => setDevice(d)}
              className={`rounded p-1.5 ${device === d ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={!history.current.length} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground disabled:opacity-40">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={redo} disabled={!future.current.length} className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground disabled:opacity-40">
            <Redo2 className="h-4 w-4" />
          </button>
          <button onClick={() => setAiOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20">
            <Sparkles className="h-3.5 w-3.5" /> IA
          </button>
          <button onClick={() => mSave.mutate()} disabled={mSave.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-sm hover:bg-surface">
            {mSave.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar
          </button>
          <button onClick={() => mPub.mutate(!published)}
            className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-glow">
            <Globe className="h-3.5 w-3.5" /> {published ? "Despublicar" : "Publicar"}
          </button>
          {published && publicUrl && (
            <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground">Ver pública ↗</a>
          )}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[260px_1fr_320px] overflow-hidden">
        {/* Left: blocks library + structure */}
        <aside className="overflow-y-auto border-r border-border bg-surface p-3">
          <div className="mb-4">
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Adicionar bloco</h3>
            <div className="grid grid-cols-2 gap-2">
              {blockList.map(b => (
                <button key={b.type} onClick={() => addBlock(b.type)}
                  className="flex flex-col items-center gap-1 rounded-md border border-border bg-background p-3 text-xs hover:bg-surface-elevated">
                  <b.icon className="h-4 w-4" /> {b.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estrutura</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={content.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {content.sections.map(s => (
                    <SortableRow key={s.id} section={s} selected={selectedId === s.id}
                      onSelect={() => setSelectedId(s.id)}
                      onMoveUp={() => move(s.id, -1)} onMoveDown={() => move(s.id, 1)}
                      onDelete={() => removeBlock(s.id)} />
                  ))}
                  {!content.sections.length && (
                    <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Adicione um bloco para começar.
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </aside>

        {/* Center: preview */}
        <main className="overflow-y-auto bg-background/40 p-6">
          <div className="mx-auto rounded-2xl border border-border bg-background shadow-elegant transition-all"
            style={{ width: deviceWidth, maxWidth: "100%" }}>
            <div className="overflow-hidden rounded-2xl">
              <RenderPage content={content} />
            </div>
          </div>
        </main>

        {/* Right: properties */}
        <aside className="overflow-y-auto border-l border-border bg-surface p-4">
          <div className="mb-4 flex items-center gap-1 rounded-md border border-border bg-background p-1">
            <button onClick={() => setRightTab("block")}
              className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${rightTab === "block" ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Bloco
            </button>
            <button onClick={() => setRightTab("seo")}
              className={`flex-1 rounded px-2 py-1 text-xs font-medium transition ${rightTab === "seo" ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              SEO
            </button>
          </div>
          {rightTab === "block" ? (
            selected ? (
              <PropertiesPanel section={selected} workspaceId={(page as any).workspace_id} onPatch={(p) => patchProps(selected.id, p)} />
            ) : (
              <div className="text-sm text-muted-foreground">Selecione um bloco para editar suas propriedades.</div>
            )
          ) : (
            <SeoPanel seo={seo} onChange={(next) => { setSeo(next); dirty.current = true; }} />
          )}
        </aside>
      </div>

      <Dialog open={aiOpen} onOpenChange={(o) => !mAi.isPending && setAiOpen(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Gerar com IA
            </DialogTitle>
            <DialogDescription>
              Descreva o produto, público e oferta. A IA monta uma página completa em segundos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              rows={6}
              placeholder="Ex.: Landing para curso online de finanças pessoais para iniciantes. Foco em transformação em 30 dias. Tom motivador e direto."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={mAi.isPending}
            />
            <div className="flex gap-2 text-xs">
              {([["replace", "Substituir página"], ["append", "Adicionar seções"]] as const).map(([m, label]) => (
                <button key={m} type="button" onClick={() => setAiMode(m)}
                  className={`rounded-md border px-3 py-1.5 ${aiMode === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setAiOpen(false)} disabled={mAi.isPending}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-elevated">
              Cancelar
            </button>
            <button type="button" onClick={() => mAi.mutate()} disabled={mAi.isPending || aiPrompt.trim().length < 4}
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60">
              {mAi.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {mAi.isPending ? "Gerando..." : "Gerar página"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableRow({ section, selected, onSelect, onMoveUp, onMoveDown, onDelete }: {
  section: Section; selected: boolean;
  onSelect: () => void; onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const def = blockRegistry[section.type];
  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm ${selected ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-surface-elevated"}`}>
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground"><GripVertical className="h-3.5 w-3.5" /></button>
      <button onClick={onSelect} className="flex flex-1 items-center gap-2 truncate text-left">
        <def.icon className="h-3.5 w-3.5 text-muted-foreground" /> {def.label}
      </button>
      <button onClick={onMoveUp} className="rounded p-0.5 text-muted-foreground hover:bg-surface hover:text-foreground"><ChevronUp className="h-3.5 w-3.5" /></button>
      <button onClick={onMoveDown} className="rounded p-0.5 text-muted-foreground hover:bg-surface hover:text-foreground"><ChevronDown className="h-3.5 w-3.5" /></button>
      <button onClick={onDelete} className="rounded p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function PropertiesPanel({ section, workspaceId, onPatch }: { section: Section; workspaceId?: string; onPatch: (p: Record<string, unknown>) => void }) {
  const def = blockRegistry[section.type];
  const p: any = section.props;
  const colors: any = p.colors || {};
  const setColor = (key: "bg" | "text" | "border" | "shadow", value: string) => {
    const next = { ...colors, [key]: value };
    if (!value) delete next[key];
    onPatch({ colors: next });
  };
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Bloco</div>
        <div className="mt-1 flex items-center gap-2 font-semibold"><def.icon className="h-4 w-4" /> {def.label}</div>
      </div>

      <details className="rounded-md border border-border bg-background" open>
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cores
        </summary>
        <div className="space-y-2 border-t border-border p-3">
          {([
            ["bg", "Fundo"],
            ["text", "Texto"],
            ["border", "Borda"],
            ["shadow", "Sombra"],
          ] as const).map(([k, label]) => (
            <div key={k} className="flex items-center gap-2">
              <label className="flex-1 text-xs text-muted-foreground">{label}</label>
              <input
                type="color"
                value={colors[k] || "#000000"}
                onChange={(e) => setColor(k, e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={colors[k] || ""}
                onChange={(e) => setColor(k, e.target.value)}
                placeholder="—"
                className="h-7 w-24 text-xs"
              />
              {colors[k] && (
                <button onClick={() => setColor(k, "")} className="text-xs text-muted-foreground hover:text-destructive">×</button>
              )}
            </div>
          ))}
        </div>
      </details>


      {def.schema.map(field => {
        if (field.type === "text") {
          return (
            <Field key={field.key} label={field.label}>
              <Input placeholder={field.placeholder} value={p[field.key] ?? ""} onChange={e => onPatch({ [field.key]: e.target.value })} />
            </Field>
          );
        }
        if (field.type === "textarea" || field.type === "richtext") {
          return (
            <Field key={field.key} label={field.label}>
              <Textarea rows={field.type === "richtext" ? 4 : 3} placeholder={field.placeholder} value={p[field.key] ?? ""} onChange={e => onPatch({ [field.key]: e.target.value })} />
              {field.type === "richtext" && (
                <p className="text-[10px] text-muted-foreground">
                  Use &lt;a href="https://..."&gt;texto&lt;/a&gt; para criar links.
                </p>
              )}
            </Field>
          );
        }
        if (field.type === "toggle") {
          const checked = p[field.key] !== false && String(p[field.key]) !== "false";
          return (
            <Field key={field.key} label={field.label}>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                <input type="checkbox" checked={checked} onChange={(e) => onPatch({ [field.key]: e.target.checked })} />
                <span className="text-muted-foreground">{checked ? "Ativado" : "Desativado"}</span>
              </label>
            </Field>
          );
        }
        if (field.type === "image") {
          return (
            <Field key={field.key} label={field.label}>
              <ImageUploadField
                value={p[field.key] as string}
                workspaceId={workspaceId}
                onChange={(url) => onPatch({ [field.key]: url })}
              />
            </Field>
          );
        }
        // items
        const items: any[] = p[field.key] || [];
        return (
          <Field key={field.key} label={field.label}>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="space-y-1.5 rounded-md border border-border bg-background p-2">
                  {field.itemFields!.map(f => (
                    f.type === "textarea" ? (
                      <Textarea key={f.key} rows={2} placeholder={f.label} value={it[f.key] ?? ""}
                        onChange={e => {
                          const next = items.map((x, j) => j === i ? { ...x, [f.key]: e.target.value } : x);
                          onPatch({ [field.key]: next });
                        }} />
                    ) : (
                      <Input key={f.key} placeholder={f.label} value={it[f.key] ?? ""}
                        onChange={e => {
                          const next = items.map((x, j) => j === i ? { ...x, [f.key]: e.target.value } : x);
                          onPatch({ [field.key]: next });
                        }} />
                    )
                  ))}
                  <button onClick={() => onPatch({ [field.key]: items.filter((_, j) => j !== i) })}
                    className="text-xs text-muted-foreground hover:text-destructive">Remover</button>
                </div>
              ))}
              <button onClick={() => {
                const blank: any = {};
                field.itemFields!.forEach(f => (blank[f.key] = ""));
                onPatch({ [field.key]: [...items, blank] });
              }} className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:bg-surface-elevated hover:text-foreground">
                <Plus className="h-3 w-3" /> Adicionar item
              </button>
            </div>
          </Field>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function SeoPanel({ seo, onChange }: { seo: { title: string; description: string; ogImage: string }; onChange: (s: { title: string; description: string; ogImage: string }) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Configurações de SEO</div>
        <p className="mt-1 text-xs text-muted-foreground">Otimize como sua página aparece nos motores de busca e redes sociais.</p>
      </div>
      <Field label="Título da página (meta title)">
        <Input value={seo.title} onChange={e => onChange({ ...seo, title: e.target.value })} placeholder="Meu produto — Descrição curta" />
        <p className="text-[10px] text-muted-foreground">{seo.title.length}/60 caracteres</p>
      </Field>
      <Field label="Descrição (meta description)">
        <Textarea rows={3} value={seo.description} onChange={e => onChange({ ...seo, description: e.target.value })} placeholder="Descreva sua página em até 160 caracteres..." />
        <p className="text-[10px] text-muted-foreground">{seo.description.length}/160 caracteres</p>
      </Field>
      <Field label="Imagem OG (URL)">
        <Input value={seo.ogImage} onChange={e => onChange({ ...seo, ogImage: e.target.value })} placeholder="https://meusite.com/imagem.jpg" />
      </Field>
    </div>
  );
}
