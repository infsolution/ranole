import { templates, type TemplateDef } from "@/lib/templates";
import type { SectionType } from "@/lib/blocks/types";

// Schematic block representations per section type — keeps thumbnails
// procedural, instant, and consistent with the design system tokens.
function Block({ type, y }: { type: SectionType; y: number }) {
  const accent = "hsl(var(--primary) / 0.55)";
  const soft = "hsl(var(--foreground) / 0.12)";
  const softer = "hsl(var(--foreground) / 0.07)";

  switch (type) {
    case "hero":
      return (
        <g transform={`translate(0 ${y})`}>
          <rect x="6" y="4" width="40" height="3" rx="1.5" fill={accent} opacity="0.7" />
          <rect x="6" y="10" width="90" height="6" rx="2" fill={accent} />
          <rect x="6" y="19" width="70" height="3" rx="1.5" fill={soft} />
          <rect x="6" y="24" width="55" height="3" rx="1.5" fill={soft} />
          <rect x="6" y="32" width="24" height="6" rx="3" fill={accent} />
          <rect x="33" y="32" width="20" height="6" rx="3" fill={softer} />
          <rect x="120" y="6" width="60" height="34" rx="3" fill={softer} />
        </g>
      );
    case "logos":
      return (
        <g transform={`translate(0 ${y})`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={10 + i * 35} y="6" width="26" height="6" rx="1.5" fill={soft} />
          ))}
        </g>
      );
    case "features":
    case "benefits":
      return (
        <g transform={`translate(0 ${y})`}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${10 + i * 60} 0)`}>
              <rect x="0" y="0" width="10" height="10" rx="2" fill={accent} opacity="0.8" />
              <rect x="0" y="14" width="46" height="3" rx="1.5" fill={soft} />
              <rect x="0" y="20" width="38" height="2" rx="1" fill={softer} />
              <rect x="0" y="25" width="42" height="2" rx="1" fill={softer} />
            </g>
          ))}
        </g>
      );
    case "stats":
      return (
        <g transform={`translate(0 ${y})`}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${10 + i * 45} 0)`}>
              <rect x="0" y="0" width="22" height="8" rx="1.5" fill={accent} />
              <rect x="0" y="11" width="32" height="2" rx="1" fill={softer} />
            </g>
          ))}
        </g>
      );
    case "pricing":
      return (
        <g transform={`translate(0 ${y})`}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${10 + i * 60} 0)`}>
              <rect x="0" y="0" width="50" height="40" rx="3" fill={i === 1 ? accent : softer} opacity={i === 1 ? 0.4 : 1} />
              <rect x="6" y="6" width="20" height="3" rx="1.5" fill={soft} />
              <rect x="6" y="13" width="28" height="5" rx="1.5" fill={accent} />
              <rect x="6" y="23" width="30" height="2" rx="1" fill={softer} />
              <rect x="6" y="28" width="26" height="2" rx="1" fill={softer} />
              <rect x="6" y="33" width="22" height="2" rx="1" fill={softer} />
            </g>
          ))}
        </g>
      );
    case "testimonials":
      return (
        <g transform={`translate(0 ${y})`}>
          {[0, 1].map((i) => (
            <g key={i} transform={`translate(${10 + i * 95} 0)`}>
              <rect x="0" y="0" width="85" height="32" rx="3" fill={softer} />
              <circle cx="10" cy="10" r="5" fill={accent} opacity="0.7" />
              <rect x="20" y="6" width="40" height="3" rx="1.5" fill={soft} />
              <rect x="20" y="12" width="30" height="2" rx="1" fill={softer} />
              <rect x="6" y="20" width="70" height="2" rx="1" fill={soft} />
              <rect x="6" y="25" width="60" height="2" rx="1" fill={softer} />
            </g>
          ))}
        </g>
      );
    case "faq":
      return (
        <g transform={`translate(0 ${y})`}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(10 ${i * 10})`}>
              <rect x="0" y="0" width="180" height="7" rx="1.5" fill={softer} />
              <rect x="4" y="2" width="80" height="3" rx="1.5" fill={soft} />
              <circle cx="173" cy="3.5" r="1.5" fill={accent} />
            </g>
          ))}
        </g>
      );
    case "cta":
      return (
        <g transform={`translate(0 ${y})`}>
          <rect x="6" y="0" width="188" height="30" rx="3" fill={accent} opacity="0.18" />
          <rect x="50" y="6" width="100" height="5" rx="1.5" fill={accent} />
          <rect x="65" y="14" width="70" height="2.5" rx="1" fill={soft} />
          <rect x="80" y="20" width="40" height="6" rx="3" fill={accent} />
        </g>
      );
    case "contact":
      return (
        <g transform={`translate(0 ${y})`}>
          <rect x="10" y="0" width="180" height="6" rx="1.5" fill={softer} />
          <rect x="10" y="10" width="180" height="6" rx="1.5" fill={softer} />
          <rect x="10" y="20" width="180" height="12" rx="1.5" fill={softer} />
          <rect x="10" y="36" width="40" height="6" rx="2" fill={accent} />
        </g>
      );
    case "footer":
      return (
        <g transform={`translate(0 ${y})`}>
          <rect x="0" y="0" width="200" height="14" fill={softer} />
          <rect x="10" y="4" width="30" height="3" rx="1" fill={soft} />
          <rect x="150" y="4" width="40" height="3" rx="1" fill={softer} />
          <rect x="10" y="9" width="60" height="2" rx="1" fill={softer} />
        </g>
      );
    default:
      return null;
  }
}

// Approximate heights per section in the thumbnail viewbox.
const heights: Partial<Record<SectionType, number>> = {
  hero: 46,
  logos: 22,
  features: 34,
  benefits: 34,
  stats: 18,
  pricing: 46,
  testimonials: 38,
  faq: 36,
  cta: 36,
  contact: 50,
  footer: 18,
};

export function TemplateThumbnail({ template }: { template: TemplateDef }) {
  const content = template.build();
  // Layout sections vertically; scale to fit viewbox height.
  let y = 0;
  const items: Array<{ type: SectionType; y: number }> = [];
  for (const s of content.sections) {
    items.push({ type: s.type, y });
    y += (heights[s.type] ?? 24) + 6;
  }
  const totalH = Math.max(y, 1);
  const viewH = 220;
  const scale = Math.min(1, viewH / totalH);

  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface to-surface-elevated">
      <svg viewBox="0 0 200 220" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMin slice">
        <g transform={`scale(${scale}) translate(0 0)`}>
          {items.map((it, i) => (
            <Block key={i} type={it.type} y={it.y} />
          ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" />
    </div>
  );
}

export function getTemplatePreviewList() {
  return templates;
}
