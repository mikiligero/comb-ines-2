"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useUserStore } from "@/lib/userStore";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore(s => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const displayName =
      mode === "signup" && name.trim()
        ? name.trim()
        : (email || "ana@combines.app").split("@")[0].replace(/^./, c => c.toUpperCase());
    setUser({ name: displayName, email: email || "ana@combines.app" });
    setTimeout(() => router.push("/dashboard"), 600);
  }

  return (
    <div className="fixed inset-0 grid min-[900px]:grid-cols-[1.05fr_1fr] bg-bg">

      {/* ── Left panel: illustration — hidden below 900px ── */}
      <div
        className="hidden min-[900px]:flex flex-col justify-between relative overflow-hidden"
        style={{
          background: "var(--bg-1)",
          borderRight: "1px solid var(--line-c)",
          padding: 36,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 2 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--accent)", color: "var(--accent-ink)",
              display: "grid", placeItems: "center",
              fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18,
            }}
          >
            ⌇
          </div>
          <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em" }}>
            Comb<span style={{ color: "var(--fg-2)", fontWeight: 500 }}>-</span>ines
          </div>
        </div>

        {/* Animated SVG */}
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}
        >
          <svg
            viewBox="0 0 500 400"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: "82%", maxWidth: 540, height: "auto", display: "block" }}
          >
            <defs>
              <radialGradient id="halo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </radialGradient>
            </defs>

            <circle cx="250" cy="210" r="200" fill="url(#halo)" />

            {/* Floor shadow */}
            <ellipse cx="250" cy="322" rx="52" ry="5" fill="#000" opacity="0.32">
              <animate attributeName="rx" values="52;38;26;38;52" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite" />
              <animate attributeName="ry" values="5;4;2.5;4;5" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.32;0.22;0.1;0.22;0.32" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite" />
            </ellipse>

            {/* Jumper + rope system */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 0 -8; 0 -24; 0 -8; 0 0"
                keyTimes="0;0.25;0.5;0.75;1"
                dur="0.62s"
                repeatCount="indefinite"
              />

              {/* Rope — back pass */}
              <path
                fill="none"
                stroke="var(--accent)"
                strokeWidth="4.5"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 10px color-mix(in oklab, var(--accent) 60%, transparent))" }}
              >
                <animate
                  attributeName="d"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="M 208 222 C 208 70,  292 70,  292 222;
                          M 208 222 C 260 222, 320 222, 292 222;
                          M 208 222 C 208 360, 292 360, 292 222;
                          M 208 222 C 180 222, 240 222, 292 222;
                          M 208 222 C 208 70,  292 70,  292 222"
                  dur="0.62s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="1;0.35;0;0.35;1"
                  dur="0.62s"
                  repeatCount="indefinite"
                />
              </path>

              {/* Person */}
              <g fill="var(--fg)">
                <circle cx="250" cy="158" r="14" />
                <rect x="236" y="172" width="28" height="64" rx="10" />
                <rect x="218" y="184" width="24" height="8" rx="4" transform="rotate(12 230 188)" />
                <rect x="258" y="184" width="24" height="8" rx="4" transform="rotate(-12 270 188)" />
                <rect x="201" y="214" width="12" height="16" rx="3" />
                <rect x="287" y="214" width="12" height="16" rx="3" />
                <rect x="240" y="236" width="8" height="58" rx="3.5">
                  <animate attributeName="height" values="58;52;44;52;58" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite" />
                </rect>
                <rect x="252" y="236" width="8" height="58" rx="3.5">
                  <animate attributeName="height" values="58;52;44;52;58" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite" />
                </rect>
              </g>

              {/* Rope — front pass */}
              <path
                fill="none"
                stroke="var(--accent)"
                strokeWidth="4.5"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 10px color-mix(in oklab, var(--accent) 60%, transparent))" }}
              >
                <animate
                  attributeName="d"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="M 208 222 C 208 70,  292 70,  292 222;
                          M 208 222 C 260 222, 320 222, 292 222;
                          M 208 222 C 208 360, 292 360, 292 222;
                          M 208 222 C 180 222, 240 222, 292 222;
                          M 208 222 C 208 70,  292 70,  292 222"
                  dur="0.62s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="0;0.35;1;0.35;0"
                  dur="0.62s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          </svg>
        </div>

        {/* Tagline */}
        <div style={{ zIndex: 2, maxWidth: 380 }}>
          <p className="eyebrow" style={{ marginBottom: 10 }}>BUILT FOR JUMPERS</p>
          <h2 style={{ fontSize: 36, lineHeight: 1.05 }}>
            Salta. Mide.{" "}
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, color: "var(--accent)" }}>
              Repite.
            </span>
          </h2>
          <p style={{ color: "var(--fg-2)", marginTop: 12, fontSize: 15, maxWidth: 340 }}>
            Diseña rutinas por bloques, cambia de cuerda sobre la marcha y mira cómo se acumulan tus saltos.
          </p>
        </div>
      </div>

      {/* ── Right panel: form — auto-placement in col 2 on desktop, full width on mobile ── */}
      <div className="grid place-items-center" style={{ padding: 32 }}>
        <form
          onSubmit={handleSubmit}
          style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 18 }}
        >
          <p className="eyebrow">{mode === "signin" ? "ENTRAR" : "CREAR CUENTA"}</p>

          <h1 style={{ fontSize: 38 }}>
            {mode === "signin" ? "Bienvenida de vuelta" : "Empezar a saltar"}
          </h1>

          <p style={{ color: "var(--fg-2)", fontSize: 14, marginTop: -6, marginBottom: 8 }}>
            {mode === "signin" ? "Continúa donde lo dejaste." : "Crea tu perfil en menos de 30 segundos."}
          </p>

          {/* Nombre — solo en signup */}
          {mode === "signup" && (
            <div className="field">
              <label>Nombre en la app</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cómo te llamaremos"
                maxLength={32}
              />
              <span className="muted" style={{ fontSize: 11 }}>
                Aparecerá en tu perfil. Puedes cambiarlo después.
              </span>
            </div>
          )}

          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, letterSpacing: "0.02em" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                appearance: "none", width: "100%",
                fontFamily: "inherit", fontSize: 15,
                padding: "12px 14px", borderRadius: "var(--radius-sm)",
                background: "var(--bg-2)", color: "var(--fg)",
                border: "1px solid var(--line-c)", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--line-c)")}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500, letterSpacing: "0.02em" }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                appearance: "none", width: "100%",
                fontFamily: "inherit", fontSize: 15,
                padding: "12px 14px", borderRadius: "var(--radius-sm)",
                background: "var(--bg-2)", color: "var(--fg)",
                border: "1px solid var(--line-c)", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--line-c)")}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              appearance: "none", border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", fontWeight: 600, fontSize: 16,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "16px 24px", borderRadius: "var(--radius-sm)",
              background: "var(--accent)", color: "var(--accent-ink)",
              opacity: loading ? 0.7 : 1,
              transition: "filter 0.08s ease, transform 0.08s ease",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = "brightness(0.95)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(1px)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "none"; }}
          >
            {loading ? "Entrando..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
            {!loading && <ChevronRight size={16} />}
          </button>

          {/* Mode toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--fg-2)" }}>
              {mode === "signin" ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}
            </span>
            <button
              type="button"
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
              style={{
                appearance: "none", border: "none",
                background: "transparent", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 600, fontSize: 13,
                color: "var(--fg)", padding: "6px 10px",
                borderRadius: "var(--radius-sm)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {mode === "signin" ? "Crear cuenta" : "Entrar"}
            </button>
          </div>

          <div style={{ height: 1, background: "var(--line-c)" }} />

          <div style={{ color: "var(--fg-2)", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="kbd">↵</span> para entrar como demo
          </div>
        </form>
      </div>
    </div>
  );
}
