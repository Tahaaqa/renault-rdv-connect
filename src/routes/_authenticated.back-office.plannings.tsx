import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SEED_AGENCES, useDataStore } from "@/stores/dataStore";

const HOURS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export const Route = createFileRoute("/_authenticated/back-office/plannings")({
  component: ABOPlannings,
});

function ABOPlannings() {
  const [agenceId, setAgenceId] = useState(SEED_AGENCES[0].id);
  const rdvs = useDataStore((s) => s.rdvs).filter((r) => r.agenceId === agenceId);

  // Build week starting today
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0); return d;
  });

  const occupied = (d: Date, h: string) =>
    rdvs.find((r) => {
      const rd = new Date(r.date);
      return rd.toDateString() === d.toDateString() && rd.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", ":") === h;
    });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <select value={agenceId} onChange={(e) => setAgenceId(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm">
        {SEED_AGENCES.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
      </select>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-xs">
          <thead className="bg-background/40 text-[10px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-left">Heure</th>
              {days.map((d) => (
                <th key={d.toISOString()} className="px-3 py-3 text-left">
                  {d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h} className="border-t border-border">
                <td className="px-3 py-3 font-mono text-muted-foreground">{h}</td>
                {days.map((d) => {
                  const occ = occupied(d, h);
                  return (
                    <td key={d.toISOString() + h} className="px-3 py-2">
                      {occ ? (
                        <div className="rounded-md bg-yellow/15 px-2 py-1 font-mono text-[10px] text-yellow">
                          {occ.reference}
                        </div>
                      ) : (
                        <div className="h-6 rounded-md border border-dashed border-border/60" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
