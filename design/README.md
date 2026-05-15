# Handoff: Comb-ines · App de rutinas de comba

## Overview

**Comb-ines** es una app web para diseñar y ejecutar rutinas de saltar a la comba. Permite al usuario:

- Dar de alta **cuerdas** (color + peso) y **tipos de salto**
- Crear **rutinas** compuestas por **bloques** (A, B, C…), cada bloque con su propia cuerda
- Dentro de cada bloque definir **ejercicios** (por tiempo o por reps) y **descansos**
- Configurar un **tiempo de cambio de cuerda** entre bloques que se inserta automáticamente cuando dos bloques consecutivos usan cuerdas distintas
- Ejecutar la rutina con una pantalla de **workout en vivo** (timer, salto actual, próximo, avisos de cambio de cuerda)
- Consultar el **histórico** de sesiones con detalle
- Ver **estadísticas** (tiempo total, streak, heatmap de actividad, distribución de saltos, PRs)
- **Login** con usuario y contraseña

Diseño desktop-first, totalmente responsive a móvil (breakpoint en 900px).

## About the Design Files

Los archivos `.html` y `.jsx` incluidos en esta carpeta son **referencias de diseño** creadas con React + Babel sobre HTML — son prototipos para mostrar el look, la jerarquía visual y los flujos. **No son código de producción** y no deben copiarse tal cual.

Tu tarea es **reimplementar este diseño en un stack real** (recomendación abajo) siguiendo las convenciones del codebase destino. Si no hay codebase aún, este documento incluye una propuesta de stack y arquitectura.

## Fidelity

**Alta fidelidad (hifi)** — los mockups son pixel-perfect: colores, tipografía, espaciados, animaciones y estados están definidos. Reproduce la UI tal cual; ajusta solo lo necesario para encajar con el design system / librería de componentes que uses.

---

## Stack recomendado

Para una app personal/freemium con sync entre dispositivos:

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | SSR/SSG, file-based routing, RSC para data fetching |
| UI | **Tailwind CSS** + **shadcn/ui** | Tokens consistentes, componentes accesibles, fácil de personalizar |
| Estado | **Zustand** (cliente) + **React Query** (server state) | Workout en vivo tiene mucho estado local de timer; el resto es CRUD |
| Backend | **Supabase** (Postgres + Auth + Storage + Realtime) | Auth ya incluido, schema relacional encaja perfectamente |
| PWA | **next-pwa** | Para instalar en el móvil y workout funcione offline |
| Iconos | **Lucide React** | Los iconos del prototipo son equivalentes a Lucide |
| Animación | CSS + **Framer Motion** para transiciones de pantalla | Mínimo necesario |
| Audio | Web Audio API | Pitidos de cuenta atrás y cambio de bloque |
| Wearables (opcional) | Web Bluetooth (sensores HR) | Para los chips de pulsaciones |

**Alternativa móvil-nativa:** si en algún momento se quiere app nativa, **React Native + Expo** reutilizaría la mayor parte del código de componentes y lógica.

---

## Modelo de datos (Supabase / Postgres)

```sql
-- Auth la gestiona Supabase. Tablas de dominio:

create table profiles (
  id uuid primary key references auth.users(id),
  name text not null,
  avatar_url text,
  created_at timestamptz default now()
);

create table ropes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  color text not null,                 -- "#D4FF3A"
  weight_g int not null,               -- gramos
  rope_type text,                      -- "Speed" | "Beaded" | "Weighted" | "Drag" | "PVC"
  created_at timestamptz default now()
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  transition_sec int not null default 15,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table routine_blocks (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines(id) on delete cascade,
  rope_id uuid not null references ropes(id),
  letter text not null,                -- "A","B","C"…
  position int not null,               -- 0,1,2…
  unique (routine_id, position)
);

create table routine_items (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references routine_blocks(id) on delete cascade,
  position int not null,
  kind text not null check (kind in ('ex','rest')),
  exercise_id uuid references exercises(id),       -- null si rest
  mode text check (mode in ('time','reps')),       -- null si rest
  value int not null,                              -- segundos o reps
  unique (block_id, position)
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  routine_id uuid references routines(id),
  routine_name_snapshot text,          -- por si la rutina se borra
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_sec int,
  jumps int default 0,
  avg_hr int,
  calories int,
  completed boolean default false,
  notes text
);

-- Detalle de qué pasó en cada paso (opcional pero útil para histórico rico)
create table workout_events (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  ts timestamptz not null,
  kind text not null,                  -- 'ex_start','ex_end','rest','rope_change','pause','resume','skip'
  block_letter text,
  exercise_id uuid references exercises(id),
  rope_id uuid references ropes(id),
  duration_sec int
);

-- RLS en todas las tablas: el usuario solo ve sus propias filas
-- alter table ropes enable row level security;
-- create policy "own ropes" on ropes for all using (user_id = auth.uid());
-- (repetir para todas)
```

