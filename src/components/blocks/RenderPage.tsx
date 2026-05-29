import { blockRegistry } from "@/lib/blocks/registry";
import type { PageContent } from "@/lib/blocks/types";

export function RenderPage({ content }: { content: PageContent }) {
  return (
    <>
      {content.sections.map((s) => {
        const def = blockRegistry[s.type];
        if (!def) return null;
        const Comp = def.Component;
        return <Comp key={s.id} {...def.defaultProps} {...s.props} />;
      })}
    </>
  );
}
