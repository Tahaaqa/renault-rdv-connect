import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useDataStore, SEED_AGENCES } from "@/stores/dataStore";

export const Route = createFileRoute("/_authenticated/agent-fo/rdv-nouveau")({
  component: AFONouveau,
});

function AFONouveau() {
  const { clients, vehicules, createRDV } = useDataStore();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [vehiculeId, setVehiculeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [heure, setHeure] = useState("10:00");
  const [notes, setNotes] = useState("");

  const myVehs = vehicules.filter((v) => v.clientId === clientId);

  const submit = () => {
    if (!clientId || !vehiculeId) {
      toast.error("Sélectionnez un client et un véhicule");
      return;
    }
    const dt = new Date(`${date}T${heure}:00`);
    createRDV({
      clientId,
      agenceId: SEED_AGENCES[0].id,
      vehiculeId,
      date: dt.toISOString(),
      notes,
      statut: "Confirme",
    });
    toast.success("RDV créé pour le client");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Créer un RDV pour un client</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Client">
            <select value={clientId} onChange={(e) => { setClientId(e.target.value); setVehiculeId(""); }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {clients.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
            </select>
          </Field>
          <Field label="Véhicule">
            <select value={vehiculeId} onChange={(e) => setVehiculeId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">— Sélectionner —</option>
              {myVehs.map((v) => <option key={v.id} value={v.id}>{v.marque} {v.modele} ({v.immatriculation})</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Heure">
            <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </Field>
          </div>
        </div>
        <button onClick={submit} className="mt-6 press inline-flex rounded-md bg-yellow px-5 py-2 text-sm font-semibold text-renault-black">
          Créer le rendez-vous
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
