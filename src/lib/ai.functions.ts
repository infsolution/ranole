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
  items: z.array(z.object({ title: z.string(), description: z.string() })).min(2).max(6),
});
const ctaProps = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaHref: z.string().optional(),
});
const faqProps = z.object({
  title: z.string().optional(),
  items: z.array(z.object({ q: z.string(), a: z.string() })).min(2).max(8),
});
const testimonialsProps = z.object({
  title: z.string().optional(),
  items: z.array(z.object({ name: z.string(), role: z.string(), quote: z.string() })).min(2).max(6),
});
const footerProps = z.object({
  copyright: z.string(),
  tagline: z.string().optional(),
});
const featuresProps = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  items: z.array(z.object({ title: z.string(), description: z.string() })).min(3).max(9),
});
const pricingProps = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    price: z.string(),
    period: z.string().optional(),
    description: z.string().optional(),
    features: z.string(),
    ctaText: z.string().optional(),
    ctaHref: z.string().optional(),
    highlight: z.string().optional(),
  })).min(2).max(4),
});
const logosProps = z.object({
  title: z.string().optional(),
  items: z.array(z.object({ name: z.string() })).min(3).max(8),
});
const statsProps = z.object({
  title: z.string().optional(),
  items: z.array(z.object({ value: z.string(), label: z.string() })).min(2).max(6),
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

function fillSections(raw: z.infer<typeof pageSchema>): PageContent {
  const sections: Section[] = raw.sections.map((s) => {
    const def = blockRegistry[s.type as SectionType];
    return {
      id: newId(),
      type: s.type as SectionType,
      props: { ...def.defaultProps, ...s.props },
    };
  });
  return { sections };
}

export const generatePageFromPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ prompt: z.string().min(4).max(2000) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ content: any }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    try {
      const { experimental_output } = await generateText({
        model,
        system: systemPrompt(),
        prompt: `Brief: ${data.prompt}`,
        experimental_output: Output.object({ schema: pageSchema }),
      });
      return { content: fillSections(experimental_output) };
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("429")) throw new Error("Limite de uso de IA atingido. Tente novamente em instantes.");
      if (msg.includes("402")) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error(`Falha ao gerar página: ${msg || "erro desconhecido"}`);
    }
  });
