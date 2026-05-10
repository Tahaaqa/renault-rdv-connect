import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Calendar, Car, Edit2, FileText, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ServiceChecklist } from "@/components/rdv/ServiceChecklist";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { fmtDateLong } from "@/lib/format";
import { cancelAppointment, listAgencies, listAppointments, listVehicles, modifyAppointment } from "@/lib/backend-api";
import { mapAgency, mapAppointment, mapVehicle } from "@/lib/backend-mappers";
import { useAuth } from "@/context/AuthContext";
import type { RendezVous } from "@/types";

export const Route = createFileRoute("/_authenticated/client/rdv/$id")({
  component: RDVDetails,
});

function RDVDetails() {
  const { id } = useParams({ from: "/_authenticated/client/rdv/$id" });
  const { loading } = useAuth();
  const queryClient = useQueryClient();
  const appointmentsQuery = useQuery({ queryKey: ["appointments"], queryFn: listAppointments, enabled: !loading, retry: false });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles"], queryFn: listVehicles, enabled: !loading, retry: false });
  const agenciesQuery = useQuery({ queryKey: ["agencies"], queryFn: listAgencies, enabled: !loading, retry: false });
  const rdv = appointmentsQuery.data?.appointments.map(mapAppointment).find((r) => r.id === id);
  const vehicules = vehiclesQuery.data?.vehicles.map(mapVehicle) ?? [];
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const vehicule = vehicules.find((v) => v.id === rdv?.vehiculeId);
  const agence = agences.find((a) => a.id === rdv?.agenceId);
  const cancelMutation = useMutation({
    mutationFn: () => cancelAppointment(id),
    onSuccess: () => {
      toast.success("RDV annulé.");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => {
      const err = error as Error & { payload?: { code?: string } };
      toast.error(err.payload?.code === "TOO_LATE_TO_CANCEL" ? "Annulation impossible moins de 24h avant." : "Erreur. Veuillez réessayer.");
    },
  });

  if (!rdv) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <p className="text-muted-foreground">Rendez-vous introuvable</p>
        <Link to="/client/dashboard" className="mt-4 inline-block text-yellow underline">Retour</Link>
      </div>
    );
  }

  const canCancel = (rdv.statut === "EnAttente" || rdv.statut === "Confirme") && new Date(rdv.date).getTime() > Date.now() + 24 * 60 * 60 * 1000;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/client/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-yellow">
        <ArrowLeft size={16} /> Retour
      </Link>
      <div className="rounded-2xl border border-yellow/30 bg-gradient-to-br from-yellow/10 to-card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs tracking-widest text-muted-foreground">{rdv.reference}</span>
          <StatusBadge statut={rdv.statut} />
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">{fmtDateLong(rdv.date)}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard icon={MapPin} title="Agence" lines={[agence?.nom ?? "", agence?.adresse ?? "", agence?.telephone ?? ""]} />
        <InfoCard icon={Car} title="Véhicule" lines={vehicule ? [`${vehicule.marque} ${vehicule.modele}`, `Année ${vehicule.annee}`, vehicule.immatriculation] : ["-"]} />
        <div className="md:col-span-2">
          <InfoCard icon={FileText} title="Services" lines={[...rdv.servicesSelectionnes, rdv.notesLibres ?? ""].filter(Boolean)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <ModifySheet rdv={rdv} disabled={rdv.statut !== "EnAttente"} />
        {canCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive/40 text-destructive"><X size={16} /> Annuler le RDV</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
                <AlertDialogDescription>Cette action est irréversible. Le créneau sera libéré.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Retour</AlertDialogCancel>
                <AlertDialogAction onClick={() => cancelMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Annuler</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

function ModifySheet({ rdv, disabled }: { rdv: RendezVous; disabled: boolean }) {
  const queryClient = useQueryClient();
  const [services, setServices] = useState(rdv.servicesSelectionnes);
  const [notes, setNotes] = useState(rdv.notesLibres ?? "");
  const mutation = useMutation({
    mutationFn: () => modifyAppointment(rdv.id, { servicesSelectionnes: services, notesLibres: notes || null }),
    onSuccess: () => {
      toast.success("RDV modifié.");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Erreur. Veuillez réessayer."),
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button disabled={disabled} className="bg-yellow text-renault-black hover:bg-yellow/90"><Edit2 size={16} /> Modifier</Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>Modifier le rendez-vous</SheetTitle></SheetHeader>
        <div className="mt-6 space-y-4">
          <ServiceChecklist value={services} notesLibres={notes} onChange={setServices} onNotesChange={setNotes} />
          <Button disabled={services.length === 0 || mutation.isPending} onClick={() => mutation.mutate()} className="w-full bg-yellow text-renault-black hover:bg-yellow/90">
            Enregistrer les modifications
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoCard({ icon: Icon, title, lines }: { icon: typeof Calendar; title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon size={14} className="text-yellow" /> {title}
      </div>
      {lines.map((line, i) => (
        <div key={`${line}-${i}`} className={i === 0 ? "font-display font-semibold" : "text-sm text-muted-foreground"}>
          {line}
        </div>
      ))}
    </div>
  );
}
