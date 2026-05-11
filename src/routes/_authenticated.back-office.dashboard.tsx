import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Calendar, Building2, MessageSquareWarning, Users } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { listAgencies, listAppointments, listClients, listComplaints } from "@/lib/backend-api";
import { mapAgency, mapAppointment, mapComplaint, mapUserClient } from "@/lib/backend-mappers";

export const Route = createFileRoute("/_authenticated/back-office/dashboard")({
  component: ABODash,
});

function ABODash() {
  const { loading, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role !== "agent_back_office") {
      if (role === "agent_front_office") navigate({ to: "/agent-fo/dashboard" });
      else navigate({ to: "/client/dashboard" });
    }
  }, [loading, role, navigate]);

  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
    enabled: !loading,
    retry: false,
  });
  const complaintsQuery = useQuery({
    queryKey: ["complaints"],
    queryFn: listComplaints,
    enabled: !loading,
    retry: false,
  });
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
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
  const clients = clientsQuery.data?.clients.map(mapUserClient) ?? [];
  const reclamations = complaintsQuery.data?.complaints.map(mapComplaint) ?? [];
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const open = reclamations.filter((r) => r.statut !== "Resolue");

  if (loading || role !== "agent_back_office") return null;

  const error =
    appointmentsQuery.error || complaintsQuery.error || clientsQuery.error || agenciesQuery.error;
  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-6 text-red-500">
          <h3 className="font-semibold">Erreur de chargement des donnees (API /api/*)</h3>
          <p className="mt-2 text-sm">{error.message}</p>
          <p className="mt-1 text-xs opacity-70">
            Veuillez verifier la connexion au backend et les permissions Keycloak.
          </p>
        </div>
      </div>
    );
  }

  const trend = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    return {
      day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      rdvs: rdvs.filter((r) => {
        const date = new Date(r.date);
        return date >= dayStart && date <= dayEnd;
      }).length,
    };
  });
  const byAgence = agences.map((a) => ({
    name: a.ville,
    total: rdvs.filter((r) => r.agenceId === a.id).length,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Calendar} label="Total RDV" value={rdvs.length} />
        <Stat icon={Users} label="Clients" value={clients.length} />
        <Stat icon={Building2} label="Agences" value={agences.length} />
        <Stat icon={MessageSquareWarning} label="Reclamations actives" value={open.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-4 font-display text-base font-semibold">RDV des 7 derniers jours</h3>
          <div className="h-64">
            <ResponsiveContainer minWidth={0} minHeight={0}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--renault-yellow)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--renault-yellow)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rdvs"
                  stroke="var(--renault-yellow)"
                  fill="url(#g1)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-base font-semibold">Par agence</h3>
          <div className="h-64">
            <ResponsiveContainer minWidth={0} minHeight={0}>
              <BarChart data={byAgence}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {byAgence.map((_, i) => (
                    <Cell key={i} fill="var(--renault-yellow)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="hover-lift rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon size={16} className="text-yellow" />
      </div>
      <div className="mt-2 font-display text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
