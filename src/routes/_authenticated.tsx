import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, LogOut, CreditCard, Shield } from "lucide-react";
import ranoleLogo from "@/assets/ranole-logo.png.asset.json";
import { isCurrentUserAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 font-display font-semibold">
              <img src={ranoleLogo.url} alt="Ranole" className="h-7 w-7 object-contain" />
              Ranole
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link to="/dashboard"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 ${pathname.startsWith("/dashboard") ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutDashboard className="h-4 w-4" /> Páginas
              </Link>
              <Link to="/billing"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 ${pathname.startsWith("/billing") ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <CreditCard className="h-4 w-4" /> Billing
              </Link>
            </nav>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
