// Browser-side API client for the radio SPA. Built on
// @karyl-chan/plugin-sdk/web's `bootstrapPluginSession` orchestrator —
// JWT decode, manage exchange, refresh, sessionStorage restore and
// the authed fetch wrapper all live inside the SessionHandle owned by
// App.vue. This module exposes the typed feature endpoints; it
// receives the `PluginApi` via `setApi` once bootstrap resolves.

import { API_BASE, type PluginApi } from "@karyl-chan/plugin-sdk/web";

let _api: PluginApi | null = null;

export function setApi(api: PluginApi): void {
  _api = api;
}

function pluginApi(): PluginApi {
  if (!_api) {
    throw new Error("radio api used before bootstrapPluginSession resolved");
  }
  return _api;
}

export { API_BASE };

// ── Legacy aliases ────────────────────────────────────────────────────
// Existing call sites (ManageView, SessionView, modal components)
// imported `api` / `apiUpload` as named functions — keep the names so
// the migration touches a single layer.

export function api<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  return pluginApi().request<T>(method, path, body);
}

export function apiUpload<T = unknown>(path: string, file: File): Promise<T> {
  return pluginApi().upload<T>(path, file);
}
