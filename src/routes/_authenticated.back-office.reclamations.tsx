import { createFileRoute } from "@tanstack/react-router";
import { useDataStore } from "@/stores/dataStore";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { fmtRelative } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/back-office/reclamations")({
  component: ABORecs,
});

function ABORecs() {
  const { reclamations, clients, updateReclamation } = useDataStore();
  return (
    <div className="mx-auto max-w-5xl space-y-3">
      {reclamations.map((r) => {
        const c = clients.find((x) => x.id === r.clientId);
        return (
          <div key={r.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display font-semibold">{c?.prenom} {c?.nom}</div>
                <div className="text-xs text-muted-foreground">{fmtRelative(r.createdAt)}</div>
              </div>
              <StatusBadge statut={r.statut} kind="rec" />
            </div>
            <p className="mt-3 text-sm">{r.description}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { updateReclamation(r.id, { statut: "Escaladee" }); toast.warning("Escaladée"); }}
                className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs text-destructive">Escalader</button>
              <button onClick={() => { updateReclamation(r.id, { statut: "Resolue", resolution: "Résolue par le back-office" }); toast.success("Résolue"); }}
                className="rounded-md bg-yellow px-3 py-1.5 text-xs font-semibold text-renault-black">Résoudre</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
