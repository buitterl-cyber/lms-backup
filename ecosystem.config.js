// pm2 process definitions for RiyadaIntel (api + web). Runs under the same pm2 daemon as the
// other Excis apps. Start with:  pm2 start ecosystem.config.js  &&  pm2 save
const path = require("path");
const fs = require("fs");

// Load gitignored .env secrets (AI gateway key, etc.) into the api process env.
function loadEnv(file) {
  const out = {};
  try {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith("#")) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env */
  }
  return out;
}
const secrets = loadEnv(path.join(__dirname, ".env"));

// Resolve the Next.js binary from the web workspace (robust across pnpm version-hash paths).
const nextBin = require.resolve("next/dist/bin/next", {
  paths: [path.join(__dirname, "apps", "web")],
});

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://riyada:riyada@localhost:5440/riyada?schema=public";

module.exports = {
  apps: [
    {
      name: "riyada-api",
      cwd: __dirname,
      script: path.join(__dirname, "apps", "api", "dist", "main.js"),
      interpreter: "node",
      max_memory_restart: "512M",
      env: { NODE_ENV: "production", PORT: "4400", DATABASE_URL, ...secrets },
    },
    {
      name: "riyada-web",
      cwd: path.join(__dirname, "apps", "web"),
      script: nextBin,
      args: "start -p 3300",
      interpreter: "node",
      max_memory_restart: "512M",
      env: { NODE_ENV: "production", API_URL: "http://localhost:4400" },
    },
  ],
};
