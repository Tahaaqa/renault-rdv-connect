import { useMutation } from '@tanstack/react-query';
import type { Agence } from '@/types';

interface AgenceScore {
  agence: Agence;
  distanceKm: number;
  availableSlots: number;
  loadRatio: number;
  score: number;
  hasHistory: boolean;
  hadComplaint: boolean;
}

export interface RecommendationResult {
  recommended: Agence;
  scores: AgenceScore[];
  explanation: string;
  factors: {
    distance: string;
    availability: string;
    history: string;
    load: string;
  };
}

export function useAgenceRecommendation() {
  return useMutation<RecommendationResult, Error, { userLat: number; userLon: number; vehiculeModele?: string; serviceType?: string[] }>({
    mutationFn: async (payload) => {
      const res = await fetch('/api/agencies/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Recommendation failed');
      }
      return res.json();
    },
  });
}
