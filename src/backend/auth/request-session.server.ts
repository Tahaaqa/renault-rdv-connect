import { getBackendConfig } from "@/backend/config";
import type { AppSession } from "@/backend/auth/session";
import { ACCESS_TOKEN_COOKIE } from "@/backend/auth/session-cookie.server";
import { verifyKeycloakAccessToken } from "@/backend/auth/keycloak.server";
import { getBackendRepositories } from "@/backend/db/mongo.server";
import { parseCookieHeader } from "@/backend/http/cookies";

export async function getSessionFromRequest(request: Request): Promise<AppSession | null> {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const accessToken = cookies[ACCESS_TOKEN_COOKIE];
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

export async function requireSessionFromRequest(request: Request): Promise<AppSession> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}
