// Mock data store for RDV, vehicules, reclamations, clients.
// Backend tables (profiles, user_roles, agences) live in Lovable Cloud;
// this layer provides instant, fully-interactive seed data for the demo UX.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Agence,
  Client,
  RendezVous,
  Reclamation,
  Vehicule,
  Notification,
  StatutRDV,
} from "@/types";

export const SEED_AGENCES: Agence[] = [
  { id: "ag-1", nom: "Renault Tunis-Centre", ville: "Tunis", adresse: "Avenue Habib Bourguiba, Tunis", telephone: "+216 71 234 567" },
  { id: "ag-2", nom: "Renault Sfax", ville: "Sfax", adresse: "Route de Tunis, Sfax", telephone: "+216 74 456 789" },
  { id: "ag-3", nom: "Renault Sousse", ville: "Sousse", adresse: "Boulevard 14 Janvier, Sousse", telephone: "+216 73 678 901" },
  { id: "ag-4", nom: "Renault Monastir", ville: "Monastir", adresse: "Zone Industrielle Monastir", telephone: "+216 73 890 123" },
  { id: "ag-5", nom: "Renault Bizerte", ville: "Bizerte", adresse: "Avenue Farhat Hached, Bizerte", telephone: "+216 72 012 345" },
  { id: "ag-6", nom: "Renault Gabès", ville: "Gabès", adresse: "Route Nationale 1, Gabès", telephone: "+216 75 234 567" },
];

const SEED_CLIENTS: Client[] = [
  { id: "cl-1", nom: "Benali", prenom: "Karim", email: "karim.benali@email.com", telephone: "+216 55 123 456" },
  { id: "cl-2", nom: "Hadj", prenom: "Amira", email: "amira.hadj@email.com", telephone: "+216 22 987 654" },
  { id: "cl-3", nom: "Trabelsi", prenom: "Mohamed", email: "m.trabelsi@email.com", telephone: "+216 98 555 222" },
  { id: "cl-4", nom: "Cherif", prenom: "Sami", email: "sami.cherif@email.com", telephone: "+216 27 111 333" },
  { id: "cl-5", nom: "Khelifi", prenom: "Yasmine", email: "y.khelifi@email.com", telephone: "+216 50 444 666" },
];

const SEED_VEHICULES: Vehicule[] = [
  { id: "v-1", clientId: "cl-1", immatriculation: "16 TN 142", marque: "Renault", modele: "Clio V", annee: 2022, isPrincipal: true },
  { id: "v-2", clientId: "cl-1", immatriculation: "203 TN 5871", marque: "Renault", modele: "Captur", annee: 2020 },
  { id: "v-3", clientId: "cl-2", immatriculation: "88 TN 9012", marque: "Renault", modele: "Mégane", annee: 2021, isPrincipal: true },
  { id: "v-4", clientId: "cl-3", immatriculation: "141 TN 3344", marque: "Renault", modele: "Kadjar", annee: 2023, isPrincipal: true },
  { id: "v-5", clientId: "cl-4", immatriculation: "55 TN 7788", marque: "Renault", modele: "Duster", annee: 2024, isPrincipal: true },
  { id: "v-6", clientId: "cl-5", immatriculation: "199 TN 6543", marque: "Renault", modele: "Arkana", annee: 2024, isPrincipal: true },
];

const today = new Date();
const dayOff = (d: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  return x;
};
const at = (d: Date, h: number, m = 0) => {
  const x = new Date(d);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
};

const SEED_RDV: RendezVous[] = [
  { id: "r-1", reference: "RDV-2025-00127", clientId: "cl-1", agenceId: "ag-1", vehiculeId: "v-1", date: at(dayOff(7), 10), statut: "Confirme", notes: "Vidange et révision générale.", createdAt: at(dayOff(-15), 14, 30) },
  { id: "r-2", reference: "RDV-2025-00128", clientId: "cl-1", agenceId: "ag-1", vehiculeId: "v-2", date: at(dayOff(14), 14), statut: "EnAttente", notes: "Bruit moteur depuis 2 semaines.", createdAt: at(dayOff(-2), 9, 12) },
  { id: "r-3", reference: "RDV-2025-00120", clientId: "cl-1", agenceId: "ag-2", vehiculeId: "v-1", date: at(dayOff(-30), 11), statut: "Termine", createdAt: at(dayOff(-40), 10) },
  { id: "r-4", reference: "RDV-2025-00115", clientId: "cl-1", agenceId: "ag-1", vehiculeId: "v-2", date: at(dayOff(-60), 9), statut: "Termine", createdAt: at(dayOff(-70), 16) },
  { id: "r-5", reference: "RDV-2025-00110", clientId: "cl-1", agenceId: "ag-3", vehiculeId: "v-1", date: at(dayOff(-90), 16), statut: "Annule", notes: "Empêchement de dernière minute.", createdAt: at(dayOff(-95), 8) },
  { id: "r-6", reference: "RDV-2025-00130", clientId: "cl-2", agenceId: "ag-1", vehiculeId: "v-3", date: at(dayOff(0), 9), statut: "Confirme", createdAt: at(dayOff(-3), 11) },
  { id: "r-7", reference: "RDV-2025-00131", clientId: "cl-3", agenceId: "ag-1", vehiculeId: "v-4", date: at(dayOff(0), 11), statut: "EnAttente", createdAt: at(dayOff(-1), 17) },
  { id: "r-8", reference: "RDV-2025-00132", clientId: "cl-4", agenceId: "ag-1", vehiculeId: "v-5", date: at(dayOff(0), 14), statut: "Confirme", createdAt: at(dayOff(-2), 13) },
  { id: "r-9", reference: "RDV-2025-00133", clientId: "cl-5", agenceId: "ag-1", vehiculeId: "v-6", date: at(dayOff(0), 15), statut: "Confirme", createdAt: at(dayOff(-2), 9) },
  { id: "r-10", reference: "RDV-2025-00134", clientId: "cl-2", agenceId: "ag-1", vehiculeId: "v-3", date: at(dayOff(0), 16), statut: "Confirme", createdAt: at(dayOff(-1), 10) },
  { id: "r-11", reference: "RDV-2025-00135", clientId: "cl-3", agenceId: "ag-1", vehiculeId: "v-4", date: at(dayOff(0), 17), statut: "Termine", createdAt: at(dayOff(-5), 12) },
  { id: "r-12", reference: "RDV-2025-00136", clientId: "cl-4", agenceId: "ag-2", vehiculeId: "v-5", date: at(dayOff(1), 10), statut: "Confirme", createdAt: at(dayOff(-3), 14) },
];