---

## Estructura de carpetas sugerida

```
app/
├─ (auth)/
│  ├─ login/page.tsx
│  └─ signup/page.tsx
├─ (app)/
│  ├─ layout.tsx                 # Sidebar + Tabbar
│  ├─ dashboard/page.tsx
│  ├─ routines/
│  │  ├─ page.tsx                # Lista
│  │  └─ [id]/page.tsx           # Editor
│  ├─ workout/
│  │  └─ [routineId]/page.tsx    # Pantalla full-bleed, sin layout
│  ├─ history/
│  │  ├─ page.tsx
│  │  └─ [id]/page.tsx
│  ├─ stats/page.tsx
│  └─ library/
│     ├─ ropes/page.tsx
│     └─ exercises/page.tsx
├─ api/                          # Si necesitas endpoints (Supabase suele bastar)
└─ globals.css

components/
├─ ui/                           # shadcn primitives
├─ Sidebar.tsx
├─ Tabbar.tsx
├─ RopeSwatch.tsx
├─ BlockEditor.tsx
├─ Heatmap.tsx
├─ RoutineBlocksStrip.tsx
└─ workout/
   ├─ BigTimer.tsx
   ├─ RopeChange.tsx
   ├─ ExerciseIcon.tsx
   └─ useWorkoutEngine.ts        # hook que orquesta steps + timer

lib/
├─ supabase.ts
├─ queries/                      # React Query hooks
└─ utils/
   ├─ buildSteps.ts              # routine → flat list de pasos con transitions
   └─ fmt.ts                     # fmtTime, etc.

styles/
└─ tokens.css                    # variables CSS (ver design tokens abajo)
```

---

## Design tokens

Mete esto en `globals.css` o un `tokens.css`. Está pensado para mapearse 1:1 a `tailwind.config.ts` vía `theme.extend.colors` y `theme.extend.fontFamily`.

```css
:root {
  /* Brand */
  --accent: #D4FF3A;          /* lima eléctrico — configurable por usuario */
  --accent-ink: #0a0a0a;       /* texto sobre acento, recalculado por luminancia */

  /* Dark (default) */
  --bg:   #0a0a0b;
  --bg-1: #111113;
  --bg-2: #17171a;
  --bg-3: #1e1e22;
  --fg:   #f4f4f0;
  --fg-1: #c9c9c2;
  --fg-2: #86867f;
  --fg-3: #56564f;
  --line-c: rgba(255,255,255,.08);
  --line-s: rgba(255,255,255,.16);

  --danger: #ff5d3a;
  --good:   #22d3a8;
  --warn:   #ffb020;

  --radius:    14px;
  --radius-sm:  8px;
  --radius-lg: 22px;
}

[data-theme="light"] {
  --bg:   #f6f5f0;
  --bg-1: #fbfaf6;
  --bg-2: #ffffff;
  --bg-3: #eeece5;
  --fg:   #15140f;
  --fg-1: #3a3933;
  --fg-2: #75736a;
  --fg-3: #a8a59a;
  --line-c: rgba(0,0,0,.07);
  --line-s: rgba(0,0,0,.14);
  --danger: #e23b1c;
  --good:   #0f9e7a;
  --warn:   #c47d04;
}
```

### Tipografía

