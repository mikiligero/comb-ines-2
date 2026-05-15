// Login screen — split layout: animated rope on the left, form on the right.

function Login({ onLogin }){
  const [email, setEmail] = React.useState("ana@combines.app");
  const [pwd, setPwd] = React.useState("•••••••••");
  const [name, setName] = React.useState("Ana");
  const [mode, setMode] = React.useState("signin"); // signin | signup
  const [loading, setLoading] = React.useState(false);

  const submit = (e)=>{
    e.preventDefault();
    setLoading(true);
    const displayName = mode==="signup" && name.trim()
      ? name.trim()
      : email.split("@")[0].replace(/^./, c=>c.toUpperCase());
    setTimeout(()=> onLogin({ name: displayName, email }), 600);
  };

  return (
    <div className="login-shell">
      <div className="login-art">
        <div style={{display:"flex",alignItems:"center",gap:10,zIndex:2}}>
          <div className="logo-mark" style={{width:36,height:36,borderRadius:10,background:"var(--accent)",color:"var(--accent-ink)",display:"grid",placeItems:"center",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:18}}>⌇</div>
          <div style={{fontWeight:700,fontSize:22,letterSpacing:"-0.02em"}}>Comb<span style={{color:"var(--fg-2)",fontWeight:500}}>-</span>ines</div>
        </div>

        <div className="rope-anim" aria-hidden>
          <svg className="rope-svg" viewBox="0 0 500 400" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="halo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22"/>
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
              </radialGradient>
            </defs>

            <circle cx="250" cy="210" r="200" fill="url(#halo)"/>

            {/* Floor shadow — pulses with jump, stays on ground */}
            <ellipse cx="250" cy="322" rx="52" ry="5" fill="#000" opacity="0.32">
              <animate attributeName="rx" values="52;38;26;38;52" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite"/>
              <animate attributeName="ry" values="5;4;2.5;4;5" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.32;0.22;0.1;0.22;0.32" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite"/>
            </ellipse>

            {/* Jumper system — person + their own rope. Everything translates together
                so the rope stays attached to the hands. The two rope paths morph in lock-
                step but cross-fade their opacity: back-rope is visible when the loop is
                above the head; front-rope when it's beneath the feet. */}
            <g>
              <animateTransform attributeName="transform" type="translate"
                                values="0 0; 0 -8; 0 -24; 0 -8; 0 0"
                                keyTimes="0;0.25;0.5;0.75;1"
                                dur="0.62s" repeatCount="indefinite"/>

              {/* Rope — BACK pass (behind the person) */}
              <path fill="none" stroke="var(--accent)" strokeWidth="4.5" strokeLinecap="round"
                    style={{filter:"drop-shadow(0 0 10px color-mix(in oklab, var(--accent) 60%, transparent))"}}>
                <animate attributeName="d"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="M 208 222 C 208 70,  292 70,  292 222;
                          M 208 222 C 260 222, 320 222, 292 222;
                          M 208 222 C 208 360, 292 360, 292 222;
                          M 208 222 C 180 222, 240 222, 292 222;
                          M 208 222 C 208 70,  292 70,  292 222"
                  dur="0.62s" repeatCount="indefinite"/>
                <animate attributeName="opacity"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="1;0.35;0;0.35;1"
                  dur="0.62s" repeatCount="indefinite"/>
              </path>

              {/* Person — front view, holding both handles */}
              <g fill="var(--fg)">
                {/* Head */}
                <circle cx="250" cy="158" r="14"/>
                {/* Torso */}
                <rect x="236" y="172" width="28" height="64" rx="10"/>
                {/* Arms — short, hands hang at sides */}
                <rect x="218" y="184" width="24" height="8" rx="4" transform="rotate(12 230 188)"/>
                <rect x="258" y="184" width="24" height="8" rx="4" transform="rotate(-12 270 188)"/>
                {/* Handles (held in hands) */}
                <rect x="201" y="214" width="12" height="16" rx="3"/>
                <rect x="287" y="214" width="12" height="16" rx="3"/>
                {/* Legs — slightly tuck up at peak of jump */}
                <rect x="240" y="236" width="8" height="58" rx="3.5">
                  <animate attributeName="height" values="58;52;44;52;58" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite"/>
                </rect>
                <rect x="252" y="236" width="8" height="58" rx="3.5">
                  <animate attributeName="height" values="58;52;44;52;58" keyTimes="0;0.25;0.5;0.75;1" dur="0.62s" repeatCount="indefinite"/>
                </rect>
              </g>

              {/* Rope — FRONT pass (in front of the person) */}
              <path fill="none" stroke="var(--accent)" strokeWidth="4.5" strokeLinecap="round"
                    style={{filter:"drop-shadow(0 0 10px color-mix(in oklab, var(--accent) 60%, transparent))"}}>
                <animate attributeName="d"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="M 208 222 C 208 70,  292 70,  292 222;
                          M 208 222 C 260 222, 320 222, 292 222;
                          M 208 222 C 208 360, 292 360, 292 222;
                          M 208 222 C 180 222, 240 222, 292 222;
                          M 208 222 C 208 70,  292 70,  292 222"
                  dur="0.62s" repeatCount="indefinite"/>
                <animate attributeName="opacity"
                  keyTimes="0;0.25;0.5;0.75;1"
                  values="0;0.35;1;0.35;0"
                  dur="0.62s" repeatCount="indefinite"/>
              </path>
            </g>
          </svg>
        </div>

        <div style={{zIndex:2,maxWidth:380}}>
          <div className="eyebrow" style={{marginBottom:10}}>BUILT FOR JUMPERS</div>
          <h2 style={{fontSize:36,lineHeight:1.05}}>
            Salta. Mide. <span className="serif" style={{color:"var(--accent)"}}>Repite.</span>
          </h2>
          <p className="muted" style={{marginTop:12,fontSize:15,maxWidth:340}}>
            Diseña rutinas por bloques, cambia de cuerda sobre la marcha y mira cómo se acumulan tus saltos.
          </p>
        </div>
      </div>

      <div className="login-form">
        <form className="inner" onSubmit={submit}>
          <div className="eyebrow">{mode==="signin" ? "ENTRAR" : "CREAR CUENTA"}</div>
          <h1 style={{fontSize:38}}>{mode==="signin" ? "Bienvenida de vuelta" : "Empezar a saltar"}</h1>
          <p className="muted" style={{fontSize:14,marginTop:-6,marginBottom:8}}>
            {mode==="signin" ? "Continúa donde lo dejaste." : "Crea tu perfil en menos de 30 segundos."}
          </p>

          {mode==="signup" && (
            <div className="field">
              <label>Nombre en la app</label>
              <input className="input" type="text" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Cómo te llamaremos" maxLength={32}/>
              <span className="muted" style={{fontSize:11}}>Aparecerá en tu perfil. Puedes cambiarlo después.</span>
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="tu@email.com"/>
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input className="input" type="password" value={pwd} onChange={(e)=>setPwd(e.target.value)} placeholder="••••••••"/>
          </div>

          <button className="btn primary lg" type="submit" disabled={loading} style={{justifyContent:"center"}}>
            {loading ? "Entrando..." : (mode==="signin" ? "Entrar" : "Crear cuenta")}
            {!loading && <Icon name="chevron-right" size={16}/>}
          </button>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13}}>
            <span className="muted">{mode==="signin" ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}</span>
            <button type="button" className="btn ghost" style={{padding:"6px 10px",fontSize:13}}
                    onClick={()=>setMode(m=>m==="signin"?"signup":"signin")}>
              {mode==="signin" ? "Crear cuenta" : "Entrar"}
            </button>
          </div>

          <div className="divider"/>
          <div className="muted" style={{fontSize:11,display:"flex",alignItems:"center",gap:6}}>
            <span className="kbd">↵</span> para entrar como demo
          </div>
        </form>
      </div>
    </div>
  );
}

window.Login = Login;
