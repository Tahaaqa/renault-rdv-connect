import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { useDataStore } from "@/stores/dataStore";
import { VehiclePlate } from "@/components/shared/VehiclePlate";

export const Route = createFileRoute("/_authenticated/agent-fo/clients")({
  component: AFOClients,
});

function AFOClients() {
  const { clients, vehicules, rdvs } = useDataStore();
  const [q, setQ] = useState("");
  const filtered = clients.filter((c) =>
    `${c.prenom} ${c.nom} ${c.email} ${c.telephone}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un client..."
          className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-3 text-sm"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Véhicules</th>
              <th className="px-4 py-3">RDV</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const veh = vehicules.filter((v) => v.clientId === c.id);
              const count = rdvs.filter((r) => r.clientId === c.id).length;
              return (
                <tr key={c.id} className="border-t border-border hover:bg-background/40">
                  <td className="px-4 py-3 font-display font-semibold">{c.prenom} {c.nom}</td>
                  <td className="px-4 py-3">
                    <div>{c.email}</div>
                    <div className="text-xs text-muted-foreground">{c.telephone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {veh.map((v) => <VehiclePlate key={v.id} value={v.immatriculation} size="sm" />)}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
