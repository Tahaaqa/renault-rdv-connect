import { MongoClient, ObjectId, type Collection, type Db } from "mongodb";

import type { MongoConfig } from "@/backend/config";
import { COLLECTIONS } from "@/backend/db/collections";
import type {
  BackendAgency,
  BackendAppointment,
  BackendComplaint,
  BackendNotification,
  BackendUser,
  BackendVehicle,
  EntityId,
} from "@/backend/domain";
import type {
  AgencyRepository,
  AppointmentRepository,
  BackendRepositories,
  ComplaintRepository,
  NotificationRepository,
  UserRepository,
  VehicleRepository,
} from "@/backend/repositories/contracts";
import type { AppRole, StatutRDV, StatutReclamation } from "@/types";
import {
  DEFAULT_AGENCIES,
  DEFAULT_USERS,
  DEFAULT_VEHICLES,
  DEFAULT_APPOINTMENTS,
  DEFAULT_COMPLAINTS,
  DEFAULT_NOTIFICATIONS,
} from "@/backend/db/seed";

interface MongoAuditFields {
  createdAt: Date;
  updatedAt: Date;
}

interface MongoUser extends MongoAuditFields {
  _id: ObjectId;
  keycloakSubject: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  roles: AppRole[];
  agencyId: ObjectId | null;
}

interface MongoAgency extends MongoAuditFields {
  _id: ObjectId;
  name: string;
  city: string;
  address: string;
  phone: string;
  location: { lat: number; lng: number } | null;
}

interface MongoVehicle extends MongoAuditFields {
  _id: ObjectId;
  ownerUserId: ObjectId;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  isPrimary: boolean;
}

interface MongoAppointment extends MongoAuditFields {
  _id: ObjectId;
  reference: string;
  clientUserId: ObjectId;
  agencyId: ObjectId;
  vehicleId: ObjectId;
  startsAt: Date;
  status: StatutRDV;
  servicesSelectionnes: string[];
  notesLibres: string | null;
  createdByUserId: ObjectId | null;
}

interface MongoComplaint extends MongoAuditFields {
  _id: ObjectId;
  clientUserId: ObjectId;
  appointmentId: ObjectId | null;
  description: string;
  status: StatutReclamation;
  resolution: string | null;
}

interface MongoNotification extends MongoAuditFields {
  _id: ObjectId;
  userId: ObjectId;
  type: BackendNotification["type"];
  message: string;
  read: boolean;
}

let clientPromise: Promise<MongoClient> | undefined;
let cachedRepositories: BackendRepositories | undefined;

function toObjectId(id: EntityId): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Response("Invalid id", { status: 400 });
  }
  return new ObjectId(id);
}

function toNullableObjectId(id: EntityId | null | undefined): ObjectId | null {
  if (!id) return null;
  return toObjectId(id);
}

