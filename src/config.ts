import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-sound-guess",
  description: "An accessible browser-local shared sound and emoji clue guessing game.",
  accentHex: "#7c3aed",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
