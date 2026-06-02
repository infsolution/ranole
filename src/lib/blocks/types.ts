export type SectionType =
  | "hero"
  | "benefits"
  | "features"
  | "pricing"
  | "logos"
  | "stats"
  | "testimonials"
  | "faq"
  | "contact"
  | "cta"
  | "footer";

export interface Section {
  id: string;
  type: SectionType;
  props: Record<string, unknown>;
}

export interface PageContent {
  sections: Section[];
}

export const newId = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
