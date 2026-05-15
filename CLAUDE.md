# CLAUDE.md — Comb-ines

Instrucciones para Claude Code sobre cómo trabajar en este repo.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Auth + Postgres + Realtime + Storage)
- **Zustand** para estado cliente (workout engine), **TanStack Query** para server state
- **next-pwa** para instalación móvil
- **Lucide React** para iconos
- Tests: **Vitest** + **Testing Library**

Si vas a añadir una dependencia que no esté en este stack, **pregunta antes**.

---

## Estructura del repo

```
.
├─ design/                ← Fuente de verdad VISUAL — no se ejecuta en prod
│  ├─ README.md           ← handoff completo (léelo cuando edites UI por primera vez)
│  ├─ Comb-ines.html      ← prototipo abrible en el navegador para comparar
│  ├─ styles.css          ← tokens de diseño + estilos de referencia
│  └─ *.jsx               ← pantallas de referencia (React + Babel inline)
│
├─ app/                   ← Código de producción (Next.js App Router)
│  ├─ (auth)/login/
│  ├─ (app)/
│  │  ├─ dashboard/
│  │  ├─ routines/
│  │  ├─ workout/[routineId]/
│  │  ├─ history/
│  │  ├─ stats/
│  │  └─ library/{ropes,exercises}/
│  └─ globals.css         ← tokens copiados/adaptados de design/styles.css
├─ components/
│  ├─ ui/                 ← primitivos shadcn (no tocar a mano)
│  ├─ workout/            ← BigTimer, RopeChange, ExerciseIcon, useWorkoutEngine
│  └─ ...
├─ lib/
│  ├─ supabase.ts
│  ├─ queries/            ← hooks de TanStack Query
│  └─ utils/              ← buildSteps, fmtTime, etc.
└─ supabase/
   └─ migrations/         ← SQL versionado
```

---

## La carpeta `design/` es sagrada

`design/` contiene el handoff de diseño en HTML — es la **fuente de verdad visual**. Reglas:

1. **Cuando implementes UI nueva**, consulta primero `design/README.md` y el `.jsx` correspondiente a esa pantalla. Reproduce el diseño 1:1 usando los componentes de `components/ui/` (shadcn).

2. **Cuando el usuario te pida un cambio visual pequeño** (color, spacing, copy), aplícalo **tanto en el código de producción como en `design/`** para que ambos lados queden sincronizados. Actualiza el archivo `.jsx` correspondiente y, si toca tokens, también `design/styles.css`.

3. **Cuando el usuario te traiga una versión nueva de `design/`** (descarga desde la conversación con Claude designs), no la fusiones automáticamente — primero ejecuta `git diff design/` y muéstrale al usuario qué cambió antes de propagarlo al código real.

4. **No edites `design/Comb-ines.html`, `design/main.jsx` ni `design/tweaks-panel.jsx`** — son la estructura del prototipo. Solo edita los archivos por-pantalla (`dashboard.jsx`, `workout.jsx`, etc.) y `styles.css`.

5. **Si hay conflicto entre `design/` y lo que pide el usuario en chat**, pregunta cuál es la fuente de verdad para este cambio.

---

## Design tokens

Los tokens viven en `app/globals.css` como variables CSS. Están sincronizados con `design/styles.css`. **No los dupliques en Tailwind config** salvo para mapear `theme.extend.colors`:

```ts
// tailwind.config.ts
colors: {
  bg:   "var(--bg)",
  fg:   "var(--fg)",
  accent: "var(--accent)",
  // etc.
}
```

Familias tipográficas (vía `next/font` en `app/layout.tsx`):
- **Space Grotesk** → `font-sans` (display y body)
- **JetBrains Mono** → `font-mono` (datos, timers, eyebrows)
- **Instrument Serif** → `font-serif` (italic, solo acentos editoriales)

---

## Modelo de datos

Schema en `supabase/migrations/*.sql`. Resumen:

- `profiles` — datos del usuario
- `ropes` — color + peso
- `exercises` — solo nombre
- `routines` → `routine_blocks` → `routine_items`
- `workouts` → `workout_events`

**Todas las tablas tienen RLS habilitado**. El usuario solo puede leer/escribir filas con `user_id = auth.uid()`. Si añades una tabla nueva, **incluye RLS desde el primer commit**.

---

## Patrones de código

### Server vs Client Components

- **Server Components por defecto**: dashboard, listas, históricos, stats — todo lo que es read-heavy y no necesita interactividad pesada.
- **Client Components**: editor de rutinas (drag-drop), pantalla de workout en vivo, modales, formularios. Marca con `"use client"` solo cuando sea necesario.

### Pantalla de workout

La pantalla de workout es la más compleja. Lógica en `components/workout/useWorkoutEngine.ts`:

```ts
function useWorkoutEngine(routine: Routine) {
  // Input: routine
  // Builds: flat steps[] (incluye 'transition' entre bloques con cuerda distinta)
  // State: { idx, elapsed, running, hr }
  // Effects: setInterval(1000) cuando running
  // Returns: { step, totalProgress, controls: { play, pause, next, prev } }
}
```

- Items con `mode: "reps"` se convierten a duración aproximada (`reps / 2` segundos) solo para el timer visual.
- Atajos de teclado: `Space` play/pause, `←/→` prev/next, `Esc` salir.

### Estilo CSS

- Usa **Tailwind para todo**. No CSS modules ni styled-components.
- Para elementos muy específicos del diseño (timer enorme, heatmap, animación de cuerda) usa `@apply` o estilos inline si simplifica.
- **No uses gradientes**, no uses emojis (salvo que el usuario lo pida explícitamente).

---

## Comandos útiles

```bash
pnpm dev                # arranca Next + watch
pnpm typecheck          # tsc --noEmit
pnpm lint
pnpm test
pnpm test -- --watch
pnpm supabase:types     # regenera types desde el schema de Supabase
```

---

## Cómo iterar visualmente

Cuando el usuario te pida algo visual y no esté seguro de cómo debería verse:

1. Abre `design/Comb-ines.html` mentalmente (o pídele que te haga un screenshot).
2. Implementa.
3. Si tienes Playwright/screenshots, captura `localhost:3000/<ruta>` y compara con el prototipo.

Cuando el usuario diga *"esto debería verse como en design/"*, **lee el `.jsx` correspondiente** antes de tocar nada.

---

## Cosas que NO hacer

- ❌ Editar `components/ui/*` a mano (son shadcn — regenera con `pnpm dlx shadcn-ui@latest add <comp>`).
- ❌ Saltarte RLS "porque es prototipo".
- ❌ Añadir librerías de UI nuevas (Material, Chakra, etc.). Quédate con shadcn.
- ❌ Crear endpoints en `app/api/` si Supabase puede hacerlo con una query directa.
- ❌ Inventar copy en español sin preguntar — el tono es directo, deportivo, breve.
- ❌ Animaciones gratuitas. Solo las del `design/README.md`.

---

## Primer arranque (si el repo está vacío)

1. `pnpm create next-app@latest . --typescript --tailwind --app --src-dir=false`
2. `pnpm dlx shadcn-ui@latest init`
3. Copia `design/styles.css` → adapta a `app/globals.css` (tokens en `:root` y `[data-theme="light"]`)
4. Setup Supabase: `pnpm supabase init`, crea proyecto, aplica el SQL del README
5. Implementa el shell (Sidebar + Tabbar) — lee `design/components.jsx`
6. Implementa pantalla a pantalla en este orden: login → dashboard → routines → workout → history → stats → library
