# Painel de Administração Geral

Atualmente não existe nenhuma área de administração no projeto. Vou criar uma do zero, acessível apenas para usuários com papel `admin` global (separado dos papéis de workspace existentes como `owner`/`admin`/`editor`/`viewer`, que são por workspace).

## 1. Banco de dados

Nova migração:

- `CREATE TYPE public.app_role AS ENUM ('admin')` — papel global da plataforma.
- Tabela `public.user_roles` com `(user_id, role)` único, FK para `auth.users`, RLS ativada, GRANTs para `authenticated`/`service_role`.
- Função `public.has_role(_user_id uuid, _role app_role) RETURNS boolean` (`SECURITY DEFINER`, `STABLE`) para checagem sem recursão de RLS.
- Política em `user_roles`: o próprio usuário pode ler suas linhas; administradores podem ler/gerenciar todas.
- Promove o primeiro usuário existente a `admin` (seed inicial) para destravar acesso.

## 2. Server functions (`src/lib/admin.functions.ts`)

Todas usam `requireSupabaseAuth` e verificam `has_role(userId, 'admin')` antes de qualquer operação. Leituras privilegiadas (que cruzam workspaces) carregam `supabaseAdmin` dentro do handler.

- `getAdminOverview` — totais: usuários, workspaces, páginas (rascunho/publicadas), domínios, assinaturas por plano (free/pro/business).
- `listAllUsers` — lista paginada/filtrável de usuários (e-mail, criado em, papel global, workspaces).
- `listAllWorkspaces` — workspaces com owner, plano, contagem de páginas, domínio customizado.
- `listAllPages` — páginas de todos os workspaces, com filtro por status.
- `setUserAdmin({ userId, isAdmin })` — promove/rebaixa admin global.
- `setWorkspacePlan({ workspaceId, plan })` — força mudança de plano (suporte manual).

## 3. Rotas e UI

- `src/routes/_authenticated/admin.tsx` — layout com `beforeLoad` que chama um `isCurrentUserAdmin()` server fn; se não for admin, `redirect` para `/dashboard`. Sidebar com abas: Visão geral, Usuários, Workspaces, Páginas.
- `src/routes/_authenticated/admin.index.tsx` — dashboard com cards de métricas.
- `src/routes/_authenticated/admin.users.tsx` — tabela de usuários, toggle de admin.
- `src/routes/_authenticated/admin.workspaces.tsx` — tabela de workspaces, mudança manual de plano.
- `src/routes/_authenticated/admin.pages.tsx` — tabela de páginas com link para abrir publicadas.

## 4. Entrada visível ("botão administrador")

No header `_authenticated.tsx`, exibe o link "Admin" (ícone `Shield`) **apenas** quando `has_role(uid, 'admin')` retorna true. Hook leve: `useQuery(['is-admin'], isCurrentUserAdmin)`. Sem flicker: o link só aparece após a confirmação.

## Detalhes técnicos

- O papel global `admin` é **separado** de `workspace_members.role`. Não reaproveitar a coluna existente para evitar privilege escalation cruzada.
- Todas as queries de admin filtram **server-side**; nada confiamos no cliente.
- A migração inclui um seed que promove o **primeiro** `auth.users` (ordenado por `created_at`) a admin global, para que você consiga acessar o painel imediatamente. Você poderá promover/rebaixar outros pela própria UI.
- Memória de segurança será atualizada para registrar que `user_roles` é a única fonte de verdade de papéis globais.
