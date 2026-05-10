import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cancelAppointment } from "@/lib/backend-api";
import { StatusBadge } from "./StatusBadge";
import { VehiclePlate } from "./VehiclePlate";
import type { RendezVous } from "@/types";
import type { Agence, Vehicule } from "@/types";
import { fmtDateLong } from "@/lib/format";

export function RDVCard({
  rdv,
  to,
  vehicules: providedVehicules,
  agences: providedAgences,
}: {
  rdv: RendezVous;
  to?: string;
  vehicules?: Vehicule[];
  agences?: Agence[];
}) {
  const vehicules = providedVehicules ?? [];
  const agences = providedAgences ?? [];
  const vehicule = vehicules.find((v) => v.id === rdv.vehiculeId);
  const agence = agences.find((a) => a.id === rdv.agenceId);
  const queryClient = useQueryClient();
  const canCancel =
    (rdv.statut === "EnAttente" || rdv.statut === "Confirme") &&
    new Date(rdv.date).getTime() > Date.now() + 24 * 60 * 60 * 1000;
  const cancelMutation = useMutation({
    mutationFn: () => cancelAppointment(rdv.id),
    onSuccess: () => {
      toast.success("RDV annulé.");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["rdv"] });
    },
    onError: (error) => {
      const err = error as Error & { payload?: { code?: string } };
      if (err.payload?.code === "TOO_LATE_TO_CANCEL") {
        toast.error("Annulation impossible moins de 24h avant.");
      } else {
        toast.error("Erreur. Veuillez réessayer.");
      }
    },
  });

  const Wrapper = to
    ? ({ children }: { children: React.ReactNode }) => (
        <Link to={to} className="block">
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <Wrapper>
      <div className="hover-lift group rounded-xl border border-border bg-card p-5 transition-colors hover:border-yellow/40">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground">
                {rdv.reference}
              </span>
              <StatusBadge statut={rdv.statut} />
            </div>
            <div className="font-display text-lg font-semibold">{fmtDateLong(rdv.date)}</div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-yellow" />
                {agence?.nom ?? "Agence"}
              </span>
              {vehicule && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className="flex items-center gap-2">
                    <VehiclePlate value={vehicule.immatriculation} size="sm" />
                    <span>
                      {vehicule.marque} {vehicule.modele}
                    </span>
                  </span>
                </>
              )}
            </div>
            {rdv.servicesSelectionnes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rdv.servicesSelectionnes.slice(0, 3).map((service) => (
                  <span key={service} className="rounded-full bg-yellow/10 px-2 py-0.5 text-xs">
                    {service}
                  </span>
                ))}
              </div>
            )}
            {canCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={(event) => event.preventDefault()}
                    className="mt-4 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive"
                  >
                    Annuler
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(event) => event.preventDefault()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Le créneau sera libéré.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Retour</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Annuler le RDV
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          {to && (
            <ChevronRight
              size={20}
              className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-yellow"
            />
          )}
        </div>
      </div>
    </Wrapper>
  );
}

export function RDVCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="space-y-3">
        <div className="h-4 w-32 skeleton-shimmer rounded" />
        <div className="h-6 w-3/4 skeleton-shimmer rounded" />
        <div className="h-4 w-1/2 skeleton-shimmer rounded" />
      </div>
    </div>
  );
}

export { Calendar };
