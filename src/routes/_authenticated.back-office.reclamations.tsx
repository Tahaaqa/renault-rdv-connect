import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { fmtRelative } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { listClients, listComplaints, updateComplaint } from "@/lib/backend-api";
import { mapComplaint, mapUserClient } from "@/lib/backend-mappers";
import type { StatutReclamation } from "@/types";

export const Route = createFileRoute("/_authenticated/back-office/reclamations")({
  component: ABORecs,
});

function ABORecs() {
  const { loading } = useAuth();
  const queryClient = useQueryClient();
  const complaintsQuery = useQuery({
    queryKey: ["complaints"],
    queryFn: listComplaints,
    enabled: !loading,
    retry: false,
  });
  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
    enabled: !loading,
    retry: false,
  });
  const reclamations = complaintsQuery.data?.complaints.map(mapComplaint) ?? [];
  const clients = clientsQuery.data?.clients.map(mapUserClient) ?? [];
  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
      resolution,
    }: {
      id: string;
      status: StatutReclamation;
      resolution?: string;
    }) => updateComplaint(id, { status, resolution }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaints"] }),
    onError: () => toast.error("Erreur lors de la mise \u00e0 jour"),
  });

  const setStatus = (id: string, status: StatutReclamation, resolution?: string) => {
    mutation.mutate({ id, status, resolution });
    if (status === "Escaladee") toast.warning("Escaladee");
    else toast.success("Resolue");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-3">
      {reclamations.map((r) => {
        const c = clients.find((x) => x.id === r.clientId);
        return (
          <div key={r.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display font-semibold">
                  {c?.prenom} {c?.nom}
                </div>
                <div className="text-xs text-muted-foreground">{fmtRelative(r.createdAt)}</div>
              </div>
              <StatusBadge statut={r.statut} kind="rec" />
            </div>
            <p className="mt-3 text-sm">{r.description}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStatus(r.id, "Escaladee")}
                className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs text-destructive"
              >
                Escalader
              </button>
              <button
                onClick={() => setStatus(r.id, "Resolue", "Resolue par le back-office")}
                className="rounded-md bg-yellow px-3 py-1.5 text-xs font-semibold text-renault-black"
              >
                Resoudre
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
