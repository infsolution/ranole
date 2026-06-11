import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Zap, Layers, Palette, Globe, BarChart3, ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Indigo — Construa páginas SaaS que convertem" },
      { name: "description", content: "Plataforma visual para criar landing pages, sites institucionais e funis. Multi-tenant, versionado e pronto para escalar." },
      { property: "og:title", content: "Indigo — Construa páginas SaaS que convertem" },
      { property: "og:description", content: "Builder visual com componentes Atomic Design e arquitetura enterprise." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <Benefits />
      <DemoStrip />
      <Pricing />
      <FAQ />
      <CTAFinal />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </div>
          Indigo
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#beneficios" className="hover:text-foreground">Recursos</a>
          <a href="#demo" className="hover:text-foreground">Demo</a>
          <a href="#precos" className="hover:text-foreground">Preços</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Entrar</Link>
          <Link to="/login" className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow">
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero ring-grid">
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-36 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary-glow" />
          Builder visual enterprise
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mt-6 font-display text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
          Páginas que <span className="text-gradient">convertem</span>,
          <br /> construídas em minutos.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Multi-tenant, versionamento JSON, Atomic Design e analytics. A plataforma SaaS para growth, agências e produtos.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/login" className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow">
            Criar conta grátis <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#demo" className="inline-flex items-center rounded-md border border-border bg-surface-elevated px-6 py-3 font-medium hover:bg-surface">
            Ver demonstração
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mx-auto mt-20 max-w-5xl rounded-2xl border border-border bg-surface p-2 shadow-elegant">
          <div className="rounded-xl border border-border bg-background/80 p-8">
            <div className="grid grid-cols-12 gap-3 text-left">
              <div className="col-span-3 space-y-2">
                {["Hero", "Benefícios", "CTA", "FAQ", "Depoimentos", "Rodapé"].map(l => (
                  <div key={l} className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs">{l}</div>
                ))}
              </div>
              <div className="col-span-6 rounded-md bg-hero ring-grid p-8 text-center">
                <div className="mx-auto h-3 w-32 rounded bg-foreground/20" />
                <div className="mx-auto mt-4 h-6 w-3/4 rounded bg-foreground/40" />
                <div className="mx-auto mt-3 h-3 w-2/3 rounded bg-foreground/20" />
                <div className="mx-auto mt-6 inline-block h-9 w-32 rounded bg-gradient-primary" />
              </div>
              <div className="col-span-3 space-y-2">
                <div className="rounded-md border border-border bg-surface-elevated p-3 text-xs">
                  <div className="text-muted-foreground">Título</div>
                  <div className="mt-1 h-2 w-full rounded bg-foreground/20" />
                </div>
                <div className="rounded-md border border-border bg-surface-elevated p-3 text-xs">
                  <div className="text-muted-foreground">Subtítulo</div>
                  <div className="mt-1 h-2 w-3/4 rounded bg-foreground/20" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const benefits = [
  { icon: Zap, title: "Performance nativa", desc: "Renderização SSR otimizada e componentes leves." },
  { icon: Layers, title: "Atomic Design", desc: "Blocos reutilizáveis e schema versionado em JSON." },
  { icon: Palette, title: "Design system pronto", desc: "Tokens semânticos, dark mode e marca consistente." },
  { icon: Globe, title: "Multi-tenant", desc: "Workspaces isolados com RLS e papéis (owner, editor)." },
  { icon: BarChart3, title: "Analytics integrado", desc: "Pageviews, clicks e eventos com event tracking." },
  { icon: Sparkles, title: "Pronto para IA", desc: "Arquitetura preparada para geração assistida." },
];

function Benefits() {
  return (
    <section id="beneficios" className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold">Tudo que você precisa para escalar</h2>
          <p className="mt-4 text-muted-foreground">Arquitetura enterprise sob um builder simples.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {benefits.map((b, i) => (
            <motion.div key={b.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-border bg-surface p-6 transition hover:bg-surface-elevated">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoStrip() {
  return (
    <section id="demo" className="border-y border-border bg-surface/40 py-28">
      <div className="mx-auto max-w-6xl px-6 grid gap-10 md:grid-cols-2 items-center">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-bold">Editor visual com versionamento</h2>
          <p className="mt-4 text-muted-foreground">
            Arraste blocos, edite propriedades e publique com um clique. Cada save cria uma versão imutável da página.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {["Drag and drop com dnd-kit", "Snapshots em page_versions", "Preview responsivo", "SEO por página", "Eventos rastreados"].map(t => (
              <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary-glow" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-background p-3 shadow-elegant">
          <div className="rounded-xl bg-hero ring-grid p-10 text-center">
            <div className="mx-auto h-3 w-24 rounded bg-foreground/20" />
            <div className="mx-auto mt-3 h-5 w-3/4 rounded bg-foreground/40" />
            <div className="mx-auto mt-2 h-3 w-2/3 rounded bg-foreground/20" />
            <div className="mx-auto mt-5 inline-block h-8 w-28 rounded bg-gradient-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}

import { PLANS } from "@/lib/billing";

function Pricing() {
  return (
    <section id="precos" className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold">Preços simples</h2>
          <p className="mt-4 text-muted-foreground">Comece grátis. Faça upgrade quando precisar.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((t) => {
            const featured = !!t.highlight;
            const price = t.prices.monthly.amountUsd;
            return (
              <div key={t.id} className={`rounded-2xl border p-8 ${featured ? "border-primary bg-gradient-primary/10 shadow-glow" : "border-border bg-surface"}`}>
                <h3 className="font-display text-xl font-semibold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="font-display text-4xl font-bold">${price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {t.features.map(f => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary-glow" />{f}</li>)}
                </ul>
                <Link to="/login" className={`mt-8 inline-flex w-full justify-center rounded-md px-4 py-2.5 font-medium ${featured ? "bg-gradient-primary text-primary-foreground shadow-glow" : "border border-border bg-surface-elevated"}`}>
                  Começar
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  { q: "Como funciona o builder?", a: "Arraste blocos prontos, edite propriedades e publique. Tudo é salvo como JSON versionado." },
  { q: "Tenho domínio próprio?", a: "Sim, no plano Pro. No Starter você usa subdomínio Indigo." },
  { q: "É multi-tenant?", a: "Sim. Cada workspace tem isolamento por RLS e membros com papéis." },
  { q: "Posso exportar minha página?", a: "Em breve. A v0 foca em publicação no nosso host." },
];

function FAQ() {
  return (
    <section id="faq" className="border-t border-border bg-surface/40 py-28">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center font-display text-3xl md:text-4xl font-bold">Perguntas frequentes</h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-xl border border-border bg-background p-5 open:bg-surface-elevated">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                <span>{f.q}</span>
                <span className="ml-4 text-muted-foreground transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTAFinal() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-primary p-14 text-center shadow-elegant">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground">Pronto para construir?</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">Crie sua conta e publique sua primeira página em menos de 5 minutos.</p>
          <Link to="/login" className="mt-8 inline-flex items-center gap-2 rounded-md bg-background px-6 py-3 font-medium text-foreground hover:opacity-90">
            Começar grátis <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <p className="text-sm text-muted-foreground">© 2026 Indigo. Plataforma SaaS de páginas.</p>
        <p className="text-sm text-muted-foreground">Feito com arquitetura enterprise.</p>
      </div>
    </footer>
  );
}
