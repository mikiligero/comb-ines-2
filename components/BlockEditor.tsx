"use client";

import type { Rope, Exercise, RoutineBlock, RoutineItem } from "@/lib/types";
import { fmtTime, blockDuration } from "@/lib/fmt";

type Props = {
  block: RoutineBlock;
  ropes: Rope[];
  exercises: Exercise[];
  onChange: (b: RoutineBlock) => void;
  onRemove: () => void;
};

function DragIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <circle cx="9"  cy="6"  r="1.3" /><circle cx="15" cy="6"  r="1.3" />
      <circle cx="9"  cy="12" r="1.3" /><circle cx="15" cy="12" r="1.3" />
      <circle cx="9"  cy="18" r="1.3" /><circle cx="15" cy="18" r="1.3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
    </svg>
  );
}

function PlusIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function BlockEditor({ block, ropes, exercises, onChange, onRemove }: Props) {
  const rope = ropes.find(r => r.id === block.ropeId);
  const dur = blockDuration(block);

  const update = (idx: number, next: RoutineItem) =>
    onChange({ ...block, items: block.items.map((it, i) => i === idx ? next : it) });
  const remove = (idx: number) =>
    onChange({ ...block, items: block.items.filter((_, i) => i !== idx) });
  const addEx = () =>
    onChange({ ...block, items: [...block.items, { kind: "ex", exId: exercises[0]?.id, exName: exercises[0]?.name, mode: "time", value: 30 }] });
  const addRest = () =>
    onChange({ ...block, items: [...block.items, { kind: "rest", value: 15 }] });

  return (
    <div className="block">
      <div className="block-hd">
        <div className="block-letter">{block.letter}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Bloque {block.letter}</div>
          <div className="muted mono" style={{ fontSize: 11 }}>
            {block.items.filter(i => i.kind === "ex").length} ejercicios · {fmtTime(dur)}
          </div>
        </div>
        <label className="rope-swatch" style={{ position: "relative" }}>
          <span className="dot" style={{ background: rope?.color }} />
          <select
            className="input"
            value={block.ropeId}
            onChange={e => onChange({ ...block, ropeId: e.target.value })}
            style={{ padding: "6px 28px 6px 8px", fontSize: 13, height: 32, minWidth: 160 }}
          >
            {ropes.map(r => (
              <option key={r.id} value={r.id}>{r.name} · {r.weight}g</option>
            ))}
          </select>
        </label>
        <button className="btn icon ghost" onClick={onRemove} title="Eliminar bloque">
          <TrashIcon />
        </button>
      </div>

      <div className="block-body">
        {block.items.map((it, idx) => (
          <div key={idx} className="exercise-row">
            <span className="handle"><DragIcon /></span>

            {it.kind === "ex" ? (
              <select
                className="input"
                value={it.exId}
                onChange={e => {
                  const ex = exercises.find(ex => ex.id === e.target.value);
                  update(idx, { ...it, exId: e.target.value, exName: ex?.name });
                }}
                style={{ padding: "7px 10px", fontSize: 14, height: 34 }}
              >
                {exercises.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--fg-2)", fontStyle: "italic", paddingLeft: 6 }}>
                <span className="tag">REST</span>
                <span style={{ fontSize: 14 }}>Descanso</span>
              </div>
            )}

            {it.kind === "ex" ? (
              <div className="seg" role="tablist">
                <button className={it.mode === "time" ? "on" : ""} onClick={() => update(idx, { ...it, mode: "time" })}>TIEMPO</button>
                <button className={it.mode === "reps" ? "on" : ""} onClick={() => update(idx, { ...it, mode: "reps" })}>REPS</button>
              </div>
            ) : <span />}

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                className="input mono"
                type="number"
                min={1}
                value={it.value}
                onChange={e => update(idx, { ...it, value: +e.target.value })}
                style={{ width: 70, textAlign: "center", padding: "6px 8px", height: 34, fontSize: 14 }}
              />
              <span className="muted mono" style={{ fontSize: 11, width: 28 }}>
                {it.kind === "rest" || it.mode === "time" ? "seg" : "reps"}
              </span>
            </div>

            <button className="btn icon ghost" onClick={() => remove(idx)} title="Eliminar">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, padding: "10px 18px 14px" }}>
          <button className="btn ghost" onClick={addEx} style={{ padding: "6px 12px", fontSize: 13 }}>
            <PlusIcon /> Salto
          </button>
          <button className="btn ghost" onClick={addRest} style={{ padding: "6px 12px", fontSize: 13 }}>
            <PlusIcon /> Descanso
          </button>
        </div>
      </div>
    </div>
  );
}
