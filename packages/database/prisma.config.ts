import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 moves connection config out of schema.prisma and into this file.
// `datasource.url` is only consulted by CLI commands that touch the database
// (migrate, db push, studio, introspect); `prisma generate` does not need it,
// so reading process.env directly keeps generation working without a .env file.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
