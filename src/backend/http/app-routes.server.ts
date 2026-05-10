import { getBackendConfig } from "@/backend/config";
import { getBackendRepositories, seedDefaultData } from "@/backend/db/mongo.server";
import { createAppointment } from "@/backend/services/appointments";
import { extractPlateText } from "@/backend/services/ocrService";
import { requireSessionFromRequest } from "@/backend/auth/request-session.server";
import { jsonResponse } from "@/backend/http/json";
import type { AppSession } from "@/backend/auth/session";
import type { AppRole } from "@/types";
import { z, type ZodType } from "zod";

// ---------------------------------------------------------------------------
// Zod Schemas — replace the old manual interfaces + assert helpers
// ---------------------------------------------------------------------------

const appRoleSchema = z.enum(["client", "agent_front_office", "agent_back_office"]);
const tunisianPlateSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^\d{1,3}\s?TN\s?\d{1,4}$/.test(value), "Invalid Tunisian plate");
const servicesSelectionnesSchema = z.array(z.string()).min(1, "Sélectionnez au moins un service");

const CreateAppointmentSchema = z.object({
  clientUserId: z.string().min(1, "clientUserId is required").optional(),
  agencyId: z.string().min(1, "agencyId is required"),
  vehicleId: z.string().min(1, "vehicleId is required"),
  startsAt: z.string().min(1, "startsAt is required"),
  servicesSelectionnes: servicesSelectionnesSchema,
  notesLibres: z.string().max(500).nullable().optional(),
});

const CreateVehicleSchema = z.object({
  ownerUserId: z.string().min(1, "ownerUserId is required").optional(),
  plateNumber: tunisianPlateSchema,
  brand: z.string().min(1, "brand is required").default("Renault"),
  model: z.string().min(1, "model is required"),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  isPrimary: z.boolean().default(false),
});

const UpdateVehicleSchema = CreateVehicleSchema.omit({ ownerUserId: true }).partial();

const ModifyAppointmentSchema = z.object({
  startsAt: z.string().min(1).optional(),
  servicesSelectionnes: servicesSelectionnesSchema.optional(),
  notesLibres: z.string().max(500).nullable().optional(),
});

const CreateComplaintSchema = z.object({
  clientUserId: z.string().min(1, "clientUserId is required").optional(),
  appointmentId: z.string().nullable().optional(),
  description: z.string().min(1, "description is required"),
});

const UpdateComplaintSchema = z.object({
  status: z.enum(["Ouverte", "EnCours", "Resolue", "Escaladee"]),
  resolution: z.string().nullable().optional(),
});

const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(["EnAttente", "Confirme", "Annule", "Termine"]),
});

const UpdateUserSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  roles: z.array(appRoleSchema).min(1).optional(),
  agencyId: z.string().nullable().optional(),
});

const AgencySchema = z.object({
  name: z.string().min(1, "name is required"),
  city: z.string().min(1, "city is required"),
  address: z.string().min(1, "address is required"),
  phone: z.string().min(1, "phone is required"),
  location: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
});

const AgencyPatchSchema = AgencySchema.partial();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function parsePayload<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new Response("Invalid JSON", { status: 400 });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Response(
      JSON.stringify({ error: "Validation failed", issues: result.error.flatten().fieldErrors }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }
  return result.data;
}

function requireStaff(session: AppSession): void {
  if (
    !session.principal.roles.includes("agent_front_office") &&
    !session.principal.roles.includes("agent_back_office")
  ) {
    throw new Response("Forbidden", { status: 403 });
  }
}

