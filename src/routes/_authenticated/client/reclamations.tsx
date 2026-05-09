import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquareWarning, Plus } from "lucide-react";
import { toast } from "sonner";
import { useDataStore } from "@/stores/dataStore";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { fmtRelative } from "@/lib/format";
import { createComplaint, listComplaints } from "@/lib/backend-api";
import { mapComplaint } from "@/lib/backend-mappers";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/_authenticated/client/reclamations")({
  component: Reclamations,
});

function Reclamations() {
  const { loading } = useAuth();
  const queryClient = useQueryClient();
  const { reclamations, currentClientId, addReclamation } = useDataStore();
  const complaintsQuery = useQuery({
    queryKey: ["complaints"],
    queryFn: listComplaints,
    enabled: !loading,
    retry: false,
  });
  const createComplaintMutation = useMutation({
    mutationFn: createComplaint,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaints"] }),
  });
  const mine =
    complaintsQuery.data?.complaints.map(mapComplaint) ??
    reclamations.filter((r) => r.clientId === currentClientId);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await createComplaintMutation.mutateAsync({ description: text });
      toast.success("Reclamation envoyee");
    } catch {
      addReclamation({ clientId: currentClientId, description: text });
      toast.success("Reclamation envoyee localement");
    } finally {
      setText("");
      setOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{mine.length} reclamation(s) au total</p>
        <button
          onClick={() => setOpen(true)}
          className="press inline-flex items-center gap-2 rounded-md bg-yellow px-4 py-2 text-sm font-semibold text-renault-black"
        >
          <Plus size={16} /> Nouvelle reclamation
        </button>
      </div>

      {open && (
        <div className="rounded-xl border border-yellow/40 bg-card p-5 animate-fade-up">
          <h3 className="font-display text-base font-semibold">Decrivez votre reclamation</h3>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Detaillez le probleme rencontre..."
            className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-md border border-input px-3 py-1.5 text-sm">
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={createComplaintMutation.isPending}
              className="rounded-md bg-yellow px-4 py-1.5 text-sm font-semibold text-renault-black disabled:opacity-60"
            >
              Envoyer
            </button>
          </div>
        </div>
      )}

      {mine.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title="Aucune reclamation"
          description="Vous n'avez ouvert aucune reclamation a ce jour."
        />
      ) : (
        <div className="space-y-3">
          {mine.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5 hover-lift">
              <div className="mb-2 flex items-center gap-2">
                <StatusBadge statut={r.statut} kind="rec" />
                <span className="text-xs text-muted-foreground">{fmtRelative(r.createdAt)}</span>
              </div>
              <p className="text-sm">{r.description}</p>
              {r.resolution && (
                <div className="mt-3 rounded-md border border-yellow/20 bg-yellow/5 p-3 text-sm">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-yellow">
                    Reponse Renault
                  </div>
                  {r.resolution}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
