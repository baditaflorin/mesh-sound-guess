import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-sound-guess",
  breadcrumbs: false,
  displayName: "Sound Guess",
  visualProfile: "play",
  shellLayout: "inset",
  description: "A shared, voice-free sound clue game for quick, accessible room play.",
  accentHex: "#df7a32",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