function dateToIso(date: Date): string {
  return date.toISOString();
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function userToDomain(user: MongoUser): BackendUser {
  return {
    id: user._id.toHexString(),
    keycloakSubject: user.keycloakSubject,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    roles: user.roles,
    agencyId: user.agencyId?.toHexString() ?? null,
    createdAt: dateToIso(user.createdAt),
    updatedAt: dateToIso(user.updatedAt),
  };
}

function agencyToDomain(agency: MongoAgency): BackendAgency {
  return {
    id: agency._id.toHexString(),
    name: agency.name,
    city: agency.city,
    address: agency.address,
    phone: agency.phone,
    location: agency.location,
    createdAt: dateToIso(agency.createdAt),
    updatedAt: dateToIso(agency.updatedAt),
  };
}

function vehicleToDomain(vehicle: MongoVehicle): BackendVehicle {
  return {
    id: vehicle._id.toHexString(),
    ownerUserId: vehicle.ownerUserId.toHexString(),
    plateNumber: vehicle.plateNumber,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    isPrimary: vehicle.isPrimary,
    createdAt: dateToIso(vehicle.createdAt),
    updatedAt: dateToIso(vehicle.updatedAt),
  };
}

function appointmentToDomain(appointment: MongoAppointment): BackendAppointment {
  return {
    id: appointment._id.toHexString(),
    reference: appointment.reference,
    clientUserId: appointment.clientUserId.toHexString(),
    agencyId: appointment.agencyId.toHexString(),
    vehicleId: appointment.vehicleId.toHexString(),
    startsAt: dateToIso(appointment.startsAt),
    status: appointment.status,
    servicesSelectionnes: appointment.servicesSelectionnes ?? [],
    notesLibres: appointment.notesLibres ?? null,
    createdByUserId: appointment.createdByUserId?.toHexString() ?? null,
    createdAt: dateToIso(appointment.createdAt),
    updatedAt: dateToIso(appointment.updatedAt),
  };
}

function complaintToDomain(complaint: MongoComplaint): BackendComplaint {
  return {
    id: complaint._id.toHexString(),
    clientUserId: complaint.clientUserId.toHexString(),
    appointmentId: complaint.appointmentId?.toHexString() ?? null,
    description: complaint.description,
    status: complaint.status,
    resolution: complaint.resolution,
    createdAt: dateToIso(complaint.createdAt),
    updatedAt: dateToIso(complaint.updatedAt),
  };
}

function notificationToDomain(notification: MongoNotification): BackendNotification {
  return {
    id: notification._id.toHexString(),
    userId: notification.userId.toHexString(),
    type: notification.type,
    message: notification.message,
    read: notification.read,
    createdAt: dateToIso(notification.createdAt),
    updatedAt: dateToIso(notification.updatedAt),
  };
}

async function getMongoClient(config: MongoConfig): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = new MongoClient(config.uri).connect();
  }
  return clientPromise;
}

async function getDb(config: MongoConfig): Promise<Db> {
  const client = await getMongoClient(config);
  return client.db(config.databaseName);
}

function buildUserRepository(collection: Collection<MongoUser>): UserRepository {
  return {
    async findById(id) {
      const user = await collection.findOne({ _id: toObjectId(id) });
      return user ? userToDomain(user) : null;
    },
    async findByKeycloakSubject(subject) {
      const user = await collection.findOne({ keycloakSubject: subject });
      return user ? userToDomain(user) : null;
    },
    async listAll() {
      return (await collection.find().sort({ lastName: 1, firstName: 1, email: 1 }).toArray()).map(
        userToDomain,
      );
    },
    async listClients() {
      return (
        await collection
          .find({ roles: "client" })
          .sort({ lastName: 1, firstName: 1, email: 1 })
          .toArray()
      ).map(userToDomain);
    },
    async updateProfile(id, patch) {
      const $set: Partial<MongoUser> = { updatedAt: new Date() };

      if ("firstName" in patch) $set.firstName = patch.firstName ?? null;
      if ("lastName" in patch) $set.lastName = patch.lastName ?? null;
      if ("phone" in patch) $set.phone = patch.phone ?? null;
      if ("roles" in patch && patch.roles) $set.roles = patch.roles;
      if ("agencyId" in patch) $set.agencyId = toNullableObjectId(patch.agencyId);

      const updated = await collection.findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set },
        { returnDocument: "after" },
      );
      if (!updated) {
        throw new Response("User not found", { status: 404 });
      }
      return userToDomain(updated);
    },
    async upsertFromIdentity(input) {
      const now = new Date();
      const email = input.email ?? "";

      await collection.updateOne(
        { keycloakSubject: input.keycloakSubject },
        {
          $set: {
            email,
            firstName: input.firstName,
            lastName: input.lastName,
            updatedAt: now,
          },
          $setOnInsert: {
            _id: new ObjectId(),
            keycloakSubject: input.keycloakSubject,
            phone: null,
            roles: [],
            agencyId: null,
            createdAt: now,
          },
        },
        { upsert: true },
      );

      const user = await collection.findOne({ keycloakSubject: input.keycloakSubject });
      if (!user) {
        throw new Response("User upsert failed", { status: 500 });
      }
      return userToDomain(user);
    },
  };
}

