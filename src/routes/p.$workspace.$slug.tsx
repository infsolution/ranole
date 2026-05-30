import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { getPublicPage, trackEvent } from "@/lib/pages.functions";
import { RenderPage } from "@/components/blocks/RenderPage";
import type { PageContent } from "@/lib/blocks/types";

export const Route = createFileRoute("/p/$workspace/$slug")({
  loader: async ({ params }) => {
    const page = await getPublicPage({ data: { workspaceSlug: params.workspace, pageSlug: params.slug } });
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: (loaderData as any).seo?.title || (loaderData as any).name },
          { name: "description", content: (loaderData as any).seo?.description || "" },
        ]
      : [],
  }),
  component: PublicPage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-muted-foreground">Esta página pode estar despublicada ou nunca ter existido.</p>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
      <p className="text-muted-foreground">Erro: {error.message}</p>
    </div>
  ),
});

function PublicPage() {
  const page = Route.useLoaderData() as any;

  useEffect(() => {
    const sid = sessionStorage.getItem("sid") ?? (() => {
      const s = Math.random().toString(36).slice(2);
      sessionStorage.setItem("sid", s); return s;
    })();
    trackEvent({ data: { pageId: page.id, eventType: "pageview", sessionId: sid } }).catch(() => {});
  }, [page.id]);

  return (
    <div onClick={(e) => {
      const a = (e.target as HTMLElement).closest("a");
      if (a) {
        const sid = sessionStorage.getItem("sid") || undefined;
        trackEvent({ data: { pageId: page.id, eventType: "click", sessionId: sid, properties: { href: a.getAttribute("href") } } }).catch(() => {});
      }
    }}>
      <RenderPage content={page.content as PageContent} />
    </div>
  );
}
