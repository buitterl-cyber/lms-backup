import { defineConfig } from "vitest/config";

// Pin the test surface so the run is deterministic (vitest 4's default globbing otherwise
// matched the suite twice). Pure unit tests, node environment, no setup.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    globals: false,
  },
});
