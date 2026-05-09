import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, Car, FileText, X } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { VehiclePlate } from "@/components/shared/VehiclePlate";
import { fmtDateLong } from "@/lib/format";
import { toast } from "sonner";
import {
  listAgencies,
  listAppointments,
  listVehicles,
  updateAppointmentStatus,
} from "@/lib/backend-api";
import { mapAgency, mapAppointment, mapVehicle } from "@/lib/backend-mappers";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_authenticated/client/rdv/$id")({
  component: RDVDetails,
});

function RDVDetails() {
  const { id } = useParams({ from: "/_authenticated/client/rdv/$id" });
  const { loading } = useAuth();
  const queryClient = useQueryClient();
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
    enabled: !loading,
    retry: false,
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
    enabled: !loading,
    retry: false,
  });
  const agenciesQuery = useQuery({
    queryKey: ["agencies"],
    queryFn: listAgencies,
    enabled: !loading,
    retry: false,
  });
  const cancelMutation = useMutation({
    mutationFn: () => updateAppointmentStatus(id, "Annule"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
  const rdv = appointmentsQuery.data?.appointments.map(mapAppointment).find((r) => r.id === id);
  const vehicules = vehiclesQuery.data?.vehicles.map(mapVehicle) ?? [];
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const vehicule = vehicules.find((v) => v.id === rdv?.vehiculeId);
  const agence = agences.find((a) => a.id === rdv?.agenceId);

  if (!rdv) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-muted-foreground">Rendez-vous introuvable</p>
        <Link to="/client/dashboard" className="mt-4 inline-block text-yellow underline">
          Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/client/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-yellow"
      >
        <ArrowLeft size={16} /> Retour
      </Link>

      <div className="rounded-2xl border border-yellow/30 bg-gradient-to-br from-yellow/10 to-card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs tracking-widest text-muted-foreground">
            {rdv.reference}
          </span>
          <StatusBadge statut={rdv.statut} />
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">
          {fmtDateLong(rdv.date)}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard
          icon={MapPin}
          title="Agence"
          lines={[agence?.nom ?? "", agence?.adresse ?? "", agence?.telephone ?? ""]}
        />
        <InfoCard
          icon={Car}
          title="Véhicule"
          lines={
            vehicule
              ? [
                  `${vehicule.marque} ${vehicule.modele}`,
                  `Année ${vehicule.annee}`,
                  vehicule.immatriculation,
                ]
              : ["—"]
          }
        />
        {rdv.notes && (
          <div className="md:col-span-2">
            <InfoCard icon={FileText} title="Notes" lines={[rdv.notes]} />
          </div>
        )}
      </div>

      {(rdv.statut === "EnAttente" || rdv.statut === "Confirme") && (
        <button
          onClick={() => {
            cancelMutation.mutate(undefined, {
              onSuccess: () => toast.success("Rendez-vous annulé"),
              onError: () => {
                toast.error("Erreur lors de l'annulation");
              },
            });
          }}
          className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20"
        >
          <X size={16} /> Annuler le RDV
        </button>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  lines,
}: {
  icon: typeof Calendar;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon size={14} className="text-yellow" /> {title}
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          className={i === 0 ? "font-display font-semibold" : "text-sm text-muted-foreground"}
        >
          {l}
        </div>
      ))}
    </div>
  );
}
