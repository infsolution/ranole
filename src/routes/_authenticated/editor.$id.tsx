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
  head: () => ({ meta: [{ title: "Editor — Indigo" }] }),
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

  const { data: page, isLoading } = useQuery({ queryKey: ["page", id], queryFn: () => get({ data: { id } }) });

  const [name, setName] = useState("");
  const [content, setContent] = useState<PageContent>({ sections: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const history = useRef<PageContent[]>([]);
  const future = useRef<PageContent[]>([]);
  const dirty = useRef(false);

  useEffect(() => {
    if (page) {
      setName(page.name);
      setContent((page.content as unknown as PageContent) || { sections: [] });
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
    mutationFn: () => save({ data: { id, content, name } }),
    onSuccess: () => { dirty.current = false; toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["pages"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const mPub = useMutation({
    mutationFn: (publish: boolean) => pub({ data: { id, publish } }),
    onSuccess: (_, publish) => { toast.success(publish ? "Página publicada" : "Despublicada"); qc.invalidateQueries({ queryKey: ["page", id] }); qc.invalidateQueries({ queryKey: ["pages"] }); },
  });

  // Autosave (debounced)
  useEffect(() => {
    if (!page) return;
    const t = setTimeout(() => { if (dirty.current) mSave.mutate(); }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, name]);

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
          {selected ? (
            <PropertiesPanel section={selected} onPatch={(p) => patchProps(selected.id, p)} />
          ) : (
            <div className="text-sm text-muted-foreground">Selecione um bloco para editar suas propriedades.</div>
          )}
        </aside>
      </div>
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

function PropertiesPanel({ section, onPatch }: { section: Section; onPatch: (p: Record<string, unknown>) => void }) {
  const def = blockRegistry[section.type];
  const p: any = section.props;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Bloco</div>
        <div className="mt-1 flex items-center gap-2 font-semibold"><def.icon className="h-4 w-4" /> {def.label}</div>
      </div>
      {def.schema.map(field => {
        if (field.type === "text") {
          return (
            <Field key={field.key} label={field.label}>
              <Input value={p[field.key] ?? ""} onChange={e => onPatch({ [field.key]: e.target.value })} />
            </Field>
          );
        }
        if (field.type === "textarea") {
          return (
            <Field key={field.key} label={field.label}>
              <Textarea rows={3} value={p[field.key] ?? ""} onChange={e => onPatch({ [field.key]: e.target.value })} />
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
