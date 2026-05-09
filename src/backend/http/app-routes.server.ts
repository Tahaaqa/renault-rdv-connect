import { getBackendConfig } from "@/backend/config";
import { getBackendRepositories, seedDefaultData } from "@/backend/db/mongo.server";
import { createAppointment } from "@/backend/services/appointments";
import { requireSessionFromRequest } from "@/backend/auth/request-session.server";
import { jsonResponse } from "@/backend/http/json";
import type { AppSession } from "@/backend/auth/session";
import type { AppRole, StatutReclamation, StatutRDV } from "@/types";

interface CreateAppointmentPayload {
  clientUserId?: string;
  agencyId?: string;
  vehicleId?: string;
  startsAt?: string;
  notes?: string | null;
}

interface CreateVehiclePayload {
  ownerUserId?: string;
  plateNumber?: string;
  brand?: string;
  model?: string;
  year?: number;
  isPrimary?: boolean;
}

interface CreateComplaintPayload {
  clientUserId?: string;
  appointmentId?: string | null;
  description?: string;
}

interface UpdateComplaintPayload {
  status?: StatutReclamation;
  resolution?: string | null;
}

interface UpdateAppointmentStatusPayload {
  status?: StatutRDV;
}

interface UpdateUserPayload {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  roles?: AppRole[];
  agencyId?: string | null;
}

interface AgencyPayload {
  name?: string;
  city?: string;
  address?: string;
  phone?: string;
  location?: { lat: number; lng: number } | null;
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Response("Invalid JSON", { status: 400 });
  }
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Response(`Missing field: ${field}`, { status: 400 });
  }
  return value;
}

function assertNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Response(`Missing field: ${field}`, { status: 400 });
  }
  return value;
}

function requireStaff(session: AppSession): void {
  if (!session.principal.roles.includes("agent_fo") && !session.principal.roles.includes("agent_bo")) {
    throw new Response("Forbidden", { status: 403 });
  }
}

function requireBackOffice(session: AppSession): void {
  if (!session.principal.roles.includes("agent_bo")) {
    throw new Response("Forbidden", { status: 403 });
  }
}

function assertRoles(value: unknown): AppRole[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Response("Missing field: roles", { status: 400 });
  }

  const valid = new Set<AppRole>(["client", "agent_fo", "agent_bo"]);
  const roles = value.filter((role): role is AppRole => typeof role === "string" && valid.has(role as AppRole));
  if (roles.length !== value.length) {
    throw new Response("Invalid roles", { status: 400 });
  }
  return Array.from(new Set(roles));
}

async function getRepositories() {
  const config = getBackendConfig();
  return getBackendRepositories(config.mongo);
}

