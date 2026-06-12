import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { blockRegistry } from "@/lib/blocks/registry";
import { newId, type PageContent, type Section, type SectionType } from "@/lib/blocks/types";

/* Schemas describing the shape we want the model to return.
 * We keep props as a generic record so the model can fill any block. */
const heroProps = z.object({
  eyebrow: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
  secondaryText: z.string().optional(),
  secondaryHref: z.string().optional(),
});
const benefitsProps = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  items: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .min(1)
    .max(8),
});
const ctaProps = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
});
const faqProps = z.object({
  title: z.string().optional(),
  items: z
    .array(z.object({ q: z.string(), a: z.string() }))
    .min(1)
    .max(10),
});
const testimonialsProps = z.object({
  title: z.string().optional(),
  items: z
    .array(z.object({ name: z.string(), role: z.string(), quote: z.string() }))
    .min(1)
    .max(8),
});
const footerProps = z.object({
  copyright: z.string(),
  tagline: z.string().optional(),
});
const featuresProps = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  items: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .min(1)
    .max(12),
});
const pricingProps = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.string(),
        period: z.string().optional(),
        description: z.string().optional(),
        features: z.string(),
        ctaText: z.string().optional(),
        ctaHref: z.string().optional(),
        highlight: z.string().optional(),
      }),
    )
    .min(1)
    .max(4),
});
const logosProps = z.object({
  title: z.string().optional(),
  items: z
    .array(z.object({ name: z.string() }))
    .min(1)
    .max(12),
});
const statsProps = z.object({
  title: z.string().optional(),
  items: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .min(1)
    .max(8),
});
const contactProps = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  ctaText: z.string().optional(),
});

const sectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), props: heroProps }),
  z.object({ type: z.literal("benefits"), props: benefitsProps }),
  z.object({ type: z.literal("features"), props: featuresProps }),
  z.object({ type: z.literal("pricing"), props: pricingProps }),
  z.object({ type: z.literal("logos"), props: logosProps }),
  z.object({ type: z.literal("stats"), props: statsProps }),
  z.object({ type: z.literal("cta"), props: ctaProps }),
  z.object({ type: z.literal("faq"), props: faqProps }),
  z.object({ type: z.literal("testimonials"), props: testimonialsProps }),
  z.object({ type: z.literal("contact"), props: contactProps }),
  z.object({ type: z.literal("footer"), props: footerProps }),
]);

const pageSchema = z.object({
  sections: z.array(sectionSchema).min(2).max(8),
});

const looseSectionSchema = z
  .object({
    type: z.string(),
    props: z.record(z.unknown()).optional(),
  })
  .passthrough();

const loosePageSchema = z
  .object({
    sections: z.array(looseSectionSchema).min(1).max(20),
  })
  .passthrough();

type LooseSection = z.infer<typeof looseSectionSchema>;
type LoosePage = z.infer<typeof loosePageSchema>;
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type SerializablePageContent = {
  sections: Array<{ id: string; type: SectionType; props: { [key: string]: JsonValue } }>;
};

function systemPrompt() {
  const blocks = Object.values(blockRegistry)
    .map((b) => `- ${b.type}: ${b.label}`)
    .join("\n");
  return `Você é um copywriter e designer de landing pages de alta conversão em português do Brasil.
Gere uma estrutura de página retornando JSON estrito com a chave "sections", onde cada item tem "type" e "props".
Tipos de bloco disponíveis:
${blocks}

Regras:
- Sempre inclua um hero no início e um footer no final.
- Use linguagem clara, direta, focada em benefício e prova social.
- 3 a 6 itens em listas (benefits/faq/testimonials).
- CTAs com verbos de ação. Não invente URLs reais — use "#".
- Não retorne markdown nem comentários, apenas o JSON exigido pelo schema.`;
}

function text(value: unknown, fallback: unknown = ""): string {
  const target = value === undefined || value === null ? fallback : value;
  if (target === undefined || target === null) return "";
  if (Array.isArray(target))
    return target
      .map((item) => text(item))
      .filter(Boolean)
      .join("\n");
  if (typeof target === "object") return "";
  return String(target);
}

function defaultPricingFeatures(defaults: Record<string, unknown>): string {
  const defaultItems = defaults.items;
  if (!Array.isArray(defaultItems)) return "";
  const first = defaultItems[0];
  if (!first || typeof first !== "object" || Array.isArray(first)) return "";
  return text((first as Record<string, unknown>).features);
}

function featureLines(value: unknown, fallback: unknown = ""): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return text(fallback);
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const title = text(obj.title || obj.name || obj.label);
        const description = text(obj.description || obj.text);
        return [title, description].filter(Boolean).join(": ");
      }
      return text(item);
    })
    .filter(Boolean)
    .join("\n");
}

