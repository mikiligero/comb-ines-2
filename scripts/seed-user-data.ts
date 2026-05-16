// Siembra datos de usuario para todos los usuarios (o uno concreto).
// Run for all users:  pnpm exec tsx scripts/seed-user-data.ts
// Run for one user:   pnpm exec tsx scripts/seed-user-data.ts <email>
//
// Para añadir una rutina nueva: añade una función seedXxx(userId, ...) abajo
// y llámala desde seedForUser(). No toques update.sh.

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

type DB = ReturnType<typeof drizzle>;

const emailArg = process.argv[2] ?? null;
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// ── Helpers ────────────────────────────────────────────────────────────────

async function ensureExercise(db: DB, userId: string, name: string) {
  const [row] = await db.select().from(exercises)
    .where(and(eq(exercises.userId, userId), eq(exercises.name, name)));
  if (row) return row;
  const [created] = await db.insert(exercises).values({ userId, name }).returning();
  console.log(`    + ejercicio: ${name}`);
  return created;
}

async function routineExists(db: DB, userId: string, name: string) {
  const [row] = await db.select({ id: routines.id }).from(routines)
    .where(and(eq(routines.userId, userId), eq(routines.name, name)));
  return !!row;
}

async function insertRoutine(
  db: DB,
  userId: string,
  meta: { name: string; description: string; transitionSec: number },
  blocks: { letter: string; ropeId: string; items: { kind: "ex" | "rest"; exerciseId?: string; mode?: "time" | "reps"; value: number }[] }[]
) {
  const [rt] = await db.insert(routines).values({ userId, ...meta }).returning({ id: routines.id });
  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    const [blk] = await db.insert(routineBlocks).values({
      routineId: rt.id, ropeId: b.ropeId, letter: b.letter, position: bi,
    }).returning({ id: routineBlocks.id });
    await db.insert(routineItems).values(
      b.items.map((item, pi) => ({
        blockId: blk.id, position: pi, kind: item.kind,
        exerciseId: item.exerciseId ?? null,
        mode: item.mode ?? null,
        value: item.value,
      }))
    );
  }
  console.log(`    + rutina: ${meta.name}`);
}

// ── Rutinas ────────────────────────────────────────────────────────────────
// Añade aquí cada nueva rutina como función independiente.

async function seedCardioCast(db: DB, userId: string) {
  if (await routineExists(db, userId, "Cardio Coast")) return;

  const userRopes = await db.select().from(ropes).where(eq(ropes.userId, userId));
  const rope14 = userRopes.find(r => r.name.includes("1/4"));
  const rope12 = userRopes.find(r => r.name.includes("1/2"));
  if (!rope14 || !rope12) { console.warn("    ! sin cuerdas 1/4+1/2 LB — omitiendo Cardio Coast"); return; }

  const userEx = await db.select().from(exercises).where(eq(exercises.userId, userId));
  const ex = Object.fromEntries(userEx.map(e => [e.name, e.id]));

  const blockA = [
    { kind: "ex" as const, exerciseId: ex["Jump Rope Jacks"],    mode: "time" as const, value: 15 },
    { kind: "rest" as const,                                                              value: 20 },
    { kind: "ex" as const, exerciseId: ex["Scissors Jump"],      mode: "time" as const, value: 20 },
    { kind: "rest" as const,                                                              value: 20 },
    { kind: "ex" as const, exerciseId: ex["Jump Rope Off Step"], mode: "time" as const, value: 25 },
    { kind: "rest" as const,                                                              value: 25 },
    { kind: "ex" as const, exerciseId: ex["Basic jump"],         mode: "time" as const, value: 25 },
    { kind: "rest" as const,                                                              value: 25 },
    { kind: "ex" as const, exerciseId: ex["Scissors Jump"],      mode: "time" as const, value: 20 },
    { kind: "rest" as const,                                                              value: 20 },
    { kind: "ex" as const, exerciseId: ex["Jump Rope Jacks"],    mode: "time" as const, value: 15 },
  ];

  await insertRoutine(db, userId, {
    name: "Cardio Coast",
    description: "4 bloques alternando cuerdas. Progresión de saltos con descansos activos.",
    transitionSec: 60,
  }, [
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
  ]);
}

// ── Entry point ────────────────────────────────────────────────────────────

async function seedForUser(userId: string, userName: string) {
  console.log(`  → ${userName}`);
  await ensureExercise(db, userId, "Jump Rope Off Step");
  await seedCardioCast(db, userId);
  // Añade aquí las llamadas a futuras rutinas:
  // await seedNuevaRutina(db, userId);
}

async function run() {
  if (emailArg) {
    const [user] = await db.select().from(profiles).where(eq(profiles.email, emailArg));
    if (!user) { console.error(`No encontrado: ${emailArg}`); await client.end(); process.exit(1); }
    await seedForUser(user.id, user.name);
  } else {
    const users = await db.select({ id: profiles.id, name: profiles.name }).from(profiles);
    console.log(`Seeding ${users.length} usuario(s)...`);
    for (const u of users) await seedForUser(u.id, u.name);
  }
  console.log("✓ seed-user-data completado");
  await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
