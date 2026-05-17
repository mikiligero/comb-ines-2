// Run: npx tsx scripts/find-user.ts <nombre>
import { existsSync, readFileSync } from "fs";
import { like, sql } from "drizzle-orm";

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

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/schema";
const { profiles } = schema;

const name = process.argv[2] ?? "";
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function run() {
  const rows = await db.select({ email: profiles.email, name: profiles.name })
    .from(profiles)
    .where(sql`lower(${profiles.name}) like ${"%" + name.toLowerCase() + "%"}`);
  if (rows.length === 0) { console.log("No encontrado"); }
  else { rows.forEach(r => console.log(`${r.name} → ${r.email}`)); }
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
