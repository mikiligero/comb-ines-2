"use server";

import { db } from "./db";
import { exercises, ropes, routines, routineBlocks, routineItems } from "./schema";

export async function seedUserData(userId: string) {
  // ── Exercises ──────────────────────────────────────────────
  const exerciseNames = [
    "Alternate Foot", "Basic jump", "Bell Jump", "Body Weight Squats",
    "Boxer Step", "Double Unders", "Elbow Plank", "Free Style Jump",
    "High Knee Jump", "Jump Rope Jacks", "Jump Rope Off Step", "Scissors Jump", "Ski Jump",
  ];
  const insertedExercises = await db
    .insert(exercises)
    .values(exerciseNames.map(name => ({ userId, name })))
    .returning({ id: exercises.id, name: exercises.name });
  const ex = Object.fromEntries(insertedExercises.map(e => [e.name, e.id]));

  // ── Ropes ──────────────────────────────────────────────────
  const insertedRopes = await db
    .insert(ropes)
    .values([
      { userId, name: "1/4 LB verde",  color: "#4ade80", weightG: 113, ropeType: "Speed" },
      { userId, name: "1/2 LB blanca", color: "#f5f5f5", weightG: 227, ropeType: "Speed" },
      { userId, name: "1 LB gris",     color: "#9ca3af", weightG: 454, ropeType: "Speed" },
      { userId, name: "2 LB negra",    color: "#1f2937", weightG: 907, ropeType: "Speed" },
    ])
    .returning({ id: ropes.id, name: ropes.name });
  const rope = Object.fromEntries(insertedRopes.map(r => [r.name, r.id]));

  // ── Rutina 1: 12 min Basic transition ─────────────────────
  const [rt1] = await db.insert(routines).values({
    userId,
    name: "12 min Basic transition",
    description: "Progresión básica con cambio de cuerda. 3 bloques de intensidad creciente.",
    transitionSec: 30,
  }).returning({ id: routines.id });

  const blocks1 = [
    { letter: "A", ropeId: rope["1/2 LB blanca"], items: [
      { kind: "ex" as const, exerciseId: ex["Basic jump"],      mode: "time" as const, value: 10 },
      { kind: "ex" as const, exerciseId: ex["Ski Jump"],        mode: "time" as const, value: 10 },
      { kind: "rest" as const,                                                          value: 20 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],      mode: "time" as const, value: 10 },
      { kind: "ex" as const, exerciseId: ex["Bell Jump"],       mode: "time" as const, value: 10 },
      { kind: "rest" as const,                                                          value: 20 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],      mode: "time" as const, value: 10 },
      { kind: "ex" as const, exerciseId: ex["Jump Rope Jacks"], mode: "time" as const, value: 10 },
      { kind: "rest" as const,                                                          value: 14 },
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 30 },
    ]},
    { letter: "B", ropeId: rope["1/4 LB verde"], items: [
      { kind: "ex" as const, exerciseId: ex["Basic jump"],      mode: "time" as const, value: 15 },
      { kind: "ex" as const, exerciseId: ex["Ski Jump"],        mode: "time" as const, value: 15 },
      { kind: "rest" as const,                                                          value: 20 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],      mode: "time" as const, value: 15 },
      { kind: "ex" as const, exerciseId: ex["Bell Jump"],       mode: "time" as const, value: 12 },
      { kind: "rest" as const,                                                          value: 18 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],      mode: "time" as const, value: 15 },
      { kind: "ex" as const, exerciseId: ex["Jump Rope Jacks"], mode: "time" as const, value: 15 },
      { kind: "rest" as const,                                                          value: 15 },
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 40 },
    ]},
    { letter: "C", ropeId: rope["1/2 LB blanca"], items: [
      { kind: "ex" as const, exerciseId: ex["Basic jump"],      mode: "time" as const, value: 20 },
      { kind: "ex" as const, exerciseId: ex["Ski Jump"],        mode: "time" as const, value: 20 },
      { kind: "rest" as const,                                                          value: 20 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],      mode: "time" as const, value: 20 },
      { kind: "ex" as const, exerciseId: ex["Bell Jump"],       mode: "time" as const, value: 20 },
      { kind: "rest" as const,                                                          value: 20 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],      mode: "time" as const, value: 20 },
      { kind: "ex" as const, exerciseId: ex["Jump Rope Jacks"], mode: "time" as const, value: 20 },
      { kind: "rest" as const,                                                          value: 20 },
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 30 },
    ]},
  ];

  for (let bi = 0; bi < blocks1.length; bi++) {
    const b = blocks1[bi];
    const [blk] = await db.insert(routineBlocks).values({
      routineId: rt1.id, ropeId: b.ropeId, letter: b.letter, position: bi,
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

  // ── Rutina 2: Jump & Bodyweight exercises ──────────────────
  const [rt2] = await db.insert(routines).values({
    userId,
    name: "Jump & Bodyweight exercises",
    description: "Combinación de saltos y ejercicios de peso corporal.",
    transitionSec: 30,
  }).returning({ id: routines.id });

  const blocks2 = [
    { letter: "A", ropeId: rope["1/2 LB blanca"], items: [
      { kind: "ex" as const, exerciseId: ex["Alternate Foot"], mode: "time" as const, value: 30 },
      { kind: "rest" as const,                                                          value: 30 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],     mode: "time" as const, value: 20 },
      { kind: "rest" as const,                                                          value: 20 },
      { kind: "ex" as const, exerciseId: ex["Alternate Foot"], mode: "time" as const, value: 30 },
      { kind: "rest" as const,                                                          value: 30 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],     mode: "time" as const, value: 20 },
      { kind: "rest" as const,                                                          value: 20 },
      { kind: "ex" as const, exerciseId: ex["Alternate Foot"], mode: "time" as const, value: 30 },
      { kind: "rest" as const,                                                          value: 30 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],     mode: "time" as const, value: 20 },
    ]},
    { letter: "B", ropeId: rope["1/4 LB verde"], items: [
      { kind: "rest" as const,                                                                    value: 60 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],         mode: "time" as const, value: 30 },
      { kind: "rest" as const,                                                                    value: 30 },
      { kind: "ex" as const, exerciseId: ex["Elbow Plank"],        mode: "time" as const, value: 30 },
      { kind: "rest" as const,                                                                    value: 30 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],         mode: "time" as const, value: 30 },
      { kind: "rest" as const,                                                                    value: 30 },
      { kind: "ex" as const, exerciseId: ex["Body Weight Squats"], mode: "time" as const, value: 30 },
      { kind: "rest" as const,                                                                    value: 30 },
      { kind: "ex" as const, exerciseId: ex["Basic jump"],         mode: "time" as const, value: 30 },
    ]},
  ];

  for (let bi = 0; bi < blocks2.length; bi++) {
    const b = blocks2[bi];
    const [blk] = await db.insert(routineBlocks).values({
      routineId: rt2.id, ropeId: b.ropeId, letter: b.letter, position: bi,
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

  // ── Rutina 3: Cardio Coast (15 min) ───────────────────────
  const [rt3] = await db.insert(routines).values({
    userId,
    name: "Cardio Coast",
    description: "4 bloques alternando cuerdas. Progresión de saltos con descansos activos.",
    transitionSec: 60,
  }).returning({ id: routines.id });

  const cardioCoastBlockA = [
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

  const blocks3 = [
    { letter: "A", ropeId: rope["1/4 LB verde"],  items: cardioCoastBlockA },
    { letter: "B", ropeId: rope["1/2 LB blanca"], items: [
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 45 },
      { kind: "rest" as const,                                                           value: 30 },
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 45 },
    ]},
    { letter: "C", ropeId: rope["1/4 LB verde"],  items: cardioCoastBlockA },
    { letter: "D", ropeId: rope["1/2 LB blanca"], items: [
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 60 },
      { kind: "rest" as const,                                                           value: 30 },
      { kind: "ex" as const, exerciseId: ex["Free Style Jump"], mode: "time" as const, value: 60 },
    ]},
  ];

  for (let bi = 0; bi < blocks3.length; bi++) {
    const b = blocks3[bi];
    const [blk] = await db.insert(routineBlocks).values({
      routineId: rt3.id, ropeId: b.ropeId, letter: b.letter, position: bi,
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

  // ── Rutina 4: Tabata Jump Strong (9 min) ──────────────────
  const [rt4] = await db.insert(routines).values({
    userId,
    name: "Tabata Jump Strong",
    description: "HIIT Tabata: 20s trabajo / 10s descanso. 2 bloques con cuerdas pesadas.",
    transitionSec: 60,
  }).returning({ id: routines.id });

  // Tabata: [ex 20s, rest 10s] × 7 + [ex 20s] (sin rest final)
  function tabataBlock(sequence: string[]): { kind: "ex" | "rest"; exerciseId?: string; mode?: "time"; value: number }[] {
    const items: { kind: "ex" | "rest"; exerciseId?: string; mode?: "time"; value: number }[] = [];
    for (let i = 0; i < sequence.length; i++) {
      items.push({ kind: "ex", exerciseId: ex[sequence[i]], mode: "time", value: 20 });
      if (i < sequence.length - 1) items.push({ kind: "rest", value: 10 });
    }
    return items;
  }

  const tabataSeqA = [
    "Alternate Foot", "Double Unders", "Jump Rope Off Step", "High Knee Jump",
    "Alternate Foot", "Double Unders", "Jump Rope Off Step", "High Knee Jump",
  ];
  const tabataSeqB = [
    "Basic jump", "Scissors Jump", "Boxer Step", "Ski Jump",
    "Basic jump", "Scissors Jump", "Boxer Step", "Ski Jump",
  ];

  const blocks4 = [
    { letter: "A", ropeId: rope["1 LB gris"],  items: tabataBlock(tabataSeqA) },
    { letter: "B", ropeId: rope["2 LB negra"], items: tabataBlock(tabataSeqB) },
  ];

  for (let bi = 0; bi < blocks4.length; bi++) {
    const b = blocks4[bi];
    const [blk] = await db.insert(routineBlocks).values({
      routineId: rt4.id, ropeId: b.ropeId, letter: b.letter, position: bi,
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
}
