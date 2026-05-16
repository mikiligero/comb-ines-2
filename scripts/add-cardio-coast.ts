// Run for one user:  npx tsx scripts/add-cardio-coast.ts <email>
// Run for all users: npx tsx scripts/add-cardio-coast.ts

import { existsSync, readFileSync } from "fs";
import { eq, and } from "drizzle-orm";

if (existsSync(".env.local")) {
  readFileSync(".env.local", "utf8").split("\n").forEach(line => {
    const eqIdx = line.indexOf("=");
    if (eqIdx > 0 && !line.startsWith("#")) {
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    }
  });
}

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../lib/schema";
const { profiles, exercises, ropes, routines, routineBlocks, routineItems } = schema;

const emailArg = process.argv[2] ?? null;
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function seedForUser(userId: string, userName: string) {
  console.log(`→ ${userName} (${userId})`);

  // ── Ejercicio Jump Rope Off Step (idempotente) ─────────────
  let [offStep] = await db.select().from(exercises)
    .where(and(eq(exercises.userId, userId), eq(exercises.name, "Jump Rope Off Step")));
  if (!offStep) {
    [offStep] = await db.insert(exercises).values({ userId, name: "Jump Rope Off Step" }).returning();
    console.log("  Ejercicio creado: Jump Rope Off Step");
  }

  // ── Rutina Cardio Coast (idempotente) ─────────────────────
  const [existing] = await db.select().from(routines)
    .where(and(eq(routines.userId, userId), eq(routines.name, "Cardio Coast")));
  if (existing) { console.log("  Rutina ya existe: Cardio Coast"); return; }

  // ── Cuerdas del usuario ────────────────────────────────────
  const userRopes = await db.select().from(ropes).where(eq(ropes.userId, userId));
  const rope14 = userRopes.find(r => r.name.includes("1/4"));
  const rope12 = userRopes.find(r => r.name.includes("1/2"));
  if (!rope14 || !rope12) {
    console.warn(`  Sin cuerdas 1/4 LB / 1/2 LB — omitiendo`);
    return;
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

  console.log("  Rutina creada: Cardio Coast (4 bloques, ~15 min)");
}

async function run() {
  if (emailArg) {
    const [user] = await db.select().from(profiles).where(eq(profiles.email, emailArg));
    if (!user) { console.error(`No encontrado: ${emailArg}`); await client.end(); process.exit(1); }
    await seedForUser(user.id, user.name);
  } else {
    const users = await db.select({ id: profiles.id, name: profiles.name }).from(profiles);
    console.log(`Procesando ${users.length} usuario(s)...`);
    for (const u of users) await seedForUser(u.id, u.name);
  }
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
