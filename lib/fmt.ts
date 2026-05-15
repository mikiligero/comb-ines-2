import type { RoutineBlock, Routine } from "./types";

export function fmtTime(s: number): string {
  s = Math.max(0, Math.round(s));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function blockDuration(b: RoutineBlock): number {
  return b.items.reduce((sum, it) => sum + it.value, 0);
}

export function routineDuration(rt: Routine): number {
  const blocks = rt.blocks.reduce((s, b) => s + blockDuration(b), 0);
  const transitions = Math.max(0, rt.blocks.length - 1) * rt.transitionSec;
  return blocks + transitions;
}
