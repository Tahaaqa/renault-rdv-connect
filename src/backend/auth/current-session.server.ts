import { getBackendConfig } from "@/backend/config";
import type { AppSession } from "@/backend/auth/session";
import { getAccessTokenCookie } from "@/backend/auth/session-cookie.server";
import { verifyKeycloakAccessToken } from "@/backend/auth/keycloak.server";
import { getBackendRepositories } from "@/backend/db/mongo.server";

export async function getCurrentSession(): Promise<AppSession | null> {
  const accessToken = getAccessTokenCookie();
  if (!accessToken) return null;

  const config = getBackendConfig();
  const principal = await verifyKeycloakAccessToken(config.keycloak, accessToken);
  const repos = await getBackendRepositories(config.mongo);
  const user = await repos.users.upsertFromIdentity({
    keycloakSubject: principal.subject,
    email: principal.email,
    firstName: principal.firstName,
    lastName: principal.lastName,
  });

  return {
    userId: user.id,
    principal: {
      ...principal,
      roles: user.roles.length > 0 ? user.roles : principal.roles,
    },
    accessToken,
    expiresAt: 0,
  };
}

export async function requireCurrentSession(): Promise<AppSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}
