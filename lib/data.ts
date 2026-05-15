import type { Rope, Exercise, Routine, WorkoutSession } from "./types";

export const ROPES: Rope[] = [
  { id: "r1", name: "Speed Lima",    color: "#D4FF3A", weight: 45,  type: "Speed",    bought: "2025-09-12" },
  { id: "r2", name: "Beaded Roja",   color: "#E2392B", weight: 180, type: "Beaded",   bought: "2025-03-04" },
  { id: "r3", name: "Heavy Cobalto", color: "#2A6FDB", weight: 450, type: "Weighted", bought: "2024-11-22" },
  { id: "r4", name: "Drag Negra",    color: "#1a1a1a", weight: 95,  type: "Drag",     bought: "2025-06-30" },
  { id: "r5", name: "PVC Naranja",   color: "#FF7A1A", weight: 60,  type: "PVC",      bought: "2025-01-15" },
];

export const EXERCISES: Exercise[] = [
  { id: "e1",  name: "Basic Bounce" },
  { id: "e2",  name: "Alternate Foot" },
  { id: "e3",  name: "High Knees" },
  { id: "e4",  name: "Boxer Skip" },
  { id: "e5",  name: "Double Under" },
  { id: "e6",  name: "Criss-Cross" },
  { id: "e7",  name: "Side Swing" },
  { id: "e8",  name: "Heel Taps" },
  { id: "e9",  name: "Side-to-Side" },
  { id: "e10", name: "Front-Back" },
  { id: "e11", name: "Mummy Kicks" },
  { id: "e12", name: "Triple Under" },
];

export const ROUTINES: Routine[] = [
  {
    id: "rt1",
    name: "HIIT Express",
    description: "Sesión corta de alta intensidad. 3 bloques, sin descanso entre cuerdas largas.",
    createdAt: "2026-04-12",
    transitionSec: 20,
    blocks: [
      { letter: "A", ropeId: "r1", items: [
        { kind: "ex", exId: "e1", mode: "time",  value: 60 },
        { kind: "rest",                           value: 15 },
        { kind: "ex", exId: "e3", mode: "time",  value: 45 },
        { kind: "rest",                           value: 15 },
        { kind: "ex", exId: "e4", mode: "time",  value: 60 },
      ]},
      { letter: "B", ropeId: "r3", items: [
        { kind: "ex", exId: "e1", mode: "time",  value: 45 },
        { kind: "rest",                           value: 20 },
        { kind: "ex", exId: "e2", mode: "reps",  value: 80 },
        { kind: "rest",                           value: 20 },
        { kind: "ex", exId: "e9", mode: "time",  value: 45 },
      ]},
      { letter: "C", ropeId: "r1", items: [
        { kind: "ex", exId: "e5", mode: "reps",  value: 30 },
        { kind: "rest",                           value: 30 },
        { kind: "ex", exId: "e6", mode: "time",  value: 40 },
        { kind: "rest",                           value: 30 },
        { kind: "ex", exId: "e5", mode: "reps",  value: 25 },
      ]},
    ],
  },
  {
    id: "rt2",
    name: "Endurance 20'",
    description: "Mantener pulso constante. Cuerda media-pesada todo el rato.",
    createdAt: "2026-03-30",
    transitionSec: 15,
    blocks: [
      { letter: "A", ropeId: "r2", items: [
        { kind: "ex", exId: "e1", mode: "time",  value: 180 },
        { kind: "rest",                           value: 30  },
        { kind: "ex", exId: "e4", mode: "time",  value: 180 },
        { kind: "rest",                           value: 30  },
        { kind: "ex", exId: "e2", mode: "time",  value: 180 },
      ]},
      { letter: "B", ropeId: "r2", items: [
        { kind: "ex", exId: "e3",  mode: "time", value: 120 },
        { kind: "rest",                           value: 30  },
        { kind: "ex", exId: "e10", mode: "time", value: 120 },
      ]},
    ],
  },
  {
    id: "rt3",
    name: "Técnica & Skill",
    description: "Foco en cruzados y dobles. Cuerda ligera.",
    createdAt: "2026-02-18",
    transitionSec: 25,
    blocks: [
      { letter: "A", ropeId: "r1", items: [
        { kind: "ex", exId: "e6", mode: "reps", value: 20 },
        { kind: "rest",                          value: 25 },
        { kind: "ex", exId: "e7", mode: "reps", value: 20 },
        { kind: "rest",                          value: 25 },
        { kind: "ex", exId: "e5", mode: "reps", value: 15 },
      ]},
      { letter: "B", ropeId: "r5", items: [
        { kind: "ex", exId: "e5",  mode: "reps", value: 25 },
        { kind: "rest",                           value: 30 },
        { kind: "ex", exId: "e12", mode: "reps", value: 10 },
      ]},
      { letter: "C", ropeId: "r1", items: [
        { kind: "ex", exId: "e6",  mode: "time", value: 60 },
        { kind: "rest",                           value: 20 },
        { kind: "ex", exId: "e11", mode: "time", value: 60 },
      ]},
    ],
  },
  {
    id: "rt4",
    name: "Calentamiento 5'",
    description: "Movilidad y activación.",
    createdAt: "2026-04-30",
    transitionSec: 10,
    blocks: [
      { letter: "A", ropeId: "r5", items: [
        { kind: "ex", exId: "e1", mode: "time", value: 60 },
        { kind: "rest",                          value: 10 },
        { kind: "ex", exId: "e2", mode: "time", value: 60 },
        { kind: "rest",                          value: 10 },
        { kind: "ex", exId: "e4", mode: "time", value: 60 },
      ]},
    ],
  },
];

function pseudoRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildHistory(routines: Routine[]): WorkoutSession[] {
  const today = new Date(2026, 4, 11);
  const positions = [
    0, 1, 3, 4, 6, 7, 8, 10, 11, 13, 14, 16, 17, 18, 20, 21, 23, 25, 27, 28,
    30, 32, 34, 36, 38, 40, 42, 44, 45, 47, 49, 51, 53, 55, 57, 59, 61, 63,
    65, 67, 69, 71, 73, 75, 77, 79, 81, 83, 85, 87, 89,
  ];
  return positions.map((daysAgo, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const rt = routines[i % routines.length];
    const rawSecs =
      rt.blocks.reduce((s, b) => s + b.items.reduce((ss, it) => ss + it.value, 0), 0) +
      rt.blocks.length * rt.transitionSec;
    const duration = Math.round(rawSecs / 60);
    return {
      id: "w" + i,
      routineId: rt.id,
      routineName: rt.name,
      date: d.toISOString().slice(0, 10),
      duration,
      jumps:    800 + Math.floor(pseudoRand(i * 3)       * 1600),
      avgHr:    138 + Math.floor(pseudoRand(i * 3 + 1)   * 22),
      calories: 220 + Math.floor(pseudoRand(i * 3 + 2)   * 180),
      ropes: rt.blocks.map(b => b.ropeId),
      completed: pseudoRand(i * 3 + 1) > 0.08,
    };
  });
}

export const HISTORY: WorkoutSession[] = buildHistory(ROUTINES);

export function getRope(id: string): Rope | undefined {
  return ROPES.find(r => r.id === id);
}

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id);
}

export const JUMP_DISTRIBUTION = [
  { name: "Basic Bounce",   pct: 32 },
  { name: "Alternate Foot", pct: 22 },
  { name: "Double Under",   pct: 14 },
  { name: "Boxer Skip",     pct: 11 },
  { name: "Criss-Cross",    pct: 8  },
  { name: "High Knees",     pct: 7  },
  { name: "Otros",          pct: 6  },
];

export const PRS = [
  { name: "Saltos seguidos sin fallo",     value: "428",   unit: "saltos",  on: "2026-04-22" },
  { name: "Double-unders en 1 minuto",     value: "86",    unit: "reps",    on: "2026-03-14" },
  { name: "Sesión más larga",              value: "42:18", unit: "min:seg", on: "2026-02-02" },
  { name: "Tiempo total en una semana",    value: "3:42",  unit: "horas",   on: "semana 16"  },
];
