"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRope, updateRope } from "@/lib/actions/ropes";
import type { Rope } from "@/lib/types";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";

const ROPE_TYPES = ["Speed", "Beaded", "Weighted", "Drag", "PVC", "Leather"];

function PlusIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}

type EditingRope = Partial<Rope> & { isNew?: boolean };

export default function RopesClient({ initialRopes }: { initialRopes: Rope[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditingRope | null>(null);
  const [pending, startTransition] = useTransition();

  const newRope = () => setEditing({ name: "Nueva cuerda", color: "#D4FF3A", weight: 80, type: "Speed", isNew: true });

  const handleSave = () => {
    if (!editing) return;
    startTransition(async () => {
      if (editing.isNew) {
        await createRope({ name: editing.name!, color: editing.color!, weight: editing.weight!, type: editing.type! });
      } else {
        await updateRope(editing as Rope);
      }
      setEditing(null);
      router.refresh();
    });
  };

  return (
    <>
      <Topbar title="Cuerdas" right={
        <button className="btn primary" onClick={newRope}><PlusIcon /> Nueva cuerda</button>
      } />

      <div className="scroll-area">
        <div className="grid-3">
          {initialRopes.map(r => (
            <button key={r.id} onClick={() => setEditing({ ...r })}
              style={{ textAlign: "left", cursor: "pointer", padding: 0, overflow: "hidden", border: "1px solid var(--line-c)", background: "var(--bg-1)", fontFamily: "inherit", color: "inherit", borderRadius: "var(--radius)" }}>
              <div style={{ height: 80, background: r.color, position: "relative" }}>
                <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.35)", color: "#fff", padding: "3px 8px", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600 }}>
                  {r.color.toUpperCase()}
                </span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{r.name}</div>
                <div className="muted mono" style={{ fontSize: 12, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                  <span>{r.weight}g</span><span>{r.type}</span>
                </div>
              </div>
            </button>
          ))}
          <button onClick={newRope} style={{ display: "grid", placeItems: "center", cursor: "pointer", minHeight: 160, color: "var(--fg-2)", fontFamily: "inherit", fontSize: 14, background: "transparent", border: "1px dashed var(--line-c)", borderRadius: "var(--radius)" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <PlusIcon /><span>Añadir cuerda</span>
            </div>
          </button>
        </div>
      </div>

      {editing && (
        <Modal title={editing.isNew ? "Nueva cuerda" : "Editar cuerda"} onClose={() => setEditing(null)}
          actions={<>
            <button className="btn ghost" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="btn primary" onClick={handleSave} disabled={pending}>{pending ? "Guardando..." : "Guardar"}</button>
          </>}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 72, height: 72, borderRadius: 14, background: editing.color, border: "1px solid var(--line-c)", flexShrink: 0 }} />
            <div className="field" style={{ flex: 1 }}>
              <label>Color</label>
              <input className="input" type="color" value={editing.color ?? "#D4FF3A"} onChange={e => setEditing({ ...editing, color: e.target.value })} style={{ height: 42, padding: 4 }} />
            </div>
          </div>
          <div className="field">
            <label>Nombre</label>
            <input className="input" value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} autoFocus />
          </div>
          <div className="grid-2" style={{ gap: 10 }}>
            <div className="field">
              <label>Peso (g)</label>
              <input className="input mono" type="number" value={editing.weight ?? 0} onChange={e => setEditing({ ...editing, weight: +e.target.value })} />
            </div>
            <div className="field">
              <label>Tipo</label>
              <select className="input" value={editing.type ?? "Speed"} onChange={e => setEditing({ ...editing, type: e.target.value })}>
                {ROPE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
