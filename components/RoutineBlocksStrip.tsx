import type { Routine } from "@/lib/types";
import { blockDuration, routineDuration } from "@/lib/fmt";
import { getRope } from "@/lib/data";

export default function RoutineBlocksStrip({ routine }: { routine: Routine }) {
  const total = routineDuration(routine);
  return (
    <div style={{ display: "flex", gap: 4, height: 8, borderRadius: 99, overflow: "hidden", background: "var(--bg-3)" }}>
      {routine.blocks.map((b, i) => {
        const dur = blockDuration(b);
        const w = total > 0 ? (dur / total) * 100 : 0;
        const rope = getRope(b.ropeId);
        return (
          <div
            key={i}
            title={`Bloque ${b.letter} · ${rope?.name}`}
            style={{ width: `${w}%`, background: rope?.color ?? "var(--accent)" }}
          />
        );
      })}
    </div>
  );
}
