// Main app — routing, theme/tweak wiring, screen mounting.

function App(){
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const [user, setUser]   = React.useState(null);
  const [route, setRoute] = React.useState("dashboard");
  const [workoutRoutine, setWorkoutRoutine] = React.useState(null);
  const [completed, setCompleted] = React.useState(false);

  // Apply theme/style tokens to <body>
  React.useEffect(()=>{
    document.body.dataset.theme = t.dark ? "dark" : "light";
    document.body.dataset.style = t.style || "sport";
    document.documentElement.style.setProperty("--accent", t.accent);
    // pick a readable accent-ink based on luminance
    const hex = t.accent.replace("#","");
    const r = parseInt(hex.substr(0,2),16), g=parseInt(hex.substr(2,2),16), b=parseInt(hex.substr(4,2),16);
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    document.documentElement.style.setProperty("--accent-ink", lum > 0.55 ? "#0a0a0a" : "#fafafa");
  }, [t.dark, t.style, t.accent]);

  const startRoutine = (rt)=>{
    setWorkoutRoutine(rt);
    setRoute("workout");
    setCompleted(false);
  };

  const handleRoute = (r)=>{
    if (r==="start") {
      startRoutine(ROUTINES[0]);
    } else {
      setRoute(r);
    }
  };

  if (!user) {
    return (
      <>
        <Login onLogin={(u)=>{ setUser(u); setRoute("dashboard"); }}/>
        <AppTweaks t={t} setTweak={setTweak}/>
      </>
    );
  }

  if (route === "workout" && workoutRoutine) {
    return (
      <>
        <Workout
          routine={workoutRoutine}
          onExit={()=>{ setWorkoutRoutine(null); setRoute("history"); }}
          onComplete={()=>{ setCompleted(true); setWorkoutRoutine(null); setRoute("history"); }}
        />
        <AppTweaks t={t} setTweak={setTweak}/>
      </>
    );
  }

  let screen;
  switch (route) {
    case "dashboard":  screen = <Dashboard user={user} onRoute={handleRoute} onStart={()=>startRoutine(ROUTINES[0])}/>; break;
    case "routines":   screen = <Routines onRoute={handleRoute} onStartRoutine={startRoutine}/>; break;
    case "history":    screen = <History onRoute={handleRoute}/>; break;
    case "stats":      screen = <Stats onRoute={handleRoute}/>; break;
    case "ropes":      screen = <Ropes/>; break;
    case "exercises":  screen = <Exercises/>; break;
    default:           screen = <Dashboard user={user} onRoute={handleRoute} onStart={()=>startRoutine(ROUTINES[0])}/>;
  }

  // Dashboard handles its own topbar internally; others inject via Topbar component
  const needsTopbar = route === "dashboard";

  return (
    <>
      <div className="app">
        <Sidebar route={route} onRoute={handleRoute} user={user} onLogout={()=>setUser(null)}/>
        <main className="main">
          {needsTopbar && <Topbar title="Dashboard" right={
            <span className="muted mono" style={{fontSize:12}}>11 may 2026</span>
          }/>}
          {screen}
        </main>
        <Tabbar route={route} onRoute={handleRoute}/>
      </div>
      <AppTweaks t={t} setTweak={setTweak}/>
    </>
  );
}

function AppTweaks({ t, setTweak }){
  return (
    <TweaksPanel>
      <TweakSection label="Tema"/>
      <TweakToggle label="Modo oscuro" value={t.dark} onChange={(v)=>setTweak("dark", v)}/>
      <TweakColor label="Acento" value={t.accent}
        options={["#D4FF3A","#FF4D2E","#2A6FDB","#22D3A8","#FF3DA1","#F4F4F0"]}
        onChange={(v)=>setTweak("accent", v)}/>
      <TweakSection label="Estilo visual"/>
      <TweakRadio label="Dirección" value={t.style||"sport"}
        options={["sport","mono","neon"]}
        onChange={(v)=>setTweak("style", v)}/>
      <div className="muted" style={{fontSize:11,marginTop:4,lineHeight:1.4}}>
        <b>Sport</b>: limpio y energético · <b>Mono</b>: tipo herramienta, todo monospace · <b>Neon</b>: gym/gaming, alto contraste
      </div>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
