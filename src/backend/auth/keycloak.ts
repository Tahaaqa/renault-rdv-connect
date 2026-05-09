import type { AppRole } from "@/types";
import type { KeycloakConfig } from "@/backend/config";
import type { AuthenticatedPrincipal } from "@/backend/auth/session";

export interface KeycloakTokenSet {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
}

export interface KeycloakTokenClaims {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  [claim: string]: unknown;
}

const APP_ROLES: AppRole[] = ["client", "agent_fo", "agent_bo"];

export function getKeycloakAuthorizationUrl(config: KeycloakConfig, state: string): string {
  const url = new URL(`${config.issuerUrl}/protocol/openid-connect/auth`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  return url.toString();
}

export function getKeycloakLogoutUrl(config: KeycloakConfig, idTokenHint?: string): string {
  const url = new URL(`${config.issuerUrl}/protocol/openid-connect/logout`);
  url.searchParams.set("post_logout_redirect_uri", config.postLogoutRedirectUri);
  if (idTokenHint) {
    url.searchParams.set("id_token_hint", idTokenHint);
  }
  return url.toString();
}

export function mapKeycloakClaimsToPrincipal(
  claims: KeycloakTokenClaims,
  clientId: string,
): AuthenticatedPrincipal {
  if (!claims.sub) {
    throw new Response("Unauthorized: missing Keycloak subject", { status: 401 });
  }

  const realmRoles = claims.realm_access?.roles ?? [];
  const clientRoles = claims.resource_access?.[clientId]?.roles ?? [];
  const roles = [...new Set([...realmRoles, ...clientRoles])].filter((role): role is AppRole =>
    APP_ROLES.includes(role as AppRole),
  );

  return {
    subject: claims.sub,
    email: claims.email ?? null,
    firstName: claims.given_name ?? null,
    lastName: claims.family_name ?? null,
    roles: roles.length > 0 ? roles : ["client"],
    rawClaims: claims,
  };
}

export async function exchangeAuthorizationCode(
  config: KeycloakConfig,
  code: string,
): Promise<KeycloakTokenSet> {
  const response = await fetch(`${config.issuerUrl}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    throw new Response("Unauthorized: Keycloak token exchange failed", { status: 401 });
  }

  const payload = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in?: number;
  };

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    idToken: payload.id_token,
    expiresAt: Date.now() + (payload.expires_in ?? 300) * 1000,
  };
}
