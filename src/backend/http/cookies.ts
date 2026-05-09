import {
  ACCESS_TOKEN_COOKIE,
  AUTH_STATE_COOKIE,
  ID_TOKEN_COOKIE,
} from "@/backend/auth/session-cookie.server";

const isProduction = process.env.NODE_ENV === "production";

function serializeCookie(
  name: string,
  value: string,
  options: { maxAge?: number; expires?: Date } = {},
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax"];

  if (isProduction) parts.push("Secure");
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);

  return parts.join("; ");
}

export function parseCookieHeader(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (!name || valueParts.length === 0) continue;
    cookies[name] = decodeURIComponent(valueParts.join("="));
  }

  return cookies;
}

export function authStateCookie(state: string): string {
  return serializeCookie(AUTH_STATE_COOKIE, state, { maxAge: 10 * 60 });
}

export function tokenCookies(tokens: {
  accessToken: string;
  idToken?: string;
  expiresAt: number;
}): string[] {
  const maxAge = Math.max(0, Math.floor((tokens.expiresAt - Date.now()) / 1000));
  const cookies = [serializeCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, { maxAge })];

  if (tokens.idToken) {
    cookies.push(serializeCookie(ID_TOKEN_COOKIE, tokens.idToken, { maxAge }));
  }

  cookies.push(clearCookie(AUTH_STATE_COOKIE));
  return cookies;
}

export function clearCookie(name: string): string {
  return serializeCookie(name, "", {
    maxAge: 0,
    expires: new Date(0),
  });
}

export function clearTokenCookies(): string[] {
  return [clearCookie(ACCESS_TOKEN_COOKIE), clearCookie(ID_TOKEN_COOKIE)];
}
