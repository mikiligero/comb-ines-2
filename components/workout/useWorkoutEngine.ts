"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Routine } from "@/lib/types";
import { buildSteps, type WorkoutStep } from "@/lib/buildSteps";
import { fmtTime } from "@/lib/fmt";

export type { WorkoutStep };

export type WorkoutEngine = {
  steps: WorkoutStep[];
  idx: number;
  elapsed: number;
  running: boolean;
  hr: number;
  calBurnt: number;
  step: WorkoutStep | undefined;
  total: number;
  elapsedTotal: number;
  remaining: number;
  totalProgress: number;
  done: boolean;
  // derived display helpers
  nextEx: WorkoutStep | undefined;
  upcoming: WorkoutStep | undefined;
  upcomingInLabel: string | null;
  toggle: () => void;
  next: () => void;
  prev: () => void;
};

export function useWorkoutEngine(routine: Routine): WorkoutEngine {
  const steps = useMemo(() => buildSteps(routine), [routine]);

  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [hr, setHr] = useState(132);
  const [calBurnt, setCalBurnt] = useState(0);

  const step = steps[idx];
  const total = useMemo(() => steps.reduce((s, st) => s + st.duration, 0), [steps]);
  const elapsedTotal = steps.slice(0, idx).reduce((s, st) => s + st.duration, 0) + elapsed;
  const remaining = step ? Math.max(0, step.duration - elapsed) : 0;
  const totalProgress = total > 0 ? (elapsedTotal / total) * 100 : 0;
  const done = idx >= steps.length;

  // Next exercise step (for "NEXT" label)
  const nextEx = steps.slice(idx + 1).find(s => s.kind === "ex");

  // Upcoming rope change within next 5 steps
  const upcoming = steps.slice(idx + 1, idx + 6).find(s => s.kind === "transition");
  let upcomingInLabel: string | null = null;
  if (upcoming) {
    const upcomingIdx = steps.indexOf(upcoming);
    const secs = steps.slice(idx, upcomingIdx).reduce((s, st, i) =>
      s + (i === 0 ? Math.max(0, st.duration - elapsed) : st.duration), 0
    );
    upcomingInLabel = fmtTime(secs);
  }

  // Timer
  useEffect(() => {
    if (!running || !step) return;
    const t = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= step.duration) {
          if (idx + 1 >= steps.length) {
            setRunning(false);
            return step.duration;
          }
          setIdx(i => i + 1);
          return 0;
        }
        return e + 1;
      });
      setHr(h => {
        const drift = step.kind === "ex"
          ? (Math.random() * 4 - 1)
          : (Math.random() * 3 - 2);
        return Math.max(110, Math.min(175, h + drift));
      });
      setCalBurnt(c => c + (step.kind === "ex" ? 0.12 : 0.04));
    }, 1000);
    return () => clearInterval(t);
  }, [running, idx, step, steps.length]);

  // Keyboard shortcuts
  const next = useCallback(() => {
    setIdx(i => Math.min(steps.length - 1, i + 1));
    setElapsed(0);
  }, [steps.length]);

  const prev = useCallback(() => {
    setIdx(i => Math.max(0, i - 1));
    setElapsed(0);
  }, []);

  const toggle = useCallback(() => setRunning(r => !r), []);

  return {
    steps, idx, elapsed, running, hr, calBurnt,
    step, total, elapsedTotal, remaining, totalProgress, done,
    nextEx, upcoming, upcomingInLabel,
    toggle, next, prev,
  };
}