| Uso | Familia | Peso | Notas |
|---|---|---|---|
| Display, headings, botones | **Space Grotesk** | 400/500/600/700 | `letter-spacing: -0.02em` en H1/H2; `-0.04em` en `.display` |
| Datos, timers, mono | **JetBrains Mono** | 400/500/600 | `font-variant-numeric: tabular-nums` |
| Acento editorial (saludo en dashboard, etc.) | **Instrument Serif** | 400 italic | Solo para detalles, no para cuerpo |

Tamaños base:
- H1 desktop: 48px (móvil 34px)
- H2: 32px (24px móvil)
- H3: 22px
- Cuerpo: 14–15px
- "eyebrow" (uppercase, monospace): 11px, `letter-spacing: 0.12em`
- Big timer del workout: `clamp(140px, 22vw, 320px)`

### Spacing scale

Sigue Tailwind por defecto (4px). Los paddings de tarjeta son 22px (1.375rem); gaps entre cards 16px.

### Border radius

- Botones, inputs: 8px
- Tarjetas: 14px
- Modal: 22px

### Sombras

Mínimas. Solo modal usa `0 30px 80px rgba(0,0,0,.4)`. Las cards se distinguen por `border 1px solid var(--line-c)`, no por sombra.

---

## Pantallas

### 1. Login

- **Layout desktop**: grid 1.05fr / 1fr.
  - Izquierda: panel ilustrativo con animación SVG de una cuerda saltando + silueta humana + tagline en serif italic.
  - Derecha: form centrado, max-width 360px.
- **Layout móvil**: solo el form, panel oculto.
- **Campos**: email, password. Toggle "signin ↔ signup". Botón primario full-width.
- **Animación de la cuerda**: SVG `<path>` con `@keyframes` cambiando el `d` entre 5 keyframes (1.4s linear infinite). Halo radial con `var(--accent)`.

### 2. Sidebar + Tabbar (shell de navegación)

- **Sidebar desktop** (240px ancho):
  - Brand "Comb-ines" arriba.
  - Secciones: principal (Dashboard, Rutinas, Empezar), Tracking (Histórico, Estadísticas), Librería (Cuerdas, Saltos).
  - Item activo: barra vertical de 3×14px en `--accent` a la izquierda.
  - Tarjeta de usuario abajo con avatar (iniciales) + logout.
- **Tabbar móvil** (<900px):
  - Flotante en `bottom: 8px`, redondeada, 5 tabs.
  - Icono activo en `--accent`.

### 3. Dashboard

- Saludo con nombre en serif italic acentuado.
- 3 stats: Esta semana / Streak / Tiempo total.
- Card grande "Próximo workout" + card lateral con CTA único (botón primario XL).
- Card "Sesiones recientes": tabla de 4 columnas.
- Card "Actividad": heatmap estilo GitHub de 12 semanas (7 filas × N columnas, celdas 12×12px, gap 3px, 4 niveles de intensidad).

### 4. Rutinas (lista + editor)

- **Layout**: 280px sidebar interno con tarjetas de rutinas + main con editor.
- Cada tarjeta de rutina muestra una **mini-strip** de los bloques (anchos proporcionales a su duración, color del bloque = color de la cuerda).
- **Editor**:
  - Inputs en línea para nombre/descripción.
  - Card de resumen: duración + nº bloques.
  - Card de tiempo de cambio de cuerda (input numérico en segundos).
  - Lista de bloques (componente `BlockEditor`):
    - Cabecera: letra grande en cuadrado acento, selector de cuerda, botón eliminar.
    - Filas: drag handle, selector de ejercicio (o etiqueta "Descanso"), segmented control TIEMPO/REPS, input numérico, botón eliminar fila.
    - Acciones de fila: añadir salto / añadir descanso.
  - Botón "Añadir bloque X" (la letra se autoincrementa).
- Botón "Empezar rutina" primary grande al final.

### 5. Workout (LIVE) — la pantalla estrella

