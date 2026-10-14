import { defineConfig } from "oxlint";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";

import root from "../../oxlint.config.ts";

// Oxlint lints each file with its nearest config alone, so this extends the
// root config and repeats the properties that extends doesn't carry over.
export default defineConfig({
  extends: [root, next, react],
  // Patterns resolve from this folder, so the root's repo-relative ignores
  // need their app-relative form here.
  ignorePatterns: [
    ...(root.ignorePatterns ?? []),
    "components/ui/**",
    "lib/content/*.generated.json",
  ],
  settings: root.settings,
});
