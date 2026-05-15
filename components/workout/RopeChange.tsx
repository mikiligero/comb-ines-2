import type { Rope } from "@/lib/types";
import type { WorkoutStep } from "./useWorkoutEngine";
import { fmtTime } from "@/lib/fmt";

type Props = {
  step: WorkoutStep;
  elapsed: number;
  remaining: number;
  fromRope: Rope;
  toRope: Rope;
};

export default function RopeChange({ step, elapsed, remaining, fromRope, toRope }: Props) {
  const progress = step.duration > 0 ? (elapsed / step.duration) * 100 : 0;

  return (
    <div style={{
      gridColumn: "1 / -1",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 40, gap: 24, position: "relative",
    }}>
      <div className="eyebrow" style={{ color: "var(--warn)" }}>CAMBIO DE CUERDA</div>
      <h1 style={{ fontSize: 48, margin: 0, textAlign: "center" }}>
        Prepara tu próxima cuerda
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 10 }}>
        {/* From rope — dimmed */}
        <div style={{ textAlign: "center", opacity: 0.5 }}>
          <span style={{
            width: 80, height: 80, borderRadius: 16,
            background: fromRope.color, display: "inline-block",
            border: "1px solid var(--line-c)",
          }} />
          <div style={{ marginTop: 10, fontWeight: 600 }}>{fromRope.name}</div>
          <div className="mono muted" style={{ fontSize: 12 }}>{fromRope.weight}g</div>
        </div>

        {/* Arrow */}
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-2)" }}>
          <path d="M9 6l6 6-6 6" />
        </svg>

        {/* To rope — prominent with glow */}
        <div style={{ textAlign: "center" }}>
          <span style={{
            width: 120, height: 120, borderRadius: 24,
            background: toRope.color, display: "inline-block",
            border: "1px solid var(--line-c)",
            boxShadow: `0 0 40px color-mix(in oklab, ${toRope.color} 50%, transparent)`,
          }} />
          <div style={{ marginTop: 10, fontSize: 22, fontWeight: 700 }}>{toRope.name}</div>
          <div className="mono muted">{toRope.weight}g · {toRope.type}</div>
        </div>
      </div>

      <div className="big-timer" style={{ fontSize: "clamp(90px, 14vw, 180px)", marginTop: 10 }}>
        {fmtTime(remaining)}
      </div>

      <div style={{ width: "min(520px, 80%)" }}>
        <div className="bar">
          <i style={{ width: `${progress}%`, background: "var(--warn)" }} />
        </div>
      </div>
    </div>
  );
}
