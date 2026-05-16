import { describe, it, expect } from "vitest";
import { buildSteps } from "../buildSteps";
import type { Routine, RoutineBlock } from "../types";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeRoutine(blocks: RoutineBlock[], transitionSec = 15): Routine {
  return {
    id: "rt1",
    name: "Test routine",
    description: "",
    createdAt: "2024-01-01",
    transitionSec,
    blocks,
  };
}

function block(
  letter: string,
  ropeId: string,
  items: RoutineBlock["items"],
): RoutineBlock {
  return { letter, ropeId, items };
}

// ── empty routine ────────────────────────────────────────────────────────────

describe("buildSteps – empty routine", () => {
  it("returns an empty array when there are no blocks", () => {
    expect(buildSteps(makeRoutine([]))).toHaveLength(0);
  });

  it("returns an empty array when the single block has no items", () => {
    const rt = makeRoutine([block("A", "r1", [])]);
    expect(buildSteps(rt)).toHaveLength(0);
  });
});

// ── single block ─────────────────────────────────────────────────────────────

describe("buildSteps – single block", () => {
  const rt = makeRoutine([
    block("A", "r1", [
      { kind: "ex", exId: "e1", exName: "Jump", mode: "time", value: 30 },
      { kind: "rest", value: 15 },
    ]),
  ]);
  const steps = buildSteps(rt);

  it("produces exactly 2 steps (no transition for the first block)", () => {
    expect(steps).toHaveLength(2);
  });

  it("assigns correct blockIdx and blockLetter", () => {
    expect(steps[0].blockIdx).toBe(0);
    expect(steps[0].blockLetter).toBe("A");
    expect(steps[1].blockIdx).toBe(0);
  });

  it("assigns correct itemIdx", () => {
    expect(steps[0].itemIdx).toBe(0);
    expect(steps[1].itemIdx).toBe(1);
  });

  it("passes through duration for time-mode exercises", () => {
    expect(steps[0].kind).toBe("ex");
    expect(steps[0].duration).toBe(30);
    expect(steps[0].mode).toBe("time");
  });

  it("propagates ropeId from block", () => {
    expect(steps[0].ropeId).toBe("r1");
    expect(steps[1].ropeId).toBe("r1");
  });

  it("copies exName onto exercise steps", () => {
    expect(steps[0].exName).toBe("Jump");
  });

  it("sets kind=rest for rest items", () => {
    expect(steps[1].kind).toBe("rest");
    expect(steps[1].duration).toBe(15);
  });
});

// ── rep-mode exercises ───────────────────────────────────────────────────────

describe("buildSteps – reps → duration conversion", () => {
  it("converts reps to Math.round(reps / 2) seconds", () => {
    const rt = makeRoutine([
      block("A", "r1", [
        { kind: "ex", exId: "e1", mode: "reps", value: 20 },
      ]),
    ]);
    const [step] = buildSteps(rt);
    expect(step.duration).toBe(10); // 20 / 2
    expect(step.reps).toBe(20);
    expect(step.mode).toBe("reps");
  });

  it("rounds up odd rep counts", () => {
    const rt = makeRoutine([
      block("A", "r1", [
        { kind: "ex", exId: "e1", mode: "reps", value: 15 },
      ]),
    ]);
    const [step] = buildSteps(rt);
    expect(step.duration).toBe(8); // Math.round(15 / 2) = 8
  });

  it("does not set reps for time-mode steps", () => {
    const rt = makeRoutine([
      block("A", "r1", [
        { kind: "ex", exId: "e1", mode: "time", value: 30 },
      ]),
    ]);
    const [step] = buildSteps(rt);
    expect(step.reps).toBeUndefined();
  });
});

// ── transitions ──────────────────────────────────────────────────────────────

