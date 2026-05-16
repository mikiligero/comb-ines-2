// Run: npx tsx scripts/add-cardio-coast.ts <email>
// Example: npx tsx scripts/add-cardio-coast.ts mikiligero@gmail.com

import { existsSync, readFileSync } from "fs";
import { eq, and } from "drizzle-orm";

if (existsSync(".env.local")) {
  readFileSync(".env.local", "utf8").split("\n").forEach(line => {
    const eq2 = line.indexOf("=");
    if (eq2 > 0 && !line.startsWith("#")) {
      const key = line.slice(0, eq2).trim();
      const val = line.slice(eq2 + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    }
  });
}

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/schema";
const { profiles, exercises, ropes, routines, routineBlocks, routineItems } = schema;

const email = process.argv[2];
if (!email) { console.error("Usage: npx tsx scripts/add-cardio-coast.ts <email>"); process.exit(1); }

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function run() {
  // ── Usuario ────────────────────────────────────────────────
  const [user] = await db.select().from(profiles).where(eq(profiles.email, email));
  if (!user) { console.error(`No se encontró usuario con email: ${email}`); process.exit(1); }
  const userId = user.id;
  console.log(`Usuario: ${user.name} (${userId})`);

  // ── Ejercicio Jump Rope Off Step (idempotente) ─────────────
  let [offStep] = await db.select().from(exercises)
    .where(and(eq(exercises.userId, userId), eq(exercises.name, "Jump Rope Off Step")));
  if (!offStep) {
    [offStep] = await db.insert(exercises).values({ userId, name: "Jump Rope Off Step" }).returning();
    console.log("Ejercicio creado: Jump Rope Off Step");
  } else {
    console.log("Ejercicio ya existe: Jump Rope Off Step");
  }

  // ── Rutina Cardio Coast (idempotente) ─────────────────────
  const [existing] = await db.select().from(routines)
    .where(and(eq(routines.userId, userId), eq(routines.name, "Cardio Coast")));
  if (existing) { console.log("Rutina ya existe: Cardio Coast"); await client.end(); return; }

  // ── Cuerdas del usuario ────────────────────────────────────
  const userRopes = await db.select().from(ropes).where(eq(ropes.userId, userId));
  const rope14 = userRopes.find(r => r.name.includes("1/4"));
  const rope12 = userRopes.find(r => r.name.includes("1/2"));
  if (!rope14 || !rope12) {
    console.error("No se encontraron las cuerdas 1/4 LB y 1/2 LB para este usuario");
    await client.end(); process.exit(1);
  }

  // ── Ejercicios del usuario ─────────────────────────────────
  const userEx = await db.select().from(exercises).where(eq(exercises.userId, userId));
  const ex = Object.fromEntries(userEx.map(e => [e.name, e.id]));

  const [rt] = await db.insert(routines).values({
    userId,
    name: "Cardio Coast",
    description: "4 bloques alternando cuerdas. Progresión de saltos con descansos activos.",
    transitionSec: 60,
  }).returning({ id: routines.id });

  const blockA = [
    { kind: "ex" as const, exerciseId: ex["Jump Rope Jacks"],    mode: "time" as const, value: 15 },
    { kind: "rest" as const,                                                              value: 20 },
    { kind: "ex" as const, exerciseId: ex["Scissors Jump"],      mode: "time" as const, value: 20 },
    { kind: "rest" as const,                                                              value: 20 },
    { kind: "ex" as const, exerciseId: offStep.id,               mode: "time" as const, value: 25 },
    { kind: "rest" as const,                                                              value: 25 },
    { kind: "ex" as const, exerciseId: ex["Basic jump"],         mode: "time" as const, value: 25 },
    { kind: "rest" as const,                                                              value: 25 },
    { kind: "ex" as const, exerciseId: ex["Scissors Jump"],      mode: "time" as const, value: 20 },
    { kind: "rest" as const,                                                              value: 20 },
    { kind: "ex" as const, exerciseId: ex["Jump Rope Jacks"],    mode: "time" as const, value: 15 },
  ];

  const blocks = [
    { letter: "A", ropeId: rope14.id, items: blockA },
    { letter: "B", ropeId: rope12.id, items: [
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 45 },
      { kind: "rest" as const,                                                           value: 30 },
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 45 },
    ]},
    { letter: "C", ropeId: rope14.id, items: blockA },
    { letter: "D", ropeId: rope12.id, items: [
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 60 },
      { kind: "rest" as const,                                                           value: 30 },
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 60 },
    ]},
  ];

  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    const [blk] = await db.insert(routineBlocks).values({
      routineId: rt.id, ropeId: b.ropeId, letter: b.letter, position: bi,
    }).returning({ id: routineBlocks.id });
    await db.insert(routineItems).values(
      b.items.map((item, pi) => ({
        blockId: blk.id, position: pi, kind: item.kind,
        exerciseId: "exerciseId" in item ? item.exerciseId : null,
        mode: "mode" in item ? item.mode : null,
        value: item.value,
      }))
    );
  }

  console.log("Rutina creada: Cardio Coast (4 bloques, ~15 min)");
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
