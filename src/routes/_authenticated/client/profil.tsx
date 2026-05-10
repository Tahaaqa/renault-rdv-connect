import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Camera, Car, Edit2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { createVehicle, deleteVehicle, listVehicles, scanPlate, updateVehicle } from "@/lib/backend-api";
import { mapVehicle } from "@/lib/backend-mappers";
import type { Vehicule } from "@/types";

export const Route = createFileRoute("/_authenticated/client/profil")({
  component: Profil,
});

const PLATE_RE = /^\d{1,3}\s?TN\s?\d{1,4}$/;

function Profil() {
  const { profile, user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
    enabled: !loading,
    retry: false,
  });
  const mine = vehiclesQuery.data?.vehicles.map(mapVehicle) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Mes véhicules</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow text-renault-black hover:bg-yellow/90">
                Ajouter un véhicule <Plus size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un véhicule</DialogTitle>
              </DialogHeader>
              <VehicleForm
                submitLabel="Ajouter"
                onSubmit={async (values) => {
                  await createVehicle({
                    plateNumber: values.immatriculation,
                    brand: "Renault",
                    model: values.modele,
                    year: values.annee,
                    isPrimary: values.isMain,
                  });
                  toast.success("Véhicule ajouté.");
                  queryClient.invalidateQueries({ queryKey: ["vehicles"] });
                  setOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4 grid gap-3">
          {mine.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background/50 p-8 text-center">
              <Car className="mx-auto text-yellow" size={38} />
              <div className="mt-3 font-display font-semibold">Aucun véhicule enregistré</div>
              <Button
                onClick={() => setOpen(true)}
                className="mt-4 bg-yellow text-renault-black hover:bg-yellow/90"
              >
                Ajouter mon premier véhicule
              </Button>
            </div>
          ) : (
            mine.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)
          )}
        </div>
      </section>
    </div>
  );
}

function VehicleCard({ vehicle }: { vehicle: Vehicule }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: () => deleteVehicle(vehicle.id),
    onSuccess: () => {
      toast.success("Véhicule supprimé.");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: () => toast.error("Impossible de supprimer ce véhicule."),
  });

  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Plate value={vehicle.immatriculation} />
          <div className="mt-3 font-display font-semibold">
            {vehicle.marque} {vehicle.modele}
          </div>
          <div className="text-xs text-muted-foreground">
            Année {vehicle.annee}
            {vehicle.isPrincipal && (
              <span className="ml-2 rounded-full bg-yellow/15 px-2 py-0.5 text-yellow">Principal</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setEditing((value) => !value)}>
            <Edit2 size={16} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce véhicule ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Les rendez-vous liés garderont une note indiquant que le véhicule a été supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {editing && (
        <div className="mt-4 border-t border-border pt-4">
          <VehicleForm
            initial={vehicle}
            submitLabel="Enregistrer"
            onSubmit={async (values) => {
              await updateVehicle(vehicle.id, {
                plateNumber: values.immatriculation,
                brand: "Renault",
                model: values.modele,
                year: values.annee,
                isPrimary: values.isMain,
              });
              toast.success("Véhicule mis à jour.");
              queryClient.invalidateQueries({ queryKey: ["vehicles"] });
              setEditing(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function VehicleForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Vehicule;
  submitLabel: string;
  onSubmit: (values: {
    immatriculation: string;
    modele: string;
    annee: number;
    isMain: boolean;
  }) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [immatriculation, setImmatriculation] = useState(initial?.immatriculation ?? "");
  const [modele, setModele] = useState(initial?.modele ?? "");
  const [annee, setAnnee] = useState(initial?.annee ?? new Date().getFullYear());
  const [isMain, setIsMain] = useState(initial?.isPrincipal ?? false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{ plate?: string; confidence?: number; raw?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const valid = PLATE_RE.test(immatriculation);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid || !modele.trim()) return;
    await onSubmit({ immatriculation, modele, annee, isMain });
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setOcrResult(null);
    try {
      const result = await scanPlate(file);
      setImmatriculation(result.immatriculation);
      setOcrResult({ plate: result.immatriculation, confidence: result.confidence });
    } catch (error) {
      const err = error as Error & { status?: number; payload?: { raw?: string } };
      if (err.status === 422) {
        setOcrResult({ raw: err.payload?.raw ?? "" });
      } else {
        toast.error("Erreur OCR. Veuillez saisir manuellement.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-muted-foreground">
          Immatriculation
        </label>
        <Input
          value={immatriculation}
          onChange={(event) => setImmatriculation(event.target.value.toUpperCase())}
          placeholder="123 TN 4567"
          className={immatriculation && !valid ? "border-destructive" : ""}
        />
        {immatriculation && !valid && (
          <div className="mt-1 text-xs text-destructive">Format tunisien attendu: 123 TN 4567</div>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input value={modele} onChange={(event) => setModele(event.target.value)} placeholder="Modèle" />
        <Input
          type="number"
          min={1990}
          value={annee}
          onChange={(event) => setAnnee(Number(event.target.value))}
        />
      </div>
      <label className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
        Définir comme véhicule principal
        <Switch checked={isMain} onCheckedChange={setIsMain} />
      </label>

      <div className="rounded-xl border border-dashed border-yellow/70 p-5 text-center">
        <Camera className="mx-auto text-yellow opacity-70" size={48} />
        <div className="mt-2 font-medium">Scanner la plaque automatiquement</div>
        <div className="text-xs text-muted-foreground">
          JPG ou PNG, max 5 Mo - fonctionne mieux avec une photo nette
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        <Button type="button" variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
          Choisir une photo
        </Button>
        {preview && <img src={preview} alt="" className="mx-auto mt-3 h-[100px] rounded object-cover" />}
        {loading && (
          <div className="mt-3 inline-flex items-center gap-2 text-sm">
            <Loader2 className="animate-spin" size={16} /> Analyse en cours...
          </div>
        )}
        {ocrResult?.plate && (
          <div className="mt-3 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700">
            Plaque détectée: <span className="font-mono">{ocrResult.plate}</span>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-yellow/20">
              <div className="h-full bg-yellow" style={{ width: `${ocrResult.confidence ?? 0}%` }} />
            </div>
            <button type="button" onClick={() => setOcrResult(null)} className="mt-2 text-xs underline">
              Ce n'est pas ma plaque
            </button>
          </div>
        )}
        {ocrResult?.raw !== undefined && (
          <div className="mt-3 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700">
            Plaque non reconnue - résultat brut: {ocrResult.raw || "vide"}
          </div>
        )}
      </div>

      <Button disabled={!valid || !modele.trim()} className="w-full bg-yellow text-renault-black hover:bg-yellow/90">
        {submitLabel}
      </Button>
    </form>
  );
}

function Plate({ value }: { value: string }) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-black bg-white font-mono text-sm font-bold text-black">
      <span className="bg-blue-700 px-2 py-1 text-white">TN</span>
      <span className="px-3 py-1">{value}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm">
        {value || "-"}
      </div>
    </div>
  );
}