function items(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

function normalizeType(value: unknown): SectionType | null {
  const normalized = text(value)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const aliases: Record<string, SectionType> = {
    hero: "hero",
    headline: "hero",
    benefits: "benefits",
    beneficios: "benefits",
    benefit: "benefits",
    features: "features",
    recursos: "features",
    pricing: "pricing",
    precos: "pricing",
    preços: "pricing",
    plans: "pricing",
    planos: "pricing",
    logos: "logos",
    brands: "logos",
    marcas: "logos",
    stats: "stats",
    statistics: "stats",
    estatisticas: "stats",
    métricas: "stats",
    metricas: "stats",
    testimonials: "testimonials",
    depoimentos: "testimonials",
    socialproof: "testimonials",
    faq: "faq",
    perguntasfrequentes: "faq",
    contact: "contact",
    contato: "contact",
    cta: "cta",
    calltoaction: "cta",
    footer: "footer",
    rodape: "footer",
    rodapé: "footer",
  };
  return aliases[normalized] || null;
}

function normalizeSection(section: LooseSection): Section | null {
  const type = normalizeType(section.type);
  if (!type) return null;
  const def = blockRegistry[type];
  const props = section.props || {};
  const defaults = def.defaultProps;

  const normalizedProps: Record<string, unknown> = (() => {
    switch (type) {
      case "hero":
        return {
          eyebrow: text(props.eyebrow, defaults.eyebrow),
          title: text(props.title || props.headline, defaults.title),
          subtitle: text(props.subtitle || props.description, defaults.subtitle),
          ctaText: text(props.ctaText || props.cta || props.buttonText, defaults.ctaText),
          ctaHref: text(props.ctaHref || props.href || props.link, defaults.ctaHref),
          secondaryText: text(props.secondaryText, defaults.secondaryText),
          secondaryHref: text(props.secondaryHref, defaults.secondaryHref),
        };
      case "benefits":
      case "features": {
        const maxItems = type === "benefits" ? 8 : 12;
        const normalizedItems = items(props.items || props.benefits || props.features)
          .map((item) => ({
            title: text(item.title || item.name || item.label),
            description: text(item.description || item.text || item.subtitle),
          }))
          .filter((item) => item.title || item.description)
          .slice(0, maxItems);
        return {
          title: text(props.title, defaults.title),
          subtitle: text(props.subtitle || props.description, defaults.subtitle),
          items: normalizedItems.length ? normalizedItems : defaults.items,
        };
      }
      case "pricing": {
        const normalizedItems = items(props.items || props.plans || props.planos)
          .map((item) => ({
            name: text(item.name || item.title, "Plano"),
            price: text(item.price || item.valor, "Sob consulta"),
            period: text(item.period || item.periodo),
            description: text(item.description || item.subtitle),
            features: featureLines(
              item.features || item.recursos || item.items,
              defaultPricingFeatures(defaults),
            ),
            ctaText: text(item.ctaText || item.cta || item.buttonText, "Comprar agora"),
            ctaHref: text(item.ctaHref || item.href || item.link, "#"),
            highlight: item.highlight === true ? "true" : text(item.highlight),
          }))
          .slice(0, 4);
        return {
          title: text(props.title, defaults.title),
          subtitle: text(props.subtitle || props.description, defaults.subtitle),
          items: normalizedItems.length ? normalizedItems : defaults.items,
        };
      }
      case "logos": {
        const normalizedItems = items(props.items || props.logos || props.brands)
          .map((item) => ({ name: text(item.name || item.title || item.label) }))
          .filter((item) => item.name)
          .slice(0, 12);
        return {
          title: text(props.title, defaults.title),
          items: normalizedItems.length ? normalizedItems : defaults.items,
        };
      }
      case "stats": {
        const normalizedItems = items(props.items || props.stats || props.metrics)
          .map((item) => ({
            value: text(item.value || item.number || item.valor),
            label: text(item.label || item.title || item.description),
          }))
          .filter((item) => item.value || item.label)
          .slice(0, 8);
        return {
          title: text(props.title, defaults.title),
          items: normalizedItems.length ? normalizedItems : defaults.items,
        };
      }
      case "testimonials": {
        const normalizedItems = items(props.items || props.testimonials || props.depoimentos)
          .map((item) => ({
            name: text(item.name || item.author || item.nome, "Cliente"),
            role: text(item.role || item.cargo || item.description, "Cliente"),
            quote: text(item.quote || item.text || item.depoimento),
          }))
          .filter((item) => item.quote)
          .slice(0, 8);
        return {
          title: text(props.title, defaults.title),
          items: normalizedItems.length ? normalizedItems : defaults.items,
        };
      }
      case "faq": {
        const normalizedItems = items(props.items || props.questions || props.perguntas)
          .map((item) => ({
            q: text(item.q || item.question || item.pergunta || item.title),
            a: text(item.a || item.answer || item.resposta || item.description),
          }))
          .filter((item) => item.q || item.a)
          .slice(0, 10);
        return {
          title: text(props.title, defaults.title),
          items: normalizedItems.length ? normalizedItems : defaults.items,
        };
      }
      case "contact":
        return {
          title: text(props.title, defaults.title),
          subtitle: text(props.subtitle || props.description, defaults.subtitle),
          email: text(props.email, defaults.email),
          phone: text(props.phone || props.telefone, defaults.phone),
          ctaText: text(props.ctaText || props.cta || props.buttonText, defaults.ctaText),
        };
      case "cta":
        return {
          title: text(props.title || props.headline, defaults.title),
          subtitle: text(props.subtitle || props.description, defaults.subtitle),
          ctaText: text(props.ctaText || props.cta || props.buttonText, defaults.ctaText),
          ctaHref: text(props.ctaHref || props.href || props.link, defaults.ctaHref),
        };
      case "footer":
        return {
          copyright: text(props.copyright, defaults.copyright),
          tagline: text(props.tagline || props.subtitle, defaults.tagline),
        };
      default:
        return { ...defaults, ...props };
    }
  })();

  return {
    id: newId(),
    type,
    props: { ...defaults, ...normalizedProps },
  };
}

function defaultSection(type: SectionType): Section {
  const def = blockRegistry[type];
  return {
    id: newId(),
    type,
    props: { ...def.defaultProps },
  };
}

function fillSections(raw: LoosePage): PageContent {
  const normalized = raw.sections
    .map(normalizeSection)
    .filter((section): section is Section => !!section);
  const withoutFooters = normalized.filter((section) => section.type !== "footer");
  const hero = withoutFooters.find((section) => section.type === "hero") || defaultSection("hero");
  const middle = withoutFooters.filter((section) => section.type !== "hero").slice(0, 6);
  const footer =
    normalized.find((section) => section.type === "footer") || defaultSection("footer");
  return { sections: [hero, ...middle, footer] };
}

function extractJson(raw: string): unknown {
  const clean = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const firstObject = clean.indexOf("{");
  const firstArray = clean.indexOf("[");
  const starts = [firstObject, firstArray].filter((index) => index >= 0);
  const start = starts.length ? Math.min(...starts) : 0;
  const end = Math.max(clean.lastIndexOf("}"), clean.lastIndexOf("]"));
  const slice = clean
    .slice(start, end >= start ? end + 1 : undefined)
    .replace(/,\s*([}\]])/g, "$1")
    .split("")
    .map((char) => (char.charCodeAt(0) < 32 ? " " : char))
    .join("");
  const parsed = JSON.parse(slice);
  if (Array.isArray(parsed)) return { sections: parsed };
  if (parsed && typeof parsed === "object") {
    const parsedObject = parsed as Record<string, unknown>;
    if (Array.isArray(parsedObject.sections)) return parsedObject;
    const page = parsedObject.page;
    if (
      page &&
      typeof page === "object" &&
      Array.isArray((page as Record<string, unknown>).sections)
    )
      return page;
  }
  return parsed;
}

