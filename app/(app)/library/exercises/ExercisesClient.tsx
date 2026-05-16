"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExercise, updateExercise, uploadExerciseVideo } from "@/lib/actions/exercises";
import type { Exercise } from "@/lib/types";
import Topbar from "@/components/Topbar";
import Modal from "@/components/Modal";
import ExerciseVideo from "@/components/workout/ExerciseVideo";

function PlusIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function ChevronRightIcon() {
  return <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
}
function VideoIcon() {
  return <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

type EditingExercise = Partial<Exercise> & { isNew?: boolean };

export default function ExercisesClient({ initialExercises, videoSlugs }: { initialExercises: Exercise[]; videoSlugs: Set<string> }) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditingExercise | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [videoKey, setVideoKey] = useState(0);
  const [localVideoSlugs, setLocalVideoSlugs] = useState(videoSlugs);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = async (file: File) => {
    if (!editing?.name?.trim()) return;
    setUploadError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("video", file);
    const res = await uploadExerciseVideo(fd, editing.name.trim());
    setUploading(false);
    if (!res.ok) { setUploadError(res.error); return; }
    setVideoKey(k => k + 1);
    setLocalVideoSlugs(prev => new Set([...prev, toSlug(editing.name!.trim())]));
  };

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
      <Topbar title="Ejercicios" right={
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
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <b>{e.name}</b>
                      {localVideoSlugs.has(toSlug(e.name)) && (
                        <span style={{ color: "var(--accent)", lineHeight: 0 }} title="Tiene vídeo"><VideoIcon /></span>
                      )}
                    </span>
                  </td>
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
          {!editing.isNew && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <ExerciseVideo key={videoKey} exName={editing.name} size={200} />
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); e.target.value = ""; }}
              />
              <button
                className="btn ghost"
                style={{ fontSize: 13 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Procesando vídeo…" : "Subir vídeo"}
              </button>
              {uploadError && <div style={{ fontSize: 12, color: "var(--danger)" }}>{uploadError}</div>}
            </div>
          )}
          <div className="field">
            <label>Nombre</label>
            <input className="input" value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })} autoFocus />
          </div>
        </Modal>
      )}
    </>
  );
}
