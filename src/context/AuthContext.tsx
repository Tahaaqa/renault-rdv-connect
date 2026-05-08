import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/types";
import { useUIStore } from "@/stores/uiStore";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;          // effective role (with dev override)
  realRole: AppRole;      // actual DB role
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [realRole, setRealRole] = useState<AppRole>("client");
  const [loading, setLoading] = useState(true);
  const devRole = useUIStore((s) => s.devRoleOverride);

  useEffect(() => {
    // CRITICAL: subscribe BEFORE getSession.
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer DB calls
        setTimeout(() => loadProfile(sess.user.id), 0);
      } else {
        setProfile(null);
        setRealRole("client");
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadProfile(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async (uid: string) => {
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    if (p) {
      setProfile({
        id: p.id,
        nom: p.nom,
        prenom: p.prenom,
        email: p.email,
        telephone: p.telephone,
        agenceId: p.agence_id,
      });
    }
    const rs = (roles ?? []).map((r: { role: AppRole }) => r.role);
    if (rs.includes("agent_bo")) setRealRole("agent_bo");
    else if (rs.includes("agent_fo")) setRealRole("agent_fo");
    else setRealRole("client");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const role: AppRole = devRole ?? realRole;

  return (
    <AuthContext.Provider value={{ user, session, profile, role, realRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
