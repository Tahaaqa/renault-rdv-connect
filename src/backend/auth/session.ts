import type { AppRole } from "@/types";

export interface AuthenticatedPrincipal {
  subject: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: AppRole[];
  rawClaims: Record<string, unknown>;
}

export interface AppSession {
  userId: string;
  principal: AuthenticatedPrincipal;
  accessToken: string;
  expiresAt: number;
}

export function hasRole(session: AppSession, role: AppRole): boolean {
  return session.principal.roles.includes(role);
}

export function requireRole(session: AppSession, roles: AppRole[]): void {
  if (!roles.some((role) => hasRole(session, role))) {
    throw new Response("Forbidden", { status: 403 });
  }
}

