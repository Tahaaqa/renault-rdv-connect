import { createRemoteJWKSet, jwtVerify } from "jose";

import type { KeycloakConfig } from "@/backend/config";
import { mapKeycloakClaimsToPrincipal, type KeycloakTokenClaims } from "@/backend/auth/keycloak";
import type { AuthenticatedPrincipal } from "@/backend/auth/session";

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(config: KeycloakConfig) {
  const jwksUrl = `${config.issuerUrl}/protocol/openid-connect/certs`;
  const cached = jwksCache.get(jwksUrl);
  if (cached) return cached;

  const jwks = createRemoteJWKSet(new URL(jwksUrl));
  jwksCache.set(jwksUrl, jwks);
  return jwks;
}

export async function verifyKeycloakAccessToken(
  config: KeycloakConfig,
  accessToken: string,
): Promise<AuthenticatedPrincipal> {
  const { payload } = await jwtVerify(accessToken, getJwks(config), {
    issuer: config.issuerUrl,
  });

  return mapKeycloakClaimsToPrincipal(payload as KeycloakTokenClaims, config.clientId);
}
