import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, MapPin, Car, Calendar as CalendarIcon, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useStepperStore } from "@/stores/rdvStepperStore";
import { useDataStore, SEED_AGENCES, getCurrentClient } from "@/stores/dataStore";
import { VehiclePlate } from "@/components/shared/VehiclePlate";
import { fmtDateLong } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/client/rdv-nouveau")({
  component: NouveauRDV,
});

const STEPS = [
  { n: 1, label: "Agence", icon: MapPin },
  { n: 2, label: "Véhicule", icon: Car },
  { n: 3, label: "Créneau", icon: CalendarIcon },
  { n: 4, label: "Détails", icon: FileText },
  { n: 5, label: "Confirmer", icon: ShieldCheck },
];

function NouveauRDV() {
  const s = useStepperStore();
  const navigate = useNavigate();
  const createRDV = useDataStore((st) => st.createRDV);
  const client = getCurrentClient();
  const myVehs = useDataStore((st) => st.vehicules).filter((v) => v.clientId === client.id);

  const canNext =
    (s.step === 1 && !!s.agence) ||
    (s.step === 2 && !!s.vehicule) ||
    (s.step === 3 && !!s.date && !!s.heure) ||
    (s.step === 4) ||
    (s.step === 5 && s.termsAccepted);

  const submit = () => {
    if (!s.agence || !s.vehicule || !s.date || !s.heure) return;
    const dt = new Date(`${s.date}T${s.heure}:00`);
    const rdv = createRDV({
      clientId: client.id,
      agenceId: s.agence.id,
      vehiculeId: s.vehicule.id,
      date: dt.toISOString(),
      notes: s.notes,
    });
    toast.success("Rendez-vous créé", { description: rdv.reference });
    s.reset();
    navigate({ to: `/client/rdv/${rdv.id}` });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Stepper header */}
      <div className="sticky top-14 z-10 -mx-4 border-b border-border bg-background/90 px-4 py-4 backdrop-blur md:mx-0 md:rounded-xl md:border md:px-6">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((st, i) => {
            const active = s.step === st.n;
            const done = s.step > st.n;
            return (
              <div key={st.n} className="flex flex-1 items-center gap-2">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-bold ${
                  done ? "border-yellow bg-yellow text-renault-black" :
                  active ? "border-yellow text-yellow" : "border-border text-muted-foreground"
                }`}>
                  {done ? <Check size={16} /> : st.n}
                </div>
                <span className={`hidden text-sm font-medium md:inline ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {st.label}
                </span>
                {i < STEPS.length - 1 && <div className={`h-px flex-1 ${done ? "bg-yellow" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 animate-fade-up">
        {s.step === 1 && (
          <div>
            <h2 className="font-display text-xl font-semibold">Choisissez votre agence</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sélectionnez l'agence Renault la plus proche.</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {SEED_AGENCES.map((a) => {
                const active = s.agence?.id === a.id;
                return (
                  <button key={a.id} onClick={() => s.setAgence(a)} className={`text-left rounded-xl border p-4 transition hover-lift ${
                    active ? "border-yellow bg-yellow/5" : "border-border bg-card"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="font-display font-semibold">{a.nom}</div>
                      {active && <Check size={16} className="text-yellow" />}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{a.adresse}</div>
                    <div className="mt-2 text-xs font-mono text-muted-foreground">{a.telephone}</div>
                  </button>
                );
              })}
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
                  <button key={v.id} onClick={() => s.setVehicule(v)} className={`text-left rounded-xl border p-4 transition hover-lift ${
                    active ? "border-yellow bg-yellow/5" : "border-border"
                  }`}>
                    <div className="flex items-center justify-between">
                      <VehiclePlate value={v.immatriculation} />
                      {active && <Check size={16} className="text-yellow" />}
                    </div>
                    <div className="mt-3 font-display font-semibold">{v.marque} {v.modele}</div>
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
                <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={s.date ?? ""}
                  onChange={(e) => s.setSlot(e.target.value, s.heure ?? "")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Heure</label>
                <div className="grid grid-cols-4 gap-2">
                  {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((h) => {
                    const active = s.heure === h;
                    return (
                      <button key={h} onClick={() => s.setSlot(s.date ?? new Date().toISOString().slice(0,10), h)} className={`rounded-md border px-2 py-2 text-sm font-mono ${
                        active ? "border-yellow bg-yellow text-renault-black" : "border-border hover:border-yellow/50"
                      }`}>
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
            <h2 className="font-display text-xl font-semibold">Notes additionnelles</h2>
            <p className="mt-1 text-sm text-muted-foreground">Décrivez le motif de votre visite (optionnel).</p>
            <textarea
              value={s.notes}
              onChange={(e) => s.setNotes(e.target.value)}
              rows={6}
              placeholder="Ex: vidange, contrôle des freins, bruit moteur..."
              className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {s.step === 5 && (
          <div>
            <h2 className="font-display text-xl font-semibold">Confirmation</h2>
            <div className="mt-6 space-y-3 rounded-lg border border-border bg-background/50 p-4">
              <Row label="Agence" value={s.agence?.nom} />
              <Row label="Véhicule" value={s.vehicule ? `${s.vehicule.marque} ${s.vehicule.modele} (${s.vehicule.immatriculation})` : ""} />
              <Row label="Date & heure" value={s.date && s.heure ? fmtDateLong(`${s.date}T${s.heure}:00`) : ""} />
              {s.notes && <Row label="Notes" value={s.notes} />}
            </div>
            <label className="mt-6 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={s.termsAccepted}
                onChange={(e) => s.setTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-yellow"
              />
              <span className="text-muted-foreground">
                J'accepte que mes informations soient utilisées pour traiter ce rendez-vous selon les conditions du service Renault RDV.
              </span>
            </label>
          </div>
        )}

        {/* Nav */}
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
              disabled={!canNext}
              className="press inline-flex items-center gap-2 rounded-md bg-yellow px-5 py-2 text-sm font-semibold text-renault-black disabled:opacity-40 yellow-glow"
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
