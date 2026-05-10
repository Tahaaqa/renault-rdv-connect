import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const SERVICES = [
  { id: "vidange", label: "Vidange et filtre à huile", icon: "Oil" },
  { id: "revision", label: "Révision générale", icon: "Check" },
  { id: "freins", label: "Contrôle et remplacement des freins", icon: "Brake" },
  { id: "pneus", label: "Remplacement des pneus", icon: "Tire" },
  { id: "clim", label: "Contrôle climatisation", icon: "AC" },
  { id: "diagnostic", label: "Diagnostic électronique", icon: "Diag" },
  { id: "batterie", label: "Remplacement batterie", icon: "Batt" },
  { id: "geometrie", label: "Contrôle géométrie", icon: "Geo" },
  { id: "carrosserie", label: "Réparation carrosserie", icon: "Body" },
  { id: "controle_technique", label: "Contrôle pré-contrôle technique", icon: "CT" },
  { id: "pare_brise", label: "Remplacement pare-brise", icon: "Glass" },
  { id: "autre", label: "Autre", icon: "+" },
] as const;

interface Props {
  value: string[];
  notesLibres: string;
  onChange: (value: string[]) => void;
  onNotesChange: (value: string) => void;
}

export function ServiceChecklist({ value, notesLibres, onChange, onNotesChange }: Props) {
  const selected = new Set(value);
  const toggle = (label: string) => {
    onChange(selected.has(label) ? value.filter((item) => item !== label) : [...value, label]);
  };
  const autreSelected = selected.has("Autre");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => {
          const checked = selected.has(service.label);
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => toggle(service.label)}
              className={`relative min-h-28 rounded-xl border p-3 text-left transition ${
                checked ? "border-yellow bg-yellow/10" : "border-border bg-card hover:border-yellow/50"
              }`}
            >
              {checked && (
                <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-yellow text-renault-black">
                  <Check size={14} />
                </span>
              )}
              <span className="block font-mono text-xs text-muted-foreground">{service.icon}</span>
              <span className="mt-3 block pr-7 text-sm font-medium leading-snug">{service.label}</span>
            </button>
          );
        })}
      </div>

      {autreSelected && (
        <div className="animate-fade-up">
          <Textarea
            value={notesLibres}
            onChange={(event) => onNotesChange(event.target.value.slice(0, 500))}
            maxLength={500}
            rows={4}
            placeholder="Précisez votre demande..."
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {notesLibres.length}/500
          </div>
        </div>
      )}
    </div>
  );
}
