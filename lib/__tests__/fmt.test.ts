import { describe, it, expect } from "vitest";
import { fmtTime, blockDuration, routineDuration } from "../fmt";
import type { RoutineBlock, Routine } from "../types";

// ── fmtTime ─────────────────────────────────────────────────────────────────

describe("fmtTime", () => {
  it("formats zero as 00:00", () => {
    expect(fmtTime(0)).toBe("00:00");
  });

  it("formats seconds under a minute", () => {
    expect(fmtTime(9)).toBe("00:09");
    expect(fmtTime(59)).toBe("00:59");
  });

  it("formats exactly one minute", () => {
    expect(fmtTime(60)).toBe("01:00");
  });

  it("formats minutes and seconds", () => {
    expect(fmtTime(65)).toBe("01:05");
    expect(fmtTime(3599)).toBe("59:59");
  });

  it("handles hours as overflow minutes (no HH column)", () => {
    expect(fmtTime(3600)).toBe("60:00");
    expect(fmtTime(3661)).toBe("61:01");
  });

  it("clamps negative values to 00:00", () => {
    expect(fmtTime(-1)).toBe("00:00");
    expect(fmtTime(-100)).toBe("00:00");
  });

  it("rounds fractional seconds", () => {
    expect(fmtTime(0.4)).toBe("00:00");
    expect(fmtTime(0.5)).toBe("00:01");
    expect(fmtTime(59.9)).toBe("01:00");
  });
});

// ── blockDuration ────────────────────────────────────────────────────────────

describe("blockDuration", () => {
  const block: RoutineBlock = {
    letter: "A",
    ropeId: "r1",
    items: [
      { kind: "ex", exId: "e1", mode: "time", value: 30 },
      { kind: "rest", value: 15 },
      { kind: "ex", exId: "e2", mode: "reps", value: 20 },
    ],
  };

  it("sums time/rest values directly and converts reps at Math.round(reps/2)", () => {
    // 30 (time) + 15 (rest) + Math.round(20/2)=10 (reps) = 55
    expect(blockDuration(block)).toBe(55);
  });

  it("returns 0 for an empty block", () => {
    const empty: RoutineBlock = { letter: "A", ropeId: "r1", items: [] };
    expect(blockDuration(empty)).toBe(0);
  });

  it("handles a single item", () => {
    const single: RoutineBlock = {
      letter: "A",
      ropeId: "r1",
      items: [{ kind: "ex", exId: "e1", mode: "time", value: 45 }],
    };
    expect(blockDuration(single)).toBe(45);
  });
});

// ── routineDuration ──────────────────────────────────────────────────────────

describe("routineDuration", () => {
  const makeBlock = (values: number[], letter = "A", ropeId = "r1"): RoutineBlock => ({
    letter,
    ropeId,
    items: values.map((v) => ({ kind: "ex", exId: "e1", mode: "time", value: v })),
  });

  it("returns 0 for a routine with no blocks", () => {
    const rt: Routine = {
      id: "rt1", name: "Empty", description: "", createdAt: "", transitionSec: 10, blocks: [],
    };
    expect(routineDuration(rt)).toBe(0);
  });

  it("returns block total when there is a single block (no transitions)", () => {
    const rt: Routine = {
      id: "rt1", name: "Solo", description: "", createdAt: "", transitionSec: 15,
      blocks: [makeBlock([30, 20])],
    };
    // 50 seconds, 0 transitions
    expect(routineDuration(rt)).toBe(50);
  });

  it("only counts transitions where the rope actually changes", () => {
    const rt: Routine = {
      id: "rt1", name: "Multi", description: "", createdAt: "", transitionSec: 10,
      blocks: [
        makeBlock([30], "A", "r1"),
        makeBlock([20], "B", "r2"), // rope changes: +1 transition
        makeBlock([10], "C", "r1"), // rope changes: +1 transition
      ],
    };
    // blocks = 60, 2 rope changes × 10s = 20 → total = 80
    expect(routineDuration(rt)).toBe(80);
  });

  it("skips transition when adjacent blocks share the same rope", () => {
    const rt: Routine = {
      id: "rt1", name: "SameRope", description: "", createdAt: "", transitionSec: 10,
      blocks: [
        makeBlock([30], "A", "r1"),
        makeBlock([20], "B", "r1"), // same rope → no transition
        makeBlock([10], "C", "r2"), // rope changes: +1 transition
      ],
    };
    // blocks = 60, 1 rope change × 10s = 10 → total = 70
    expect(routineDuration(rt)).toBe(70);
  });

  it("transition time is 0 when transitionSec is 0", () => {
    const rt: Routine = {
      id: "rt1", name: "NoGap", description: "", createdAt: "", transitionSec: 0,
      blocks: [makeBlock([30], "A"), makeBlock([20], "B")],
    };
    expect(routineDuration(rt)).toBe(50);
  });
});
