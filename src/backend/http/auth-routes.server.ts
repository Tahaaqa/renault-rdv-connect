import { getBackendConfig } from "@/backend/config";
import {
  exchangeAuthorizationCode,
  getKeycloakAuthorizationUrl,
  getKeycloakRegistrationUrl,
  getKeycloakLogoutUrl,
} from "@/backend/auth/keycloak";
import { verifyKeycloakAccessToken } from "@/backend/auth/keycloak.server";
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_STATE_COOKIE,
  ID_TOKEN_COOKIE,
} from "@/backend/auth/session-cookie.server";
import { getBackendRepositories } from "@/backend/db/mongo.server";
import { jsonResponse, redirectResponse } from "@/backend/http/json";
import { getSessionFromRequest } from "@/backend/auth/request-session.server";
import {
  authStateCookie,
  clearTokenCookies,
  parseCookieHeader,
  tokenCookies,
} from "@/backend/http/cookies";

function withSetCookies(response: Response, cookies: string[]): Response {
  for (const cookie of cookies) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

function landingPathForRoles(roles: string[]): string {
  if (roles.includes("agent_back_office")) return "/back-office/dashboard";
  if (roles.includes("agent_front_office")) return "/agent-fo/dashboard";
  return "/client/dashboard";
}

async function handleLogin(): Promise<Response> {
  const config = getBackendConfig();
  const state = crypto.randomUUID();
  const response = redirectResponse(getKeycloakAuthorizationUrl(config.keycloak, state));
  return withSetCookies(response, [authStateCookie(state)]);
}

async function handleRegister(): Promise<Response> {
  const config = getBackendConfig();
  const state = crypto.randomUUID();
  const response = redirectResponse(getKeycloakRegistrationUrl(config.keycloak, state));
  return withSetCookies(response, [authStateCookie(state)]);
}

async function handleCallback(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const expectedState = cookies[AUTH_STATE_COOKIE];

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectResponse("/login?error=invalid_state");
  }

  const config = getBackendConfig();
  const tokens = await exchangeAuthorizationCode(config.keycloak, code);
  const principal = await verifyKeycloakAccessToken(config.keycloak, tokens.accessToken);
  const repos = await getBackendRepositories(config.mongo);

  const user = await repos.users.upsertFromIdentity({
    keycloakSubject: principal.subject,
    email: principal.email,
    firstName: principal.firstName,
    lastName: principal.lastName,
  });

  const response = redirectResponse(
    landingPathForRoles(user.roles.length > 0 ? user.roles : principal.roles),
  );
  return withSetCookies(response, tokenCookies(tokens));
}

async function handleLogout(request: Request): Promise<Response> {
  const config = getBackendConfig();
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const idToken = cookies[ID_TOKEN_COOKIE];
  const response = redirectResponse(getKeycloakLogoutUrl(config.keycloak, idToken));
  return withSetCookies(response, clearTokenCookies());
}

async function handleMe(request: Request): Promise<Response> {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonResponse({ user: null }, { status: 401 });
  const config = getBackendConfig();
  const repos = await getBackendRepositories(config.mongo);
  const user = await repos.users.findById(session.userId);
  const cookies = parseCookieHeader(request.headers.get("cookie"));

  return jsonResponse({
    accessToken: cookies[ACCESS_TOKEN_COOKIE],
    user: {
      id: session.userId,
      subject: session.principal.subject,
      email: user?.email ?? session.principal.email,
      firstName: user?.firstName ?? session.principal.firstName,
      lastName: user?.lastName ?? session.principal.lastName,
      phone: user?.phone ?? null,
      agencyId: user?.agencyId ?? null,
      roles: session.principal.roles,
    },
  });
}

export async function handleAuthRoute(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (request.method !== "GET") return undefined;

  if (url.pathname === "/auth/login") return handleLogin();
  if (url.pathname === "/auth/register") return handleRegister();
  if (url.pathname === "/auth/callback") return handleCallback(request);
  if (url.pathname === "/auth/logout") return handleLogout(request);
  if (url.pathname === "/api/auth/me") return handleMe(request);

  return undefined;
}
