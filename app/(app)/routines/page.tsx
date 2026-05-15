"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTINES as INITIAL_ROUTINES, ROPES, EXERCISES, getRope } from "@/lib/data";
import { routineDuration } from "@/lib/fmt";
import type { Routine, RoutineBlock } from "@/lib/types";
import Topbar from "@/components/Topbar";
import RoutineBlocksStrip from "@/components/RoutineBlocksStrip";
import BlockEditor from "@/components/BlockEditor";
import Modal from "@/components/Modal";

function PlusIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M7 4l13 8-13 8V4z" />
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

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>(INITIAL_ROUTINES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_ROUTINES[0].id);
  const [newOpen, setNewOpen] = useState(false);

  const rt = routines.find(r => r.id === selectedId) ?? routines[0];

  const updateRoutine = (next: Routine) =>
    setRoutines(rs => rs.map(r => r.id === next.id ? next : r));

  const addBlock = () => {
    const letter = String.fromCharCode(65 + rt.blocks.length);
    updateRoutine({
      ...rt,
      blocks: [...rt.blocks, {
        letter,
        ropeId: ROPES[0].id,
        items: [
          { kind: "ex", exId: EXERCISES[0].id, mode: "time", value: 30 },
          { kind: "rest", value: 15 },
        ],
      }],
    });
  };

  const updateBlock = (idx: number, next: RoutineBlock) =>
    updateRoutine({ ...rt, blocks: rt.blocks.map((b, i) => i === idx ? next : b) });

  const removeBlock = (idx: number) =>
    updateRoutine({
      ...rt,
      blocks: rt.blocks
        .filter((_, i) => i !== idx)
        .map((b, i) => ({ ...b, letter: String.fromCharCode(65 + i) })),
    });

  const createRoutine = () => {
    const id = "rt" + Date.now();
    const nuevo: Routine = {
      id,
      name: "Sin nombre",
      description: "",
      createdAt: "2026-05-11",
      transitionSec: 15,
      blocks: [{
        letter: "A",
        ropeId: ROPES[0].id,
        items: [
          { kind: "ex", exId: EXERCISES[0].id, mode: "time", value: 30 },
          { kind: "rest", value: 15 },
        ],
      }],
    };
    setRoutines(rs => [nuevo, ...rs]);
    setSelectedId(id);
    setNewOpen(false);
  };

  const deleteRoutine = () => {
    const remaining = routines.filter(r => r.id !== rt.id);
    setRoutines(remaining);
    if (remaining.length > 0) setSelectedId(remaining[0].id);
  };

  const duplicateRoutine = () => {
    const id = "rt" + Date.now();
    const copy: Routine = { ...rt, id, name: rt.name + " (copia)" };
    setRoutines(rs => {
      const idx = rs.findIndex(r => r.id === rt.id);
      const next = [...rs];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setSelectedId(id);
  };

  return (
    <>
      <Topbar
        title="Rutinas"
        right={
          <>
            <span className="chip">{routines.length} rutinas</span>
            <button className="btn primary" onClick={() => setNewOpen(true)}>
              <PlusIcon /> Nueva rutina
            </button>
          </>
        }
      />

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Routine list */}
        <div style={{ borderRight: "1px solid var(--line-c)", overflow: "auto", padding: "18px 16px" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>TUS RUTINAS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {routines.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                style={{
                  textAlign: "left", cursor: "pointer",
                  padding: "12px 14px",
                  borderRadius: "var(--radius)",
                  border: "1px solid " + (selectedId === r.id ? "var(--fg)" : "var(--line-c)"),
                  background: selectedId === r.id ? "var(--bg-2)" : "var(--bg-1)",
                  fontFamily: "inherit", color: "inherit",
                  appearance: "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <b style={{ fontSize: 14 }}>{r.name}</b>
                  <span className="mono faded" style={{ fontSize: 11 }}>
                    {Math.round(routineDuration(r) / 60)}m
                  </span>
                </div>
                <div style={{ marginTop: 8 }}>
                  <RoutineBlocksStrip routine={r} />
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 6, fontFamily: "var(--font-mono)" }}>
                  {r.blocks.length} bloques · {new Set(r.blocks.map(b => b.ropeId)).size} cuerdas
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div style={{ overflow: "auto", padding: "22px 28px" }}>
          {/* Header: name + description + summary card */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
            <div style={{ flex: "1 1 360px" }}>
              <input
                className="input"
                value={rt.name}
                onChange={e => updateRoutine({ ...rt, name: e.target.value })}
                style={{ fontSize: 28, fontWeight: 700, padding: "4px 6px", border: "0", background: "transparent", marginLeft: -6 }}
              />
              <textarea
                className="input"
                value={rt.description}
                onChange={e => updateRoutine({ ...rt, description: e.target.value })}
                rows={2}
                style={{ marginTop: 6, fontSize: 14, resize: "vertical" }}
              />
            </div>
            <div className="card" style={{ padding: "14px 18px", minWidth: 200 }}>
              <div className="eyebrow">RESUMEN</div>
              <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                <div>
                  <div className="display" style={{ fontSize: 24 }}>
                    {Math.round(routineDuration(rt) / 60)}
                    <span className="mono muted" style={{ fontSize: 12, marginLeft: 4 }}>min</span>
                  </div>
                  <div className="muted" style={{ fontSize: 11 }}>duración</div>
                </div>
                <div>
                  <div className="display" style={{ fontSize: 24 }}>{rt.blocks.length}</div>
                  <div className="muted" style={{ fontSize: 11 }}>bloques</div>
                </div>
              </div>
            </div>
          </div>

          {/* Transition time */}
          <div className="card" style={{ padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div className="eyebrow">CAMBIO DE CUERDA</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Tiempo entre bloques cuando hay que cambiar de cuerda.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                className="input mono"
                type="number"
                min={0}
                max={120}
                value={rt.transitionSec}
                onChange={e => updateRoutine({ ...rt, transitionSec: +e.target.value })}
                style={{ width: 80, textAlign: "center" }}
              />
              <span className="muted mono">segundos</span>
            </div>
          </div>

          {/* Blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {rt.blocks.map((b, bi) => (
              <BlockEditor
                key={bi}
                block={b}
                onChange={nb => updateBlock(bi, nb)}
                onRemove={() => removeBlock(bi)}
              />
            ))}
            <button className="btn" style={{ alignSelf: "flex-start" }} onClick={addBlock}>
              <PlusIcon /> Añadir bloque {String.fromCharCode(65 + rt.blocks.length)}
            </button>
          </div>

          {/* Footer actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 24, alignItems: "center" }}>
            <button
              className="btn primary lg"
              onClick={() => router.push(`/workout/${rt.id}`)}
            >
              <PlayIcon /> Empezar rutina
            </button>
            <button className="btn" onClick={duplicateRoutine}>Duplicar</button>
            <span className="spacer" />
            {routines.length > 1 && (
              <button className="btn danger" onClick={deleteRoutine}>
                <TrashIcon /> Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      {newOpen && (
        <Modal
          title="Nueva rutina"
          onClose={() => setNewOpen(false)}
          actions={
            <>
              <button className="btn ghost" onClick={() => setNewOpen(false)}>Cancelar</button>
              <button className="btn primary" onClick={createRoutine}>Crear</button>
            </>
          }
        >
          <p className="muted" style={{ fontSize: 14 }}>
            Crea una rutina vacía con un bloque inicial. Podrás ajustar todo después.
          </p>
        </Modal>
      )}
    </>
  );
}