describe("buildSteps – rope-change transitions", () => {
  const rt = makeRoutine(
    [
      block("A", "rope-red", [{ kind: "ex", exId: "e1", mode: "time", value: 30 }]),
      block("B", "rope-blue", [{ kind: "ex", exId: "e2", mode: "time", value: 20 }]),
    ],
    15,
  );
  const steps = buildSteps(rt);

  it("inserts a transition step between blocks with different ropes", () => {
    expect(steps).toHaveLength(3);
    expect(steps[1].kind).toBe("transition");
  });

  it("uses transitionSec as the transition duration", () => {
    expect(steps[1].duration).toBe(15);
  });

  it("sets fromRope and toRope on the transition step", () => {
    expect(steps[1].fromRope).toBe("rope-red");
    expect(steps[1].toRope).toBe("rope-blue");
  });

  it("assigns the transition to the incoming block's idx/letter", () => {
    expect(steps[1].blockIdx).toBe(1);
    expect(steps[1].blockLetter).toBe("B");
  });

  it("exercise steps after transition have the new ropeId", () => {
    expect(steps[2].ropeId).toBe("rope-blue");
  });
});

describe("buildSteps – no transition when rope stays the same", () => {
  const rt = makeRoutine([
    block("A", "r1", [{ kind: "ex", exId: "e1", mode: "time", value: 30 }]),
    block("B", "r1", [{ kind: "ex", exId: "e2", mode: "time", value: 20 }]),
  ]);

  it("does NOT insert a transition step", () => {
    const steps = buildSteps(rt);
    expect(steps).toHaveLength(2);
    expect(steps.every((s) => s.kind !== "transition")).toBe(true);
  });
});

// ── multiple blocks with mixed transitions ───────────────────────────────────

describe("buildSteps – multiple blocks, mixed rope changes", () => {
  // A(r1) → B(r2) → C(r2) → D(r3)
  const rt = makeRoutine(
    [
      block("A", "r1", [{ kind: "ex", exId: "e1", mode: "time", value: 10 }]),
      block("B", "r2", [{ kind: "ex", exId: "e2", mode: "time", value: 10 }]),
      block("C", "r2", [{ kind: "ex", exId: "e3", mode: "time", value: 10 }]),
      block("D", "r3", [{ kind: "ex", exId: "e4", mode: "time", value: 10 }]),
    ],
    5,
  );
  const steps = buildSteps(rt);

  it("inserts only 2 transitions (A→B and C→D)", () => {
    const transitions = steps.filter((s) => s.kind === "transition");
    expect(transitions).toHaveLength(2);
  });

  it("transition 1 is between r1 and r2", () => {
    const t = steps.find((s) => s.kind === "transition" && s.fromRope === "r1");
    expect(t?.toRope).toBe("r2");
  });

  it("transition 2 is between r2 and r3", () => {
    const t = steps.find((s) => s.kind === "transition" && s.fromRope === "r2");
    expect(t?.toRope).toBe("r3");
  });

  it("total step count is 4 exercises + 2 transitions = 6", () => {
    expect(steps).toHaveLength(6);
  });
});

// ── exName fallback ──────────────────────────────────────────────────────────

describe("buildSteps – exName fallback", () => {
  it("uses exName when provided", () => {
    const rt = makeRoutine([
      block("A", "r1", [{ kind: "ex", exId: "abc", exName: "Jump rope", mode: "time", value: 30 }]),
    ]);
    expect(buildSteps(rt)[0].exName).toBe("Jump rope");
  });

  it("falls back to exId when exName is absent", () => {
    const rt = makeRoutine([
      block("A", "r1", [{ kind: "ex", exId: "abc", mode: "time", value: 30 }]),
    ]);
    expect(buildSteps(rt)[0].exName).toBe("abc");
  });

  it("does not set exName on rest steps", () => {
    const rt = makeRoutine([block("A", "r1", [{ kind: "rest", value: 10 }])]);
    expect(buildSteps(rt)[0].exName).toBeUndefined();
  });
});
