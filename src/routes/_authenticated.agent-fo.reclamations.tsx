import { createFileRoute } from "@tanstack/react-router";
import { useDataStore } from "@/stores/dataStore";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { fmtRelative } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agent-fo/reclamations")({
  component: AFORecs,
});

function AFORecs() {
  const { reclamations, clients, updateReclamation } = useDataStore();
  const list = [...reclamations].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {list.map((r) => {
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
              {r.statut === "Ouverte" && (
                <button onClick={() => { updateReclamation(r.id, { statut: "EnCours" }); toast.success("Pris en charge"); }}
                  className="rounded-md border border-input px-3 py-1.5 text-xs">Prendre en charge</button>
              )}
              {r.statut !== "Resolue" && (
                <button onClick={() => { updateReclamation(r.id, { statut: "Resolue", resolution: "Résolu par l'agent" }); toast.success("Résolue"); }}
                  className="rounded-md bg-yellow px-3 py-1.5 text-xs font-semibold text-renault-black">Marquer résolue</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
