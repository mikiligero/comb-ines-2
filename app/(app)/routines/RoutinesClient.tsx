"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRoutine, deleteRoutine } from "@/lib/actions/routines";
import { routineDuration } from "@/lib/fmt";
import type { Routine, RoutineBlock, Rope, Exercise } from "@/lib/types";
import Topbar from "@/components/Topbar";
import RoutineBlocksStrip from "@/components/RoutineBlocksStrip";
import BlockEditor from "@/components/BlockEditor";
import Modal from "@/components/Modal";

function PlusIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function PlayIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 4l13 8-13 8V4z" /></svg>;
}
function TrashIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>;
}
function SaveIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}

type Props = { initialRoutines: Routine[]; ropes: Rope[]; exercises: Exercise[] };

export default function RoutinesClient({ initialRoutines, ropes, exercises }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(initialRoutines[0]?.id ?? null);
  const [editing, setEditing] = useState<Routine | null>(initialRoutines[0] ?? null);
  const [dirty, setDirty] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const ropeMap = new Map(ropes.map(r => [r.id, r]));
  const routineList = initialRoutines;
  const rt = editing;

  const selectRoutine = (r: Routine) => {
    setSelectedId(r.id);
    setEditing(r);
    setDirty(false);
  };

  const updateEditing = (next: Routine) => { setEditing(next); setDirty(true); };

  const handleSave = () => {
    if (!rt) return;
    startTransition(async () => {
      const savedId = await saveRoutine(rt);
      setDirty(false);
      setSelectedId(savedId);
      router.refresh();
    });
  };

  const handleCreate = () => {
    const blank: Routine = {
      id: "new-" + Date.now(),
      name: "Sin nombre",
      description: "",
      createdAt: new Date().toISOString().slice(0, 10),
      transitionSec: 15,
      blocks: [{
        letter: "A",
        ropeId: ropes[0]?.id ?? "",
        items: [
          { kind: "ex", exId: exercises[0]?.id, mode: "time", value: 30 },
          { kind: "rest", value: 15 },
        ],
      }],
    };
    startTransition(async () => {
      const savedId = await saveRoutine(blank);
      setNewOpen(false);
      setSelectedId(savedId);
      setDirty(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!rt || rt.id.startsWith("new-")) return;
    startTransition(async () => {
      await deleteRoutine(rt.id);
      setEditing(null);
      setSelectedId(null);
      router.refresh();
    });
  };

  const handleDuplicate = () => {
    if (!rt) return;
    const copy: Routine = { ...rt, id: "new-" + Date.now(), name: rt.name + " (copia)" };
    startTransition(async () => {
      const savedId = await saveRoutine(copy);
      setSelectedId(savedId);
      setDirty(false);
      router.refresh();
    });
  };

  const addBlock = () => {
    if (!rt) return;
    updateEditing({
      ...rt,
      blocks: [...rt.blocks, {
        letter: String.fromCharCode(65 + rt.blocks.length),
        ropeId: ropes[0]?.id ?? "",
        items: [
          { kind: "ex", exId: exercises[0]?.id, mode: "time", value: 30 },
          { kind: "rest", value: 15 },
        ],
      }],
    });
  };

  const updateBlock = (idx: number, next: RoutineBlock) =>
    rt && updateEditing({ ...rt, blocks: rt.blocks.map((b, i) => i === idx ? next : b) });

  const removeBlock = (idx: number) =>
    rt && updateEditing({
      ...rt,
      blocks: rt.blocks.filter((_, i) => i !== idx).map((b, i) => ({ ...b, letter: String.fromCharCode(65 + i) })),
    });

  return (
    <>
      <Topbar title="Rutinas" right={
        <>
          <span className="chip">{routineList.length} rutinas</span>
          <button className="btn primary" onClick={() => setNewOpen(true)}><PlusIcon /> Nueva rutina</button>
        </>
      } />

      <div className="split-3-1 routines-split scroll-area" style={{ flex: 1, overflow: "hidden", padding: 0 }}>
        {/* Lista */}
        <div className="routines-list" style={{ borderRight: "1px solid var(--line-c)", overflow: "auto", padding: "18px 16px" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>TUS RUTINAS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {routineList.map(r => (
              <button key={r.id} onClick={() => selectRoutine(r)} style={{ textAlign: "left", cursor: "pointer", padding: "12px 14px", borderRadius: "var(--radius)", border: "1px solid " + (selectedId === r.id ? "var(--fg)" : "var(--line-c)"), background: selectedId === r.id ? "var(--bg-2)" : "var(--bg-1)", fontFamily: "inherit", color: "inherit", appearance: "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <b style={{ fontSize: 14 }}>{r.name}</b>
                  <span className="mono faded" style={{ fontSize: 11 }}>{Math.round(routineDuration(r) / 60)}m</span>
                </div>
                <div style={{ marginTop: 8 }}><RoutineBlocksStrip routine={r} ropeMap={ropeMap} /></div>
                <div className="muted" style={{ fontSize: 11, marginTop: 6, fontFamily: "var(--font-mono)" }}>
                  {r.blocks.length} bloques · {new Set(r.blocks.map(b => b.ropeId)).size} cuerdas
                </div>
              </button>
            ))}
            {routineList.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Aún no tienes rutinas.</p>}
          </div>
        </div>

        {/* Editor */}
        {rt ? (
          <div className="routines-editor" style={{ overflow: "auto", padding: "22px 28px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ flex: "1 1 360px" }}>
                <input className="input" value={rt.name} onChange={e => updateEditing({ ...rt, name: e.target.value })} style={{ fontSize: 28, fontWeight: 700, padding: "4px 6px", border: 0, background: "transparent", marginLeft: -6 }} />
                <textarea className="input" value={rt.description} onChange={e => updateEditing({ ...rt, description: e.target.value })} rows={2} style={{ marginTop: 6, fontSize: 14, resize: "vertical" }} />
              </div>
              <div className="card" style={{ padding: "14px 18px", minWidth: 200 }}>
                <div className="eyebrow">RESUMEN</div>
                <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                  <div><div className="display" style={{ fontSize: 24 }}>{Math.round(routineDuration(rt) / 60)}<span className="mono muted" style={{ fontSize: 12, marginLeft: 4 }}>min</span></div><div className="muted" style={{ fontSize: 11 }}>duración</div></div>
                  <div><div className="display" style={{ fontSize: 24 }}>{rt.blocks.length}</div><div className="muted" style={{ fontSize: 11 }}>bloques</div></div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div><div className="eyebrow">CAMBIO DE CUERDA</div><div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Tiempo entre bloques cuando hay que cambiar de cuerda.</div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input className="input mono" type="number" min={0} max={120} value={rt.transitionSec} onChange={e => updateEditing({ ...rt, transitionSec: +e.target.value })} style={{ width: 80, textAlign: "center" }} />
                <span className="muted mono">segundos</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {rt.blocks.map((b, bi) => (
                <BlockEditor key={bi} block={b} ropes={ropes} exercises={exercises} onChange={nb => updateBlock(bi, nb)} onRemove={() => removeBlock(bi)} />
              ))}
              <button className="btn" style={{ alignSelf: "flex-start" }} onClick={addBlock}>
                <PlusIcon /> Añadir bloque {String.fromCharCode(65 + rt.blocks.length)}
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn primary lg" onClick={() => router.push(`/workout/${rt.id}`)} disabled={dirty || rt.id.startsWith("new-")}>
                <PlayIcon /> Empezar rutina
              </button>
              <button className="btn lg" onClick={handleSave} disabled={!dirty || pending} style={{ opacity: dirty ? 1 : 0.4 }}>
                <SaveIcon /> {pending ? "Guardando..." : "Guardar"}
              </button>
              <button className="btn" onClick={handleDuplicate} disabled={pending}>Duplicar</button>
              <span className="spacer" />
              {!rt.id.startsWith("new-") && (
                <button className="btn danger" onClick={handleDelete} disabled={pending}><TrashIcon /> Eliminar</button>
              )}
            </div>
          </div>
        ) : (
          <div className="routines-editor" style={{ display: "grid", placeItems: "center", padding: 40 }}>
            <div style={{ textAlign: "center" }}>
              <p className="muted" style={{ marginBottom: 16 }}>Crea tu primera rutina.</p>
              <button className="btn primary" onClick={() => setNewOpen(true)}><PlusIcon /> Nueva rutina</button>
            </div>
          </div>
        )}
      </div>

      {newOpen && (
        <Modal title="Nueva rutina" onClose={() => setNewOpen(false)}
          actions={<>
            <button className="btn ghost" onClick={() => setNewOpen(false)}>Cancelar</button>
            <button className="btn primary" onClick={handleCreate} disabled={pending}>{pending ? "Creando..." : "Crear"}</button>
          </>}>
          <p className="muted" style={{ fontSize: 14 }}>Crea una rutina vacía con un bloque inicial. Podrás ajustar todo después.</p>
        </Modal>
      )}
    </>
  );
}
