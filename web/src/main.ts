import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
// @karyl-chan/ui tokens first; the local global.css layers radio's
// Discord-blue accent + dark overrides on top.
import "@karyl-chan/ui/tokens.css";
import "@karyl-chan/ui/reset.css";
import "@karyl-chan/ui/use-drawer.css";
import "@karyl-chan/ui/use-popover.css";
import "./styles/global.css";

createApp(App).use(createPinia()).mount("#app");