- **Layout full-bleed** (sin sidebar): grid `auto / 1fr / auto`.
  - **Top bar**: botón salir, nombre de rutina, barra de progreso total con tiempos, chip de HR.
  - **Centro**: 
    - Arriba: eyebrow "BLOQUE X · EJ n/total".
    - Esquina sup. derecha: dot de color + nombre + peso de cuerda actual (discreto).
    - Icono SVG animado del ejercicio (cuerda oscilando + piernas en bounce) + nombre del salto en 36px bold.
    - **Big timer** central: `clamp(140px, 22vw, 320px)`, tabular-nums, `letter-spacing: -0.08em`.
    - Progress bar del ejercicio.
    - Una sola línea: "NEXT [siguiente salto] [tiempo]" + (si aplica) aviso en `--warn` "cambio en ~MM:SS" con dot del color de la próxima cuerda.
  - **Bottom**: 3 botones — Anterior · **Play/Pause XL** (200px min-width) · Siguiente.
- **Pantalla de cambio de cuerda** (overlay durante step `transition`):
  - Eyebrow "CAMBIO DE CUERDA" en `--warn`.
  - "Prepara tu próxima cuerda" 48px.
  - Cuerda saliente (atenuada al 50%) → flecha → cuerda entrante (más grande, con glow `box-shadow` del color de la cuerda).
  - Timer grande contando atrás.
  - Progress bar en `--warn`.
- **Atajos de teclado**:
  - `Space` → play/pause
  - `←` o `p` → step anterior
  - `→` o `n` → step siguiente
  - `Esc` → modal de confirmación de salida
- **Engine** (`useWorkoutEngine.ts`):
  - Input: `Routine`.
  - Builds `steps[]` flat: por cada bloque, si su `ropeId` ≠ el del bloque anterior, inserta un step `transition` con `routine.transitionSec` antes; luego cada item del bloque.
  - Items en modo `reps` se convierten a duración aproximada (`reps / 2` segundos) para poder dibujar el timer; la cuenta real de reps es del usuario.
  - State: `currentIdx`, `elapsedInStep`, `running`, `hr`.
  - `setInterval(1000)` cuando `running`: incrementa `elapsedInStep`; al pasar de `step.duration` avanza `currentIdx` y resetea.
  - `hr` simula drift ±1–4 bpm cada tick (en producción venga del wearable).

### 6. Histórico

- 3 stats arriba: Sesiones / Tiempo total / Saltos.
- Filtro segmentado: Todas · Completadas · Parciales.
- Tabla: Fecha · Rutina (con chip "parcial" si aplica) · Duración · Saltos · Cuerdas (dots) · ChevronRight.
- Click en fila → modal de detalle con duración, saltos, HR, lista de bloques con cuerda y duración, botón "Repetir rutina".

### 7. Estadísticas

- Selector de rango: 3M · 6M · 1A.
- 3 stats: Tiempo total · Workouts · Streak.
- Card "Actividad": heatmap a pantalla completa, 7 filas, N columnas según rango.
- Grid 2/1:
  - Card "Minutos por semana": gráfica de barras 12 semanas (última semana en `--accent`, resto en `--fg-3`).
  - Card "Distribución por salto": lista con porcentajes + barras delgadas.
- Card "Récords personales": grid 2 columnas con bloques de PR (cuadradito "PR" en acento + nombre + valor en display + fecha).

### 8. Librería

- **Cuerdas**: grid 3 columnas de tarjetas. Cabecera de la tarjeta es una banda del color de la cuerda con su hex superpuesto. Cuerpo: nombre + peso + tipo. Card "Añadir" con `+`. Modal de edición con color picker nativo (`<input type="color">`).
- **Saltos**: tabla simple — nombre, veces usado, último uso, ChevronRight. Modal con un solo campo.

---

## Interacciones / animaciones

| Elemento | Duración | Easing | Propiedad |
|---|---|---|---|
| Hover botón | 80ms | ease | `transform`, `background` |
| Active botón | instant | — | `translateY(1px)` |
| Card hover (tabla) | 150ms | ease | `background` |
| Modal entrada | 180ms | `cubic-bezier(.2,.7,.3,1)` | opacity + translateY(8px) + scale(.98) |
| Modal backdrop | 150ms | ease | opacity |
| Progress bar | 400ms | `cubic-bezier(.2,.7,.3,1)` | width |
| Theme switch | 250ms | ease | background, color |
| Sidebar item activo (barra acento) | — | — | aparece sin animar |
| Cuerda animada (login) | 1.4s | linear, infinite | `<path d>` morph |
| Ejercicio (silueta) | 0.5s | linear, infinite | `<rect y>` y `<path d>` morph |