function buildAgencyRepository(collection: Collection<MongoAgency>): AgencyRepository {
  return {
    async list() {
      return (await collection.find().sort({ city: 1, name: 1 }).toArray()).map(agencyToDomain);
    },
    async findById(id) {
      const agency = await collection.findOne({ _id: toObjectId(id) });
      return agency ? agencyToDomain(agency) : null;
    },
    async create(input) {
      const now = new Date();
      const document: MongoAgency = {
        _id: new ObjectId(),
        name: input.name,
        city: input.city,
        address: input.address,
        phone: input.phone,
        location: input.location,
        createdAt: now,
        updatedAt: now,
      };
      await collection.insertOne(document);
      return agencyToDomain(document);
    },
    async update(id, patch) {
      const $set: Partial<MongoAgency> = { updatedAt: new Date() };
      if ("name" in patch) $set.name = patch.name;
      if ("city" in patch) $set.city = patch.city;
      if ("address" in patch) $set.address = patch.address;
      if ("phone" in patch) $set.phone = patch.phone;
      if ("location" in patch) $set.location = patch.location ?? null;

      const updated = await collection.findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set },
        { returnDocument: "after" },
      );
      if (!updated) {
        throw new Response("Agency not found", { status: 404 });
      }
      return agencyToDomain(updated);
    },
  };
}

function buildVehicleRepository(collection: Collection<MongoVehicle>): VehicleRepository {
  return {
    async listByOwner(ownerUserId) {
      return (
        await collection
          .find({ ownerUserId: toObjectId(ownerUserId) })
          .sort({ createdAt: -1 })
          .toArray()
      ).map(vehicleToDomain);
    },
    async listAll() {
      return (await collection.find().sort({ createdAt: -1 }).toArray()).map(vehicleToDomain);
    },
    async findById(id) {
      const vehicle = await collection.findOne({ _id: toObjectId(id) });
      return vehicle ? vehicleToDomain(vehicle) : null;
    },
    async create(input) {
      const now = new Date();
      const plateNumber = input.plateNumber.toUpperCase().trim();
      const document: MongoVehicle = {
        _id: new ObjectId(),
        ownerUserId: toObjectId(input.ownerUserId),
        plateNumber,
        brand: input.brand,
        model: input.model,
        year: input.year,
        isPrimary: input.isPrimary,
        createdAt: now,
        updatedAt: now,
      };
      await collection.insertOne(document);
      return vehicleToDomain(document);
    },
    async update(id, ownerUserId, patch) {
      const $set: Partial<MongoVehicle> = { updatedAt: new Date() };
      if ("plateNumber" in patch && patch.plateNumber) {
        $set.plateNumber = patch.plateNumber.toUpperCase().trim();
      }
      if ("brand" in patch && patch.brand) $set.brand = patch.brand;
      if ("model" in patch && patch.model) $set.model = patch.model;
      if ("year" in patch && patch.year) $set.year = patch.year;
      if ("isPrimary" in patch && patch.isPrimary !== undefined) $set.isPrimary = patch.isPrimary;

      const updated = await collection.findOneAndUpdate(
        { _id: toObjectId(id), ownerUserId: toObjectId(ownerUserId) },
        { $set },
        { returnDocument: "after" },
      );
      if (!updated) throw new Response("Vehicle not found", { status: 404 });
      return vehicleToDomain(updated);
    },
    async delete(id, ownerUserId) {
      const result = await collection.deleteOne({
        _id: toObjectId(id),
        ownerUserId: toObjectId(ownerUserId),
      });
      if (result.deletedCount === 0) throw new Response("Vehicle not found", { status: 404 });
    },
  };
}

