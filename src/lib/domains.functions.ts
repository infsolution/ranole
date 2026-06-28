import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLANS_WITH_DOMAIN = new Set(["pro", "business"]);

const DOMAIN_REGEX =
  /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (d.startsWith("www.")) d = d.slice(4);
  return d;
}

async function loadWorkspaceWithPlan(ctx: { supabase: any; userId: string }) {
  const { supabase, userId } = ctx;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: ws, error } = await supabaseAdmin
    .from("workspaces")
    .select(
      "id, name, slug, custom_domain, custom_domain_status, custom_domain_verification_token, custom_domain_verified_at",
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!ws) throw new Error("Workspace não encontrado");

  const { data: sub } = await supabaseAdmin
    .from("workspace_subscriptions")
    .select("plan, status")
    .eq("workspace_id", ws.id)
    .maybeSingle();
  const isActive = sub && ["active", "trialing"].includes(sub.status as string);
  const plan = (isActive ? (sub?.plan as string) : "free") || "free";
  return { ws, plan, supabase, supabaseAdmin };
}

export const getWorkspaceDomain = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ws, plan } = await loadWorkspaceWithPlan(context);
    return {
      workspace: { id: ws.id, name: ws.name, slug: ws.slug },
      plan,
      allowed: PLANS_WITH_DOMAIN.has(plan),
      domain: ws.custom_domain as string | null,
      status: ws.custom_domain_status as string,
      verificationToken: ws.custom_domain_verification_token as string | null,
      verifiedAt: ws.custom_domain_verified_at as string | null,
    };
  });

export const setWorkspaceDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { domain: string }) =>
    z.object({ domain: z.string().min(3).max(253) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { ws, plan, supabase } = await loadWorkspaceWithPlan(context);
    if (!PLANS_WITH_DOMAIN.has(plan)) {
      throw new Error(
        "Domínio customizado disponível apenas nos planos Pro e Business. Faça upgrade para continuar.",
      );
    }
    const domain = normalizeDomain(data.domain);
    if (!DOMAIN_REGEX.test(domain)) {
      throw new Error("Domínio inválido. Use um formato como exemplo.com ou app.exemplo.com.");
    }
    if (domain.endsWith(".lovable.app") || domain.endsWith(".lovable.dev")) {
      throw new Error("Não é permitido usar subdomínios da Lovable.");
    }

    const token =
      "lovable-verify=" +
      Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    const { error } = await supabase
      .from("workspaces")
      .update({
        custom_domain: domain,
        custom_domain_status: "pending",
        custom_domain_verification_token: token,
        custom_domain_verified_at: null,
      })
      .eq("id", ws.id);

    if (error) {
      if ((error as any).code === "23505") {
        throw new Error("Este domínio já está em uso em outro workspace.");
      }
      throw new Error(error.message);
    }

    return { ok: true, domain, status: "pending", verificationToken: token };
  });

export const removeWorkspaceDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ws, supabase } = await loadWorkspaceWithPlan(context);
    const { error } = await supabase
      .from("workspaces")
      .update({
        custom_domain: null,
        custom_domain_status: "none",
        custom_domain_verification_token: null,
        custom_domain_verified_at: null,
      })
      .eq("id", ws.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const TARGET_A_RECORD = "185.158.133.1";

type DohAnswer = { name: string; type: number; data: string };
async function dohQuery(name: string, type: "TXT" | "CNAME" | "A"): Promise<DohAnswer[]> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: "application/dns-json" } });
  if (!res.ok) return [];
  const json = (await res.json()) as { Answer?: DohAnswer[] };
  return json.Answer ?? [];
}

function stripQuotes(s: string) {
  return s.replace(/^"|"$/g, "").replace(/""/g, "");
}

export const verifyWorkspaceDomain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ws, supabase } = await loadWorkspaceWithPlan(context);
    const domain = ws.custom_domain as string | null;
    const token = ws.custom_domain_verification_token as string | null;
    if (!domain || !token) {
      throw new Error("Configure um domínio antes de verificar.");
    }

    // 1) TXT _lovable.<domain> must contain the verification token (proves ownership)
    const txtAnswers = await dohQuery(`_lovable.${domain}`, "TXT");
    const txtFound = txtAnswers.some((a) => stripQuotes(a.data).trim() === token);

    // 2) Domain must point to the Lovable edge: A record 185.158.133.1
    //    (or a CNAME chain that eventually resolves to it — Cloudflare DoH follows CNAME and returns the final A)
    const aAnswers = await dohQuery(domain, "A");
    const aFound = aAnswers.some((a) => a.data.trim() === TARGET_A_RECORD);

    const checks = {
      txt: { ok: txtFound, expected: token, found: txtAnswers.map((a) => stripQuotes(a.data)) },
      a: { ok: aFound, expected: TARGET_A_RECORD, found: aAnswers.map((a) => a.data) },
    };

    const allOk = txtFound && aFound;
    const update: Record<string, unknown> = {
      custom_domain_status: allOk ? "active" : "pending",
    };
    if (allOk) update.custom_domain_verified_at = new Date().toISOString();
    const { error } = await supabase.from("workspaces").update(update).eq("id", ws.id);
    if (error) throw new Error(error.message);

    return { ok: allOk, status: allOk ? "active" : "pending", checks };
  });

