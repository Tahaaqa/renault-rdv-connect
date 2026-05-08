import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Briefcase, KeyRound, Loader2, Lock, Shield, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Connexion — Renault RDV" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"client" | "agent_fo" | "agent_bo">("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie");
        navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Compte créé. Vérifiez votre email.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { v: "client", icon: User, label: "Client" },
    { v: "agent_fo", icon: Briefcase, label: "Agent FO" },
    { v: "agent_bo", icon: Shield, label: "Administration" },
  ] as const;

  return (
    <div className="flex min-h-screen w-full">
      {/* LEFT */}
      <div className="relative hidden flex-col justify-center overflow-hidden bg-renault-black p-12 text-white lg:flex lg:w-[55%]">
        <div className="absolute inset-0 renault-grid-bg opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,_rgba(255,204,0,0.12),_transparent_60%)]" />

        <div className="relative max-w-lg">
          <div className="mb-12 flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-yellow text-renault-black font-display text-4xl font-extrabold yellow-glow">
              R
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-semibold">Renault</span>
              <span className="h-4 w-px bg-yellow/40" />
              <span className="font-sans text-xl font-light">RDV</span>
            </div>
          </div>

          <h1 className="font-display text-5xl font-extrabold leading-[1.05] md:text-6xl">
            Gérez vos
            <br />
            rendez-vous.
            <br />
            <span className="text-yellow">Simplement.</span>
          </h1>

          <p className="mt-6 max-w-md text-white/70">
            Le portail officiel des agences Renault Tunisie — pour clients et agents.
          </p>

          <div className="mt-12 flex flex-wrap gap-2">
            {[
              "Authentification sécurisée SSO",
              "Vérification OTP par SMS",
              "iOS & Android",
            ].map((b) => (
              <span key={b} className="inline-flex items-center gap-2 rounded-full border border-yellow/30 bg-yellow/5 px-3.5 py-1.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow" />
                {b}
              </span>
            ))}
          </div>
        </div>

        <Link to="/" className="absolute bottom-8 left-12 text-xs text-white/40 hover:text-yellow transition">
          ← Retour à l'accueil
        </Link>
      </div>

      {/* RIGHT */}
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-[45%] lg:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-yellow text-renault-black font-display font-extrabold">
              R
            </div>
            <span className="font-display font-semibold">Renault RDV</span>
          </div>

          <h2 className="font-display text-3xl font-semibold">
            {mode === "signin" ? "Connexion" : "Créer un compte"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accédez à votre espace personnel
          </p>

          {/* Role cards */}
          <div className="mt-7 grid grid-cols-3 gap-2">
            {roles.map((r) => {
              const selected = role === r.v;
              return (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setRole(r.v)}
                  className={`press relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-xs transition ${
                    selected
                      ? "border-yellow bg-yellow/5"
                      : "border-border hover:border-yellow/40"
                  }`}
                >
                  <r.icon size={22} className={selected ? "text-yellow" : "text-muted-foreground"} />
                  <span className="font-medium">{r.label}</span>
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-yellow text-renault-black text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:border-yellow focus:ring-2 focus:ring-yellow/30 transition"
                placeholder="vous@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:border-yellow focus:ring-2 focus:ring-yellow/30 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="press group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-yellow text-sm font-display font-semibold text-renault-black yellow-glow transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              {loading
                ? "Connexion en cours…"
                : mode === "signin"
                ? "Se connecter"
                : "Créer mon compte"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-center text-sm text-muted-foreground hover:text-yellow transition"
          >
            {mode === "signin"
              ? "Pas encore de compte ? Créer un compte →"
              : "Déjà inscrit ? Se connecter →"}
          </button>

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            <Lock size={11} className="mr-1 inline" />
            En vous connectant, vous acceptez nos{" "}
            <a className="text-yellow hover:underline">Conditions</a> et notre{" "}
            <a className="text-yellow hover:underline">Politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
