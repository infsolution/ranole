import {
  Layout,
  Sparkles,
  MousePointerClick,
  HelpCircle,
  MessagesSquare,
  PanelBottom,
  Grid3x3,
  Tag,
  Building2,
  BarChart3,
  Mail,
  Check,
} from "lucide-react";
import type { SectionType } from "./types";

/* ============== Color helper ============== */

export interface BlockColors {
  bg?: string;
  text?: string;
  border?: string;
  shadow?: string;
}

export function sectionStyle(p: any): React.CSSProperties {
  const c: BlockColors = p?.colors || {};
  const s: React.CSSProperties = {};
  if (c.bg) s.background = c.bg;
  if (c.text) s.color = c.text;
  if (c.border) s.borderColor = c.border;
  if (c.shadow) s.boxShadow = `0 20px 60px -20px ${c.shadow}`;
  return s;
}

/* ============== Block components ============== */

function Hero(p: any) {
  return (
    <section className="relative overflow-hidden bg-hero ring-grid" style={sectionStyle(p)}>
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 text-center">
        {p.eyebrow && (
          <span className="inline-block rounded-full border border-border bg-surface-elevated/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            {p.eyebrow}
          </span>
        )}
        <h1 className="mt-6 text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">{p.title}</h1>
        {p.subtitle && <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{p.subtitle}</p>}
        {(p.ctaText || p.secondaryText) && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {p.ctaText && (
              <a href={p.ctaHref || "#"} className="inline-flex items-center rounded-md bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition hover:opacity-90">
                {p.ctaText}
              </a>
            )}
            {p.secondaryText && (
              <a href={p.secondaryHref || "#"} className="inline-flex items-center rounded-md border border-border bg-surface-elevated px-6 py-3 font-medium text-foreground hover:bg-surface">
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
    <section className="bg-background py-24" style={sectionStyle(p)}>
      <div className="mx-auto max-w-6xl px-6">
        {p.title && <h2 className="mb-3 text-center text-3xl md:text-4xl font-bold">{p.title}</h2>}
        {p.subtitle && <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">{p.subtitle}</p>}
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-6 transition hover:bg-surface-elevated">
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

function Features(p: any) {
  const items: Array<{ title: string; description: string }> = p.items || [];
  return (
    <section className="bg-surface py-24" style={sectionStyle(p)}>
      <div className="mx-auto max-w-6xl px-6">
        {p.title && <h2 className="mb-3 text-center text-3xl md:text-4xl font-bold">{p.title}</h2>}
        {p.subtitle && <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">{p.subtitle}</p>}
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="border-l-2 border-primary/40 pl-4">
              <h3 className="mb-1 font-semibold">{it.title}</h3>
              <p className="text-sm text-muted-foreground">{it.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing(p: any) {
  const items: Array<{ name: string; price: string; period?: string; description?: string; features?: string; ctaText?: string; ctaHref?: string; highlight?: string }> = p.items || [];
  return (
    <section className="bg-background py-24" style={sectionStyle(p)}>
      <div className="mx-auto max-w-6xl px-6">
        {p.title && <h2 className="mb-3 text-center text-3xl md:text-4xl font-bold">{p.title}</h2>}
        {p.subtitle && <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">{p.subtitle}</p>}
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it, i) => {
            const isHi = String(it.highlight || "").toLowerCase() === "true" || it.highlight === "1";
            const feats = (it.features || "").split("\n").map((s) => s.trim()).filter(Boolean);
            return (
              <div key={i} className={`flex flex-col rounded-2xl border p-6 ${isHi ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-surface"}`}>
                <div className="mb-1 text-sm font-medium text-muted-foreground">{it.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{it.price}</span>
                  {it.period && <span className="text-sm text-muted-foreground">/{it.period}</span>}
                </div>
                {it.description && <p className="mt-3 text-sm text-muted-foreground">{it.description}</p>}
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {feats.map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {it.ctaText && (
                  <a href={it.ctaHref || "#"} className={`mt-6 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ${isHi ? "bg-gradient-primary text-primary-foreground shadow-glow" : "border border-border bg-surface-elevated text-foreground hover:bg-surface"}`}>
                    {it.ctaText}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Logos(p: any) {
  const items: Array<{ name: string }> = p.items || [];
  return (
    <section className="bg-surface py-16" style={sectionStyle(p)}>
      <div className="mx-auto max-w-6xl px-6">
        {p.title && <p className="mb-8 text-center text-sm uppercase tracking-widest text-muted-foreground">{p.title}</p>}
        <div className="grid grid-cols-2 items-center gap-8 md:grid-cols-3 lg:grid-cols-6">
          {items.map((it, i) => (
            <div key={i} className="text-center font-display text-lg font-semibold text-muted-foreground/60 transition hover:text-foreground">
              {it.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats(p: any) {
  const items: Array<{ value: string; label: string }> = p.items || [];
  return (
    <section className="bg-background py-20" style={sectionStyle(p)}>
      <div className="mx-auto max-w-6xl px-6">
        {p.title && <h2 className="mb-12 text-center text-3xl md:text-4xl font-bold">{p.title}</h2>}
        <div className="grid gap-8 md:grid-cols-4">
          {items.map((it, i) => (
            <div key={i} className="text-center">
              <div className="bg-gradient-primary bg-clip-text text-4xl md:text-5xl font-bold text-transparent">{it.value}</div>
              <div className="mt-2 text-sm text-muted-foreground">{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA(p: any) {
  return (
    <section className="bg-background py-24" style={sectionStyle(p)}>
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-12 text-center shadow-elegant">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">{p.title}</h2>
          {p.subtitle && <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">{p.subtitle}</p>}
          {p.ctaText && (
            <a href={p.ctaHref || "#"} className="mt-8 inline-flex items-center rounded-md bg-background px-6 py-3 font-medium text-foreground hover:opacity-90">
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
    <section className="bg-surface py-24" style={sectionStyle(p)}>
      <div className="mx-auto max-w-3xl px-6">
        {p.title && <h2 className="mb-10 text-center text-3xl md:text-4xl font-bold">{p.title}</h2>}
        <div className="space-y-3">
          {items.map((it, i) => (
            <details key={i} className="group rounded-xl border border-border bg-background p-5 open:bg-surface-elevated">
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
    <section className="bg-background py-24" style={sectionStyle(p)}>
      <div className="mx-auto max-w-6xl px-6">
        {p.title && <h2 className="mb-12 text-center text-3xl md:text-4xl font-bold">{p.title}</h2>}
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

function Contact(p: any) {
  return (
    <section className="bg-surface py-24" style={sectionStyle(p)}>
      <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-2">
        <div>
          {p.title && <h2 className="text-3xl md:text-4xl font-bold">{p.title}</h2>}
          {p.subtitle && <p className="mt-4 text-muted-foreground">{p.subtitle}</p>}
          {p.email && <p className="mt-6 text-sm text-muted-foreground">✉ {p.email}</p>}
          {p.phone && <p className="mt-1 text-sm text-muted-foreground">☎ {p.phone}</p>}
        </div>
        <form className="space-y-3 rounded-2xl border border-border bg-background p-6">
          <input className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" placeholder="Seu nome" />
          <input className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" placeholder="E-mail" />
          <textarea rows={4} className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm" placeholder="Mensagem" />
          <button type="button" className="w-full rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow">
            {p.ctaText || "Enviar"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Footer(p: any) {
  return (
    <footer className="border-t border-border bg-surface py-10" style={sectionStyle(p)}>
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
  features: {
    type: "features",
    label: "Recursos",
    icon: Grid3x3,
    Component: Features,
    defaultProps: {
      title: "Recursos que fazem diferença",
      subtitle: "Uma plataforma completa, pronta para crescer com você.",
      items: [
        { title: "Editor visual", description: "Arraste, solte, publique." },
        { title: "Analytics nativo", description: "Veja o que converte em tempo real." },
        { title: "SEO pronto", description: "Meta tags, sitemap e OG dinâmicos." },
        { title: "IA Builder", description: "Gere páginas inteiras por prompt." },
        { title: "Multi-tenant", description: "Workspaces e papéis prontos." },
        { title: "Domínios próprios", description: "Conecte seu domínio em segundos." },
      ],
    },
    schema: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      {
        key: "items",
        label: "Recursos",
        type: "items",
        itemFields: [
          { key: "title", label: "Título", type: "text" },
          { key: "description", label: "Descrição", type: "textarea" },
        ],
      },
    ],
  },
  pricing: {
    type: "pricing",
    label: "Preços",
    icon: Tag,
    Component: Pricing,
    defaultProps: {
      title: "Planos simples e transparentes",
      subtitle: "Comece grátis. Escale quando precisar.",
      items: [
        { name: "Free", price: "R$ 0", period: "mês", description: "Para começar.", features: "1 página\nDomínio padrão\nAnalytics básico", ctaText: "Começar", ctaHref: "#", highlight: "" },
        { name: "Pro", price: "R$ 49", period: "mês", description: "Para quem está crescendo.", features: "Páginas ilimitadas\nDomínio próprio\nIA Builder\nAnalytics avançado", ctaText: "Assinar Pro", ctaHref: "#", highlight: "true" },
        { name: "Business", price: "R$ 149", period: "mês", description: "Para times.", features: "Tudo do Pro\nMulti-usuário\nSLA premium\nSuporte dedicado", ctaText: "Falar com vendas", ctaHref: "#", highlight: "" },
      ],
    },
    schema: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      {
        key: "items",
        label: "Planos",
        type: "items",
        itemFields: [
          { key: "name", label: "Nome", type: "text" },
          { key: "price", label: "Preço", type: "text" },
          { key: "period", label: "Período (ex.: mês)", type: "text" },
          { key: "description", label: "Descrição", type: "textarea" },
          { key: "features", label: "Recursos (um por linha)", type: "textarea" },
          { key: "ctaText", label: "Texto do botão", type: "text" },
          { key: "ctaHref", label: "Link do botão", type: "text" },
          { key: "highlight", label: "Destaque? (true/false)", type: "text" },
        ],
      },
    ],
  },
  logos: {
    type: "logos",
    label: "Logos",
    icon: Building2,
    Component: Logos,
    defaultProps: {
      title: "Empresas que confiam em nós",
      items: [
        { name: "ACME" }, { name: "Globex" }, { name: "Initech" },
        { name: "Umbrella" }, { name: "Stark" }, { name: "Wayne" },
      ],
    },
    schema: [
      { key: "title", label: "Título", type: "text" },
      {
        key: "items",
        label: "Marcas",
        type: "items",
        itemFields: [{ key: "name", label: "Nome", type: "text" }],
      },
    ],
  },
  stats: {
    type: "stats",
    label: "Estatísticas",
    icon: BarChart3,
    Component: Stats,
    defaultProps: {
      title: "Números que falam por si",
      items: [
        { value: "50k+", label: "Páginas publicadas" },
        { value: "12M", label: "Visitas mensais" },
        { value: "99.9%", label: "Uptime" },
        { value: "4.9/5", label: "NPS" },
      ],
    },
    schema: [
      { key: "title", label: "Título", type: "text" },
      {
        key: "items",
        label: "Métricas",
        type: "items",
        itemFields: [
          { key: "value", label: "Valor", type: "text" },
          { key: "label", label: "Rótulo", type: "text" },
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
  contact: {
    type: "contact",
    label: "Contato",
    icon: Mail,
    Component: Contact,
    defaultProps: {
      title: "Vamos conversar",
      subtitle: "Conte sobre seu projeto e respondemos em até 1 dia útil.",
      email: "contato@exemplo.com",
      phone: "+55 11 0000-0000",
      ctaText: "Enviar mensagem",
    },
    schema: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      { key: "email", label: "E-mail", type: "text" },
      { key: "phone", label: "Telefone", type: "text" },
      { key: "ctaText", label: "Texto do botão", type: "text" },
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