function parseLoosePage(value: unknown): LoosePage {
  return loosePageSchema.parse(value);
}

function validateGeneratedContent(content: PageContent): PageContent {
  pageSchema.parse({ sections: content.sections.map(({ type, props }) => ({ type, props })) });
  return content;
}

function serializableContent(content: PageContent): SerializablePageContent {
  return content as unknown as SerializablePageContent;
}

function safeGenerationError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err || "");
  if (msg.includes("429")) return "Limite de uso de IA atingido. Tente novamente em instantes.";
  if (msg.includes("402")) return "Créditos de IA esgotados. Adicione créditos no workspace.";
  return "Falha ao gerar página. Tente novamente com um prompt um pouco mais específico.";
}

export const generatePageFromPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ prompt: z.string().min(4).max(2000) }).parse(d))
  .handler(async ({ data }): Promise<{ content: SerializablePageContent }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const tryStructured = async () => {
      const { experimental_output } = await generateText({
        model,
        system: systemPrompt(),
        prompt: `Brief: ${data.prompt}`,
        experimental_output: Output.object({ schema: loosePageSchema }),
      });
      return parseLoosePage(experimental_output);
    };

    const tryRawJson = async () => {
      const { text } = await generateText({
        model,
        system:
          systemPrompt() +
          `\n\nRetorne APENAS um JSON válido, sem markdown, sem cercas \`\`\`, no formato: {"sections":[{"type":"hero","props":{...}}, ...]}.`,
        prompt: `Brief: ${data.prompt}`,
      });
      return parseLoosePage(extractJson(text));
    };

    try {
      let output: LoosePage;
      try {
        output = await tryStructured();
      } catch {
        output = await tryRawJson();
      }
      return { content: serializableContent(validateGeneratedContent(fillSections(output))) };
    } catch (err: unknown) {
      throw new Error(safeGenerationError(err));
    }
  });
