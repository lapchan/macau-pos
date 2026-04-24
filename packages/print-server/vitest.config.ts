import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration tests bind sockets; run files serially to avoid port races.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
