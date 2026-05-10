import type { AppRole, StatutRDV, StatutReclamation } from "@/types";

export type EntityId = string;

export interface AuditFields {
  createdAt: string;
  updatedAt: string;
}

export interface BackendUser extends AuditFields {
  id: EntityId;
  keycloakSubject: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: AppRole[];
  agencyId: EntityId | null;
}

export interface BackendAgency extends AuditFields {
  id: EntityId;
  name: string;
  city: string;
  address: string;
  phone: string;
  location: { lat: number; lng: number } | null;
}

export interface BackendVehicle extends AuditFields {
  id: EntityId;
  ownerUserId: EntityId;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  isPrimary: boolean;
}

export interface BackendAppointment extends AuditFields {
  id: EntityId;
  reference: string;
  clientUserId: EntityId;
  agencyId: EntityId;
  vehicleId: EntityId;
  startsAt: string;
  status: StatutRDV;
  servicesSelectionnes: string[];
  notesLibres: string | null;
  createdByUserId: EntityId | null;
}

export interface BackendComplaint extends AuditFields {
  id: EntityId;
  clientUserId: EntityId;
  appointmentId: EntityId | null;
  description: string;
  status: StatutReclamation;
  resolution: string | null;
}

export interface BackendNotification extends AuditFields {
  id: EntityId;
  userId: EntityId;
  type: "rdv_confirme" | "rdv_rappel" | "reclamation" | "systeme";
  message: string;
  read: boolean;
}
