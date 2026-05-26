<script setup lang="ts">
import { computed, ref } from "vue";
import { bootstrapPluginSession } from "@karyl-chan/plugin-sdk/web";
import AppToast from "./components/AppToast.vue";
import DeniedView from "./views/DeniedView.vue";
import ManageView from "./views/ManageView.vue";
import SessionView from "./views/SessionView.vue";
import { setApi } from "./api";

const PLUGIN_KEY = "karyl-radio";
const MANAGE_CAP_TOKEN = `plugin:${PLUGIN_KEY}:manage`;

type View = "loading" | "denied" | "session" | "manage";
const view = ref<View>("loading");
const deniedMessage = ref<string | null>(null);
// When the SPA boots into session mode, the JWT we read from the URL
// (or sessionStorage) carries the guildId — we still need it for the
// session view's `:guild-id` prop. Manage mode doesn't keep claims
// around: the plugin's access token is opaque to the SPA.
const sessionGuildId = ref<string | null>(null);

function isManageClaims(claims: { capabilities?: unknown } | null): boolean {
  const caps = Array.isArray(claims?.capabilities)
    ? (claims!.capabilities as string[])
    : [];
  return caps.includes("admin") || caps.includes(MANAGE_CAP_TOKEN);
}

function deny(msg: string): void {
  deniedMessage.value = msg;
  view.value = "denied";
}

async function bootstrap(): Promise<void> {
  // Radio's link URLs don't carry `?surface=` — the bot CLI emits a
  // single `/?token=…` (manage or session, distinguished by the JWT's
  // capabilities). Use the SDK 0.5 `surfaceFromClaims` resolver to
  // derive surface from the token; the SDK then handles decode,
  // manage exchange, refresh, and sessionStorage restore.
  const handle = await bootstrapPluginSession({
    pluginKey: PLUGIN_KEY,
    surfaces: {
      manage: "manage",
      session: "session",
    },
    surfaceFromClaims: (claims) =>
      isManageClaims(claims) ? "manage" : "session",
    onAccessDenied: (msg) =>
      deny(msg || "Access denied — re-open the link / ask an admin."),
  });
  setApi(handle.api);

  if (handle.denied) {
    if (view.value !== "denied") {
      deny(handle.deniedReason ?? "Access denied — re-open the link / ask an admin.");
    }
    return;
  }

  if (handle.mode === "none") {
    deny("No valid token. Run /radio manage or use a play/queue response button.");
    return;
  }

  // Tab reload — SDK restored auth from sessionStorage but has no
  // decoded claims for us. Manage resumes cleanly (the SPA never
  // needed claims for that path); session mode needs the guildId from
  // claims, so re-prompt the user.
  if (!handle.claims) {
    if (handle.mode === "manage") {
      view.value = "manage";
      return;
    }
    deny("Tab reload lost the session token claims — re-run /radio.");
    return;
  }

  if (handle.surface === "manage") {
    view.value = "manage";
    return;
  }

  // Session mode — pull the guildId from the freshly-decoded claims so
  // SessionView can scope its requests.
  if (typeof handle.claims.guildId === "string") {
    sessionGuildId.value = handle.claims.guildId;
    view.value = "session";
    return;
  }
  deny("This link doesn't grant access to a playback session.");
}

void bootstrap();

const modeLabel = computed(() => {
  if (view.value === "session") return "playback session";
  if (view.value === "manage") return "admin · library";
  return "";
});
</script>

<template>
  <div class="app-wrap" :class="{ 'app-wrap--locked': view === 'session' }">
    <header class="app-header">
      <h1>📻 Karyl Radio</h1>
      <span class="mode">{{ modeLabel }}</span>
    </header>

    <div v-if="view === 'loading'" class="center-msg">Connecting…</div>
    <DeniedView
      v-else-if="view === 'denied'"
      :message="deniedMessage || 'Access denied'"
    />
    <SessionView
      v-else-if="view === 'session' && sessionGuildId"
      :guild-id="sessionGuildId"
    />
    <ManageView v-else-if="view === 'manage'" />

    <AppToast />
  </div>
</template>
