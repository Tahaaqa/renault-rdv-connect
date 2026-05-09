import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Calendar, Car, MessageSquareWarning, Plus, ArrowRight } from "lucide-react";
import { useDataStore, SEED_AGENCES } from "@/stores/dataStore";
import { useAuth } from "@/context/AuthContext";
import { RDVCard } from "@/components/shared/RDVCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { VehiclePlate } from "@/components/shared/VehiclePlate";
import { fmtDateLong } from "@/lib/format";
import { listAgencies, listAppointments, listComplaints, listVehicles } from "@/lib/backend-api";
import { mapAgency, mapAppointment, mapComplaint, mapVehicle } from "@/lib/backend-mappers";

export const Route = createFileRoute("/_authenticated/client/dashboard")({
  component: ClientDashboard,
});

function ClientDashboard() {
  const { profile, loading } = useAuth();
  const { rdvs, vehicules, reclamations, currentClientId } = useDataStore();
  const appointmentsQuery = useQuery({ queryKey: ["appointments"], queryFn: listAppointments, enabled: !loading, retry: false });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: listVehicles, enabled: !loading, retry: false });
  const complaintsQuery = useQuery({ queryKey: ["complaints"], queryFn: listComplaints, enabled: !loading, retry: false });
  const agenciesQuery = useQuery({ queryKey: ["agencies"], queryFn: listAgencies, enabled: !loading, retry: false });

  const backendRdvs = appointmentsQuery.data?.appointments.map(mapAppointment);
  const backendVehicules = vehiclesQuery.data?.vehicles.map(mapVehicle);
  const backendReclamations = complaintsQuery.data?.complaints.map(mapComplaint);
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? SEED_AGENCES;

  const myRdvs = backendRdvs ?? rdvs.filter((r) => r.clientId === currentClientId);
  const upcoming = myRdvs
    .filter((r) => r.statut === "Confirme" || r.statut === "EnAttente")
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const myVehs = backendVehicules ?? vehicules.filter((v) => v.clientId === currentClientId);
  const openRecs = (backendReclamations ?? reclamations.filter((r) => r.clientId === currentClientId)).filter(
    (r) => r.statut !== "Resolue",
  );

  const next = upcoming[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero greeting */}
      <section className="overflow-hidden rounded-2xl border border-yellow/30 bg-gradient-to-br from-yellow/10 via-card to-card p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Bienvenue</p>
            <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
              Bonjour, {profile?.prenom ?? "Client"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {next
                ? `Votre prochain rendez-vous est ${fmtDateLong(next.date)}.`
                : "Aucun rendez-vous à venir. Réservez votre prochaine visite en quelques clics."}
            </p>
          </div>
          <Link
            to="/client/rdv-nouveau"
            className="press inline-flex items-center justify-center gap-2 rounded-xl bg-yellow px-5 py-3 font-display font-semibold text-renault-black yellow-glow hover:brightness-105"
          >
            <CalendarPlus size={18} />
            Nouveau RDV
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Calendar} label="RDV à venir" value={upcoming.length} />
        <StatCard icon={Car} label="Mes véhicules" value={myVehs.length} />
        <StatCard icon={MessageSquareWarning} label="Réclamations ouvertes" value={openRecs.length} />
      </section>

      {/* Upcoming */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Prochains rendez-vous</h2>
          <Link to="/client/historique" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-yellow">
            Tout voir <ArrowRight size={12} />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Aucun rendez-vous"
            description="Réservez une visite dans l'agence Renault de votre choix."
            action={
              <Link to="/client/rdv-nouveau" className="inline-flex items-center gap-2 rounded-md bg-yellow px-4 py-2 font-medium text-renault-black">
                <Plus size={14} /> Créer un RDV
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.slice(0, 4).map((r) => (
              <RDVCard key={r.id} rdv={r} to={`/client/rdv/${r.id}`} vehicules={myVehs} agences={agences} />
            ))}
          </div>
        )}
      </section>

      {/* Vehicles */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">Mes véhicules</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {myVehs.map((v) => {
            const ag = agences[0];
            return (
              <div key={v.id} className="rounded-xl border border-border bg-card p-4 hover-lift">
                <div className="flex items-center justify-between">
                  <VehiclePlate value={v.immatriculation} />
                  {v.isPrincipal && (
                    <span className="text-[10px] uppercase tracking-widest text-yellow">Principal</span>
                  )}
                </div>
                <div className="mt-3 font-display text-base font-semibold">
                  {v.marque} {v.modele}
                </div>
                <div className="text-xs text-muted-foreground">Année {v.annee} · {ag.ville}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: number }) {
  return (
    <div className="hover-lift rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="grid h-8 w-8 place-items-center rounded-md bg-yellow/10 text-yellow">
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
