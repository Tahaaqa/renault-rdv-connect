import { createFileRoute } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { listAgencies, listAppointments } from "@/lib/backend-api";
import { mapAgency, mapAppointment } from "@/lib/backend-mappers";

export const Route = createFileRoute("/_authenticated/back-office/statistiques")({
  component: ABOStats,
});

const COLORS = [
  "var(--status-confirmed)",
  "var(--status-pending)",
  "var(--status-cancelled)",
  "var(--status-done)",
];

function ABOStats() {
  const { loading } = useAuth();
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
    enabled: !loading,
    retry: false,
  });
  const agenciesQuery = useQuery({
    queryKey: ["agencies"],
    queryFn: listAgencies,
    enabled: !loading,
    retry: false,
  });
  const rdvs = appointmentsQuery.data?.appointments.map(mapAppointment) ?? [];
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const byStatus = ["Confirme", "EnAttente", "Annule", "Termine"].map((k) => ({
    name: k,
    value: rdvs.filter((r) => r.statut === k).length,
  }));
  const byAgence = agences.map((a) => ({
    ville: a.ville,
    confirmes: rdvs.filter((r) => r.agenceId === a.id && r.statut === "Confirme").length,
    annules: rdvs.filter((r) => r.agenceId === a.id && r.statut === "Annule").length,
  }));

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-base font-semibold">Repartition par statut</h3>
        <div className="h-72">
          <ResponsiveContainer minWidth={0} minHeight={0}>
            <PieChart>
              <Pie
                data={byStatus}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
              >
                {byStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 font-display text-base font-semibold">
          Confirmes vs annules par agence
        </h3>
        <div className="h-72">
          <ResponsiveContainer minWidth={0} minHeight={0}>
            <BarChart data={byAgence}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="ville" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Bar
                dataKey="confirmes"
                stackId="a"
                fill="var(--status-confirmed)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="annules"
                stackId="a"
                fill="var(--status-cancelled)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
