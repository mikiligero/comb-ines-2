import { defineConfig } from "drizzle-kit";
import { existsSync, readFileSync } from "fs";

// drizzle-kit no carga .env.local (convención Next.js), lo hacemos aquí
if (existsSync(".env.local")) {
  readFileSync(".env.local", "utf8").split("\n").forEach(line => {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.startsWith("#")) {
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    }
  });
}

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
