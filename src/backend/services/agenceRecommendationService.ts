import { GoogleGenerativeAI } from '@google/generative-ai';
import type { BackendRepositories } from '@/backend/repositories/contracts';
import type { BackendAgency } from '@/backend/domain';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export interface RecommendationRequest {
  userLat: number;
  userLon: number;
  clientUserId: string;
  vehiculeModele?: string;
  serviceType?: string[];
}

export interface AgenceScore {
  agence: BackendAgency;
  distanceKm: number;
  availableSlots: number;
  loadRatio: number;
  hasHistory: boolean;
  hadComplaint: boolean;
  score: number;
}

export interface RecommendationResult {
  recommended: BackendAgency;
  scores: AgenceScore[];
  explanation: string;
  factors: {
    distance: string;
    availability: string;
    history: string;
    load: string;
  };
}

export async function recommendAgence(
  req: RecommendationRequest,
  repos: BackendRepositories
): Promise<RecommendationResult> {
  const now = new Date();
  // 7 days look ahead
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 1. Load all agencies
  const allAgencies = await repos.agencies.list();
  const agences = allAgencies.filter((ag) => ag.location?.lat && ag.location?.lng);

  if (agences.length === 0) {
    throw new Error('No valid agencies found');
  }

  // 2. Load all appointments to compute load and availability
  // Since we don't have a Creneau collection, we'll estimate availability based on current appointments.
  // Assume a baseline capacity of 50 appointments per week per agency.
  const BASELINE_CAPACITY = 50;
  
  const allAppointments = await repos.appointments.listAll();
  const weekAppointments = allAppointments.filter(
    (a) => new Date(a.startsAt) >= now && new Date(a.startsAt) <= weekEnd
  );

  const agencyStats = agences.map((ag) => {
    const booked = weekAppointments.filter((a) => a.agencyId === ag.id).length;
    const available = Math.max(0, BASELINE_CAPACITY - booked);
    const load = booked / BASELINE_CAPACITY;
    return {
      agencyId: ag.id,
      booked,
      available,
      load,
    };
  });

  // 3. Load client history
  const clientHistory = await repos.appointments.listForClient(req.clientUserId);
  const visitedAgenceIds = new Set(clientHistory.map((r) => r.agencyId));

  // 4. Load client complaints
  const clientComplaints = await repos.complaints.listForClient(req.clientUserId);
  const complaintAppointmentIds = clientComplaints
    .map((c) => c.appointmentId)
    .filter(Boolean) as string[];

  const complaintAgenceIds = new Set(
    clientHistory
      .filter((a) => complaintAppointmentIds.includes(a.id))
      .map((a) => a.agencyId)
  );

  // 5. Score each agency
  const scores: AgenceScore[] = agences.map((ag) => {
    const stats = agencyStats.find((s) => s.agencyId === ag.id)!;
    const distKm = haversineKm(req.userLat, req.userLon, ag.location!.lat, ag.location!.lng);

    // Distance score: 0km=40pts, 50km=20pts, 150km+=0pts
    const distScore = Math.max(0, 40 - (distKm / 150) * 40);

    // Availability score: all available=30pts, 0 available=0pts
    const availScore = (stats.available / BASELINE_CAPACITY) * 30;

    // Load score: less busy = better (up to 15pts)
    const loadScore = Math.max(0, (1 - stats.load) * 15);

    // History bonus: visited before = +10pts
    const historyScore = visitedAgenceIds.has(ag.id) ? 10 : 0;

    // Complaint penalty: had complaint = -20pts
    const complaintPenalty = complaintAgenceIds.has(ag.id) ? -20 : 0;

    // Availability hard penalty: 0 slots = -30pts
    const zeroSlotsPenalty = stats.available === 0 ? -30 : 0;

    const score = Math.max(
      0,
      Math.min(
        100,
        distScore + availScore + loadScore + historyScore + complaintPenalty + zeroSlotsPenalty
      )
    );

    return {
      agence: ag,
      distanceKm: distKm,
      availableSlots: stats.available,
      loadRatio: stats.load,
      hasHistory: visitedAgenceIds.has(ag.id),
      hadComplaint: complaintAgenceIds.has(ag.id),
      score,
    };
  }).sort((a, b) => b.score - a.score);

  const best = scores[0];

  // 6. Generate AI explanation with Gemini
  const prompt = `
Tu es un assistant intelligent pour l'application Renault RDV en Tunisie.
Génère une recommandation courte (2-3 phrases maximum) en français,
naturelle et personnalisée, pour expliquer pourquoi cette agence est
la meilleure option pour ce client.

DONNÉES:
Agence recommandée: ${best.agence.name} (${best.agence.city})
Distance du client: ${best.distanceKm} km
Créneaux disponibles cette semaine (estimés): ${best.availableSlots}
Taux d'occupation: ${Math.round(best.loadRatio * 100)}%
Client a déjà visité cette agence: ${best.hasHistory ? 'Oui' : 'Non'}
Client a eu une réclamation ici: ${best.hadComplaint ? 'Oui' : 'Non'}
Score de recommandation: ${Math.round(best.score)}/100
Services demandés: ${req.serviceType?.join(', ') || 'non précisés'}
2ème option: ${scores[1]?.agence.name} (${scores[1]?.distanceKm} km)

RÈGLES:
Ton chaleureux mais professionnel
Mentionner la distance ET la disponibilité
Si le client a déjà visité: souligner la familiarité
Si une autre agence est très proche: le mentionner comme alternative
Pas de bullet points, du texte fluide
Maximum 60 mots
Finir par une action: "Nous vous recommandons de réserver dès maintenant."
  `.trim();

  let explanation = `L'agence ${best.agence.name} est la plus adaptée à votre situation, à ${best.distanceKm} km avec ${best.availableSlots} créneaux disponibles cette semaine. Nous vous recommandons de réserver dès maintenant.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
    });
    const result = await model.generateContent(prompt);
    explanation = result.response.text().trim();
  } catch (err) {
    console.error('Gemini API error (using fallback explanation):', err);
  }

  return {
    recommended: best.agence,
    scores,
    explanation,
    factors: {
      distance: `${best.distanceKm} km`,
      availability: `${best.availableSlots} créneaux (est.)`,
      history: best.hasHistory ? 'Agence déjà visitée' : 'Nouvelle agence',
      load: `${Math.round(best.loadRatio * 100)}% d'occupation`,
    },
  };
}
