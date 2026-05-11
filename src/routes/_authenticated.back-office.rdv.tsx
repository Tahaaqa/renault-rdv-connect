import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { VehiclePlate } from "@/components/shared/VehiclePlate";
import { fmtDateLong } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import {
  listAgencies,
  listAppointments,
  listClients,
  listVehicles,
  updateAppointmentStatus,
  cancelAppointment,
} from "@/lib/backend-api";
import { mapAgency, mapAppointment, mapUserClient, mapVehicle } from "@/lib/backend-mappers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { StatutRDV } from "@/types";

export const Route = createFileRoute("/_authenticated/back-office/rdv")({
  component: ABORdv,
});

function ABORdv() {
  const { loading } = useAuth();
  const queryClient = useQueryClient();
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: listAppointments,
    enabled: !loading,
    retry: false,
  });
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
  const rdvs = appointmentsQuery.data?.appointments.map(mapAppointment) ?? [];
  const clients = clientsQuery.data?.clients.map(mapUserClient) ?? [];
  const vehicules = vehiclesQuery.data?.vehicles.map(mapVehicle) ?? [];
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const [agence, setAgence] = useState<string>("all");
  const list = [...rdvs]
    .filter((r) => agence === "all" || r.agenceId === agence)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatutRDV }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Statut du RDV mis a jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise a jour du statut");
    },
  });

  const cancelRdv = useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("RDV annule avec succes");
    },
    onError: () => {
      toast.error("Erreur lors de l'annulation du RDV");
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={agence}
          onChange={(e) => setAgence(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Toutes les agences</option>
          {agences.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">{list.length} RDV</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-background/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Agence</th>
              <th className="px-4 py-3">Vehicule</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const c = clients.find((x) => x.id === r.clientId);
              const v = vehicules.find((x) => x.id === r.vehiculeId);
              const ag = agences.find((x) => x.id === r.agenceId);
              return (
                <tr key={r.id} className="border-t border-border hover:bg-background/40">
                  <td className="px-4 py-3 font-mono text-xs">{r.reference}</td>
                  <td className="px-4 py-3">
                    {c?.prenom} {c?.nom}
                  </td>
                  <td className="px-4 py-3 text-xs">{fmtDateLong(r.date)}</td>
                  <td className="px-4 py-3">{ag?.ville}</td>
                  <td className="px-4 py-3">
                    {v && <VehiclePlate value={v.immatriculation} size="sm" />}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge statut={r.statut} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Ouvrir le menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => updateStatus.mutate({ id: r.id, status: "EnAttente" })}
                          disabled={updateStatus.isPending}
                        >
                          Marquer En Attente
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStatus.mutate({ id: r.id, status: "Confirme" })}
                          disabled={updateStatus.isPending}
                        >
                          Marquer Confirme
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStatus.mutate({ id: r.id, status: "Termine" })}
                          disabled={updateStatus.isPending}
                        >
                          Marquer Termine
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => cancelRdv.mutate(r.id)}
                          disabled={cancelRdv.isPending}
                        >
                          Annuler le RDV
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
