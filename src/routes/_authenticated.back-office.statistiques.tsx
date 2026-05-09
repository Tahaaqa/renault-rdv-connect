import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useDataStore, SEED_AGENCES } from "@/stores/dataStore";

export const Route = createFileRoute("/_authenticated/back-office/statistiques")({
  component: ABOStats,
});

const COLORS = ["var(--status-confirmed)", "var(--status-pending)", "var(--status-cancelled)", "var(--status-done)"];

function ABOStats() {
  const rdvs = useDataStore((s) => s.rdvs);
  const byStatus = ["Confirme", "EnAttente", "Annule", "Termine"].map((k) => ({
    name: k, value: rdvs.filter((r) => r.statut === k).length,
  }));
  const byAgence = SEED_AGENCES.map((a) => ({
    ville: a.ville,
    confirmés: rdvs.filter((r) => r.agenceId === a.id && r.statut === "Confirme").length,
    annulés: rdvs.filter((r) => r.agenceId === a.id && r.statut === "Annule").length,
  }));

  return (
    <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-base font-semibold">Répartition par statut</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-base font-semibold">Confirmés vs annulés par agence</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={byAgence}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="ville" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="confirmés" stackId="a" fill="var(--status-confirmed)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="annulés" stackId="a" fill="var(--status-cancelled)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
