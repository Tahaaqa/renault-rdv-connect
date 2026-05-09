import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { createAppointment, listAgencies, listClients, listVehicles } from "@/lib/backend-api";
import { mapAgency, mapUserClient, mapVehicle } from "@/lib/backend-mappers";

export const Route = createFileRoute("/_authenticated/agent-fo/rdv-nouveau")({
  component: AFONouveau,
});

function AFONouveau() {
  const { loading, profile } = useAuth();
  const queryClient = useQueryClient();
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
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
  const clients = clientsQuery.data?.clients.map(mapUserClient) ?? [];
  const vehicules = vehiclesQuery.data?.vehicles.map(mapVehicle) ?? [];
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const agenceId = profile?.agenceId ?? agences[0]?.id ?? "";
  const [clientId, setClientId] = useState("");
  const [vehiculeId, setVehiculeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [heure, setHeure] = useState("10:00");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!clientId && clients[0]) setClientId(clients[0].id);
  }, [clientId, clients]);

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("RDV cree pour le client");
    },
    onError: () => {
      toast.error("Erreur lors de la création du RDV");
    },
  });

  const myVehs = vehicules.filter((v) => v.clientId === clientId);

  const submit = () => {
    if (!clientId || !vehiculeId) {
      toast.error("Selectionnez un client et un vehicule");
      return;
    }
    const dt = new Date(`${date}T${heure}:00`);
    mutation.mutate({
      clientUserId: clientId,
      agencyId: agenceId,
      vehicleId: vehiculeId,
      startsAt: dt.toISOString(),
      notes,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Creer un RDV pour un client</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Client">
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setVehiculeId("");
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vehicule">
            <select
              value={vehiculeId}
              onChange={(e) => setVehiculeId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">-- Selectionner --</option>
              {myVehs.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marque} {v.modele} ({v.immatriculation})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Heure">
            <input
              type="time"
              value={heure}
              onChange={(e) => setHeure(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </Field>
          </div>
        </div>
        <button
          onClick={submit}
          className="press mt-6 inline-flex rounded-md bg-yellow px-5 py-2 text-sm font-semibold text-renault-black"
        >
          Creer le rendez-vous
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
