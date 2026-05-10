import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AgencyMap } from "@/components/maps/AgencyMap";
import { ServiceChecklist } from "@/components/rdv/ServiceChecklist";
import { VehiclePlate } from "@/components/shared/VehiclePlate";
import { useAuth } from "@/context/AuthContext";
import { fmtDateLong } from "@/lib/format";
import {
  createAppointment as createBackendAppointment,
  listAgencies,
  listAppointments,
  listVehicles,
} from "@/lib/backend-api";
import { mapAgency, mapAppointment, mapVehicle } from "@/lib/backend-mappers";
import { useStepperStore } from "@/stores/rdvStepperStore";

export const Route = createFileRoute("/_authenticated/client/rdv-nouveau")({
  component: NouveauRDV,
});

const STEPS = [
  { n: 1, label: "Agence", icon: MapPin },
  { n: 2, label: "Véhicule", icon: Car },
  { n: 3, label: "Créneau", icon: CalendarIcon },
  { n: 4, label: "Services", icon: FileText },
  { n: 5, label: "Confirmer", icon: ShieldCheck },
];

const HOURS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

function NouveauRDV() {
  const s = useStepperStore();
  const navigate = useNavigate();
  const { loading } = useAuth();
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());

  const agenciesQuery = useQuery({
    queryKey: ["agencies"],
    queryFn: listAgencies,
    enabled: !loading,
    retry: false,
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
    enabled: !loading,
    retry: false,
  });
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
    enabled: !loading,
    retry: false,
  });
  const createAppointmentMutation = useMutation({ mutationFn: createBackendAppointment });

  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const myVehs = vehiclesQuery.data?.vehicles.map(mapVehicle) ?? [];
  const rdvs = appointmentsQuery.data?.appointments.map(mapAppointment) ?? [];
  const unavailableHours = new Set(
    rdvs
      .filter(
        (r) =>
          r.agenceId === s.agence?.id &&
          s.date &&
          r.date.slice(0, 10) === s.date &&
          (r.statut === "EnAttente" || r.statut === "Confirme"),
      )
      .map((r) => new Date(r.date).toTimeString().slice(0, 5)),
  );
  for (const hour of blockedSlots) unavailableHours.add(hour);

  const canNext =
    (s.step === 1 && !!s.agence) ||
    (s.step === 2 && !!s.vehicule) ||
    (s.step === 3 && !!s.date && !!s.heure && !unavailableHours.has(s.heure)) ||
    (s.step === 4 && s.servicesSelectionnes.length > 0) ||
    (s.step === 5 && s.termsAccepted);

  const submit = async () => {
    if (!s.agence || !s.vehicule || !s.date || !s.heure) return;
    const dt = new Date(`${s.date}T${s.heure}:00`);
    try {
      const { appointment } = await createAppointmentMutation.mutateAsync({
        agencyId: s.agence.id,
        vehicleId: s.vehicule.id,
        startsAt: dt.toISOString(),
        servicesSelectionnes: s.servicesSelectionnes,
        notesLibres: s.notesLibres || null,
      });
      toast.success("Rendez-vous créé", { description: appointment.reference });
      s.reset();
      navigate({ to: `/client/rdv/${appointment.id}` });
    } catch (error) {
      const err = error as Error & { status?: number };
      if (err.status === 409 && s.heure) {
        setBlockedSlots((current) => new Set([...current, s.heure!]));
        toast.error("Ce créneau vient d'être pris. Choisissez un autre horaire.");
        await appointmentsQuery.refetch();
        s.setStep(3);
        return;
      }
      toast.error("Erreur lors de la création du rendez-vous");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="sticky top-14 z-10 -mx-4 border-b border-border bg-background/90 px-4 py-4 backdrop-blur md:mx-0 md:rounded-xl md:border md:px-6">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((st, i) => {
            const active = s.step === st.n;
            const done = s.step > st.n;
            return (
              <div key={st.n} className="flex flex-1 items-center gap-2">
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-bold ${
                    done
                      ? "border-yellow bg-yellow text-renault-black"
                      : active
                        ? "border-yellow text-yellow"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {done ? <Check size={16} /> : st.n}
                </div>
                <span
                  className={`hidden text-sm font-medium md:inline ${active ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {st.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 ${done ? "bg-yellow" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="animate-fade-up rounded-xl border border-border bg-card p-6 md:p-8">
        {s.step === 1 && (
          <div>
            <h2 className="font-display text-xl font-semibold">Choisissez votre agence</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sélectionnez l'agence Renault la plus proche.
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-[45%_55%]">
              <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                {agences.map((a) => {
                  const active = s.agence?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => s.setAgence(a)}
                      className={`w-full rounded-xl border p-4 text-left transition hover-lift ${
                        active ? "border-yellow bg-yellow/5" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="font-display font-semibold">{a.nom}</div>
                        {active && <Check size={16} className="text-yellow" />}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{a.adresse}</div>
                      <div className="mt-2 text-xs font-mono text-muted-foreground">
                        {a.telephone}
                      </div>
                    </button>
                  );
                })}
              </div>
              <AgencyMap
                agencies={agences}
                selectedAgenceId={s.agence?.id}
                onAgenceSelect={s.setAgence}
                height="500px"
              />
            </div>
          </div>
        )}

        {s.step === 2 && (
          <div>
            <h2 className="font-display text-xl font-semibold">Sélectionnez votre véhicule</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {myVehs.map((v) => {
                const active = s.vehicule?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => s.setVehicule(v)}
                    className={`rounded-xl border p-4 text-left transition hover-lift ${
                      active ? "border-yellow bg-yellow/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <VehiclePlate value={v.immatriculation} />
                      {active && <Check size={16} className="text-yellow" />}
                    </div>
                    <div className="mt-3 font-display font-semibold">
                      {v.marque} {v.modele}
                    </div>
                    <div className="text-xs text-muted-foreground">Année {v.annee}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {s.step === 3 && (
          <div>
            <h2 className="font-display text-xl font-semibold">Choisissez votre créneau</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                  Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={s.date ?? ""}
                  onChange={(e) => s.setSlot(e.target.value, s.heure ?? "")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">
                  Heure
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {HOURS.map((h) => {
                    const active = s.heure === h;
                    const disabled = unavailableHours.has(h);
                    return (
                      <button
                        key={h}
                        disabled={disabled}
                        title={disabled ? "Créneau indisponible" : undefined}
                        onClick={() => s.setSlot(s.date ?? new Date().toISOString().slice(0, 10), h)}
                        className={`rounded-md border px-2 py-2 text-sm font-mono ${
                          disabled
                            ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through"
                            : active
                              ? "border-yellow bg-yellow text-renault-black"
                              : "border-border hover:border-yellow/50"
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {s.step === 4 && (
          <div>
            <h2 className="font-display text-xl font-semibold">Services souhaités</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sélectionnez au moins un service.</p>
            <div className="mt-4">
              <ServiceChecklist
                value={s.servicesSelectionnes}
                notesLibres={s.notesLibres}
                onChange={s.setServices}
                onNotesChange={s.setNotesLibres}
              />
            </div>
          </div>
        )}

        {s.step === 5 && (
          <div>
            <h2 className="font-display text-xl font-semibold">Confirmation</h2>
            <div className="mt-6 space-y-3 rounded-lg border border-border bg-background/50 p-4">
              <Row label="Agence" value={s.agence?.nom} />
              <Row
                label="Véhicule"
                value={
                  s.vehicule
                    ? `${s.vehicule.marque} ${s.vehicule.modele} (${s.vehicule.immatriculation})`
                    : ""
                }
              />
              <Row
                label="Date & heure"
                value={s.date && s.heure ? fmtDateLong(`${s.date}T${s.heure}:00`) : ""}
              />
              <div className="flex flex-wrap justify-end gap-2">
                {s.servicesSelectionnes.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-yellow/30 bg-yellow/10 px-3 py-1 text-xs"
                  >
                    {service}
                  </span>
                ))}
              </div>
              {s.notesLibres && <Row label="Précisions" value={s.notesLibres} />}
            </div>
            <label className="mt-6 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={s.termsAccepted}
                onChange={(e) => s.setTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-yellow"
              />
              <span className="text-muted-foreground">
                J'accepte que mes informations soient utilisées pour traiter ce rendez-vous selon
                les conditions du service Renault RDV.
              </span>
            </label>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <button
            onClick={s.prev}
            disabled={s.step === 1}
            className="press inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Retour
          </button>
          {s.step < 5 ? (
            <button
              onClick={s.next}
              disabled={!canNext}
              className="press inline-flex items-center gap-2 rounded-md bg-yellow px-4 py-2 text-sm font-semibold text-renault-black disabled:opacity-40"
            >
              Continuer <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!canNext || createAppointmentMutation.isPending}
              className="press yellow-glow inline-flex items-center gap-2 rounded-md bg-yellow px-5 py-2 text-sm font-semibold text-renault-black disabled:opacity-40"
            >
              Confirmer le rendez-vous <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
