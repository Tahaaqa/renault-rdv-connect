import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Users, MessageSquareWarning, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { listAgencies, listAppointments, listClients, listComplaints } from "@/lib/backend-api";
import { mapAgency, mapAppointment, mapComplaint, mapUserClient } from "@/lib/backend-mappers";

export const Route = createFileRoute("/_authenticated/agent-fo/dashboard")({
  component: AFODash,
});

function AFODash() {
  const { profile, loading } = useAuth();
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
  const reclamations = complaintsQuery.data?.complaints.map(mapComplaint) ?? [];
  const clients = clientsQuery.data?.clients.map(mapUserClient) ?? [];
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const agenceId = profile?.agenceId ?? agences[0]?.id;
  const agence = agences.find((a) => a.id === agenceId) ?? agences[0];
  const today = new Date().toDateString();
  const todayRdvs = rdvs.filter(
    (r) => r.agenceId === agenceId && new Date(r.date).toDateString() === today,
  );
  const pending = todayRdvs.filter((r) => r.statut === "EnAttente");
  const confirmed = todayRdvs.filter((r) => r.statut === "Confirme");
  const openRecs = reclamations.filter((r) => r.statut !== "Resolue");

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Front-Office - {agence?.nom ?? "Agence"}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold">
          Bonjour, {profile?.prenom ?? "Agent"}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Calendar} label="RDV aujourd'hui" value={todayRdvs.length} />
        <Stat icon={CheckCircle2} label="Confirmes" value={confirmed.length} />
        <Stat icon={Clock} label="En attente" value={pending.length} />
        <Stat icon={MessageSquareWarning} label="Reclamations" value={openRecs.length} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Agenda du jour</h2>
          <Link to="/agent-fo/rdv-nouveau" className="text-xs text-yellow hover:underline">
            + Nouveau RDV
          </Link>
        </div>
        {todayRdvs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            Aucun rendez-vous prevu aujourd'hui.
          </p>
        ) : (
          <div className="space-y-2">
            {todayRdvs
              .sort((a, b) => +new Date(a.date) - +new Date(b.date))
              .map((r) => {
                const c = clients.find((x) => x.id === r.clientId);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover-lift"
                  >
                    <div>
                      <div className="font-display font-semibold">
                        {c?.prenom} {c?.nom}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">{r.reference}</div>
                    </div>
                    <div className="font-mono text-lg font-bold text-yellow">
                      {new Date(r.date).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>
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
