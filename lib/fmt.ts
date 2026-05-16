import type { RoutineBlock, Routine } from "./types";

export function fmtTime(s: number): string {
  s = Math.max(0, Math.round(s));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function blockDuration(b: RoutineBlock): number {
  return b.items.reduce((sum, it) => {
    const isReps = it.kind === "ex" && it.mode === "reps";
    return sum + (isReps ? Math.round(it.value / 2) : it.value);
  }, 0);
}

export function fmtRoutineLabel(name: string, durationSec: number): string {
  return `${Math.round(durationSec / 60)} min - ${name}`;
}

export function routineDuration(rt: Routine): number {
  const blocks = rt.blocks.reduce((s, b) => s + blockDuration(b), 0);
  const transitionCount = rt.blocks.filter((b, i) =>
    i > 0 && rt.blocks[i - 1].ropeId !== b.ropeId
  ).length;
  return blocks + transitionCount * rt.transitionSec;
}
