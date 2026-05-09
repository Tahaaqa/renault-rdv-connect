import { Link } from "@tanstack/react-router";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { VehiclePlate } from "./VehiclePlate";
import type { RendezVous } from "@/types";
import type { Agence, Vehicule } from "@/types";
import { fmtDateLong } from "@/lib/format";
import { useDataStore } from "@/stores/dataStore";
import { SEED_AGENCES } from "@/stores/dataStore";

export function RDVCard({
  rdv,
  to,
  vehicules: providedVehicules,
  agences: providedAgences,
}: {
  rdv: RendezVous;
  to?: string;
  vehicules?: Vehicule[];
  agences?: Agence[];
}) {
  const storeVehicules = useDataStore((s) => s.vehicules);
  const vehicules = providedVehicules ?? storeVehicules;
  const agences = providedAgences ?? SEED_AGENCES;
  const vehicule = vehicules.find((v) => v.id === rdv.vehiculeId);
  const agence = agences.find((a) => a.id === rdv.agenceId);

  const Wrapper = to
    ? ({ children }: { children: React.ReactNode }) => (
        <Link to={to} className="block">{children}</Link>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <Wrapper>
      <div className="hover-lift group rounded-xl border border-border bg-card p-5 transition-colors hover:border-yellow/40">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
                {rdv.reference}
              </span>
              <StatusBadge statut={rdv.statut} />
            </div>
            <div className="font-display text-lg font-semibold">
              {fmtDateLong(rdv.date)}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-yellow" />
                {agence?.nom ?? "Agence"}
              </span>
              {vehicule && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="flex items-center gap-2">
                    <VehiclePlate value={vehicule.immatriculation} size="sm" />
                    <span>
                      {vehicule.marque} {vehicule.modele}
                    </span>
                  </span>
                </>
              )}
            </div>
            {rdv.notes && (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground/80">{rdv.notes}</p>
            )}
          </div>
          {to && (
            <ChevronRight
              size={20}
              className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-yellow"
            />
          )}
        </div>
      </div>
    </Wrapper>
  );
}

export function RDVCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="space-y-3">
        <div className="h-4 w-32 skeleton-shimmer rounded" />
        <div className="h-6 w-3/4 skeleton-shimmer rounded" />
        <div className="h-4 w-1/2 skeleton-shimmer rounded" />
      </div>
    </div>
  );
}

export { Calendar };
