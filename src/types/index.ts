export type AppRole = "client" | "agent_front_office" | "agent_back_office";

export type StatutRDV = "EnAttente" | "Confirme" | "Annule" | "Termine";
export type StatutReclamation = "Ouverte" | "EnCours" | "Resolue" | "Escaladee";

export interface Agence {
  id: string;
  nom: string;
  ville: string;
  adresse: string;
  telephone: string;
  latitude?: number;
  longitude?: number;
}

export interface Vehicule {
  id: string;
  clientId: string;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  isPrincipal?: boolean;
}

export interface Creneau {
  id: string;
  agenceId: string;
  date: string; // ISO date
  heure: string; // "10:00"
  disponible: boolean;
}

export interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
}

export interface RendezVous {
  id: string;
  reference: string;
  clientId: string;
  client?: Client;
  agenceId: string;
  agence?: Agence;
  vehiculeId: string;
  vehicule?: Vehicule;
  date: string; // ISO datetime
  statut: StatutRDV;
  servicesSelectionnes: string[];
  notesLibres?: string;
  createdAt: string;
  agentCreateurId?: string;
}

export interface Reclamation {
  id: string;
  clientId: string;
  client?: Client;
  rdvId?: string;
  description: string;
  statut: StatutReclamation;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: "rdv_confirme" | "rdv_rappel" | "reclamation" | "systeme";
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Profile {
  id: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  agenceId?: string | null;
}
