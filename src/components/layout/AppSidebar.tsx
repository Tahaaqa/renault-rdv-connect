import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarPlus,
  History,
  MessageSquareWarning,
  HelpCircle,
  User,
  Users,
  Building2,
  CalendarDays,
  BarChart3,
  ClipboardList,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/context/AuthContext";
import type { AppRole } from "@/types";

type Item = { label: string; to: string; icon: typeof LayoutDashboard };

const NAV: Record<AppRole, { group: string; items: Item[] }[]> = {
  client: [
    {
      group: "Espace client",
      items: [
        { label: "Tableau de bord", to: "/client/dashboard", icon: LayoutDashboard },
        { label: "Nouveau RDV", to: "/client/rdv-nouveau", icon: CalendarPlus },
        { label: "Historique", to: "/client/historique", icon: History },
        { label: "Réclamations", to: "/client/reclamations", icon: MessageSquareWarning },
      ],
    },
    {
      group: "Aide",
      items: [
        { label: "FAQ", to: "/client/faq", icon: HelpCircle },
        { label: "Mon profil", to: "/client/profil", icon: User },
      ],
    },
  ],
  agent_fo: [
    {
      group: "Front-Office",
      items: [
        { label: "Tableau de bord", to: "/agent-fo/dashboard", icon: LayoutDashboard },
        { label: "Nouveau RDV", to: "/agent-fo/rdv-nouveau", icon: CalendarPlus },
        { label: "Clients", to: "/agent-fo/clients", icon: Users },
        { label: "Réclamations", to: "/agent-fo/reclamations", icon: MessageSquareWarning },
      ],
    },
  ],
  agent_bo: [
    {
      group: "Back-Office",
      items: [
        { label: "Tableau de bord", to: "/back-office/dashboard", icon: LayoutDashboard },
        { label: "Tous les RDV", to: "/back-office/rdv", icon: ClipboardList },
        { label: "Agences", to: "/back-office/agences", icon: Building2 },
        { label: "Plannings", to: "/back-office/plannings", icon: CalendarDays },
        { label: "Réclamations", to: "/back-office/reclamations", icon: MessageSquareWarning },
        { label: "Statistiques", to: "/back-office/statistiques", icon: BarChart3 },
      ],
    },
  ],
};

export function AppSidebar() {
  const { role, profile, signOut } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const groups = NAV[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Logo size={28} />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.group}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {g.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((it) => {
                  const active = path === it.to || path.startsWith(it.to + "/");
                  return (
                    <SidebarMenuItem key={it.to}>
                      <SidebarMenuButton asChild isActive={active} tooltip={it.label}>
                        <Link to={it.to} className="flex items-center gap-3">
                          <it.icon size={18} />
                          <span>{it.label}</span>
                          {active && (
                            <span className="ml-auto h-5 w-0.5 rounded-full bg-yellow" aria-hidden />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-yellow text-renault-black font-display font-bold">
            {(profile?.prenom?.[0] ?? "U").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {profile?.prenom ?? ""} {profile?.nom ?? ""}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">{profile?.email ?? ""}</div>
          </div>
          <button
            onClick={() => signOut()}
            aria-label="Se déconnecter"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut size={16} />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
