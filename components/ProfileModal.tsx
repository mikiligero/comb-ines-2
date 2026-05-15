"use client";

import { useState, useTransition, useId } from "react";
import Modal from "@/components/Modal";
import { useUserStore } from "@/lib/userStore";
import { logout, updateProfileName } from "@/lib/actions/auth";

function LogoutIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
    </svg>
  );
}

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { name: storeName, email: storeEmail, setUser } = useUserStore();
  const [name, setName] = useState(storeName);
  const [pending, startTransition] = useTransition();
  const nameId = useId();
  const emailId = useId();

  const initial = (name.trim()[0] ?? "?").toUpperCase();

  const handleSave = () => {
    const trimmed = name.trim() || storeName;
    startTransition(async () => {
      await updateProfileName(trimmed);
      setUser({ name: trimmed, email: storeEmail });
      onClose();
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <Modal
      title="Perfil"
      onClose={onClose}
      actions={
        <>
          <button className="btn danger ghost" onClick={handleLogout} disabled={pending} style={{ marginRight: "auto" }}>
            <LogoutIcon /> Cerrar sesión
          </button>
          <button className="btn ghost" onClick={onClose} disabled={pending}>Cancelar</button>
          <button className="btn primary" onClick={handleSave} disabled={pending}>
            {pending ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 22, flex: "none" }}>
          {initial}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{name || "Sin nombre"}</div>
          <div className="muted mono" style={{ fontSize: 12 }}>{storeEmail}</div>
        </div>
      </div>

      <div className="field">
        <label htmlFor={nameId}>Nombre en la app</label>
        <input id={nameId} className="input" value={name} onChange={e => setName(e.target.value)} maxLength={32} autoFocus />
        <span className="muted" style={{ fontSize: 11 }}>Así te saludaremos en el dashboard y aparecerás en tus sesiones.</span>
      </div>

      <div className="field">
        <label htmlFor={emailId}>Email</label>
        <input id={emailId} className="input" value={storeEmail} disabled style={{ opacity: 0.7, cursor: "not-allowed" }} />
        <span className="muted" style={{ fontSize: 11 }}>El email no se puede cambiar.</span>
      </div>
    </Modal>
  );
}
