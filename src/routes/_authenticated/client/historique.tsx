import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar } from "lucide-react";
import { RDVCard } from "@/components/shared/RDVCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { StatutRDV } from "@/types";
import { listAgencies, listAppointments, listVehicles } from "@/lib/backend-api";
import { mapAgency, mapAppointment, mapVehicle } from "@/lib/backend-mappers";
import { useAuth } from "@/context/AuthContext";

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
  const { loading } = useAuth();
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
    enabled: !loading,
    retry: false,
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
    enabled: !loading,
    retry: false,
  });
  const agenciesQuery = useQuery({
    queryKey: ["agencies"],
    queryFn: listAgencies,
    enabled: !loading,
    retry: false,
  });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("Tous");
  const vehicules = vehiclesQuery.data?.vehicles.map(mapVehicle) ?? [];
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const mine = appointmentsQuery.data?.appointments.map(mapAppointment) ?? [];
  const list = (filter === "Tous" ? mine : mine.filter((r) => r.statut === filter)).sort(
    (a, b) => +new Date(b.date) - +new Date(a.date),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              filter === f.key
                ? "bg-yellow text-renault-black"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Aucun rendez-vous trouvé"
          description="Ajustez les filtres ou créez un nouveau RDV."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => (
            <RDVCard
              key={r.id}
              rdv={r}
              to={`/client/rdv/${r.id}`}
              vehicules={vehicules}
              agences={agences}
            />
          ))}
        </div>
      )}
    </div>
  );
}
