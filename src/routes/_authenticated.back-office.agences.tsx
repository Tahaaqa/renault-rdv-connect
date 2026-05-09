import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone } from "lucide-react";
import { SEED_AGENCES, useDataStore } from "@/stores/dataStore";

export const Route = createFileRoute("/_authenticated/back-office/agences")({
  component: ABOAgences,
});

function ABOAgences() {
  const rdvs = useDataStore((s) => s.rdvs);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SEED_AGENCES.map((a) => {
          const count = rdvs.filter((r) => r.agenceId === a.id).length;
          return (
            <div key={a.id} className="hover-lift rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold">{a.nom}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={13} className="text-yellow" /> {a.ville}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold text-yellow">{count}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">RDV</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{a.adresse}</p>
              <p className="mt-2 flex items-center gap-1.5 font-mono text-xs">
                <Phone size={12} /> {a.telephone}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
