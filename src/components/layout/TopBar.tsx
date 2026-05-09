import { Bell, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUIStore } from "@/stores/uiStore";
import { useDataStore } from "@/stores/dataStore";
import { useAuth } from "@/context/AuthContext";
import { listNotifications, markNotificationsRead } from "@/lib/backend-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppRole } from "@/types";
import { fmtRelative } from "@/lib/format";

export function TopBar({ title }: { title?: string }) {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const devRole = useUIStore((s) => s.devRoleOverride);
  const setDevRole = useUIStore((s) => s.setDevRole);
  const { realRole, loading } = useAuth();
  const queryClient = useQueryClient();
  const localNotifications = useDataStore((s) => s.notifications);
  const markAllLocal = useDataStore((s) => s.markAllNotificationsRead);
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    enabled: !loading,
    retry: false,
  });
  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: markAllLocal,
  });
  const notifications = notificationsQuery.data?.notifications ?? localNotifications;
  const markAll = () => markReadMutation.mutate();
  const unread = notifications.filter((n) => !n.read).length;
  const [open, setOpen] = useState(false);

  const roles: AppRole[] = ["client", "agent_fo", "agent_bo"];
  const labelFor = (r: AppRole) => (r === "client" ? "Client" : r === "agent_fo" ? "Agent FO" : "Back-Office");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
      <SidebarTrigger />
      <h1 className="font-display text-base font-semibold">{title ?? "Renault RDV"}</h1>

      <div className="ml-auto flex items-center gap-2">
        {/* Dev role switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden items-center gap-2 rounded-md border border-yellow/30 bg-yellow/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest text-yellow hover:bg-yellow/10 md:inline-flex">
            DEV · {labelFor(devRole ?? realRole)}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Aperçu rôle</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roles.map((r) => (
              <DropdownMenuItem key={r} onClick={() => setDevRole(r)}>
                {labelFor(r)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDevRole(null)}>Réinitialiser</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={toggleTheme}
          className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Changer de thème"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-yellow px-1 font-mono text-[10px] font-bold text-renault-black">
                {unread}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="font-display text-sm font-semibold">Notifications</span>
              <button
                onClick={markAll}
                className="text-[11px] text-muted-foreground hover:text-yellow"
              >
                Tout marquer lu
              </button>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">Aucune notification</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2 border-b border-border/50 px-3 py-2.5 last:border-0 ${
                      !n.read ? "bg-yellow/5" : ""
                    }`}
                  >
                    <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${!n.read ? "bg-yellow" : "bg-muted"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{n.message}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{fmtRelative(n.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
