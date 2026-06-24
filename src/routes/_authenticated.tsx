import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, LogOut, CreditCard, Shield, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: adminData } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkAdmin(),
    staleTime: 60_000,
  });
  const isAdmin = !!adminData?.isAdmin;

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const navItemClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 ${active ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link to="/dashboard" className="flex shrink-0 items-center gap-2 font-display font-semibold">
              <img src={ranoleLogo.url} alt="Ranole" className="h-7 w-7 object-contain" />
              Ranole
            </Link>
            <nav className="hidden items-center gap-1 text-sm md:flex">
              <Link to="/dashboard" className={navItemClass(pathname.startsWith("/dashboard"))}>
                <LayoutDashboard className="h-4 w-4" /> Páginas
              </Link>
              <Link to="/billing" className={navItemClass(pathname.startsWith("/billing"))}>
                <CreditCard className="h-4 w-4" /> Billing
              </Link>
              {isAdmin && (
                <Link to="/admin" className={navItemClass(pathname.startsWith("/admin"))}>
                  <Shield className="h-4 w-4" /> Admin
                </Link>
              )}
            </nav>
          </div>
          <button onClick={logout} className="hidden items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground md:inline-flex">
            <LogOut className="h-4 w-4" /> Sair
          </button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button aria-label="Abrir menu" className="inline-flex shrink-0 items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-surface-elevated hover:text-foreground md:hidden">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 text-sm">
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className={navItemClass(pathname.startsWith("/dashboard"))}>
                  <LayoutDashboard className="h-4 w-4" /> Páginas
                </Link>
                <Link to="/billing" onClick={() => setMobileOpen(false)} className={navItemClass(pathname.startsWith("/billing"))}>
                  <CreditCard className="h-4 w-4" /> Billing
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className={navItemClass(pathname.startsWith("/admin"))}>
                    <Shield className="h-4 w-4" /> Admin
                  </Link>
                )}
                <button onClick={() => { setMobileOpen(false); logout(); }} className="mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-left text-muted-foreground hover:bg-surface-elevated hover:text-foreground">
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