const SEED_RECLAMATIONS: Reclamation[] = [
  { id: "rec-1", clientId: "cl-1", rdvId: "r-3", description: "Le bruit du moteur n'a pas été correctement diagnostiqué. Il persiste après l'intervention.", statut: "EnCours", createdAt: at(dayOff(-18), 14), updatedAt: at(dayOff(-12), 9) },
  { id: "rec-2", clientId: "cl-2", description: "Difficulté à joindre l'agence par téléphone pour reporter mon RDV.", statut: "Resolue", resolution: "Une nouvelle ligne dédiée a été mise en place. Merci pour votre retour.", createdAt: at(dayOff(-25), 10), updatedAt: at(dayOff(-20), 11) },
  { id: "rec-3", clientId: "cl-3", description: "Délai d'attente trop long le jour du rendez-vous.", statut: "Ouverte", createdAt: at(dayOff(-3), 15), updatedAt: at(dayOff(-3), 15) },
];

const SEED_NOTIFS: Notification[] = [
  { id: "n-1", type: "rdv_confirme", message: "RDV-2025-00127 confirmé pour le 15 mai à 10h00", read: false, createdAt: at(dayOff(0), 8) },
  { id: "n-2", type: "rdv_rappel", message: "Rappel : votre RDV est dans 24h", read: false, createdAt: at(dayOff(-1), 9) },
  { id: "n-3", type: "reclamation", message: "Votre réclamation a reçu une réponse", read: true, createdAt: at(dayOff(-2), 16) },
  { id: "n-4", type: "systeme", message: "Bienvenue sur Renault RDV", read: true, createdAt: at(dayOff(-10), 12) },
];

interface DataState {
  clients: Client[];
  vehicules: Vehicule[];
  rdvs: RendezVous[];
  reclamations: Reclamation[];
  notifications: Notification[];
  // Currently impersonated demo client (tied to logged-in user in real life)
  currentClientId: string;
  setCurrentClient: (id: string) => void;
  // mutations
  createRDV: (rdv: Omit<RendezVous, "id" | "reference" | "createdAt" | "statut"> & { statut?: StatutRDV }) => RendezVous;
  updateRDVStatus: (id: string, statut: StatutRDV) => void;
  addVehicule: (v: Omit<Vehicule, "id">) => Vehicule;
  removeVehicule: (id: string) => void;
  addReclamation: (r: Omit<Reclamation, "id" | "createdAt" | "updatedAt" | "statut">) => Reclamation;
  updateReclamation: (id: string, patch: Partial<Reclamation>) => void;
  markAllNotificationsRead: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      clients: SEED_CLIENTS,
      vehicules: SEED_VEHICULES,
      rdvs: SEED_RDV,
      reclamations: SEED_RECLAMATIONS,
      notifications: SEED_NOTIFS,
      currentClientId: "cl-1",
      setCurrentClient: (id) => set({ currentClientId: id }),
      createRDV: (input) => {
        const ref = `RDV-2025-${String(Math.floor(Math.random() * 90000) + 10000)}`;
        const rdv: RendezVous = {
          ...input,
          id: `r-${Date.now()}`,
          reference: ref,
          createdAt: new Date().toISOString(),
          statut: input.statut ?? "EnAttente",
        };
        set({ rdvs: [rdv, ...get().rdvs] });
        return rdv;
      },
      updateRDVStatus: (id, statut) =>
        set({ rdvs: get().rdvs.map((r) => (r.id === id ? { ...r, statut } : r)) }),
      addVehicule: (v) => {
        const veh: Vehicule = { ...v, id: `v-${Date.now()}` };
        set({ vehicules: [...get().vehicules, veh] });
        return veh;
      },
      removeVehicule: (id) =>
        set({ vehicules: get().vehicules.filter((v) => v.id !== id) }),
      addReclamation: (r) => {
        const rec: Reclamation = {
          ...r,
          id: `rec-${Date.now()}`,
          statut: "Ouverte",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ reclamations: [rec, ...get().reclamations] });
        return rec;
      },
      updateReclamation: (id, patch) =>
        set({
          reclamations: get().reclamations.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
          ),
        }),
      markAllNotificationsRead: () =>
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
    }),
    { name: "renault-data", version: 1 }
  )
);

// Helpers
export const getCurrentClient = () => {
  const { clients, currentClientId } = useDataStore.getState();
  return clients.find((c) => c.id === currentClientId) ?? clients[0];
};
