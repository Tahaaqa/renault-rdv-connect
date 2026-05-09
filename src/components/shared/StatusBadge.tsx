import { cva } from "class-variance-authority";
import type { StatutRDV, StatutReclamation } from "@/types";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
  {
    variants: {
      tone: {
        confirmed:
          "bg-[color-mix(in_oklab,var(--status-confirmed)_18%,transparent)] text-[var(--status-confirmed)]",
        pending:
          "bg-[color-mix(in_oklab,var(--status-pending)_18%,transparent)] text-[var(--status-pending)]",
        cancelled:
          "bg-[color-mix(in_oklab,var(--status-cancelled)_18%,transparent)] text-[var(--status-cancelled)]",
        done: "bg-[color-mix(in_oklab,var(--status-done)_18%,transparent)] text-[var(--status-done)]",
        info: "bg-[color-mix(in_oklab,var(--renault-yellow)_18%,transparent)] text-[var(--renault-yellow)]",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const RDV_MAP: Record<
  StatutRDV,
  { label: string; tone: "confirmed" | "pending" | "cancelled" | "done" }
> = {
  Confirme: { label: "Confirmé", tone: "confirmed" },
  EnAttente: { label: "En attente", tone: "pending" },
  Annule: { label: "Annulé", tone: "cancelled" },
  Termine: { label: "Terminé", tone: "done" },
};
const REC_MAP: Record<
  StatutReclamation,
  { label: string; tone: "confirmed" | "pending" | "cancelled" | "done" | "info" }
> = {
  Ouverte: { label: "Ouverte", tone: "pending" },
  EnCours: { label: "En cours", tone: "info" },
  Resolue: { label: "Résolue", tone: "confirmed" },
  Escaladee: { label: "Escaladée", tone: "cancelled" },
};

export function StatusBadge({
  statut,
  kind = "rdv",
  className,
}: {
  statut: string;
  kind?: "rdv" | "rec";
  className?: string;
}) {
  const m = (kind === "rdv"
    ? RDV_MAP[statut as StatutRDV]
    : REC_MAP[statut as StatutReclamation]) ?? { label: statut, tone: "info" as const };
  return <span className={cn(badge({ tone: m.tone }), className)}>{m.label}</span>;
}
