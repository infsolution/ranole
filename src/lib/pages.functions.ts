import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { blockRegistry } from "@/lib/blocks/registry";
import { newId } from "@/lib/blocks/types";
import type { PageContent, SectionType } from "@/lib/blocks/types";

function starterContent(): PageContent {
  const order: SectionType[] = ["hero", "benefits", "testimonials", "faq", "cta", "footer"];
  return {
    sections: order.map((type) => ({
      id: newId(),
      type,
      props: { ...blockRegistry[type].defaultProps },
    })),
  };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "page";
}

/* List pages of the current user's default workspace */
export const listMyPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: ws, error: wsErr } = await supabase
      .from("workspaces")
      .select("id, name, slug")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (wsErr) throw new Error(wsErr.message);
    if (!ws) return { workspace: null, pages: [] as any[] };

    const { data, error } = await supabase
      .from("pages")
      .select("id, name, slug, status, updated_at, published_at")
      .eq("workspace_id", ws.id)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { workspace: ws, pages: data || [] };
  });

export const createPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("workspaces").select("id").eq("owner_id", userId).limit(1).maybeSingle();
    if (!ws) throw new Error("Workspace não encontrado");

    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    for (let i = 1; i < 50; i++) {
      const { data: existing } = await supabase
        .from("pages").select("id").eq("workspace_id", ws.id).eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${i}`;
    }

    const content = starterContent();
    const { data: page, error } = await supabase
      .from("pages")
      .insert({
        workspace_id: ws.id,
        name: data.name,
        slug,
        content: content as unknown as any,
        created_by: userId,
      })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { id: page.id };
  });

export const getPage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: page, error } = await supabase
      .from("pages")
      .select("id, name, slug, status, content, theme, current_version, workspace_id, published_at, updated_at")
      .eq("id", data.id).single();
    if (error) throw new Error(error.message);

    const { data: ws } = await supabase
      .from("workspaces").select("slug").eq("id", page.workspace_id).single();

    return { ...page, workspace_slug: ws?.slug ?? null };
  });

export const savePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      content: z.object({ sections: z.array(z.any()) }),
      name: z.string().min(1).max(80).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: current, error: cErr } = await supabase
      .from("pages").select("current_version").eq("id", data.id).single();
    if (cErr) throw new Error(cErr.message);

    const nextVersion = (current.current_version ?? 1) + 1;

    const update: { content: any; current_version: number; name?: string } = {
      content: data.content as unknown as any,
      current_version: nextVersion,
    };
    if (data.name) update.name = data.name;

    const { error } = await supabase.from("pages").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabase.from("page_versions").insert({
      page_id: data.id,
      version: nextVersion,
      content: data.content as unknown as any,
      created_by: userId,
    });

    return { ok: true, version: nextVersion };
  });

export const publishPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), publish: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("pages")
      .update({
        status: data.publish ? "published" : "draft",
        published_at: data.publish ? new Date().toISOString() : null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("pages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicatePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: src, error } = await supabase
      .from("pages")
      .select("workspace_id, name, content, theme")
      .eq("id", data.id).single();
    if (error) throw new Error(error.message);

    const baseSlug = slugify(`${src.name}-copia`);
    let slug = baseSlug;
    for (let i = 1; i < 50; i++) {
      const { data: existing } = await supabase
        .from("pages").select("id").eq("workspace_id", src.workspace_id).eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${i}`;
    }
    const { data: copy, error: insErr } = await supabase
      .from("pages")
      .insert({
        workspace_id: src.workspace_id,
        name: `${src.name} (cópia)`,
        slug,
        content: src.content,
        theme: src.theme,
        created_by: userId,
      })
      .select("id").single();
    if (insErr) throw new Error(insErr.message);
    return { id: copy.id };
  });

/* Public render — uses admin client scoped by published status */
export const getPublicPage = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      workspaceSlug: z.string().min(1).max(80),
      pageSlug: z.string().min(1).max(80),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: ws } = await supabaseAdmin
      .from("workspaces").select("id, name").eq("slug", data.workspaceSlug).maybeSingle();
    if (!ws) return null;
    const { data: page } = await supabaseAdmin
      .from("pages")
      .select("id, name, content, theme, seo, status")
      .eq("workspace_id", ws.id)
      .eq("slug", data.pageSlug)
      .eq("status", "published")
      .maybeSingle();
    if (!page) return null;
    return page;
  });

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      pageId: z.string().uuid(),
      eventType: z.string().min(1).max(40),
      sessionId: z.string().max(120).optional(),
      properties: z.record(z.string(), z.any()).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await supabaseAdmin.from("analytics_events").insert({
      page_id: data.pageId,
      event_type: data.eventType,
      session_id: data.sessionId ?? null,
      properties: data.properties ?? {},
    });
    return { ok: true };
  });

export const getPageStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows } = await supabase
      .from("analytics_events")
      .select("event_type")
      .eq("page_id", data.id);
    const total = rows?.length ?? 0;
    const views = rows?.filter((r) => r.event_type === "pageview").length ?? 0;
    const clicks = rows?.filter((r) => r.event_type === "click").length ?? 0;
    return { total, views, clicks };
  });
