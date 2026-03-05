import React, { useState, useEffect, useMemo } from 'react';

const CRITERIOS = [
  'Calidad Vocal',
  'Afinacion',
  'Ritmica',
  'Balance Vocal & Diccion',
  'Calidad interpretativa (OPE)',
];

function TopBar({ eventName, setView, view }) {
  const BASE = import.meta.env.BASE_URL;          // /EvaluadorCorales2.2/ en Pages, / en local
  const LOGO_HEADER = `${BASE}logo.jpg`;          // logo de cabecera (JPG)

  return (
    <header className="topbar">
      <div className="brand" onClick={() => setView('home')}>
        <img src={LOGO_HEADER} alt="Festival de Corales" />
        <div className="brand-text">
          <strong>{eventName}</strong>
          <small>{view === 'final' ? 'Resultados finales' : 'Evaluación'}</small>
        </div>
      </div>
    </header>
  );
}

function generatePIN(){ return Math.floor(1000 + Math.random()*9000).toString(); }

export default function App(){
  // ======== Hooks raíz (siempre en el mismo orden) ========
  const [view,setView] = useState('home'); // home | admin | jurado | final
  const [adminLogueado,setAdminLogueado] = useState(false);
  const [evento,setEvento] = useState(()=>localStorage.getItem('evento')||'Festival de Corales');
  const [agrupaciones,setAgrupaciones] = useState(()=>JSON.parse(localStorage.getItem('agrupaciones'))||[]);
  const [jurados,setJurados] = useState(()=>JSON.parse(localStorage.getItem('jurados_v2'))||[]); // {name,pin}
  const [evaluaciones,setEvaluaciones] = useState(()=>JSON.parse(localStorage.getItem('evaluaciones'))||{});
  const [bloqueado,setBloqueado] = useState(()=>JSON.parse(localStorage.getItem('bloqueado'))||false);
  const [juradoActivo,setJuradoActivo] = useState(null);

  // 👉 Estado para la REVELACIÓN (0=nada, 1=3º, 2=3º+2º, 3=3º+2º+1º)
  const [revealStep, setRevealStep] = useState(0);
  useEffect(() => { if (view !== 'final') setRevealStep(0); }, [view]);

  // Persistencia
  useEffect(()=>{
    localStorage.setItem('evento', evento);
    localStorage.setItem('agrupaciones', JSON.stringify(agrupaciones));
    localStorage.setItem('jurados_v2', JSON.stringify(jurados));
    localStorage.setItem('evaluaciones', JSON.stringify(evaluaciones));
    localStorage.setItem('bloqueado', JSON.stringify(bloqueado));
  },[evento,agrupaciones,jurados,evaluaciones,bloqueado]);

  // Totales por agrupación (orden desc; desempate alfabético)
  const tablaTotales = useMemo(()=>{
    const tot = {};
    for(const key of Object.keys(evaluaciones||{})){
      const evalJ = evaluaciones[key]||{};
      for(const ag of Object.keys(evalJ)){
        const fila = evalJ[ag]||{};
        const sum = Object.values(fila).reduce((a,b)=>a+(Number(b)||0),0);
        tot[ag] = (tot[ag]||0) + sum;
      }
    }
    (agrupaciones||[]).forEach(ag=>{ if(!(ag in tot)) tot[ag]=0; });
    return Object.entries(tot).sort((a,b)=>{
      if(b[1]!==a[1]) return b[1]-a[1];
      return a[0].localeCompare(b[0],'es',{sensitivity:'base'});
    });
  },[evaluaciones,agrupaciones]);

  const loginAdmin = k => k==='admin123' ? setAdminLogueado(true) : alert('Clave incorrecta');

  // Helpers refs
  let jurInputRef=null, agrInputRef=null;

  const agregarJurado=()=>{
    const n = (jurInputRef?.value || '').trim(); if(!n) return;
    if(jurados.some(j=>j.name===n)) return alert('Ese jurado ya existe');
    const pin = generatePIN();
    setJurados(prev=>[...prev,{name:n,pin}]);
    alert('Jurado agregado: '+n+'  PIN: '+pin);
    if(jurInputRef){ jurInputRef.value=''; jurInputRef.focus(); }
  };
  const eliminarJurado=(name)=>setJurados(jurados.filter(j=>j.name!==name));

  const agregarAgrupacion=()=>{
    const n = (agrInputRef?.value || '').trim(); if(!n) return;
    if(agrupaciones.length>=15) return alert('Máximo 15 agrupaciones');
    if(agrupaciones.includes(n)) return alert('Ya existe');
    setAgrupaciones(prev=>[...prev,n]);
    if(agrInputRef){ agrInputRef.value=''; agrInputRef.focus(); }
  };
  const eliminarAgrupacion=(n)=>setAgrupaciones(agrupaciones.filter(a=>a!==n));

  const evaluar=(ag,c,v)=>{
    if(v==='') v='';
    const num=Number(v); if(num<0||num>5) return;
    const key=juradoActivo.name;
    const actual=evaluaciones[key]||{};
    const nueva={...actual,[ag]:{...(actual[ag]||{}),[c]: v===''?'':num }};
    setEvaluaciones({...evaluaciones,[key]:nueva});
  };

  const reiniciar=()=>{
    if(window.confirm('¿Seguro que deseas reiniciar el concurso?')){
      setJurados([]); setAgrupaciones([]); setEvaluaciones({});
      setEvento('Festival de Corales'); setBloqueado(false);
      setAdminLogueado(false); setView('home'); setJuradoActivo(null);
    }
  };

  // =================== Vistas ===================
  if(view==='home'){
    return (
      <div className='wrap home'>
        <TopBar eventName={evento} setView={setView} view={view}/>
        <div className='content'>
          <h1>Bienvenido</h1>
          <div className='actions'>
            <button onClick={()=>setView('admin')}>Entrar como Administrador</button>
            <button onClick={()=>setView('jurado')}>Entrar como Jurado</button>
            <button className='secondary' onClick={()=>setView('final')}>Ver Resultados</button>
          </div>
        </div>
      </div>
    );
  }

  if(view==='admin' && !adminLogueado){
    let r;
    return (
      <div className='wrap'>
        <TopBar eventName={evento} setView={setView} view={view}/>
        <div className='content'>
          <h2>Login Administrador</h2>
          <input ref={x=>r=x} type='password' placeholder='Clave (admin123)' onKeyDown={e=>e.key==='Enter'&&loginAdmin(e.target.value)}/>
          <button onClick={()=>loginAdmin(r?.value||'')}>Ingresar</button>
          <button className='secondary' onClick={()=>setView('home')}>Volver</button>
        </div>
      </div>
    );
  }

  if(view==='admin'){
    return (
      <div className='wrap'>
        <TopBar eventName={evento} setView={setView} view={view}/>
        <div className='content'>
          <h2>Panel de Administración</h2>
          <label className='label'>Nombre del evento</label>
          <input value={evento} onChange={e=>setEvento(e.target.value)} placeholder='Nombre del evento'/>

          <div className='grid2'>
            <div>
              <h3>Jurados</h3>
              <div className='row'>
                <input ref={x=>jurInputRef=x} placeholder='Nombre del jurado' onKeyDown={e=>e.key==='Enter'&&agregarJurado()}/>
                <button onClick={agregarJurado}>Agregar</button>
              </div>
              <ul className='list'>
                {jurados.map(j=>(
                  <li key={j.name}>
                    <span>{j.name} — <code>PIN: {j.pin}</code></span>
                    <button className='danger' onClick={()=>eliminarJurado(j.name)}>Eliminar</button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3>Agrupaciones (máx 15)</h3>
              <div className='row'>
                <input ref={x=>agrInputRef=x} placeholder='Nombre de la agrupación' onKeyDown={e=>e.key==='Enter'&&agregarAgrupacion()}/>
                <button onClick={agregarAgrupacion}>Agregar</button>
              </div>
              <ul className='list'>
                {agrupaciones.map(a=>(
                  <li key={a}><span>{a}</span><button className='danger' onClick={()=>eliminarAgrupacion(a)}>Eliminar</button></li>
                ))}
              </ul>
            </div>
          </div>

          <div className='row'>
            <button onClick={()=>setBloqueado(!bloqueado)}>{bloqueado?'Desbloquear':'Bloquear'} Evaluación</button>
            <button className='danger' onClick={reiniciar}>Reiniciar Concurso</button>
            <button className='secondary' onClick={()=>setView('home')}>Salir</button>
            <button onClick={()=>setView('final')}>Ver resultados finales</button>
          </div>

          <h3>Totales por agrupación (suma de jurados)</h3>
          <div className='table-wrap'>
            <table>
              <thead><tr><th>#</th><th>Agrupación</th><th>Total</th></tr></thead>
              <tbody>
                {tablaTotales.map(([ag, total], idx)=>(
                  <tr key={ag} className={idx===0?'gold':idx===1?'silver':idx===2?'bronze':''}>
                    <td>{idx+1}</td><td className='left'>{ag}</td><td><strong>{total}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if(view==='jurado' && !juradoActivo){
    let selected=null, pinRef;
    return (
      <div className='wrap'>
        <TopBar eventName={evento} setView={setView} view={view}/>
        <div className='content'>
          <h2>Identifícate</h2>
          <p>Selecciona tu nombre y escribe tu PIN para continuar.</p>
          <div className='row'>
            <select onChange={e=>selected = jurados.find(j=>j.name===e.target.value)} defaultValue=''>
              <option value='' disabled>Selecciona jurado</option>
              {jurados.map(j=>(<option key={j.name} value={j.name}>{j.name}</option>))}
            </select>
            <input ref={x=>pinRef=x} placeholder='PIN' inputMode='numeric' maxLength={4}/>
            <button onClick={()=>{
              if(!selected) return alert('Selecciona tu nombre');
              if(!pinRef?.value) return alert('Escribe tu PIN');
              if(pinRef.value===selected.pin){ setJuradoActivo(selected); }
              else alert('PIN incorrecto');
            }}>Entrar</button>
            <button className='secondary' onClick={()=>setView('home')}>Volver</button>
          </div>
        </div>
      </div>
    );
  }

  if(view==='jurado'){
    const datos=evaluaciones[juradoActivo.name]||{};
    return (
      <div className='wrap'>
        <TopBar eventName={evento} setView={setView} view={view}/>
        <div className='content'>
          <h2>{evento}</h2><h3>Evaluación de: {juradoActivo.name}</h3>
          {bloqueado && <p className='locked'>Evaluación bloqueada</p>}
          <div className='table-wrap'><table><thead><tr>
            <th>Agrupación</th>{CRITERIOS.map(c=>(<th key={c}>{c}</th>))}<th>Total</th>
          </tr></thead><tbody>
            {agrupaciones.map(ag=>{
              const fila=datos[ag]||{};
              const total=Object.values(fila).reduce((a,b)=>a+(Number(b)||0),0);
              return (<tr key={ag}>
                <td className='left'>{ag}</td>
                {CRITERIOS.map(c=>(<td key={c}>
                  <input type='number' min={0} max={5} disabled={bloqueado}
                         value={(fila[c]??'')}
                         onChange={e=>evaluar(ag,c,e.target.value)} />
                </td>))}
                <td><strong>{total}</strong></td>
              </tr>);
            })}
          </tbody></table></div>
          <button className='secondary' onClick={()=>setView('final')}>Ir a resultados finales</button>
        </div>
      </div>
    );
  }

  // ============== Resultados Finales (con botón “Revelación” + FX) ==============
  if (view === 'final') {
    const orden = Array.isArray(tablaTotales) ? tablaTotales : [];
    const top3 = orden.slice(0, 3);           // [1º, 2º, 3º]
    const byReveal = top3.slice(0).reverse(); // [3º, 2º, 1º]
    const mostrando = byReveal.slice(0, Math.min(revealStep, byReveal.length));

    // --- util: canvas compartido ---
    const getCanvas = () => {
      const cvs = document.getElementById('fx');
      if (!cvs) return null;
      const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
      resize();
      return { cvs, ctx: cvs.getContext('2d'), resize };
    };

    // --- 🎉 Confeti (3º y 2º) ---
    const triggerConfetti = (durMs = 1800) => {
      const fx = getCanvas(); if (!fx) return;
      const { cvs, ctx, resize } = fx;
      const W = () => cvs.width, H = () => cvs.height;
      const colors = ['#ffd166', '#06d6a0', '#ef476f', '#118ab2', '#ffffff'];
      let parts = [];
      const N = 180;
      for (let i = 0; i < N; i++) {
        parts.push({
          x: Math.random() * W(), y: -20 - Math.random() * 80,
          vx: (Math.random() - .5) * 3, vy: Math.random() * 2 + 1,
          g: .06, rot: Math.random() * 360, vr: (Math.random() - .5) * 12,
          sz: 6 + Math.random() * 6, color: colors[(Math.random() * colors.length) | 0], life: durMs
        });
      }
      let last = performance.now(), stop = false;
      const onResize = () => resize();
      window.addEventListener('resize', onResize);
      const loop = (t) => {
        if (stop) return;
        const dt = Math.min(40, t - last); last = t;
        ctx.clearRect(0, 0, W(), H());
        parts.forEach(p => {
          p.vy += p.g;
          p.x += p.vx; p.y += p.vy; p.rot += p.vr * (dt / 16);
          p.life -= dt;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.sz / 2, -p.sz / 2, p.sz, p.sz * 0.6);
          ctx.restore();
        });
        parts = parts.filter(p => p.y < H() + 40 && p.life > 0);
        if (parts.length > 0) requestAnimationFrame(loop);
        else { ctx.clearRect(0, 0, W(), H()); window.removeEventListener('resize', onResize); }
      };
      requestAnimationFrame(loop);
      setTimeout(() => { stop = true; }, durMs + 400);
    };

    // --- 🎆 Fuegos (1º) ---
    const triggerFireworks = (durMs = 2400) => {
      const fx = getCanvas(); if (!fx) return;
      const { cvs, ctx, resize } = fx;
      const W = () => cvs.width, H = () => cvs.height;

      const bursts = [];
      const makeBurst = (x, y) => {
        const n = 90, ps = [];
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n;
          const s = 2.2 + Math.random() * 2.5;
          ps.push({
            x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
            g: 0.04, life: 900 + Math.random() * 600,
            color: `hsl(${(Math.random()*360)|0} 100% 65%)`
          });
        }
        bursts.push(ps);
      };

      // varios estallidos
      const shots = 4;
      for (let i = 0; i < shots; i++) {
        const x = W() * (0.2 + Math.random() * 0.6);
        const y = H() * (0.25 + Math.random() * 0.35);
        setTimeout(() => makeBurst(x, y), i * 300);
      }

      let last = performance.now(), stop = false;
      const onResize = () => resize();
      window.addEventListener('resize', onResize);

      const loop = (t) => {
        if (stop) return;
        const dt = Math.min(40, t - last); last = t;
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(0, 0, W(), H());

        for (let b = bursts.length - 1; b >= 0; b--) {
          const ps = bursts[b];
          for (let i = ps.length - 1; i >= 0; i--) {
            const p = ps[i];
            p.vy += p.g;
            p.x += p.vx; p.y += p.vy; p.life -= dt;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = p.color; ctx.fill();
            if (p.life <= 0) ps.splice(i, 1);
          }
          if (ps.length === 0) bursts.splice(b, 1);
        }

        if (bursts.length > 0) requestAnimationFrame(loop);
        else { ctx.clearRect(0, 0, W(), H()); window.removeEventListener('resize', onResize); }
      };
      requestAnimationFrame(loop);
      setTimeout(() => { stop = true; }, durMs + 600);
    };

    // Texto y handler del botón
  // Botón & texto
let btnText = 'Revelación';
if (revealStep === 0) btnText = 'Revelar 3º';
else if (revealStep === 1) btnText = 'Revelar 2º';
else if (revealStep === 2) btnText = 'Revelar 1º';
else btnText = 'Reiniciar';

const onRevealClick = () => {
  if (revealStep < 3) {
    const next = revealStep + 1;
    setRevealStep(next);
    // 🎉 confeti para todos los pasos
    triggerConfetti(2000);
  } else {
    setRevealStep(0); // reinicia la secuencia
  }
};

    return (
      <div className="wrap final">
        <TopBar eventName={evento} setView={setView} view={view} />

        {/* Canvas para efectos */}
        <canvas id="fx" className="fx-canvas" />

        <div className="content podium">
          <h2>Resultados Finales</h2>

          {orden.length === 0 ? (
            <p>Sin datos aún. Agrega notas y vuelve aquí. 🎼</p>
          ) : (
            <>
              {/* Ganador destacado (tras revelar 1º) */}
              {revealStep >= 3 && top3[0] && (
                <div className="winner" style={{
                  background:'#ffffff22', border:'1px solid #ffffff44',
                  padding:'16px', borderRadius:'14px', margin:'12px 0'
                }}>
                  <h3 style={{margin:'0 0 8px'}}>🏆 Ganador</h3>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <strong style={{fontSize:'1.2rem'}}>{top3[0][0]}</strong>
                    <span style={{fontWeight:800}}>{top3[0][1]} pts</span>
                  </div>
                </div>
              )}

              {/* Podio (muestra solo lo revelado: 3º → 2º → 1º) */}
              <ol>
                {mostrando.map(([ag, total]) => {
                  const rank = top3.findIndex(([name]) => name === ag); // 0=1º,1=2º,2=3º
                  const placeNum = rank + 1;
                  const cls = rank === 0 ? 'gold' : rank === 1 ? 'silver' : 'bronze';
                  return (
                    <li key={ag} className={cls}>
                      <span className="place">{placeNum}º</span>
                      <span className="name">{ag}</span>
                      <span className="score">{total} pts</span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          <button onClick={() => setView('home')}>Volver al inicio</button>
        </div>

        {/* Botón circular flotante */}
        <button className="reveal-btn" onClick={onRevealClick} title="Revelar podio">
          {btnText}
        </button>
      </div>
    );
  }

  // Salvaguarda
  return null;
}
