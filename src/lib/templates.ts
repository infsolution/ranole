import { blockRegistry } from "@/lib/blocks/registry";
import { newId, type PageContent, type SectionType } from "@/lib/blocks/types";

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  category: "SaaS" | "Startup" | "Serviços" | "Infoproduto" | "Em branco";
  build: () => PageContent;
}

function build(parts: Array<{ type: SectionType; props?: Record<string, unknown> }>): PageContent {
  return {
    sections: parts.map((p) => ({
      id: newId(),
      type: p.type,
      props: { ...blockRegistry[p.type].defaultProps, ...(p.props || {}) },
    })),
  };
}

export const templates: TemplateDef[] = [
  {
    id: "blank",
    name: "Em branco",
    description: "Comece do zero com apenas hero e rodapé.",
    category: "Em branco",
    build: () => build([{ type: "hero" }, { type: "footer" }]),
  },
  {
    id: "saas",
    name: "SaaS moderno",
    description: "Hero, logos, recursos, preços, depoimentos, FAQ, CTA.",
    category: "SaaS",
    build: () =>
      build([
        { type: "hero", props: { eyebrow: "Novo no mercado", title: "A forma mais rápida de lançar seu SaaS", subtitle: "Tudo que você precisa para sair do MVP ao crescimento.", ctaText: "Testar grátis", secondaryText: "Ver preços", secondaryHref: "#pricing" } },
        { type: "logos" },
        { type: "features" },
        { type: "stats" },
        { type: "pricing" },
        { type: "testimonials" },
        { type: "faq" },
        { type: "cta" },
        { type: "footer" },
      ]),
  },
  {
    id: "startup",
    name: "Startup pitch",
    description: "Hero, benefícios, stats, depoimentos e CTA forte.",
    category: "Startup",
    build: () =>
      build([
        { type: "hero", props: { eyebrow: "Pré-lançamento", title: "Mudamos como times trabalham", subtitle: "Junte-se a milhares que já transformaram a rotina.", ctaText: "Entrar na lista" } },
        { type: "benefits" },
        { type: "stats" },
        { type: "testimonials" },
        { type: "cta" },
        { type: "footer" },
      ]),
  },
  {
    id: "agency",
    name: "Agência / Serviços",
    description: "Hero, recursos, logos de clientes, contato.",
    category: "Serviços",
    build: () =>
      build([
        { type: "hero", props: { eyebrow: "Agência criativa", title: "Marcas que marcam.", subtitle: "Design, performance e branding sob medida.", ctaText: "Solicitar proposta" } },
        { type: "features", props: { title: "O que entregamos" } },
        { type: "logos", props: { title: "Clientes recentes" } },
        { type: "testimonials" },
        { type: "contact" },
        { type: "footer" },
      ]),
  },
  {
    id: "course",
    name: "Infoproduto / Curso",
    description: "Hero, benefícios, depoimentos, preços, FAQ e CTA.",
    category: "Infoproduto",
    build: () =>
      build([
        { type: "hero", props: { eyebrow: "Turma 2026", title: "Transforme seu conhecimento em receita", subtitle: "Método validado por milhares de alunos.", ctaText: "Quero me inscrever" } },
        { type: "benefits", props: { title: "O que você vai aprender" } },
        { type: "testimonials", props: { title: "Resultados de alunos" } },
        { type: "pricing", props: { title: "Escolha seu plano" } },
        { type: "faq" },
        { type: "cta", props: { title: "Vagas limitadas", ctaText: "Garantir minha vaga" } },
        { type: "footer" },
      ]),
  },
];

export function getTemplate(id: string): TemplateDef | undefined {
  return templates.find((t) => t.id === id);
}
