import type {
  BackendAgency,
  BackendAppointment,
  BackendComplaint,
  BackendNotification,
  BackendUser,
  BackendVehicle,
  EntityId,
} from "@/backend/domain";
import type { StatutRDV, StatutReclamation } from "@/types";

export interface UserRepository {
  findById(id: EntityId): Promise<BackendUser | null>;
  findByKeycloakSubject(subject: string): Promise<BackendUser | null>;
  listAll(): Promise<BackendUser[]>;
  listClients(): Promise<BackendUser[]>;
  updateProfile(
    id: EntityId,
    patch: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      roles?: AppRole[];
      agencyId?: EntityId | null;
    },
  ): Promise<BackendUser>;
  upsertFromIdentity(input: {
    keycloakSubject: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  }): Promise<BackendUser>;
}

export interface AgencyRepository {
  list(): Promise<BackendAgency[]>;
  findById(id: EntityId): Promise<BackendAgency | null>;
  create(input: Omit<BackendAgency, "id" | "createdAt" | "updatedAt">): Promise<BackendAgency>;
  update(
    id: EntityId,
    patch: Partial<Omit<BackendAgency, "id" | "createdAt" | "updatedAt">>,
  ): Promise<BackendAgency>;
}

export interface VehicleRepository {
  listByOwner(ownerUserId: EntityId): Promise<BackendVehicle[]>;
  listAll(): Promise<BackendVehicle[]>;
  findById(id: EntityId): Promise<BackendVehicle | null>;
  create(input: Omit<BackendVehicle, "id" | "createdAt" | "updatedAt">): Promise<BackendVehicle>;
}

export interface AppointmentRepository {
  findById(id: EntityId): Promise<BackendAppointment | null>;
  listForClient(clientUserId: EntityId): Promise<BackendAppointment[]>;
  listForAgency(agencyId: EntityId): Promise<BackendAppointment[]>;
  listAll(): Promise<BackendAppointment[]>;
  create(
    input: Omit<BackendAppointment, "id" | "reference" | "createdAt" | "updatedAt">,
  ): Promise<BackendAppointment>;
  updateStatus(id: EntityId, status: StatutRDV): Promise<BackendAppointment>;
}

export interface ComplaintRepository {
  findById(id: EntityId): Promise<BackendComplaint | null>;
  listForClient(clientUserId: EntityId): Promise<BackendComplaint[]>;
  listForAgency(agencyId: EntityId): Promise<BackendComplaint[]>;
  listAll(): Promise<BackendComplaint[]>;
  create(
    input: Omit<BackendComplaint, "id" | "status" | "resolution" | "createdAt" | "updatedAt">,
  ): Promise<BackendComplaint>;
  updateStatus(
    id: EntityId,
    patch: { status: StatutReclamation; resolution?: string | null },
  ): Promise<BackendComplaint>;
}

export interface NotificationRepository {
  listForUser(userId: EntityId): Promise<BackendNotification[]>;
  markAllRead(userId: EntityId): Promise<void>;
}

export interface BackendRepositories {
  users: UserRepository;
  agencies: AgencyRepository;
  vehicles: VehicleRepository;
  appointments: AppointmentRepository;
  complaints: ComplaintRepository;
  notifications: NotificationRepository;
}
