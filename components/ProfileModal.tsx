"use client";

import { useState, useId } from "react";
import Modal from "@/components/Modal";
import { useUserStore } from "@/lib/userStore";

function LogoutIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
    </svg>
  );
}

type Props = {
  onClose: () => void;
};

export default function ProfileModal({ onClose }: Props) {
  const { name: storeName, email: storeEmail, setUser } = useUserStore();
  const [name, setName] = useState(storeName);
  const nameId = useId();
  const emailId = useId();

  const initial = (name.trim()[0] ?? "?").toUpperCase();

  const handleSave = () => {
    setUser({ name: name.trim() || storeName, email: storeEmail });
    onClose();
  };

  return (
    <Modal
      title="Perfil"
      onClose={onClose}
      actions={
        <>
          <button
            className="btn danger ghost"
            onClick={onClose}
            style={{ marginRight: "auto" }}
          >
            <LogoutIcon /> Cerrar sesión
          </button>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={handleSave}>Guardar</button>
        </>
      }
    >
      {/* Avatar + preview */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "var(--accent)", color: "var(--accent-ink)",
          display: "grid", placeItems: "center",
          fontWeight: 700, fontSize: 22,
          flex: "none",
        }}>
          {initial}
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{name || "Sin nombre"}</div>
          <div className="muted mono" style={{ fontSize: 12 }}>{storeEmail}</div>
        </div>
      </div>

      {/* Name */}
      <div className="field">
        <label htmlFor={nameId}>Nombre en la app</label>
        <input
          id={nameId}
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={32}
          autoFocus
        />
        <span className="muted" style={{ fontSize: 11 }}>
          Así te saludaremos en el dashboard y aparecerás en tus sesiones.
        </span>
      </div>

      {/* Email — read-only */}
      <div className="field">
        <label htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          className="input"
          value={storeEmail}
          disabled
          style={{ opacity: 0.7, cursor: "not-allowed" }}
        />
        <span className="muted" style={{ fontSize: 11 }}>
          El email no se puede cambiar en este prototipo.
        </span>
      </div>
    </Modal>
  );
}
