import type { AppSession } from "@/backend/auth/session";
import type { BackendAppointment, EntityId } from "@/backend/domain";
import type { BackendRepositories } from "@/backend/repositories/contracts";
import type { StatutRDV } from "@/types";

export interface CreateAppointmentInput {
  clientUserId: EntityId;
  agencyId: EntityId;
  vehicleId: EntityId;
  startsAt: string;
  notes?: string | null;
}

export async function createAppointment(
  repos: BackendRepositories,
  session: AppSession,
  input: CreateAppointmentInput,
): Promise<BackendAppointment> {
  const isClientCreatingOwnAppointment =
    session.principal.roles.includes("client") && session.userId === input.clientUserId;
  const isStaff = session.principal.roles.includes("agent_fo") || session.principal.roles.includes("agent_bo");

  if (!isClientCreatingOwnAppointment && !isStaff) {
    throw new Response("Forbidden", { status: 403 });
  }

  const vehicle = await repos.vehicles.findById(input.vehicleId);
  if (!vehicle || vehicle.ownerUserId !== input.clientUserId) {
    throw new Response("Vehicle not found", { status: 404 });
  }

  const agency = await repos.agencies.findById(input.agencyId);
  if (!agency) {
    throw new Response("Agency not found", { status: 404 });
  }

  return repos.appointments.create({
    clientUserId: input.clientUserId,
    agencyId: input.agencyId,
    vehicleId: input.vehicleId,
    startsAt: input.startsAt,
    status: "EnAttente",
    notes: input.notes ?? null,
    createdByUserId: session.userId,
  });
}

export async function changeAppointmentStatus(
  repos: BackendRepositories,
  session: AppSession,
  appointmentId: EntityId,
  status: StatutRDV,
): Promise<BackendAppointment> {
  if (!session.principal.roles.includes("agent_fo") && !session.principal.roles.includes("agent_bo")) {
    throw new Response("Forbidden", { status: 403 });
  }

  return repos.appointments.updateStatus(appointmentId, status);
}

