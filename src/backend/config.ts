import { getRequestEnv } from "@/backend/env-store";

export interface MongoConfig {
  uri: string;
  databaseName: string;
}

export interface KeycloakConfig {
  issuerUrl: string;
  realm: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
}

export interface BackendConfig {
  appBaseUrl: string;
  seedToken: string | null;
  mongo: MongoConfig;
  keycloak: KeycloakConfig;
}

type EnvSource = Record<string, string | undefined>;

function requireEnv(env: EnvSource, name: string): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required backend environment variable: ${name}`);
  }
  return value;
}

export function getBackendConfig(env: EnvSource = getRequestEnv() ?? process.env): BackendConfig {
  const appBaseUrl = requireEnv(env, "APP_BASE_URL");

  return {
    appBaseUrl,
    seedToken: env.BACKEND_SEED_TOKEN ?? null,
    mongo: {
      uri: requireEnv(env, "MONGODB_URI"),
      databaseName: requireEnv(env, "MONGODB_DB_NAME"),
    },
    keycloak: {
      issuerUrl: requireEnv(env, "KEYCLOAK_ISSUER_URL"),
      realm: requireEnv(env, "KEYCLOAK_REALM"),
      clientId: requireEnv(env, "KEYCLOAK_CLIENT_ID"),
      clientSecret: requireEnv(env, "KEYCLOAK_CLIENT_SECRET"),
      redirectUri: env.KEYCLOAK_REDIRECT_URI ?? `${appBaseUrl}/auth/callback`,
      postLogoutRedirectUri: env.KEYCLOAK_POST_LOGOUT_REDIRECT_URI ?? appBaseUrl,
    },
  };
}
