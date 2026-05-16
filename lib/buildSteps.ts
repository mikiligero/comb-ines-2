import type { Routine } from "./types";

export type WorkoutStep = {
  kind: "ex" | "rest" | "transition";
  duration: number; // always in seconds (reps converted at ~2/s)
  // ex-only
  mode?: "time" | "reps";
  reps?: number; // original rep count when mode=reps
  exId?: string;
  exName?: string;
  // transition-only
  fromRope?: string;
  toRope?: string;
  // shared context
  ropeId?: string;
  blockIdx: number;
  blockLetter: string;
  itemIdx?: number;
};

export function buildSteps(routine: Routine): WorkoutStep[] {
  const out: WorkoutStep[] = [];

  routine.blocks.forEach((b, bi) => {
    const prev = routine.blocks[bi - 1];
    if (prev && prev.ropeId !== b.ropeId) {
      out.push({
        kind: "transition",
        duration: routine.transitionSec,
        fromRope: prev.ropeId,
        toRope: b.ropeId,
        blockIdx: bi,
        blockLetter: b.letter,
      });
    }

    b.items.forEach((it, ii) => {
      const isReps = it.kind === "ex" && it.mode === "reps";
      out.push({
        kind: it.kind,
        mode: it.mode ?? "time",
        duration: isReps ? Math.round(it.value / 2) : it.value,
        reps: isReps ? it.value : undefined,
        exId:   it.kind === "ex" ? it.exId : undefined,
        exName: it.kind === "ex" ? (it.exName ?? it.exId) : undefined,
        ropeId: b.ropeId,
        blockIdx: bi,
        blockLetter: b.letter,
        itemIdx: ii,
      });
    });
  });

  return out;
}
