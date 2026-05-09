export const COLLECTIONS = {
  users: "users",
  agencies: "agencies",
  vehicles: "vehicles",
  appointments: "appointments",
  complaints: "complaints",
  notifications: "notifications",
  auditEvents: "audit_events",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