async function handleAgencies(request: Request): Promise<Response> {
  const repos = await getRepositories();

  if (request.method === "GET") {
    await requireSessionFromRequest(request);
    return jsonResponse({ agencies: await repos.agencies.list() });
  }

  if (request.method === "POST") {
    const session = await requireSessionFromRequest(request);
    requireBackOffice(session);
    const payload = await readJson<AgencyPayload>(request);
    const agency = await repos.agencies.create({
      name: assertString(payload.name, "name"),
      city: assertString(payload.city, "city"),
      address: assertString(payload.address, "address"),
      phone: assertString(payload.phone, "phone"),
      location: payload.location ?? null,
    });
    return jsonResponse({ agency }, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleAgencyUpdate(request: Request, agencyId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  requireBackOffice(session);
  const payload = await readJson<AgencyPayload>(request);
  const repos = await getRepositories();
  const patch: AgencyPayload = {};

  if ("name" in payload) patch.name = assertString(payload.name, "name");
  if ("city" in payload) patch.city = assertString(payload.city, "city");
  if ("address" in payload) patch.address = assertString(payload.address, "address");
  if ("phone" in payload) patch.phone = assertString(payload.phone, "phone");
  if ("location" in payload) patch.location = payload.location ?? null;

  const agency = await repos.agencies.update(agencyId, patch);
  return jsonResponse({ agency });
}

async function handleClients(request: Request): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  requireStaff(session);
  const repos = await getRepositories();
  return jsonResponse({ clients: await repos.users.listClients() });
}

async function handleUsers(request: Request): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  requireBackOffice(session);
  const repos = await getRepositories();
  return jsonResponse({ users: await repos.users.listAll() });
}

async function handleUserUpdate(request: Request, userId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  requireBackOffice(session);
  const payload = await readJson<UpdateUserPayload>(request);
  const repos = await getRepositories();
  const roles = payload.roles ? assertRoles(payload.roles) : undefined;
  const patch: UpdateUserPayload = {};
  if ("firstName" in payload) patch.firstName = payload.firstName ?? null;
  if ("lastName" in payload) patch.lastName = payload.lastName ?? null;
  if ("phone" in payload) patch.phone = payload.phone ?? null;
  if (roles) {
    patch.roles = roles;
    patch.agencyId = roles.includes("agent_fo") ? payload.agencyId ?? null : null;
  } else if ("agencyId" in payload) {
    patch.agencyId = payload.agencyId ?? null;
  }
  const user = await repos.users.updateProfile(userId, patch);
  return jsonResponse({ user });
}

async function handleAppointments(request: Request): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const repos = await getRepositories();

  if (request.method === "GET") {
    if (session.principal.roles.includes("agent_bo")) {
      return jsonResponse({ appointments: await repos.appointments.listAll() });
    }

    if (session.principal.roles.includes("agent_fo")) {
      const user = await repos.users.findById(session.userId);
      if (!user?.agencyId) {
        return jsonResponse({ appointments: [] });
      }
      return jsonResponse({ appointments: await repos.appointments.listForAgency(user.agencyId) });
    }

    return jsonResponse({ appointments: await repos.appointments.listForClient(session.userId) });
  }

  if (request.method === "POST") {
    const payload = await readJson<CreateAppointmentPayload>(request);
    const clientUserId =
      session.principal.roles.includes("agent_fo") || session.principal.roles.includes("agent_bo")
        ? assertString(payload.clientUserId, "clientUserId")
        : session.userId;

    const appointment = await createAppointment(repos, session, {
      clientUserId,
      agencyId: assertString(payload.agencyId, "agencyId"),
      vehicleId: assertString(payload.vehicleId, "vehicleId"),
      startsAt: assertString(payload.startsAt, "startsAt"),
      notes: payload.notes ?? null,
    });

    return jsonResponse({ appointment }, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleAppointmentStatus(request: Request, appointmentId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  requireStaff(session);
  const payload = await readJson<UpdateAppointmentStatusPayload>(request);
  const status = assertString(payload.status, "status") as StatutRDV;
  const repos = await getRepositories();
  const appointment = await repos.appointments.updateStatus(appointmentId, status);
  return jsonResponse({ appointment });
}

async function handleVehicles(request: Request): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const repos = await getRepositories();

  if (request.method === "GET") {
    if (session.principal.roles.includes("agent_bo") || session.principal.roles.includes("agent_fo")) {
      return jsonResponse({ vehicles: await repos.vehicles.listAll() });
    }
    return jsonResponse({ vehicles: await repos.vehicles.listByOwner(session.userId) });
  }

  if (request.method === "POST") {
    const payload = await readJson<CreateVehiclePayload>(request);
    const ownerUserId =
      session.principal.roles.includes("agent_fo") || session.principal.roles.includes("agent_bo")
        ? assertString(payload.ownerUserId, "ownerUserId")
        : session.userId;

    const vehicle = await repos.vehicles.create({
      ownerUserId,
      plateNumber: assertString(payload.plateNumber, "plateNumber"),
      brand: assertString(payload.brand, "brand"),
      model: assertString(payload.model, "model"),
      year: assertNumber(payload.year, "year"),
      isPrimary: Boolean(payload.isPrimary),
    });

    return jsonResponse({ vehicle }, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleComplaints(request: Request): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const repos = await getRepositories();

  if (request.method === "GET") {
    if (session.principal.roles.includes("agent_bo")) {
      return jsonResponse({ complaints: await repos.complaints.listAll() });
    }

    if (session.principal.roles.includes("agent_fo")) {
      const user = await repos.users.findById(session.userId);
      if (!user?.agencyId) {
        return jsonResponse({ complaints: [] });
      }
      return jsonResponse({ complaints: await repos.complaints.listForAgency(user.agencyId) });
    }

    return jsonResponse({ complaints: await repos.complaints.listForClient(session.userId) });
  }

  if (request.method === "POST") {
    const payload = await readJson<CreateComplaintPayload>(request);
    const clientUserId =
      session.principal.roles.includes("agent_fo") || session.principal.roles.includes("agent_bo")
        ? assertString(payload.clientUserId, "clientUserId")
        : session.userId;

    const complaint = await repos.complaints.create({
      clientUserId,
      appointmentId: payload.appointmentId ?? null,
      description: assertString(payload.description, "description"),
    });

    return jsonResponse({ complaint }, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleComplaintUpdate(request: Request, complaintId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  requireStaff(session);
  const payload = await readJson<UpdateComplaintPayload>(request);
  const repos = await getRepositories();

  if (!session.principal.roles.includes("agent_bo")) {
    const user = await repos.users.findById(session.userId);
    const complaint = await repos.complaints.findById(complaintId);
    if (!user?.agencyId || !complaint?.appointmentId) {
      throw new Response("Forbidden", { status: 403 });
    }

    const appointment = await repos.appointments.findById(complaint.appointmentId);
    if (!appointment || appointment.agencyId !== user.agencyId) {
      throw new Response("Forbidden", { status: 403 });
    }
  }

  const complaint = await repos.complaints.updateStatus(complaintId, {
    status: assertString(payload.status, "status") as StatutReclamation,
    resolution: payload.resolution ?? null,
  });
  return jsonResponse({ complaint });
}

async function handleNotifications(request: Request): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const repos = await getRepositories();

  if (request.method === "GET") {
    return jsonResponse({ notifications: await repos.notifications.listForUser(session.userId) });
  }

  if (request.method === "POST") {
    await repos.notifications.markAllRead(session.userId);
    return jsonResponse({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleAdminSeed(request: Request): Promise<Response> {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    const session = await requireSessionFromRequest(request);
    requireBackOffice(session);
  }

  const config = getBackendConfig();
  if (authorization && (!config.seedToken || authorization !== `Bearer ${config.seedToken}`)) {
    throw new Response("Forbidden", { status: 403 });
  }

  const result = await seedDefaultData(config.mongo);
  return jsonResponse({ ok: true, inserted: result });
}

export async function handleAppRoute(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);

  if (url.pathname === "/api/admin/seed" && request.method === "POST") {
    return handleAdminSeed(request);
  }

  if (url.pathname === "/api/agencies" && (request.method === "GET" || request.method === "POST")) {
    return handleAgencies(request);
  }

  const agencyMatch = url.pathname.match(/^\/api\/agencies\/([^/]+)$/);
  if (agencyMatch && request.method === "PATCH") {
    return handleAgencyUpdate(request, agencyMatch[1]);
  }

  if (url.pathname === "/api/clients" && request.method === "GET") {
    return handleClients(request);
  }

  if (url.pathname === "/api/users" && request.method === "GET") {
    return handleUsers(request);
  }

  const userMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (userMatch && request.method === "PATCH") {
    return handleUserUpdate(request, userMatch[1]);
  }

  if (url.pathname === "/api/appointments" && (request.method === "GET" || request.method === "POST")) {
    return handleAppointments(request);
  }

  const appointmentStatusMatch = url.pathname.match(/^\/api\/appointments\/([^/]+)\/status$/);
  if (appointmentStatusMatch && request.method === "PATCH") {
    return handleAppointmentStatus(request, appointmentStatusMatch[1]);
  }

  if (url.pathname === "/api/vehicles" && (request.method === "GET" || request.method === "POST")) {
    return handleVehicles(request);
  }

  if (url.pathname === "/api/complaints" && (request.method === "GET" || request.method === "POST")) {
    return handleComplaints(request);
  }

  const complaintMatch = url.pathname.match(/^\/api\/complaints\/([^/]+)$/);
  if (complaintMatch && request.method === "PATCH") {
    return handleComplaintUpdate(request, complaintMatch[1]);
  }

  if (url.pathname === "/api/notifications" && (request.method === "GET" || request.method === "POST")) {
    return handleNotifications(request);
  }

  return undefined;
}
