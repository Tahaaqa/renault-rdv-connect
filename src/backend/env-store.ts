/**
 * Request-scoped environment store.
 *
 * On Cloudflare Workers the environment bindings arrive as the `env` argument
 * of the `fetch()` handler — `process.env` is empty.  This module lets
 * `server.ts` stash `env` at the start of each request so that
 * `getBackendConfig()` can read it without every intermediate function
 * needing an extra parameter.
 *
 * In local dev (`vite dev`) the store stays `undefined` and `config.ts`
 * falls back to `process.env` as usual.
 */

type EnvSource = Record<string, string | undefined>;

let _requestEnv: EnvSource | undefined;

/** Call once at the top of the Cloudflare `fetch()` handler. */
export function setRequestEnv(env: EnvSource): void {
  _requestEnv = env;
}

/** Returns the env set by `setRequestEnv`, or `undefined` in local dev. */
export function getRequestEnv(): EnvSource | undefined {
  return _requestEnv;
}
