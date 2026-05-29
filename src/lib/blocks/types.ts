export type SectionType =
  | "hero"
  | "benefits"
  | "cta"
  | "faq"
  | "testimonials"
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
