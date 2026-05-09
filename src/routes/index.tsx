import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Building2,
  Users,
  BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Renault RDV — Portail des agences Renault Tunisie" },
      {
        name: "description",
        content: "Prenez rendez-vous dans une agence Renault en Tunisie. Simple, rapide, sécurisé.",
      },
    ],
  }),
});

function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid place-items-center rounded-lg bg-yellow text-renault-black font-display font-extrabold yellow-glow"
        style={{ width: size, height: size, fontSize: size * 0.6 }}
      >
        R
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display font-semibold text-base">Renault</span>
        <span className="h-3.5 w-px bg-yellow/40" />
        <span className="font-sans font-light text-base text-muted-foreground">RDV</span>
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Top nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="hidden items-center gap-3 md:flex">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Tunisie</span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 renault-grid-bg opacity-40" />
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,_var(--renault-yellow)_18%,_transparent),_transparent_60%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7 animate-fade-up">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-yellow/30 bg-yellow/5 px-4 py-1.5 text-xs font-medium">
                <Sparkles size={14} className="text-yellow" />
                <span className="text-foreground/80">Nouveau portail officiel</span>
              </div>

              <h1 className="font-display font-extrabold leading-[1.05] text-5xl md:text-6xl lg:text-7xl">
                Gérez vos
                <br />
                rendez-vous.
                <br />
                <span className="text-yellow">Simplement.</span>
              </h1>

              <p className="mt-8 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
                Le portail officiel des agences{" "}
                <span className="text-foreground font-medium">Renault Tunisie</span> — pour clients
                et agents. Prenez, suivez et gérez vos rendez-vous d'entretien en quelques clics.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href="/login"
                  className="press group inline-flex items-center gap-2 rounded-xl bg-yellow px-7 py-4 text-sm font-display font-semibold text-renault-black transition hover:brightness-110 yellow-glow"
                >
                  Accéder à mon espace
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </a>
                <a
                  href="/login"
                  className="press inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-4 text-sm font-medium hover:bg-accent transition"
                >
                  Espace agent
                </a>
              </div>

              <div className="mt-12 flex flex-wrap gap-3">
                {[
                  { icon: ShieldCheck, label: "Authentification SSO sécurisée" },
                  { icon: Smartphone, label: "iOS & Android" },
                  { icon: CalendarCheck, label: "Disponible 24/7" },
                ].map((b) => (
                  <span
                    key={b.label}
                    className="inline-flex items-center gap-2 rounded-full border border-yellow/25 bg-yellow/5 px-4 py-1.5 text-xs font-medium"
                  >
                    <b.icon size={13} className="text-yellow" />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero card */}
            <div className="lg:col-span-5 animate-scale-in">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-yellow/30 via-transparent to-yellow/10 blur-2xl" />
                <div className="relative rounded-2xl border border-yellow/20 bg-card p-1 shadow-2xl">
                  <div className="rounded-xl bg-surface-sunk p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">
                        Prochain RDV
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-status-confirmed/15 px-3 py-1 text-[11px] font-medium text-status-confirmed">
                        <span className="h-1.5 w-1.5 rounded-full bg-status-confirmed" />
                        Confirmé
                      </span>
                    </div>

                    <div className="font-display text-3xl font-bold leading-tight">
                      Jeudi 15 mai
                      <span className="ml-3 font-mono text-yellow">10h00</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">Renault Tunis-Centre</div>

                    <div className="mt-6 flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3">
                      <div className="rounded-md border-2 border-renault-black bg-white px-2.5 py-1 font-mono text-xs font-bold text-renault-black">
                        16 TN 142
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Renault Clio V</div>
                        <div className="text-xs text-muted-foreground">2022</div>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-2">
                      {["Vidange", "Révision", "Pneus"].map((s) => (
                        <div
                          key={s}
                          className="rounded-md border border-border bg-card/60 p-2 text-center text-[11px] text-muted-foreground"
                        >
                          {s}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
                      RDV-2025-00127
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three role cards */}
      <section className="relative border-t border-border bg-surface-sunk/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <span className="text-xs uppercase tracking-widest text-yellow">Trois expériences</span>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold">
              Une plateforme, conçue pour chacun.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Que vous soyez client, agent en agence ou administrateur, l'expérience est pensée pour
              votre rôle.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Users,
                tag: "Espace Client",
                title: "Prendre RDV en 5 étapes",
                desc: "Choisissez votre agence, votre véhicule, votre créneau — et recevez votre confirmation par SMS.",
                features: ["Stepper intuitif", "OCR plaque", "Historique complet"],
              },
              {
                icon: Building2,
                tag: "Agent Front-Office",
                title: "Vue temps réel de l'agence",
                desc: "Le planning du jour, la recherche client instantanée, la création de RDV à la volée.",
                features: ["Timeline live", "Recherche client", "Réclamations"],
              },
              {
                icon: BarChart3,
                tag: "Administration",
                title: "Pilotez tout le réseau",
                desc: "KPI, statistiques avancées, gestion des agences et des plannings depuis une seule interface.",
                features: ["Dashboards", "Génération créneaux", "Analytics"],
              },
            ].map((card) => (
              <div
                key={card.tag}
                className="group hover-lift relative overflow-hidden rounded-2xl border border-border bg-card p-7"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-yellow/10 text-yellow">
                  <card.icon size={22} />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {card.tag}
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold">{card.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                <ul className="mt-5 space-y-2">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-foreground/80">
                      <span className="h-1 w-1 rounded-full bg-yellow" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-t border-border py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { v: "6", l: "Agences en Tunisie" },
            { v: "24/7", l: "Disponibilité" },
            { v: "5 étapes", l: "Pour réserver" },
            { v: "100%", l: "Sécurisé SSO" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-4xl md:text-5xl font-extrabold text-yellow">
                {s.v}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-b from-transparent to-yellow/5 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            Prêt à <span className="text-yellow">simplifier</span> votre prochain rendez-vous ?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            Connectez-vous à votre espace personnel et prenez rendez-vous en moins d'une minute.
          </p>
          <a
            href="/login"
            className="press mt-10 inline-flex items-center gap-2 rounded-xl bg-yellow px-8 py-4 text-sm font-display font-semibold text-renault-black yellow-glow transition hover:brightness-110"
          >
            Se connecter
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-muted-foreground md:flex-row">
          <Logo size={28} />
          <div>© 2025 Renault Tunisie · Portail RDV</div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-yellow transition">
              Confidentialité
            </a>
            <a href="#" className="hover:text-yellow transition">
              Conditions
            </a>
            <a href="#" className="hover:text-yellow transition">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