function requireBackOffice(session: AppSession): void {
  if (!session.principal.roles.includes("agent_back_office")) {
    throw new Response("Forbidden", { status: 403 });
  }
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
    const payload = await parsePayload(request, AgencySchema);
    const agency = await repos.agencies.create({
      name: payload.name,
      city: payload.city,
      address: payload.address,
      phone: payload.phone,
      location: payload.location ?? null,
    });
    return jsonResponse({ agency }, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleAgencyUpdate(request: Request, agencyId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  requireBackOffice(session);
  const patch = await parsePayload(request, AgencyPatchSchema);
  const repos = await getRepositories();

  const agency = await repos.agencies.update(agencyId, {
    ...patch,
    location: patch.location ?? null,
  });
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
  const payload = await parsePayload(request, UpdateUserSchema);
  const repos = await getRepositories();
  const patch: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    roles?: AppRole[];
    agencyId?: string | null;
  } = {};
  if ("firstName" in payload) patch.firstName = payload.firstName ?? null;
  if ("lastName" in payload) patch.lastName = payload.lastName ?? null;
  if ("phone" in payload) patch.phone = payload.phone ?? null;
  if (payload.roles) {
    patch.roles = payload.roles;
    patch.agencyId = payload.roles.includes("agent_front_office") ? (payload.agencyId ?? null) : null;
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
    if (session.principal.roles.includes("agent_back_office")) {
      return jsonResponse({ appointments: await repos.appointments.listAll() });
    }

    if (session.principal.roles.includes("agent_front_office")) {
      const user = await repos.users.findById(session.userId);
      if (!user?.agencyId) {
        return jsonResponse({ appointments: [] });
      }
      return jsonResponse({ appointments: await repos.appointments.listForAgency(user.agencyId) });
    }

    return jsonResponse({ appointments: await repos.appointments.listForClient(session.userId) });
  }

  if (request.method === "POST") {
    const payload = await parsePayload(request, CreateAppointmentSchema);
    const clientUserId =
      session.principal.roles.includes("agent_front_office") || session.principal.roles.includes("agent_back_office")
        ? (payload.clientUserId ??
          (() => {
            throw new Response("Missing field: clientUserId", { status: 400 });
          })())
        : session.userId;

    const appointment = await createAppointment(repos, session, {
      clientUserId,
      agencyId: payload.agencyId,
      vehicleId: payload.vehicleId,
      startsAt: payload.startsAt,
      servicesSelectionnes: payload.servicesSelectionnes,
      notesLibres: payload.notesLibres ?? null,
    });

    return jsonResponse({ appointment }, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleAppointmentStatus(request: Request, appointmentId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  requireStaff(session);
  const payload = await parsePayload(request, UpdateAppointmentStatusSchema);
  const repos = await getRepositories();
  const appointment = await repos.appointments.updateStatus(appointmentId, payload.status);
  return jsonResponse({ appointment });
}

async function handleAppointmentCancel(request: Request, appointmentId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const repos = await getRepositories();
  const isStaff =
    session.principal.roles.includes("agent_front_office") ||
    session.principal.roles.includes("agent_back_office");
  const appointment = await repos.appointments.cancel(appointmentId, session.userId, isStaff);
  return jsonResponse({ appointment });
}

async function handleAppointmentModify(request: Request, appointmentId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const payload = await parsePayload(request, ModifyAppointmentSchema);
  const repos = await getRepositories();
  const isStaff =
    session.principal.roles.includes("agent_front_office") ||
    session.principal.roles.includes("agent_back_office");
  const appointment = await repos.appointments.modify(appointmentId, session.userId, isStaff, {
    startsAt: payload.startsAt,
    servicesSelectionnes: payload.servicesSelectionnes,
    notesLibres: payload.notesLibres,
  });
  return jsonResponse({ appointment });
}

async function handleVehicles(request: Request, onlyMine = false): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const repos = await getRepositories();

  if (request.method === "GET") {
    if (
      !onlyMine &&
      (session.principal.roles.includes("agent_back_office") ||
        session.principal.roles.includes("agent_front_office"))
    ) {
      return jsonResponse({ vehicles: await repos.vehicles.listAll() });
    }
    return jsonResponse({ vehicles: await repos.vehicles.listByOwner(session.userId) });
  }

  if (request.method === "POST") {
    const payload = await parsePayload(request, CreateVehicleSchema);
    const ownerUserId =
      session.principal.roles.includes("agent_front_office") || session.principal.roles.includes("agent_back_office")
        ? (payload.ownerUserId ??
          (() => {
            throw new Response("Missing field: ownerUserId", { status: 400 });
          })())
        : session.userId;

    const vehicle = await repos.vehicles.create({
      ownerUserId,
      plateNumber: payload.plateNumber,
      brand: payload.brand ?? "Renault",
      model: payload.model,
      year: payload.year,
      isPrimary: payload.isPrimary ?? false,
    });

    return jsonResponse({ vehicle }, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleVehicleUpdate(request: Request, vehicleId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const payload = await parsePayload(request, UpdateVehicleSchema);
  const repos = await getRepositories();
  const vehicle = await repos.vehicles.update(vehicleId, session.userId, {
    plateNumber: payload.plateNumber,
    brand: payload.brand,
    model: payload.model,
    year: payload.year,
    isPrimary: payload.isPrimary,
  });
  return jsonResponse({ vehicle });
}

async function handleVehicleDelete(request: Request, vehicleId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const repos = await getRepositories();
  await repos.vehicles.delete(vehicleId, session.userId);
  await repos.appointments.markVehicleDeleted(vehicleId);
  return jsonResponse({ ok: true });
}

async function handleComplaints(request: Request): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  const repos = await getRepositories();

  if (request.method === "GET") {
    if (session.principal.roles.includes("agent_back_office")) {
      return jsonResponse({ complaints: await repos.complaints.listAll() });
    }

    if (session.principal.roles.includes("agent_front_office")) {
      const user = await repos.users.findById(session.userId);
      if (!user?.agencyId) {
        return jsonResponse({ complaints: [] });
      }
      return jsonResponse({ complaints: await repos.complaints.listForAgency(user.agencyId) });
    }

    return jsonResponse({ complaints: await repos.complaints.listForClient(session.userId) });
  }

  if (request.method === "POST") {
    const payload = await parsePayload(request, CreateComplaintSchema);
    const clientUserId =
      session.principal.roles.includes("agent_front_office") || session.principal.roles.includes("agent_back_office")
        ? (payload.clientUserId ??
          (() => {
            throw new Response("Missing field: clientUserId", { status: 400 });
          })())
        : session.userId;

    const complaint = await repos.complaints.create({
      clientUserId,
      appointmentId: payload.appointmentId ?? null,
      description: payload.description,
    });

    return jsonResponse({ complaint }, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
}

async function handleComplaintUpdate(request: Request, complaintId: string): Promise<Response> {
  const session = await requireSessionFromRequest(request);
  requireStaff(session);
  const payload = await parsePayload(request, UpdateComplaintSchema);
  const repos = await getRepositories();

  if (!session.principal.roles.includes("agent_back_office")) {
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
    status: payload.status,
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

async function handleOcrPlate(request: Request): Promise<Response> {
  await requireSessionFromRequest(request);
  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return jsonResponse({ code: "MISSING_IMAGE", message: "Image is required" }, { status: 400 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return jsonResponse({ code: "UNSUPPORTED_IMAGE", message: "Unsupported image type" }, { status: 415 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return jsonResponse({ code: "IMAGE_TOO_LARGE", message: "Image must be 5MB or less" }, { status: 413 });
  }

  const result = await extractPlateText(Buffer.from(await file.arrayBuffer()));
  if (result.confidence < 60 || result.normalized === null) {
    return jsonResponse(
      {
        code: "OCR_LOW_CONFIDENCE",
        message: "Plaque non reconnue. Veuillez saisir manuellement.",
        raw: result.text,
      },
      { status: 422 },
    );
  }
  return jsonResponse({ immatriculation: result.normalized, confidence: result.confidence });
}

export async function handleAppRoute(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);

  if (url.pathname === "/api/admin/seed" && request.method === "POST") {
    return handleAdminSeed(request);
  }

  if (url.pathname === "/api/ocr/plaque" && request.method === "POST") {
    return handleOcrPlate(request);
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

  if (
    (url.pathname === "/api/appointments" || url.pathname === "/api/rdv" || url.pathname === "/api/rdv/my") &&
    (request.method === "GET" || request.method === "POST")
  ) {
    return handleAppointments(request);
  }

  const appointmentStatusMatch = url.pathname.match(/^\/api\/appointments\/([^/]+)\/status$/);
  if (appointmentStatusMatch && request.method === "PATCH") {
    return handleAppointmentStatus(request, appointmentStatusMatch[1]);
  }

  const appointmentCancelMatch = url.pathname.match(/^\/api\/(?:appointments|rdv)\/([^/]+)\/annuler$/);
  if (appointmentCancelMatch && request.method === "PATCH") {
    return handleAppointmentCancel(request, appointmentCancelMatch[1]);
  }

  const appointmentModifyMatch = url.pathname.match(/^\/api\/(?:appointments|rdv)\/([^/]+)\/modifier$/);
  if (appointmentModifyMatch && request.method === "PATCH") {
    return handleAppointmentModify(request, appointmentModifyMatch[1]);
  }

  if (
    (url.pathname === "/api/vehicles" || url.pathname === "/api/vehicules" || url.pathname === "/api/vehicules/my") &&
    (request.method === "GET" || request.method === "POST")
  ) {
    return handleVehicles(request, url.pathname === "/api/vehicules/my");
  }

  const vehicleMatch = url.pathname.match(/^\/api\/(?:vehicles|vehicules)\/([^/]+)$/);
  if (vehicleMatch && request.method === "PUT") {
    return handleVehicleUpdate(request, vehicleMatch[1]);
  }
  if (vehicleMatch && request.method === "DELETE") {
    return handleVehicleDelete(request, vehicleMatch[1]);
  }

  if (
    url.pathname === "/api/complaints" &&
    (request.method === "GET" || request.method === "POST")
  ) {
    return handleComplaints(request);
  }

  const complaintMatch = url.pathname.match(/^\/api\/complaints\/([^/]+)$/);
  if (complaintMatch && request.method === "PATCH") {
    return handleComplaintUpdate(request, complaintMatch[1]);
  }

  if (
    url.pathname === "/api/notifications" &&
    (request.method === "GET" || request.method === "POST")
  ) {
    return handleNotifications(request);
  }

  return undefined;
}