function buildAppointmentRepository(
  collection: Collection<MongoAppointment>,
): AppointmentRepository {
  const sortByDate = { startsAt: 1 as const };

  return {
    async findById(id) {
      const appointment = await collection.findOne({ _id: toObjectId(id) });
      return appointment ? appointmentToDomain(appointment) : null;
    },
    async listForClient(clientUserId) {
      return (
        await collection
          .find({ clientUserId: toObjectId(clientUserId) })
          .sort(sortByDate)
          .toArray()
      ).map(appointmentToDomain);
    },
    async listForAgency(agencyId) {
      return (
        await collection
          .find({ agencyId: toObjectId(agencyId) })
          .sort(sortByDate)
          .toArray()
      ).map(appointmentToDomain);
    },
    async listAll() {
      return (await collection.find().sort(sortByDate).toArray()).map(appointmentToDomain);
    },
    async create(input) {
      const now = new Date();
      const count = await collection.countDocuments();
      const document: MongoAppointment = {
        _id: new ObjectId(),
        reference: `RDV-${now.getFullYear()}-${String(count + 1).padStart(5, "0")}`,
        clientUserId: toObjectId(input.clientUserId),
        agencyId: toObjectId(input.agencyId),
        vehicleId: toObjectId(input.vehicleId),
        startsAt: new Date(input.startsAt),
        status: input.status,
        servicesSelectionnes: input.servicesSelectionnes,
        notesLibres: input.notesLibres,
        createdByUserId: input.createdByUserId ? toObjectId(input.createdByUserId) : null,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await collection.insertOne(document);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new Response(
            JSON.stringify({
              status: "error",
              code: "CRENEAU_UNAVAILABLE",
              message: "Ce créneau vient d'être réservé. Veuillez en choisir un autre.",
            }),
            { status: 409, headers: { "content-type": "application/json" } },
          );
        }
        throw error;
      }
      return appointmentToDomain(document);
    },
    async updateStatus(id, status) {
      const updated = await collection.findOneAndUpdate(
        { _id: toObjectId(id) },
        { $set: { status, updatedAt: new Date() } },
        { returnDocument: "after" },
      );
      if (!updated) {
        throw new Response("Appointment not found", { status: 404 });
      }
      return appointmentToDomain(updated);
    },
    async cancel(id, actorUserId, isStaff) {
      const appointment = await collection.findOne({ _id: toObjectId(id) });
      if (!appointment) throw new Response("Appointment not found", { status: 404 });
      if (!isStaff && !appointment.clientUserId.equals(toObjectId(actorUserId))) {
        throw new Response("Forbidden", { status: 403 });
      }
      if (appointment.status !== "EnAttente" && appointment.status !== "Confirme") {
        throw new Response("Appointment cannot be cancelled", { status: 400 });
      }
      if (appointment.startsAt.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
        throw new Response(
          JSON.stringify({
            code: "TOO_LATE_TO_CANCEL",
            message: "Annulation impossible moins de 24h avant le RDV.",
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
      const updated = await collection.findOneAndUpdate(
        { _id: appointment._id },
        { $set: { status: "Annule", updatedAt: new Date() } },
        { returnDocument: "after" },
      );
      if (!updated) throw new Response("Appointment not found", { status: 404 });
      return appointmentToDomain(updated);
    },
    async modify(id, actorUserId, isStaff, patch) {
      const appointment = await collection.findOne({ _id: toObjectId(id) });
      if (!appointment) throw new Response("Appointment not found", { status: 404 });
      if (!isStaff && !appointment.clientUserId.equals(toObjectId(actorUserId))) {
        throw new Response("Forbidden", { status: 403 });
      }
      if (appointment.status !== "EnAttente") {
        throw new Response("Only pending appointments can be modified", { status: 400 });
      }

      const $set: Partial<MongoAppointment> = { updatedAt: new Date() };
      if (patch.startsAt) $set.startsAt = new Date(patch.startsAt);
      if (patch.servicesSelectionnes) $set.servicesSelectionnes = patch.servicesSelectionnes;
      if ("notesLibres" in patch) $set.notesLibres = patch.notesLibres ?? null;

      try {
        const updated = await collection.findOneAndUpdate(
          { _id: appointment._id },
          { $set },
          { returnDocument: "after" },
        );
        if (!updated) throw new Response("Appointment not found", { status: 404 });
        return appointmentToDomain(updated);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new Response(
            JSON.stringify({
              status: "error",
              code: "CRENEAU_UNAVAILABLE",
              message: "Ce créneau vient d'être réservé. Veuillez en choisir un autre.",
            }),
            { status: 409, headers: { "content-type": "application/json" } },
          );
        }
        throw error;
      }
    },
    async markVehicleDeleted(vehicleId) {
      await collection.updateMany(
        { vehicleId: toObjectId(vehicleId) },
        {
          $addToSet: { servicesSelectionnes: "Autre" },
          $set: { notesLibres: "véhicule supprimé", updatedAt: new Date() },
        },
      );
    },
  };
}

function buildComplaintRepository(
  collection: Collection<MongoComplaint>,
  appointments: Collection<MongoAppointment>,
): ComplaintRepository {
  return {
    async findById(id) {
      const complaint = await collection.findOne({ _id: toObjectId(id) });
      return complaint ? complaintToDomain(complaint) : null;
    },
    async listForClient(clientUserId) {
      return (
        await collection
          .find({ clientUserId: toObjectId(clientUserId) })
          .sort({ createdAt: -1 })
          .toArray()
      ).map(complaintToDomain);
    },
    async listForAgency(agencyId) {
      const agencyAppointmentIds = await appointments
        .find({ agencyId: toObjectId(agencyId) }, { projection: { _id: 1 } })
        .map((appointment) => appointment._id)
        .toArray();

      if (agencyAppointmentIds.length === 0) return [];

      return (
        await collection
          .find({ appointmentId: { $in: agencyAppointmentIds } })
          .sort({ createdAt: -1 })
          .toArray()
      ).map(complaintToDomain);
    },
    async listAll() {
      return (await collection.find().sort({ createdAt: -1 }).toArray()).map(complaintToDomain);
    },
    async create(input) {
      const now = new Date();
      const document: MongoComplaint = {
        _id: new ObjectId(),
        clientUserId: toObjectId(input.clientUserId),
        appointmentId: input.appointmentId ? toObjectId(input.appointmentId) : null,
        description: input.description,
        status: "Ouverte",
        resolution: null,
        createdAt: now,
        updatedAt: now,
      };
      await collection.insertOne(document);
      return complaintToDomain(document);
    },
    async updateStatus(id, patch) {
      const updated = await collection.findOneAndUpdate(
        { _id: toObjectId(id) },
        {
          $set: {
            status: patch.status,
            resolution: patch.resolution ?? null,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      );
      if (!updated) {
        throw new Response("Complaint not found", { status: 404 });
      }
      return complaintToDomain(updated);
    },
  };
}

function buildNotificationRepository(
  collection: Collection<MongoNotification>,
): NotificationRepository {
  return {
    async listForUser(userId) {
      return (
        await collection
          .find({ userId: toObjectId(userId) })
          .sort({ createdAt: -1 })
          .toArray()
      ).map(notificationToDomain);
    },
    async markAllRead(userId) {
      await collection.updateMany(
        { userId: toObjectId(userId), read: false },
        { $set: { read: true, updatedAt: new Date() } },
      );
    },
  };
}

export async function ensureMongoIndexes(config: MongoConfig): Promise<void> {
  const db = await getDb(config);

  await Promise.all([
    db.collection(COLLECTIONS.users).createIndex({ keycloakSubject: 1 }, { unique: true }),
    db.collection(COLLECTIONS.users).createIndex({ email: 1 }),
    db.collection(COLLECTIONS.agencies).createIndex({ name: 1, city: 1 }, { unique: true }),
    db.collection(COLLECTIONS.vehicles).createIndex({ ownerUserId: 1 }),
    db.collection(COLLECTIONS.vehicles).createIndex({ plateNumber: 1 }),
    db.collection(COLLECTIONS.appointments).createIndex({ clientUserId: 1, startsAt: -1 }),
    db.collection(COLLECTIONS.appointments).createIndex({ agencyId: 1, startsAt: -1 }),
    db
      .collection(COLLECTIONS.appointments)
      .createIndex(
        { agencyId: 1, startsAt: 1, status: 1 },
        {
          unique: true,
          partialFilterExpression: { status: { $in: ["EnAttente", "Confirme"] } },
        },
      ),
    db.collection(COLLECTIONS.appointments).createIndex({ reference: 1 }, { unique: true }),
    db.collection(COLLECTIONS.complaints).createIndex({ clientUserId: 1, createdAt: -1 }),
    db.collection(COLLECTIONS.complaints).createIndex({ appointmentId: 1, createdAt: -1 }),
    db.collection(COLLECTIONS.notifications).createIndex({ userId: 1, createdAt: -1 }),
  ]);
}

export async function seedDefaultData(config: MongoConfig): Promise<{
  agencies: number;
  users: number;
  vehicles: number;
  appointments: number;
  complaints: number;
  notifications: number;
}> {
  await ensureMongoIndexes(config);
  const db = await getDb(config);
  const now = new Date();

  const agenciesCol = db.collection<MongoAgency>(COLLECTIONS.agencies);
  const usersCol = db.collection<MongoUser>(COLLECTIONS.users);
  const vehiclesCol = db.collection<MongoVehicle>(COLLECTIONS.vehicles);
  const appointmentsCol = db.collection<MongoAppointment>(COLLECTIONS.appointments);
  const complaintsCol = db.collection<MongoComplaint>(COLLECTIONS.complaints);
  const notificationsCol = db.collection<MongoNotification>(COLLECTIONS.notifications);

  // --- Agencies ---
  const agencyIds: ObjectId[] = [];
  let insertedAgencies = 0;
  for (const agency of DEFAULT_AGENCIES) {
    const existing = await agenciesCol.findOne({ name: agency.name, city: agency.city });
    if (existing) {
      if (!existing.location && "location" in agency) {
        await agenciesCol.updateOne(
          { _id: existing._id },
          { $set: { location: agency.location, updatedAt: now } },
        );
      }
      agencyIds.push(existing._id);
    } else {
      const _id = new ObjectId();
      await agenciesCol.insertOne({
        _id,
        name: agency.name,
        city: agency.city,
        address: agency.address,
        phone: agency.phone,
        location: agency.location ?? null,
        createdAt: now,
        updatedAt: now,
      });
      agencyIds.push(_id);
      insertedAgencies++;
    }
  }

  // --- Users ---
  const userIds: ObjectId[] = [];
  let insertedUsers = 0;
  for (const user of DEFAULT_USERS) {
    const existing = await usersCol.findOne({ keycloakSubject: user.keycloakSubject });
    if (existing) {
      userIds.push(existing._id);
    } else {
      const _id = new ObjectId();
      await usersCol.insertOne({
        _id,
        keycloakSubject: user.keycloakSubject,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles: user.roles,
        agencyId: user.roles.includes("agent_front_office") ? agencyIds[0] : null,
        createdAt: now,
        updatedAt: now,
      });
      userIds.push(_id);
      insertedUsers++;
    }
  }

  // --- Vehicles ---
  const vehicleIds: ObjectId[] = [];
  let insertedVehicles = 0;
  for (const v of DEFAULT_VEHICLES) {
    const existing = await vehiclesCol.findOne({ plateNumber: v.plateNumber });
    if (existing) {
      vehicleIds.push(existing._id);
    } else {
      const _id = new ObjectId();
      await vehiclesCol.insertOne({
        _id,
        ownerUserId: userIds[v.ownerIndex],
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
        year: v.year,
        isPrimary: v.isPrimary,
        createdAt: now,
        updatedAt: now,
      });
      vehicleIds.push(_id);
      insertedVehicles++;
    }
  }

  // --- Appointments ---
  const appointmentIds: ObjectId[] = [];
  let insertedAppointments = 0;
  const existingAppointmentCount = await appointmentsCol.countDocuments();
  if (existingAppointmentCount === 0) {
    for (let i = 0; i < DEFAULT_APPOINTMENTS.length; i++) {
      const appt = DEFAULT_APPOINTMENTS[i];
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + appt.dayOffset);
      startsAt.setHours(appt.hour, 0, 0, 0);

      const _id = new ObjectId();
      await appointmentsCol.insertOne({
        _id,
        reference: `RDV-${now.getFullYear()}-${String(i + 1).padStart(5, "0")}`,
        clientUserId: userIds[appt.clientIndex],
        agencyId: agencyIds[appt.agencyIndex],
        vehicleId: vehicleIds[appt.vehicleIndex],
        startsAt,
        status: appt.status,
        servicesSelectionnes: appt.servicesSelectionnes ?? ["Autre"],
        notesLibres: appt.notesLibres ?? null,
        createdByUserId: null,
        createdAt: now,
        updatedAt: now,
      });
      appointmentIds.push(_id);
      insertedAppointments++;
    }
  }

  // --- Complaints ---
  let insertedComplaints = 0;
  const existingComplaintCount = await complaintsCol.countDocuments();
  if (existingComplaintCount === 0) {
    for (const c of DEFAULT_COMPLAINTS) {
      await complaintsCol.insertOne({
        _id: new ObjectId(),
        clientUserId: userIds[c.clientIndex],
        appointmentId: c.appointmentIndex != null ? appointmentIds[c.appointmentIndex] : null,
        description: c.description,
        status: c.status,
        resolution: c.resolution ?? null,
        createdAt: now,
        updatedAt: now,
      });
      insertedComplaints++;
    }
  }

  // --- Notifications ---
  let insertedNotifications = 0;
  const existingNotificationCount = await notificationsCol.countDocuments();
  if (existingNotificationCount === 0) {
    for (const n of DEFAULT_NOTIFICATIONS) {
      await notificationsCol.insertOne({
        _id: new ObjectId(),
        userId: userIds[n.userIndex],
        type: n.type,
        message: n.message,
        read: n.read,
        createdAt: now,
        updatedAt: now,
      });
      insertedNotifications++;
    }
  }

  return {
    agencies: insertedAgencies,
    users: insertedUsers,
    vehicles: insertedVehicles,
    appointments: insertedAppointments,
    complaints: insertedComplaints,
    notifications: insertedNotifications,
  };
}

export async function getBackendRepositories(config: MongoConfig): Promise<BackendRepositories> {
  if (cachedRepositories) return cachedRepositories;

  const db = await getDb(config);
  const appointments = db.collection<MongoAppointment>(COLLECTIONS.appointments);

  cachedRepositories = {
    users: buildUserRepository(db.collection<MongoUser>(COLLECTIONS.users)),
    agencies: buildAgencyRepository(db.collection<MongoAgency>(COLLECTIONS.agencies)),
    vehicles: buildVehicleRepository(db.collection<MongoVehicle>(COLLECTIONS.vehicles)),
    appointments: buildAppointmentRepository(appointments),
    complaints: buildComplaintRepository(
      db.collection<MongoComplaint>(COLLECTIONS.complaints),
      appointments,
    ),
    notifications: buildNotificationRepository(
      db.collection<MongoNotification>(COLLECTIONS.notifications),
    ),
  };

  return cachedRepositories;
}
