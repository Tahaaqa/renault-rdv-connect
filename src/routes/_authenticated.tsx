import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import { useAuth } from "@/context/AuthContext";

const getAuthStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getCurrentSession } = await import("@/backend/auth/current-session.server");
  const session = await getCurrentSession();
  return { authenticated: Boolean(session) };
});

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { authenticated } = await getAuthStatus();
    if (!authenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthShell,
});

const TITLES: Record<string, string> = {
  "/client/dashboard": "Tableau de bord",
  "/client/rdv-nouveau": "Nouveau rendez-vous",
  "/client/historique": "Historique",
  "/client/reclamations": "Réclamations",
  "/client/faq": "Foire aux questions",
  "/client/profil": "Mon profil",
  "/agent-fo/dashboard": "Tableau de bord agent",
  "/agent-fo/rdv-nouveau": "Créer un rendez-vous",
  "/agent-fo/clients": "Clients",
  "/agent-fo/reclamations": "Réclamations",
  "/back-office/dashboard": "Tableau de bord",
  "/back-office/rdv": "Tous les rendez-vous",
  "/back-office/utilisateurs": "Utilisateurs",
  "/back-office/agences": "Agences",
  "/back-office/plannings": "Plannings",
  "/back-office/reclamations": "Réclamations",
  "/back-office/statistiques": "Statistiques",
};

function AuthShell() {
  const { loading } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [path]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-pulse-slow rounded-full bg-yellow" />
      </div>
    );
  }

  const title = TITLES[path];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar title={title} />
          <main key={path} className="flex-1 animate-fade-up px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
