import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkoutEngine } from "../useWorkoutEngine";
import type { Routine } from "@/lib/types";

// ── fixtures ──────────────────────────────────────────────────────────────────

const singleBlockRoutine: Routine = {
  id: "rt1",
  name: "Solo",
  description: "",
  createdAt: "2024-01-01",
  transitionSec: 10,
  blocks: [
    {
      letter: "A",
      ropeId: "r1",
      items: [
        { kind: "ex", exId: "e1", exName: "Jump", mode: "time", value: 5 },
        { kind: "rest", value: 3 },
      ],
    },
  ],
};

const twoBlockRoutine: Routine = {
  id: "rt2",
  name: "Two blocks",
  description: "",
  createdAt: "2024-01-01",
  transitionSec: 10,
  blocks: [
    {
      letter: "A",
      ropeId: "r1",
      items: [{ kind: "ex", exId: "e1", exName: "Jump", mode: "time", value: 5 }],
    },
    {
      letter: "B",
      ropeId: "r2",
      items: [{ kind: "ex", exId: "e2", exName: "Double", mode: "time", value: 8 }],
    },
  ],
};

// ── setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

// ── initial state ─────────────────────────────────────────────────────────────

describe("useWorkoutEngine – initial state", () => {
  it("starts at idx 0", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    expect(result.current.idx).toBe(0);
  });

  it("starts with elapsed = 0", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    expect(result.current.elapsed).toBe(0);
  });

  it("starts running = true", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    expect(result.current.running).toBe(true);
  });

  it("done = false on first render", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    expect(result.current.done).toBe(false);
  });

  it("step is the first step", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    expect(result.current.step?.kind).toBe("ex");
    expect(result.current.step?.exName).toBe("Jump");
  });

  it("totalProgress starts at 0", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    expect(result.current.totalProgress).toBe(0);
  });

  it("remaining equals first step duration", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    expect(result.current.remaining).toBe(5);
  });

  it("total equals sum of all step durations", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    // steps: ex(5) + rest(3) = 8
    expect(result.current.total).toBe(8);
  });
});

// ── toggle ─────────────────────────────────────────────────────────────────────

describe("useWorkoutEngine – toggle", () => {
  it("pauses when running", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { result.current.toggle(); });
    expect(result.current.running).toBe(false);
  });

  it("resumes when paused", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { result.current.toggle(); }); // pause
    act(() => { result.current.toggle(); }); // resume
    expect(result.current.running).toBe(true);
  });
});

// ── next / prev ───────────────────────────────────────────────────────────────

describe("useWorkoutEngine – next", () => {
  it("advances idx by 1", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { result.current.next(); });
    expect(result.current.idx).toBe(1);
  });

  it("resets elapsed to 0 on next", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    // tick 2 seconds first
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.elapsed).toBe(2);
    act(() => { result.current.next(); });
    expect(result.current.elapsed).toBe(0);
  });

  it("does not advance beyond last step", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    // 2 steps total — advance to last step
    act(() => { result.current.next(); result.current.next(); result.current.next(); });
    expect(result.current.idx).toBe(1); // capped at steps.length - 1
  });
});

describe("useWorkoutEngine – prev", () => {
  it("decrements idx by 1", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { result.current.next(); }); // go to idx 1
    act(() => { result.current.prev(); }); // back to 0
    expect(result.current.idx).toBe(0);
  });

  it("does not go below 0", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { result.current.prev(); });
    expect(result.current.idx).toBe(0);
  });

  it("resets elapsed to 0 on prev", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { result.current.next(); });
    act(() => { vi.advanceTimersByTime(2000); });
    act(() => { result.current.prev(); });
    expect(result.current.elapsed).toBe(0);
  });
});

// ── timer progression ─────────────────────────────────────────────────────────

describe("useWorkoutEngine – timer", () => {
  it("increments elapsed each second while running", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.elapsed).toBe(3);
  });

  it("does not tick while paused", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { result.current.toggle(); }); // pause
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.elapsed).toBe(0);
  });

  it("auto-advances to next step when current step duration expires", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    // First step is 5s, advance 5 seconds
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.idx).toBe(1); // moved to rest step
    expect(result.current.elapsed).toBe(0);
  });

  it("remaining decreases as time passes", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.remaining).toBe(3); // 5 - 2
  });

  it("totalProgress increases proportionally", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    // total = 8s; after 4s → 50%
    act(() => { vi.advanceTimersByTime(4000); });
    expect(result.current.totalProgress).toBeCloseTo(50, 0);
  });
});

// ── done state ────────────────────────────────────────────────────────────────

describe("useWorkoutEngine – done", () => {
  it("done becomes true after all steps complete", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    // total = 8s: ex(5) + rest(3). Advance in two separate acts so React
    // re-registers the interval after the step transition at 5s.
    act(() => { vi.advanceTimersByTime(5000); }); // finishes first step, idx → 1
    act(() => { vi.advanceTimersByTime(3000); }); // finishes second step → done
    expect(result.current.done).toBe(true);
  });

  it("stops running when done", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    act(() => { vi.advanceTimersByTime(5000); });
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.running).toBe(false);
  });
});

// ── nextEx / upcoming ─────────────────────────────────────────────────────────

describe("useWorkoutEngine – nextEx", () => {
  it("nextEx is undefined when only one exercise exists and no remaining ex steps", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    // steps: ex, rest — nextEx from idx 0 is undefined (rest is not an ex)
    expect(result.current.nextEx).toBeUndefined();
  });

  it("nextEx points to the next exercise step", () => {
    // Two-block routine produces: ex(A) → transition → ex(B)
    const { result } = renderHook(() => useWorkoutEngine(twoBlockRoutine));
    // At idx 0 (ex A), nextEx should be ex B (skipping the transition)
    expect(result.current.nextEx?.exName).toBe("Double");
  });
});

describe("useWorkoutEngine – upcoming (transition warning)", () => {
  it("upcoming is defined when a transition is within the next 5 steps", () => {
    const { result } = renderHook(() => useWorkoutEngine(twoBlockRoutine));
    // steps: ex(A, 5s) | transition(10s) | ex(B, 8s) — transition is 1 step ahead
    expect(result.current.upcoming).toBeDefined();
    expect(result.current.upcoming?.kind).toBe("transition");
  });

  it("upcomingInLabel formats the seconds until the transition", () => {
    const { result } = renderHook(() => useWorkoutEngine(twoBlockRoutine));
    // 5s remaining on first step → "00:05"
    expect(result.current.upcomingInLabel).toBe("00:05");
  });

  it("upcoming is undefined when no transition is within 5 steps", () => {
    const { result } = renderHook(() => useWorkoutEngine(singleBlockRoutine));
    expect(result.current.upcoming).toBeUndefined();
    expect(result.current.upcomingInLabel).toBeNull();
  });
});
