import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Globe,
  Loader2,
  Lock,
  Copy,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getWorkspaceDomain,
  setWorkspaceDomain,
  removeWorkspaceDomain,
  verifyWorkspaceDomain,
} from "@/lib/domains.functions";

export const Route = createFileRoute("/_authenticated/settings/domains")({
  head: () => ({ meta: [{ title: "Domínios — Ranole" }] }),
  component: DomainsPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Não encontrado.</div>,
});

const PROXY_TARGET_HOST = "ranole.com";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    none: { label: "Sem domínio", cls: "bg-surface-elevated text-muted-foreground" },
    pending: { label: "Aguardando DNS", cls: "bg-amber-500/15 text-amber-400" },
    verifying: { label: "Verificando", cls: "bg-amber-500/15 text-amber-400" },
    active: { label: "Ativo", cls: "bg-primary/20 text-primary-glow" },
    failed: { label: "Falha", cls: "bg-destructive/20 text-destructive" },
  };
  const s = map[status] ?? map.none;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs ${s.cls}`}>{s.label}</span>;
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
        <code className="flex-1 truncate font-mono text-xs">{value}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(value);
            toast.success("Copiado");
          }}
          className="rounded p-1 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function DomainsPage() {
  const qc = useQueryClient();
  const get = useServerFn(getWorkspaceDomain);
  const setFn = useServerFn(setWorkspaceDomain);
  const remove = useServerFn(removeWorkspaceDomain);
  const verify = useServerFn(verifyWorkspaceDomain);

  const { data, isLoading } = useQuery({
    queryKey: ["workspace-domain"],
    queryFn: () => get(),
  });

  const [domain, setDomain] = useState("");

  const mSet = useMutation({
    mutationFn: (d: string) => setFn({ data: { domain: d } }),
    onSuccess: () => {
      toast.success("Domínio salvo. Configure o DNS para concluir a verificação.");
      setDomain("");
      qc.invalidateQueries({ queryKey: ["workspace-domain"] });
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao salvar domínio"),
  });

  const mRemove = useMutation({
    mutationFn: () => remove(),
    onSuccess: () => {
      toast.success("Domínio removido");
      qc.invalidateQueries({ queryKey: ["workspace-domain"] });
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao remover"),
  });

  const mVerify = useMutation({
    mutationFn: () => verify(),
    onSuccess: (r: any) => {
      if (r.ok) toast.success("Domínio verificado e ativo!");
      else {
        const msgs: string[] = [];
        if (!r.checks.txt.ok) msgs.push("TXT _lovable ainda não propagou");
        if (!r.checks.proxy.ok) msgs.push(`CNAME ainda não aponta para ${PROXY_TARGET_HOST}`);
        toast.error(msgs.join(" · ") || "Ainda não verificado");
      }
      qc.invalidateQueries({ queryKey: ["workspace-domain"] });
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao verificar"),
  });

  if (isLoading || !data) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const { plan, allowed, domain: current, status, verificationToken } = data;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Configurações</p>
        <h1 className="font-display text-3xl">Domínio customizado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte seu próprio domínio para publicar páginas na sua marca.
        </p>
      </header>

      {!allowed ? (
        <section className="rounded-2xl border border-border bg-surface-elevated p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2 text-primary-glow">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl">Recurso dos planos Pro e Business</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Seu plano atual é <span className="capitalize text-foreground">{plan}</span>. Faça upgrade
                para conectar um domínio próprio.
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  to="/billing"
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
                >
                  Ver planos
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-surface-elevated p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h2 className="font-display text-lg">Seu domínio</h2>
              </div>
              <StatusPill status={status} />
            </div>

            {current ? (
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-surface px-3 py-2">
                  <code className="font-mono text-sm">{current}</code>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => mVerify.mutate()}
                    disabled={mVerify.isPending}
                  >
                    {mVerify.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Verificar DNS agora
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Remover domínio customizado?")) mRemove.mutate();
                    }}
                    disabled={mRemove.isPending}
                  >
                    {mRemove.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remover domínio
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (domain.trim()) mSet.mutate(domain.trim());
                }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <Input
                  placeholder="exemplo.com ou lp.exemplo.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={mSet.isPending || !domain.trim()}>
                  {mSet.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </form>
            )}
          </section>

          {current && (
            <section className="mt-6 rounded-2xl border border-border bg-surface-elevated p-6">
              <h2 className="font-display text-lg">Configuração de DNS</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Conecte seu domínio através de um proxy CDN (Cloudflare, Fastly, Bunny, etc.) na sua
                própria conta. O SSL é emitido automaticamente lá e o tráfego é encaminhado para o
                Ranole. Esse domínio servirá apenas as páginas publicadas deste workspace — o
                dashboard continua em <code className="rounded bg-surface px-1">ranole.com</code>.
              </p>

              <div className="mt-5 space-y-5">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-primary-glow">Passo 1</span>
                    Apontar o domínio para o Ranole (CNAME proxiado)
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <CopyField label="Tipo" value="CNAME" />
                    <CopyField label="Nome" value={current.split(".").length > 2 ? current.split(".")[0] : "@"} />
                    <CopyField label="Valor" value={PROXY_TARGET_HOST} />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    No Cloudflare, mantenha o registro com a <strong>nuvem laranja (Proxied)</strong>
                    ativada — é isso que emite o SSL no seu domínio. Em <em>SSL/TLS</em> use o modo
                    <strong> Full</strong>. Em <em>Rules → Origin Rules</em>, crie uma regra que
                    sobrescreva o <strong>Host Header</strong> para <code className="rounded bg-surface-elevated px-1">{current}</code>
                    (ou deixe o padrão; o Ranole já resolve pelo Host original).
                  </p>
                </div>

                {verificationToken && (
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                      <span className="rounded bg-primary/15 px-2 py-0.5 text-primary-glow">Passo 2</span>
                      Verificar a propriedade
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <CopyField label="Tipo" value="TXT" />
                      <CopyField label="Nome" value="_lovable" />
                      <CopyField label="Valor" value={verificationToken} />
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-primary-glow">Passo 3</span>
                    Definir a página inicial do domínio
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No <Link to="/dashboard" className="underline">Dashboard</Link>, em uma página
                    publicada, clique no ícone de <strong>casa</strong> para marcá-la como home.
                    Ela será servida em <code className="rounded bg-surface-elevated px-1">https://{current}</code>.
                    As demais páginas publicadas ficam disponíveis em
                    <code className="rounded bg-surface-elevated px-1">https://{current}/&lt;slug&gt;</code>.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Depois de configurar o CNAME proxiado e o TXT, clique em <strong>Verificar DNS agora</strong>.
                  A propagação geralmente leva poucos minutos.
                </p>
              </div>



              {status === "active" && (
                <div className="mt-3 flex items-center gap-2 text-sm text-primary-glow">
                  <CheckCircle2 className="h-4 w-4" /> Domínio ativo — sua home será servida em {current}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
