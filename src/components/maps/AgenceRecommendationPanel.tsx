import { useState } from 'react';
import { Sparkles, MapPin, Calendar, Clock, Star, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Agence } from '@/types';
import type { RecommendationResult } from '@/hooks/useAgenceRecommendation';

interface Props {
  result: RecommendationResult | null;
  isLoading: boolean;
  onSelect: (agence: Agence) => void;
  onTrigger: () => void;
  hasLocation: boolean;
}

export function AgenceRecommendationPanel({
  result,
  isLoading,
  onSelect,
  onTrigger,
  hasLocation,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  // ── TRIGGER STATE (before AI runs) ──────────────────────────
  if (!result && !isLoading) {
    return (
      <div className="rounded-2xl border border-[rgba(255,204,0,0.25)] bg-[rgba(255,204,0,0.04)] p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#FFCC00]/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-[#FFCC00]" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm mb-0.5">Recommandation IA personnalisée</div>
          <div className="text-xs text-muted-foreground">
            {hasLocation
              ? 'Notre IA analyse votre position et les disponibilités en temps réel.'
              : 'Activez la localisation pour obtenir une recommandation.'}
          </div>
        </div>
        <Button
          onClick={onTrigger}
          disabled={!hasLocation}
          size="sm"
          className="bg-[#FFCC00] text-black hover:bg-yellow-400 font-semibold flex-shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Analyser
        </Button>
      </div>
    );
  }

  // ── LOADING STATE ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[rgba(255,204,0,0.2)] bg-[rgba(255,204,0,0.04)] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#FFCC00]/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-[#FFCC00]" />
          </div>
          <div>
            <div className="h-3.5 bg-muted rounded w-40 mb-1.5 animate-pulse" />
            <div className="h-2.5 bg-muted rounded w-56 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          ✨ L'IA analyse les disponibilités et votre historique...
        </p>
      </div>
    );
  }

  // ── RESULT STATE ─────────────────────────────────────────────
  if (!result) return null;

  const displayedScores = showAll ? result.scores : result.scores.slice(0, 3);

  return (
    <div className="rounded-2xl border border-[rgba(255,204,0,0.3)] bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-[rgba(255,204,0,0.08)] px-5 py-4 border-b border-[rgba(255,204,0,0.15)] flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-[#FFCC00] flex-shrink-0" />
        <div>
          <div className="font-semibold text-sm">Recommandation IA</div>
          <div className="text-xs text-muted-foreground">
            Basée sur votre position, les disponibilités et votre historique
          </div>
        </div>
      </div>

      {/* AI Explanation */}
      <div className="px-5 py-4 border-b border-border/50 bg-[#FFCC00]/5">
        <p className="text-sm leading-relaxed text-foreground/90 italic font-medium">
          "{result.explanation}"
        </p>
      </div>

      {/* Top recommended agency */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Agence recommandée
        </div>
        <div
          onClick={() => onSelect(result.recommended as unknown as Agence)}
          className="rounded-xl border-2 border-[#FFCC00] bg-[rgba(255,204,0,0.06)] p-4 cursor-pointer hover:bg-[rgba(255,204,0,0.1)] transition-colors group"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-semibold text-sm group-hover:text-[#FFCC00] transition-colors">
                {result.recommended.nom || (result.recommended as any).name}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {result.recommended.adresse || (result.recommended as any).address}
              </div>
            </div>
            <Badge className="bg-[#FFCC00]/20 text-[#FFCC00] border-[#FFCC00]/30 font-bold text-xs">
              {Math.round(result.scores[0].score)}/100
            </Badge>
          </div>
          {/* Factor pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1">
              <MapPin className="w-2.5 h-2.5" />
              {result.factors.distance}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-600 rounded-full px-2.5 py-1">
              <Calendar className="w-2.5 h-2.5" />
              {result.factors.availability}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1">
              <Clock className="w-2.5 h-2.5" />
              {result.factors.load}
            </span>
            {result.scores[0].hasHistory && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-500 rounded-full px-2.5 py-1">
                <Star className="w-2.5 h-2.5" />
                Déjà visitée
              </span>
            )}
          </div>
          <Button
            className="w-full mt-3 bg-[#FFCC00] text-black hover:bg-yellow-400 font-semibold text-sm h-9"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(result.recommended as unknown as Agence);
            }}
          >
            Choisir cette agence &rarr;
          </Button>
        </div>
      </div>

      {/* Other agencies ranked */}
      <div className="px-5 py-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Autres agences
        </div>
        <div className="space-y-2">
          {displayedScores.slice(1).map((item, idx) => (
            <div
              key={item.agence.id}
              onClick={() => onSelect(item.agence as unknown as Agence)}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50 cursor-pointer hover:border-[rgba(255,204,0,0.3)] hover:bg-[rgba(255,204,0,0.03)] transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                {idx + 2}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {item.agence.nom || (item.agence as any).name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.distanceKm} km &middot; {item.availableSlots} créneaux (est.)
                </div>
              </div>
              {/* Mini score bar */}
              <div className="w-16 flex-shrink-0">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFCC00]/60 rounded-full"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground text-right mt-0.5">
                  {Math.round(item.score)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {result.scores.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-muted-foreground hover:text-foreground mt-3 py-2 flex items-center justify-center gap-1 transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`}
            />
            {showAll ? 'Afficher moins' : `Voir ${result.scores.length - 3} autres agences`}
          </button>
        )}
      </div>
    </div>
  );
}
