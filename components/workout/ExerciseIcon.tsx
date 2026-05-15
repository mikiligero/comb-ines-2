// Animated jump-rope figure — same motion as the login SVG, scaled to 96×96.
export default function ExerciseIcon({ name }: { name?: string }) {
  return (
    <div
      aria-label={name}
      style={{
        width: 96, height: 96, borderRadius: 20,
        background: "var(--bg-1)", border: "1px solid var(--line-c)",
        display: "grid", placeItems: "center", flex: "none",
        position: "relative", overflow: "hidden",
      }}
    >
      <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
        {/* Floor shadow */}
        <ellipse cx="50" cy="86" rx="16" ry="2" fill="#000" opacity="0.35">
          <animate attributeName="rx"      values="16;11;7;11;16"           keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.22;0.1;0.22;0.35" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite" />
        </ellipse>

        {/* Jumper + rope group */}
        <g>
          <animateTransform
            attributeName="transform" type="translate"
            values="0 0; 0 -3; 0 -10; 0 -3; 0 0"
            keyTimes="0;0.25;0.5;0.75;1"
            dur="0.62s" repeatCount="indefinite"
          />

          {/* Rope — back pass */}
          <path fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
            <animate attributeName="d"
              keyTimes="0;0.25;0.5;0.75;1"
              values="M 32 52 C 32 14, 68 14, 68 52;
                      M 32 52 C 50 52, 70 52, 68 52;
                      M 32 52 C 32 88, 68 88, 68 52;
                      M 32 52 C 30 52, 50 52, 68 52;
                      M 32 52 C 32 14, 68 14, 68 52"
              dur="0.62s" repeatCount="indefinite" />
            <animate attributeName="opacity"
              keyTimes="0;0.25;0.5;0.75;1"
              values="1;0.35;0;0.35;1"
              dur="0.62s" repeatCount="indefinite" />
          </path>

          {/* Person */}
          <g fill="var(--fg)">
            <circle cx="50" cy="34" r="6" />
            <rect x="45" y="40" width="10" height="20" rx="4" />
            {/* Arms */}
            <rect x="38" y="44" width="9" height="3.5" rx="1.8" transform="rotate(12 42 46)" />
            <rect x="53" y="44" width="9" height="3.5" rx="1.8" transform="rotate(-12 58 46)" />
            {/* Handles */}
            <rect x="29" y="49" width="5" height="7" rx="1.5" />
            <rect x="66" y="49" width="5" height="7" rx="1.5" />
            {/* Legs */}
            <rect x="46.5" y="60" width="3" height="22" rx="1.5">
              <animate attributeName="height" values="22;19;15;19;22" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite" />
            </rect>
            <rect x="50.5" y="60" width="3" height="22" rx="1.5">
              <animate attributeName="height" values="22;19;15;19;22" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite" />
            </rect>
          </g>

          {/* Rope — front pass */}
          <path fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
            <animate attributeName="d"
              keyTimes="0;0.25;0.5;0.75;1"
              values="M 32 52 C 32 14, 68 14, 68 52;
                      M 32 52 C 50 52, 70 52, 68 52;
                      M 32 52 C 32 88, 68 88, 68 52;
                      M 32 52 C 30 52, 50 52, 68 52;
                      M 32 52 C 32 14, 68 14, 68 52"
              dur="0.62s" repeatCount="indefinite" />
            <animate attributeName="opacity"
              keyTimes="0;0.25;0.5;0.75;1"
              values="0;0.35;1;0.35;0"
              dur="0.62s" repeatCount="indefinite" />
          </path>
        </g>
      </svg>
    </div>
  );
}
