import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppRole, Profile } from "@/types";
import { useUIStore } from "@/stores/uiStore";

interface AuthContextValue {
  user: AppUser | null;
  profile: Profile | null;
  role: AppRole;          // effective role (with dev override)
  realRole: AppRole;      // actual DB role
  loading: boolean;
  signOut: () => void;
}

interface AppUser {
  id: string;
  subject: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  agencyId: string | null;
  roles: AppRole[];
}

interface MeResponse {
  user: AppUser | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [realRole, setRealRole] = useState<AppRole>("client");
  const [loading, setLoading] = useState(true);
  const devRole = useUIStore((s) => s.devRoleOverride);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return { user: null };
        return (await response.json()) as MeResponse;
      })
      .then(({ user }) => {
        if (!active) return;
        setUser(user);
        if (!user) {
          setProfile(null);
          setRealRole("client");
          return;
        }

        setProfile({
          id: user.id,
          nom: user.lastName,
          prenom: user.firstName,
          email: user.email,
          telephone: user.phone,
          agenceId: user.agencyId,
        });
        setRealRole(resolvePrimaryRole(user.roles));
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setProfile(null);
        setRealRole("client");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signOut = () => {
    window.location.href = "/auth/logout";
  };

  const role: AppRole = devRole ?? realRole;
  const value = useMemo(
    () => ({ user, profile, role, realRole, loading, signOut }),
    [user, profile, role, realRole, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

function resolvePrimaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("agent_bo")) return "agent_bo";
  if (roles.includes("agent_fo")) return "agent_fo";
  return "client";
}
