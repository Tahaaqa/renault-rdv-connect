import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppRole, Profile } from "@/types";

interface AuthContextValue {
  user: AppUser | null;
  profile: Profile | null;
  role: AppRole;
  realRole: AppRole;
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
  accessToken?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [realRole, setRealRole] = useState<AppRole>("client");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return { user: null };
        return (await response.json()) as MeResponse;
      })
      .then(({ user, accessToken }) => {
        if (!active) return;
        setUser(user);
        if (!user) {
          setProfile(null);
          const fallbackRole = getDevRole();
          if (fallbackRole) {
            setRealRole(fallbackRole);
            return;
          }
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
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
        setRealRole(accessToken ? decodeRole(accessToken) : resolvePrimaryRole(user.roles));
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setProfile(null);
        const fallbackRole = getDevRole();
        if (fallbackRole) {
          setRealRole(fallbackRole);
        } else if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
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

  const role: AppRole = realRole;
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

export const decodeRole = (token: string): AppRole => {
  const payload = JSON.parse(atob(token.split(".")[1]));
  const roles: string[] = payload?.realm_access?.roles ?? [];
  if (roles.includes("agent_back_office")) return "agent_back_office";
  if (roles.includes("agent_front_office")) return "agent_front_office";
  return "client";
};

function resolvePrimaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("agent_back_office")) return "agent_back_office";
  if (roles.includes("agent_front_office")) return "agent_front_office";
  return "client";
}

function getDevRole(): AppRole | null {
  if (!import.meta.env.DEV) return null;
  const role = localStorage.getItem("dev_role");
  return role === "client" || role === "agent_front_office" || role === "agent_back_office"
    ? role
    : null;
}
