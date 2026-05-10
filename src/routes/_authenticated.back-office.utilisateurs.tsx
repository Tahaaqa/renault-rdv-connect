import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";
import { listAgencies, listUsers, updateUser } from "@/lib/backend-api";
import { mapAgency } from "@/lib/backend-mappers";
import type { BackendUser } from "@/backend/domain";
import type { AppRole } from "@/types";

export const Route = createFileRoute("/_authenticated/back-office/utilisateurs")({
  component: ABOUsers,
});

const ROLE_LABELS: Record<AppRole, string> = {
  client: "Client",
  agent_front_office: "Agent FO",
  agent_back_office: "Back-Office",
};

function ABOUsers() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: listUsers, retry: false });
  const agenciesQuery = useQuery({ queryKey: ["agencies"], queryFn: listAgencies, retry: false });
  const agences = agenciesQuery.data?.agencies.map(mapAgency) ?? [];
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateUser>[1] }) =>
      updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Utilisateur mis a jour");
    },
    onError: () => toast.error("Impossible de mettre a jour l'utilisateur"),
  });

  const users = usersQuery.data?.users ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-yellow text-renault-black">
          <UserCog size={20} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Utilisateurs</h2>
          <p className="text-sm text-muted-foreground">
            Roles applicatifs et affectation agence des agents.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="bg-background/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Identite</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Agence FO</th>
              <th className="px-4 py-3">Keycloak</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                agencies={agences}
                saving={mutation.isPending}
                onSave={(input) => mutation.mutate({ id: user.id, input })}
              />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {usersQuery.isError
                    ? "Backend utilisateurs indisponible."
                    : "Aucun utilisateur synchronise depuis Keycloak."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  agencies,
  saving,
  onSave,
}: {
  user: BackendUser;
  agencies: { id: string; nom: string }[];
  saving: boolean;
  onSave: (input: Parameters<typeof updateUser>[1]) => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<AppRole>(primaryRole(user.roles));
  const [agencyId, setAgencyId] = useState(user.agencyId ?? "");

  useEffect(() => {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhone(user.phone ?? "");
    setRole(primaryRole(user.roles));
    setAgencyId(user.agencyId ?? "");
  }, [user]);

  const save = () => {
    onSave({
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      phone: phone.trim() || null,
      roles: [role],
      agencyId: role === "agent_front_office" ? agencyId || null : null,
    });
  };

  return (
    <tr className="border-t border-border hover:bg-background/40">
      <td className="px-4 py-3">
        <div className="grid gap-2">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prenom"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nom"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="grid gap-2">
          <div className="truncate font-mono text-xs">{user.email || "-"}</div>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telephone"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AppRole)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={agencyId}
          onChange={(e) => setAgencyId(e.target.value)}
          disabled={role !== "agent_front_office"}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">Aucune agence</option>
          {agencies.map((agency) => (
            <option key={agency.id} value={agency.id}>
              {agency.nom}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-yellow" />
          <span className="max-w-[160px] truncate font-mono">{user.keycloakSubject}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-yellow px-3 py-2 text-xs font-semibold text-renault-black disabled:opacity-60"
        >
          Enregistrer
        </button>
      </td>
    </tr>
  );
}

function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes("agent_back_office")) return "agent_back_office";
  if (roles.includes("agent_front_office")) return "agent_front_office";
  return "client";
}
