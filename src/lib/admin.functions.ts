import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso negado");
}

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) return { isAdmin: false };
    return { isAdmin: !!data };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ count: workspacesCount }, { count: pagesCount }, { count: publishedCount }, { count: draftCount }, { count: domainsCount }] = await Promise.all([
      supabaseAdmin.from("workspaces").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("pages").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("pages").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabaseAdmin.from("pages").select("*", { count: "exact", head: true }).eq("status", "draft"),
      supabaseAdmin.from("workspaces").select("*", { count: "exact", head: true }).not("custom_domain", "is", null),
    ]);

    const { data: subs } = await supabaseAdmin
      .from("workspace_subscriptions")
      .select("plan, status");
    const plansCount: Record<string, number> = { free: 0, pro: 0, business: 0 };
    for (const s of subs ?? []) {
      const active = ["active", "trialing"].includes(s.status as string);
      const plan = active ? (s.plan as string) : "free";
      plansCount[plan] = (plansCount[plan] ?? 0) + 1;
    }

    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    const usersCount = (usersData as any)?.total ?? null;

    return {
      workspacesCount: workspacesCount ?? 0,
      pagesCount: pagesCount ?? 0,
      publishedCount: publishedCount ?? 0,
      draftCount: draftCount ?? 0,
      domainsCount: domainsCount ?? 0,
      plansCount,
      usersCount,
    };
  });

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);
    const users = usersData?.users ?? [];

    const ids = users.map((u: any) => u.id);
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const adminSet = new Set((roles ?? []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id));

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const nameMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.display_name]));

    return {
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        createdAt: u.created_at,
        displayName: nameMap.get(u.id) ?? null,
        isAdmin: adminSet.has(u.id),
      })),
    };
  });

export const listAllWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: workspaces, error } = await supabaseAdmin
      .from("workspaces")
      .select("id, name, slug, owner_id, custom_domain, custom_domain_status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (workspaces ?? []).map((w: any) => w.id);
    const safe = ids.length ? ids : ["00000000-0000-0000-0000-000000000000"];

    const [{ data: subs }, { data: pageRows }] = await Promise.all([
      supabaseAdmin.from("workspace_subscriptions").select("workspace_id, plan, status").in("workspace_id", safe),
      supabaseAdmin.from("pages").select("workspace_id, status").in("workspace_id", safe),
    ]);

    const subMap = new Map((subs ?? []).map((s: any) => [s.workspace_id, s]));
    const pageMap = new Map<string, { total: number; published: number }>();
    for (const p of pageRows ?? []) {
      const entry = pageMap.get(p.workspace_id) ?? { total: 0, published: 0 };
      entry.total++;
      if (p.status === "published") entry.published++;
      pageMap.set(p.workspace_id, entry);
    }

    return {
      workspaces: (workspaces ?? []).map((w: any) => {
        const sub = subMap.get(w.id);
        const active = sub && ["active", "trialing"].includes(sub.status);
        return {
          ...w,
          plan: active ? sub.plan : "free",
          pagesTotal: pageMap.get(w.id)?.total ?? 0,
          pagesPublished: pageMap.get(w.id)?.published ?? 0,
        };
      }),
    };
  });

export const listAllPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: pages, error } = await supabaseAdmin
      .from("pages")
      .select("id, name, slug, status, workspace_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const wsIds = Array.from(new Set((pages ?? []).map((p: any) => p.workspace_id)));
    const { data: ws } = await supabaseAdmin
      .from("workspaces")
      .select("id, name, slug")
      .in("id", wsIds.length ? wsIds : ["00000000-0000-0000-0000-000000000000"]);
    const wsMap = new Map((ws ?? []).map((w: any) => [w.id, w]));

    return {
      pages: (pages ?? []).map((p: any) => ({
        ...p,
        workspace: wsMap.get(p.workspace_id) ?? null,
      })),
    };
  });

export const setUserAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; isAdmin: boolean }) =>
    z.object({ userId: z.string().uuid(), isAdmin: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.isAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: "admin" });
      if (error && error.code !== "23505") throw new Error(error.message);
    } else {
      if (data.userId === context.userId) {
        throw new Error("Você não pode remover seu próprio acesso de administrador.");
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setWorkspacePlanAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { workspaceId: string; plan: "free" | "pro" | "business" }) =>
    z.object({
      workspaceId: z.string().uuid(),
      plan: z.enum(["free", "pro", "business"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("workspace_subscriptions")
      .upsert(
        { workspace_id: data.workspaceId, plan: data.plan, status: "active" },
        { onConflict: "workspace_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
