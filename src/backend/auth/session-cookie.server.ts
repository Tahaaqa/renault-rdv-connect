import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

export const ACCESS_TOKEN_COOKIE = "renault_access_token";
export const ID_TOKEN_COOKIE = "renault_id_token";
export const AUTH_STATE_COOKIE = "renault_auth_state";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  path: "/",
};

export function setAuthStateCookie(state: string): void {
  setCookie(AUTH_STATE_COOKIE, state, {
    ...baseCookieOptions,
    maxAge: 10 * 60,
  });
}

export function consumeAuthStateCookie(): string | undefined {
  const state = getCookie(AUTH_STATE_COOKIE);
  deleteCookie(AUTH_STATE_COOKIE, { path: "/" });
  return state;
}

export function setTokenCookies(tokens: { accessToken: string; idToken?: string; expiresAt: number }): void {
  const maxAge = Math.max(0, Math.floor((tokens.expiresAt - Date.now()) / 1000));

  setCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge,
  });

  if (tokens.idToken) {
    setCookie(ID_TOKEN_COOKIE, tokens.idToken, {
      ...baseCookieOptions,
      maxAge,
    });
  }
}

export function getAccessTokenCookie(): string | undefined {
  return getCookie(ACCESS_TOKEN_COOKIE);
}

export function getIdTokenCookie(): string | undefined {
  return getCookie(ID_TOKEN_COOKIE);
}

export function clearTokenCookies(): void {
  deleteCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  deleteCookie(ID_TOKEN_COOKIE, { path: "/" });
}

