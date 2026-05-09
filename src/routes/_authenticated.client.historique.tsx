import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { RDVCard } from "@/components/shared/RDVCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { StatutRDV } from "@/types";

export const Route = createFileRoute("/_authenticated/client/historique")({
  component: Historique,
});

const FILTERS: { key: "Tous" | StatutRDV; label: string }[] = [
  { key: "Tous", label: "Tous" },
  { key: "Confirme", label: "Confirmés" },
  { key: "EnAttente", label: "En attente" },
  { key: "Termine", label: "Terminés" },
  { key: "Annule", label: "Annulés" },
];

function Historique() {
  const { rdvs, currentClientId } = useDataStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("Tous");
  const mine = rdvs.filter((r) => r.clientId === currentClientId);
  const list = (filter === "Tous" ? mine : mine.filter((r) => r.statut === filter)).sort(
    (a, b) => +new Date(b.date) - +new Date(a.date)
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              filter === f.key ? "bg-yellow text-renault-black" : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Calendar} title="Aucun rendez-vous trouvé" description="Ajustez les filtres ou créez un nouveau RDV." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => (
            <RDVCard key={r.id} rdv={r} to={`/client/rdv/${r.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