## Estados

- **Loading**: skeletons con `--bg-2` y shimmer suave; en el botón de submit del login, cambiar texto a "Entrando..." y deshabilitar.
- **Empty**: tarjeta dashed con icono + texto + CTA (ej. "Aún no tienes rutinas — Crear una").
- **Error**: chips de color `--danger`. Toast en esquina sup. derecha (no diseñado, usar shadcn `sonner`).
- **Offline**: la pantalla de workout debe funcionar sin red — guardar en IndexedDB y sincronizar después.

## Responsive (breakpoint 900px)

- Sidebar oculta, tabbar inferior aparece.
- Grid 4 → grid 2 (móvil grande) → grid 1 (≤600px).
- Top bar reduce padding a 14px/16px.
- Workout: panel lateral colapsa abajo (en este diseño se eliminó del todo, así que solo hay timer).
- Login: lado ilustrativo oculto.
- Big timer: `font-size: 24vw`.

## Tweaks expuestos al usuario (en Settings / Profile)

- **Modo oscuro / claro**: toggle. Persiste en `localStorage` y se aplica con `data-theme` en `<body>`.
- **Color de acento**: picker entre 6 swatches. Al cambiar, recalcular `--accent-ink` por luminancia.

(El "estilo visual" Sport/Mono/Neon del prototipo fue para exploración; no es necesario llevarlo a producción salvo que el cliente lo pida.)

---

## Archivos en este bundle

| Archivo | Contenido |
|---|---|
| `Comb-ines.html` | Entry point — carga React + Babel + todos los scripts. |
| `styles.css` | Todas las variables CSS, layout shell, componentes (cards, buttons, inputs, table, modal, heatmap, workout shell, login, responsive). |
| `data.jsx` | Mock data y helpers (`getRope`, `fmtTime`, `routineDuration`). |
| `components.jsx` | `Icon`, `Sidebar`, `Tabbar`, `Topbar`, `Modal`, `Stat`, `RopeSwatch`, `RoutineBlocksStrip`. |
| `login.jsx` | Pantalla de login. |
| `dashboard.jsx` | Dashboard con heatmap, próximo workout, recientes. |
| `routines.jsx` | Lista + editor con `BlockEditor`. |
| `workout.jsx` | Workout en vivo, `RopeChange`, `ExerciseIcon`. |
| `history.jsx` | Histórico + `WorkoutDetail`. |
| `stats.jsx` | Stats con heatmap, weekly bars, distribución, PRs. |
| `library.jsx` | Cuerdas + Saltos (CRUD). |
| `main.jsx` | Routing, theme/tweak wiring, montaje. |
| `tweaks-panel.jsx` | Panel de tweaks (puedes ignorarlo; era para previsualización). |
| `Responsive.html` | Visor desktop+móvil lado a lado (para comparar). |

## Cómo abrir el prototipo

Solo `open Comb-ines.html` en el navegador. No requiere build.

---

## Primer prompt sugerido para Claude Code

```
He recibido un handoff de diseño en /design_handoff_combines/. Léete el README.md
y los archivos .html/.jsx. Quiero crear un nuevo proyecto Next.js 14 (App Router) +
TypeScript + Tailwind + shadcn/ui + Supabase que implemente el diseño 1:1.

Empieza por:
1. Scaffolding del proyecto (next, tailwind, shadcn init).
2. Configurar Supabase con el schema SQL del README.
3. Crear los tokens en globals.css y configurar tailwind.config.ts.
4. Implementar el shell (Sidebar + Tabbar) y la página de login.
5. Implementar el dashboard.

Itera screen a screen, mostrándome cada una antes de pasar a la siguiente.
Usa Server Components donde tenga sentido (queries) y Client Components solo
donde hay interactividad (workout, editor de rutinas).
```
