import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import { AgencyMap } from "@/components/maps/AgencyMap";
import { useAuth } from "@/context/AuthContext";
import { listAgencies } from "@/lib/backend-api";
import { mapAgency } from "@/lib/backend-mappers";
import { distanceKm } from "@/lib/utils";
import type { Agence } from "@/types";

export const Route = createFileRoute("/_authenticated/client/agences")({
  component: ClientAgencesPage,
});

function ClientAgencesPage() {
  const { loading } = useAuth();
  const [selected, setSelected] = useState<Agence | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const agenciesQuery = useQuery({
    queryKey: ["agencies"],
    queryFn: listAgencies,
    enabled: !loading,
    retry: false,
  });
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Agences Renault</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Retrouvez les agences disponibles en Tunisie.
        </p>
      </div>

      <AgencyMap
        agencies={agences}
        selectedAgenceId={selected?.id}
        onAgenceSelect={setSelected}
        onUserLocation={setUserPos}
        height="60vh"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agences.map((agence) => {
          const active = selected?.id === agence.id;
          const distance =
            userPos && agence.latitude && agence.longitude
              ? distanceKm(userPos[0], userPos[1], agence.latitude, agence.longitude)
              : null;
          return (
            <button
              key={agence.id}
              onClick={() => setSelected(agence)}
              className={`rounded-xl border p-4 text-left transition hover-lift ${
                active ? "border-yellow bg-yellow/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display font-semibold">{agence.nom}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{agence.adresse}</div>
                </div>
                {active ? <Check size={16} className="text-yellow" /> : <MapPin size={16} />}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">{agence.telephone}</span>
                {distance !== null && <span>À {distance} km de vous</span>}
              </div>
              <Link
                to="/client/rdv-nouveau"
                className="mt-4 inline-flex rounded-md bg-yellow px-3 py-2 text-xs font-semibold text-renault-black"
              >
                Prendre RDV
              </Link>
            </button>
          );
        })}
      </div>
    </div>
  );
}
