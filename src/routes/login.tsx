import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Connexion - Renault RDV" }] }),
});

function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
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
            Gerez vos
            <br />
            rendez-vous.
            <br />
            <span className="text-yellow">Simplement.</span>
          </h1>

          <p className="mt-6 max-w-md text-white/70">
            Le portail officiel des agences Renault Tunisie, securise par Keycloak.
          </p>

          <div className="mt-12 flex flex-wrap gap-2">
            {["Authentification SSO", "Roles centralises", "Session securisee"].map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-2 rounded-full border border-yellow/30 bg-yellow/5 px-3.5 py-1.5 text-xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-yellow" />
                {b}
              </span>
            ))}
          </div>
        </div>

        <Link
          to="/"
          className="absolute bottom-8 left-12 text-xs text-white/40 hover:text-yellow transition"
        >
          Retour a l'accueil
        </Link>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-[45%] lg:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-yellow text-renault-black font-display font-extrabold">
              R
            </div>
            <span className="font-display font-semibold">Renault RDV</span>
          </div>

          <h2 className="font-display text-3xl font-semibold">Connexion</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accedez a votre espace personnel avec Keycloak.
          </p>

          <a
            href="/auth/login"
            className="press group mt-7 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-yellow text-sm font-display font-semibold text-renault-black yellow-glow transition hover:brightness-110"
          >
            <KeyRound size={18} />
            Continuer avec Keycloak
          </a>

          <div className="mt-4 text-center">
            <a
              href="/auth/register"
              className="text-sm font-medium text-muted-foreground hover:text-yellow hover:underline transition"
            >
              Nouveau client ? Créer un compte
            </a>
          </div>

          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            <Lock size={11} className="mr-1 inline" />
            La connexion, les mots de passe et les roles sont geres par le fournisseur SSO.
          </p>
        </div>
      </div>
    </div>
  );
}
