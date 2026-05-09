import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useDataStore } from "@/stores/dataStore";
import { VehiclePlate } from "@/components/shared/VehiclePlate";

export const Route = createFileRoute("/_authenticated/client/profil")({
  component: Profil,
});

function Profil() {
  const { profile, user } = useAuth();
  const { vehicules, currentClientId } = useDataStore();
  const mine = vehicules.filter((v) => v.clientId === currentClientId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Informations personnelles</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" value={profile?.prenom ?? ""} />
          <Field label="Nom" value={profile?.nom ?? ""} />
          <Field label="Email" value={user?.email ?? profile?.email ?? ""} />
          <Field label="Téléphone" value={profile?.telephone ?? ""} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold">Mes véhicules</h2>
        <div className="mt-4 space-y-2">
          {mine.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-md border border-border bg-background/50 p-3">
              <div>
                <div className="font-display font-semibold">{v.marque} {v.modele}</div>
                <div className="text-xs text-muted-foreground">Année {v.annee}</div>
              </div>
              <VehiclePlate value={v.immatriculation} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">{value || "—"}</div>
    </div>
  );
}
