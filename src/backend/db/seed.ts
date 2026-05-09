import type { AppRole, StatutRDV, StatutReclamation } from "@/types";
import type { BackendNotification } from "@/backend/domain";

export const DEFAULT_AGENCIES = [
  {
    name: "Renault Tunis-Centre",
    city: "Tunis",
    address: "Avenue Habib Bourguiba, Tunis",
    phone: "+216 71 234 567",
  },
  {
    name: "Renault Sfax",
    city: "Sfax",
    address: "Route de Tunis, Sfax",
    phone: "+216 74 456 789",
  },
  {
    name: "Renault Sousse",
    city: "Sousse",
    address: "Boulevard 14 Janvier, Sousse",
    phone: "+216 73 678 901",
  },
  {
    name: "Renault Monastir",
    city: "Monastir",
    address: "Zone Industrielle Monastir",
    phone: "+216 73 890 123",
  },
  {
    name: "Renault Bizerte",
    city: "Bizerte",
    address: "Avenue Farhat Hached, Bizerte",
    phone: "+216 72 012 345",
  },
  {
    name: "Renault Gabes",
    city: "Gabes",
    address: "Route Nationale 1, Gabes",
    phone: "+216 75 234 567",
  },
] as const;

export interface SeedUser {
  keycloakSubject: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roles: AppRole[];
}

export const DEFAULT_USERS: SeedUser[] = [
  {
    keycloakSubject: "seed-client-1",
    email: "karim.benali@email.com",
    firstName: "Karim",
    lastName: "Benali",
    phone: "+216 55 123 456",
    roles: ["client"],
  },
  {
    keycloakSubject: "seed-client-2",
    email: "amira.hadj@email.com",
    firstName: "Amira",
    lastName: "Hadj",
    phone: "+216 22 987 654",
    roles: ["client"],
  },
  {
    keycloakSubject: "seed-client-3",
    email: "m.trabelsi@email.com",
    firstName: "Mohamed",
    lastName: "Trabelsi",
    phone: "+216 98 555 222",
    roles: ["client"],
  },
  {
    keycloakSubject: "seed-agent-fo-1",
    email: "agent.fo@renault.tn",
    firstName: "Sami",
    lastName: "Cherif",
    phone: "+216 27 111 333",
    roles: ["agent_fo"],
  },
  {
    keycloakSubject: "seed-agent-bo-1",
    email: "admin@renault.tn",
    firstName: "Yasmine",
    lastName: "Khelifi",
    phone: "+216 50 444 666",
    roles: ["agent_bo"],
  },
];

/** Vehicle seed data — ownerIndex refers to position in DEFAULT_USERS array */
export interface SeedVehicle {
  ownerIndex: number;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  isPrimary: boolean;
}

export const DEFAULT_VEHICLES: SeedVehicle[] = [
  {
    ownerIndex: 0,
    plateNumber: "16 TN 142",
    brand: "Renault",
    model: "Clio V",
    year: 2022,
    isPrimary: true,
  },
  {
    ownerIndex: 0,
    plateNumber: "203 TN 5871",
    brand: "Renault",
    model: "Captur",
    year: 2020,
    isPrimary: false,
  },
  {
    ownerIndex: 1,
    plateNumber: "88 TN 9012",
    brand: "Renault",
    model: "Mégane",
    year: 2021,
    isPrimary: true,
  },
  {
    ownerIndex: 2,
    plateNumber: "141 TN 3344",
    brand: "Renault",
    model: "Kadjar",
    year: 2023,
    isPrimary: true,
  },
];

/** Appointment seed — clientIndex/agencyIndex/vehicleIndex refer to array positions */
export interface SeedAppointment {
  clientIndex: number;
  agencyIndex: number;
  vehicleIndex: number;
  dayOffset: number;
  hour: number;
  status: StatutRDV;
  notes?: string;
}

export const DEFAULT_APPOINTMENTS: SeedAppointment[] = [
  {
    clientIndex: 0,
    agencyIndex: 0,
    vehicleIndex: 0,
    dayOffset: 7,
    hour: 10,
    status: "Confirme",
    notes: "Vidange et révision générale.",
  },
  {
    clientIndex: 0,
    agencyIndex: 0,
    vehicleIndex: 1,
    dayOffset: 14,
    hour: 14,
    status: "EnAttente",
    notes: "Bruit moteur depuis 2 semaines.",
  },
  { clientIndex: 0, agencyIndex: 1, vehicleIndex: 0, dayOffset: -30, hour: 11, status: "Termine" },
  { clientIndex: 1, agencyIndex: 0, vehicleIndex: 2, dayOffset: 0, hour: 9, status: "Confirme" },
  { clientIndex: 2, agencyIndex: 0, vehicleIndex: 3, dayOffset: 0, hour: 11, status: "EnAttente" },
  { clientIndex: 1, agencyIndex: 0, vehicleIndex: 2, dayOffset: 0, hour: 16, status: "Confirme" },
  { clientIndex: 2, agencyIndex: 1, vehicleIndex: 3, dayOffset: 1, hour: 10, status: "Confirme" },
];

export interface SeedComplaint {
  clientIndex: number;
  appointmentIndex: number | null;
  description: string;
  status: StatutReclamation;
  resolution?: string;
}

export const DEFAULT_COMPLAINTS: SeedComplaint[] = [
  {
    clientIndex: 0,
    appointmentIndex: 2,
    description:
      "Le bruit du moteur n'a pas été correctement diagnostiqué. Il persiste après l'intervention.",
    status: "EnCours",
  },
  {
    clientIndex: 1,
    appointmentIndex: null,
    description: "Difficulté à joindre l'agence par téléphone pour reporter mon RDV.",
    status: "Resolue",
    resolution: "Une nouvelle ligne dédiée a été mise en place. Merci pour votre retour.",
  },
  {
    clientIndex: 2,
    appointmentIndex: null,
    description: "Délai d'attente trop long le jour du rendez-vous.",
    status: "Ouverte",
  },
];

export interface SeedNotification {
  userIndex: number;
  type: BackendNotification["type"];
  message: string;
  read: boolean;
}

export const DEFAULT_NOTIFICATIONS: SeedNotification[] = [
  {
    userIndex: 0,
    type: "rdv_confirme",
    message: "Votre rendez-vous a été confirmé pour le 15 mai à 10h00",
    read: false,
  },
  { userIndex: 0, type: "rdv_rappel", message: "Rappel : votre RDV est dans 24h", read: false },
  {
    userIndex: 0,
    type: "reclamation",
    message: "Votre réclamation a reçu une réponse",
    read: true,
  },
  { userIndex: 1, type: "rdv_confirme", message: "Votre rendez-vous a été confirmé", read: false },
];
