import {
  Layout,
  Sparkles,
  MousePointerClick,
  HelpCircle,
  MessagesSquare,
  PanelBottom,
} from "lucide-react";
import type { SectionType } from "./types";

/* ============== Block components (render from props) ============== */

function Hero(p: any) {
  return (
    <section className="relative overflow-hidden bg-hero ring-grid">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-center">
        {p.eyebrow && (
          <span className="inline-block rounded-full border border-border bg-surface-elevated/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            {p.eyebrow}
          </span>
        )}
        <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
          {p.title}
        </h1>
        {p.subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{p.subtitle}</p>
        )}
        {(p.ctaText || p.secondaryText) && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {p.ctaText && (
              <a
                href={p.ctaHref || "#"}
                className="inline-flex items-center rounded-md bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition hover:opacity-90"
              >
                {p.ctaText}
              </a>
            )}
            {p.secondaryText && (
              <a
                href={p.secondaryHref || "#"}
                className="inline-flex items-center rounded-md border border-border bg-surface-elevated px-6 py-3 font-medium text-foreground hover:bg-surface"
              >
                {p.secondaryText}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Benefits(p: any) {
  const items: Array<{ title: string; description: string }> = p.items || [];
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        {p.title && (
          <h2 className="mb-3 text-center text-3xl md:text-4xl font-bold">{p.title}</h2>
        )}
        {p.subtitle && (
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            {p.subtitle}
          </p>
        )}
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-surface p-6 transition hover:bg-surface-elevated"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{it.title}</h3>
              <p className="text-sm text-muted-foreground">{it.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA(p: any) {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-12 text-center shadow-elegant">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">{p.title}</h2>
          {p.subtitle && (
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">{p.subtitle}</p>
          )}
          {p.ctaText && (
            <a
              href={p.ctaHref || "#"}
              className="mt-8 inline-flex items-center rounded-md bg-background px-6 py-3 font-medium text-foreground hover:opacity-90"
            >
              {p.ctaText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function FAQ(p: any) {
  const items: Array<{ q: string; a: string }> = p.items || [];
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-3xl px-6">
        {p.title && (
          <h2 className="mb-10 text-center text-3xl md:text-4xl font-bold">{p.title}</h2>
        )}
        <div className="space-y-3">
          {items.map((it, i) => (
            <details
              key={i}
              className="group rounded-xl border border-border bg-background p-5 open:bg-surface-elevated"
            >
              <summary className="cursor-pointer list-none font-medium flex justify-between items-center">
                <span>{it.q}</span>
                <span className="ml-4 text-muted-foreground group-open:rotate-45 transition">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials(p: any) {
  const items: Array<{ name: string; role: string; quote: string }> = p.items || [];
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-6">
        {p.title && (
          <h2 className="mb-12 text-center text-3xl md:text-4xl font-bold">{p.title}</h2>
        )}
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <figure key={i} className="rounded-2xl border border-border bg-surface p-6">
              <blockquote className="text-foreground/90">"{it.quote}"</blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{it.name}</span> · {it.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer(p: any) {
  return (
    <footer className="border-t border-border bg-surface py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <p className="text-sm text-muted-foreground">{p.copyright}</p>
        <p className="text-sm text-muted-foreground">{p.tagline}</p>
      </div>
    </footer>
  );
}

/* ============== Registry ============== */

export interface BlockSchemaField {
  key: string;
  label: string;
  type: "text" | "textarea" | "items";
  itemFields?: Array<{ key: string; label: string; type: "text" | "textarea" }>;
}

export interface BlockDef {
  type: SectionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  Component: React.ComponentType<any>;
  defaultProps: Record<string, unknown>;
  schema: BlockSchemaField[];
}

export const blockRegistry: Record<SectionType, BlockDef> = {
  hero: {
    type: "hero",
    label: "Hero",
    icon: Layout,
    Component: Hero,
    defaultProps: {
      eyebrow: "Nova plataforma",
      title: "Construa páginas que convertem em minutos",
      subtitle: "O builder visual mais rápido para criar landing pages de alta performance.",
      ctaText: "Começar grátis",
      ctaHref: "#",
      secondaryText: "Ver demo",
      secondaryHref: "#",
    },
    schema: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      { key: "ctaText", label: "CTA principal", type: "text" },
      { key: "ctaHref", label: "Link CTA", type: "text" },
      { key: "secondaryText", label: "CTA secundário", type: "text" },
      { key: "secondaryHref", label: "Link secundário", type: "text" },
    ],
  },
  benefits: {
    type: "benefits",
    label: "Benefícios",
    icon: Sparkles,
    Component: Benefits,
    defaultProps: {
      title: "Por que escolher a plataforma",
      subtitle: "Tudo que você precisa para escalar.",
      items: [
        { title: "Rápido", description: "Builder otimizado e responsivo." },
        { title: "Escalável", description: "Arquitetura multi-tenant pronta." },
        { title: "Inteligente", description: "IA integrada para gerar páginas." },
      ],
    },
    schema: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      {
        key: "items",
        label: "Benefícios",
        type: "items",
        itemFields: [
          { key: "title", label: "Título", type: "text" },
          { key: "description", label: "Descrição", type: "textarea" },
        ],
      },
    ],
  },
  cta: {
    type: "cta",
    label: "CTA",
    icon: MousePointerClick,
    Component: CTA,
    defaultProps: {
      title: "Pronto para começar?",
      subtitle: "Crie sua primeira página em menos de 5 minutos.",
      ctaText: "Criar conta grátis",
      ctaHref: "#",
    },
    schema: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      { key: "ctaText", label: "Texto do botão", type: "text" },
      { key: "ctaHref", label: "Link", type: "text" },
    ],
  },
  faq: {
    type: "faq",
    label: "FAQ",
    icon: HelpCircle,
    Component: FAQ,
    defaultProps: {
      title: "Perguntas frequentes",
      items: [
        { q: "Como funciona?", a: "Você arrasta blocos e edita o conteúdo." },
        { q: "Posso publicar?", a: "Sim, com um clique." },
      ],
    },
    schema: [
      { key: "title", label: "Título", type: "text" },
      {
        key: "items",
        label: "Perguntas",
        type: "items",
        itemFields: [
          { key: "q", label: "Pergunta", type: "text" },
          { key: "a", label: "Resposta", type: "textarea" },
        ],
      },
    ],
  },
  testimonials: {
    type: "testimonials",
    label: "Depoimentos",
    icon: MessagesSquare,
    Component: Testimonials,
    defaultProps: {
      title: "O que dizem sobre nós",
      items: [
        { name: "Ana", role: "CEO", quote: "Mudou meu negócio." },
        { name: "Bruno", role: "CMO", quote: "Rápido e bonito." },
        { name: "Carla", role: "Designer", quote: "Builder excelente." },
      ],
    },
    schema: [
      { key: "title", label: "Título", type: "text" },
      {
        key: "items",
        label: "Depoimentos",
        type: "items",
        itemFields: [
          { key: "name", label: "Nome", type: "text" },
          { key: "role", label: "Cargo", type: "text" },
          { key: "quote", label: "Depoimento", type: "textarea" },
        ],
      },
    ],
  },
  footer: {
    type: "footer",
    label: "Rodapé",
    icon: PanelBottom,
    Component: Footer,
    defaultProps: {
      copyright: "© 2026 Sua marca. Todos os direitos reservados.",
      tagline: "Feito com a plataforma.",
    },
    schema: [
      { key: "copyright", label: "Copyright", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
    ],
  },
};

export const blockList = Object.values(blockRegistry);
