import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Phone, Plus, Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { createAgency, listAgencies, listAppointments, updateAgency } from "@/lib/backend-api";
import { mapAgency, mapAppointment } from "@/lib/backend-mappers";
import type { BackendAgency } from "@/backend/domain";

export const Route = createFileRoute("/_authenticated/back-office/agences")({
  component: ABOAgences,
});

function ABOAgences() {
  const { loading } = useAuth();
  const queryClient = useQueryClient();
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
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
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const createMutation = useMutation({
    mutationFn: createAgency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast.success("Agence creee");
    },
    onError: () => toast.error("Impossible de creer l'agence"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateAgency>[1] }) =>
      updateAgency(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      toast.success("Agence mise a jour");
    },
    onError: () => toast.error("Impossible de mettre a jour l'agence"),
  });
  const backendAgencies = agenciesQuery.data?.agencies;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <AgencyCreateForm
        saving={createMutation.isPending}
        onCreate={(input) => createMutation.mutate(input)}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agences.map((a) => {
          const count = rdvs.filter((r) => r.agenceId === a.id).length;
          const backendAgency = backendAgencies?.find((agency) => agency.id === a.id);
          return (
            <div key={a.id} className="hover-lift rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold">{a.nom}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin size={13} className="text-yellow" /> {a.ville}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold text-yellow">{count}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    RDV
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{a.adresse}</p>
              <p className="mt-2 flex items-center gap-1.5 font-mono text-xs">
                <Phone size={12} /> {a.telephone}
              </p>
              {backendAgency && (
                <AgencyEditForm
                  agency={backendAgency}
                  saving={updateMutation.isPending}
                  onSave={(input) => updateMutation.mutate({ id: backendAgency.id, input })}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgencyCreateForm({
  saving,
  onCreate,
}: {
  saving: boolean;
  onCreate: (input: Parameters<typeof createAgency>[0]) => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const submit = () => {
    const input = {
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      phone: phone.trim(),
      location: null,
    };
    if (!input.name || !input.city || !input.address || !input.phone) {
      toast.error("Tous les champs agence sont requis");
      return;
    }
    onCreate(input);
    setName("");
    setCity("");
    setAddress("");
    setPhone("");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1.4fr_0.8fr_auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom agence"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Adresse"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telephone"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-yellow px-3 py-2 text-sm font-semibold text-renault-black disabled:opacity-60"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>
    </div>
  );
}

function AgencyEditForm({
  agency,
  saving,
  onSave,
}: {
  agency: BackendAgency;
  saving: boolean;
  onSave: (input: Parameters<typeof updateAgency>[1]) => void;
}) {
  const [name, setName] = useState(agency.name);
  const [city, setCity] = useState(agency.city);
  const [address, setAddress] = useState(agency.address);
  const [phone, setPhone] = useState(agency.phone);

  const save = () => {
    onSave({
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      phone: phone.trim(),
      location: agency.location,
    });
  };

  return (
    <div className="mt-4 grid gap-2 border-t border-border pt-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <button
        onClick={save}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-input px-3 py-2 text-xs font-semibold disabled:opacity-60"
      >
        <Save size={14} /> Enregistrer
      </button>
    </div>
  );
}
