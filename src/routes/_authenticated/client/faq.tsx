import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/client/faq")({
  component: FAQ,
});

const ITEMS = [
  { q: "Comment prendre un rendez-vous ?", a: "Cliquez sur \"Nouveau RDV\" depuis votre tableau de bord, choisissez l'agence, votre véhicule et le créneau." },
  { q: "Puis-je annuler ou modifier un RDV ?", a: "Oui, jusqu'à 24h avant l'heure prévue depuis la fiche détaillée du rendez-vous." },
  { q: "Comment ajouter un véhicule ?", a: "Rendez-vous dans \"Mon profil\" puis ajoutez votre véhicule via la section dédiée." },
  { q: "Que faire en cas de problème ?", a: "Ouvrez une réclamation depuis l'onglet dédié. Notre équipe vous répond sous 48h ouvrées." },
  { q: "Quelles agences sont disponibles ?", a: "6 agences en Tunisie : Tunis, Sfax, Sousse, Monastir, Bizerte, Gabès." },
];

function FAQ() {
  return (
    <div className="mx-auto max-w-3xl">
      <Accordion type="single" collapsible className="rounded-xl border border-border bg-card">
        {ITEMS.map((it, i) => (
          <AccordionItem key={i} value={`i-${i}`} className="px-5">
            <AccordionTrigger className="font-display text-base">{it.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{it.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
