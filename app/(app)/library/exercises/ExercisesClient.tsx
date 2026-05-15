"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExercise, updateExercise } from "@/lib/actions/exercises";
import type { Exercise } from "@/lib/types";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";

function PlusIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function ChevronRightIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
}

type EditingExercise = Partial<Exercise> & { isNew?: boolean };

export default function ExercisesClient({ initialExercises }: { initialExercises: Exercise[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditingExercise | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSave = () => {
    if (!editing?.name?.trim()) return;
    startTransition(async () => {
      if (editing.isNew) {
        await createExercise(editing.name!.trim());
      } else {
        await updateExercise(editing as Exercise);
      }
      setEditing(null);
      router.refresh();
    });
  };

  return (
    <>
      <Topbar title="Saltos" right={
        <button className="btn primary" onClick={() => setEditing({ name: "", isNew: true })}><PlusIcon /> Nuevo salto</button>
      } />

      <div className="scroll-area">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr><th>Salto</th><th></th></tr>
            </thead>
            <tbody>
              {initialExercises.map(e => (
                <tr key={e.id} className="clickable" onClick={() => setEditing({ ...e })}>
                  <td><b>{e.name}</b></td>
                  <td><ChevronRightIcon /></td>
                </tr>
              ))}
              {initialExercises.length === 0 && (
                <tr><td colSpan={2} style={{ color: "var(--fg-2)", textAlign: "center", padding: 32 }}>Aún no hay saltos — añade el primero</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing.isNew ? "Nuevo salto" : "Editar salto"} onClose={() => setEditing(null)}
          actions={<>
            <button className="btn ghost" onClick={() => setEditing(null)}>Cancelar</button>
            <button className="btn primary" onClick={handleSave} disabled={pending}>{pending ? "Guardando..." : "Guardar"}</button>
          </>}>
          <div className="field">
            <label>Nombre</label>
            <input className="input" value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} autoFocus />
          </div>
        </Modal>
      )}
    </>
  );
}
