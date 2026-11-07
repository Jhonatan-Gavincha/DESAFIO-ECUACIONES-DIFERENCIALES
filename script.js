const DEF=[
["N","Estudiantes (personas)",30,1,80,1],
["g","CO₂ por persona (L/min)",0.3,0.05,1,0.05],
["V","Volumen del aula (m³)",144,10,1000,1],
["Q","Ventilación (m³/min)",6,0,100,0.5],
["Cext","CO₂ exterior (ppm)",420,300,600,10],
["C0","CO₂ inicial (ppm)",420,300,5000,10],
["T","Tiempo de simulación (min)",60,1,240,1],
["h","Paso h (min)",5,0.05,30,0.05]];
const $=id=>document.getElementById(id);
$("inputs").innerHTML=DEF.map(d=>`<label for="${d[0]}"><b>${d[1]}</b><small>entre ${d[3]} y ${d[4]}</small><input id="${d[0]}" type="number" step="${d[5]}" value="${d[2]}" inputmode="decimal"></label>`).join("");
const LIM=1000,f2=(x,n=2)=>Number(x).toFixed(n);

function read(){
  const p={},bad=[];
  DEF.forEach(d=>{const el=$(d[0]),v=parseFloat(el.value);const ok=Number.isFinite(v)&&v>=d[3]&&v<=d[4];el.setAttribute("aria-invalid",!ok);if(!ok)bad.push(d[1]+": debe estar entre "+d[3]+" y "+d[4]);p[d[0]]=v});
  if(!bad.length&&p.T/p.h>2000)bad.push("Hay demasiados pasos: aumenta h o reduce el tiempo (máximo 2000 pasos).");
  return{p,bad};
}
function model(p){
  const a=1000*p.N*p.g/p.V,lam=p.Q/p.V,Cinf=lam>0?p.Cext+a/lam:Infinity;
  return{a,lam,Cinf,f:(t,y)=>a-lam*(y-p.Cext),ex:t=>lam>0?Cinf+(p.C0-Cinf)*Math.exp(-lam*t):p.C0+a*t};
}
function run(f,y0,T,h,m){
  const t=[0],y=[y0];let tt=0,yy=y0;
  while(tt<T-1e-9){const s=Math.min(h,T-tt);let n;
    if(m==="heun"){const k1=f(tt,yy),k2=f(tt+s,yy+s*k1);n=yy+s/2*(k1+k2)}
    else{const k1=f(tt,yy),k2=f(tt+s/2,yy+s/2*k1),k3=f(tt+s/2,yy+s/2*k2),k4=f(tt+s,yy+s*k3);n=yy+s/6*(k1+2*k2+2*k3+k4)}
    tt+=s;yy=n;t.push(tt);y.push(yy)}
  return{t,y};
}
const maxErr=(M,r)=>r.t.reduce((m,t,i)=>Math.max(m,Math.abs(r.y[i]-M.ex(t))),0);

function chart(id,series,o){
  const W=640,H=300,L=64,R=14,Tp=30,B=36;
  const xs=[],ys=[];series.forEach(s=>{xs.push(...s.x);ys.push(...s.y)});if(o.hline!=null)ys.push(o.hline);
  const x1=Math.max(...xs);let y0=o.zero?0:Math.min(...ys),y1=Math.max(...ys);
  const pad=(y1-y0)*.08||1;y1+=pad;if(!o.zero)y0-=pad;
  const X=x=>L+x/x1*(W-L-R),Y=y=>H-B-(y-y0)/(y1-y0)*(H-B-Tp);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.label}">`;
  for(let i=0;i<=4;i++){const v=y0+(y1-y0)*i/4,xv=x1*i/4;
    s+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L-6}" y="${Y(v)+4}" text-anchor="end">${o.fmt(v)}</text>`;
    s+=`<text x="${X(xv)}" y="${H-B+16}" text-anchor="middle">${f2(xv,xv%1?1:0)}</text>`}
  s+=`<text x="${(L+W-R)/2}" y="${H-4}" text-anchor="middle">tiempo (min)</text><text x="${L}" y="12">${o.yl}</text>`;
  if(o.hline!=null&&o.hline>=y0&&o.hline<=y1)s+=`<line x1="${L}" x2="${W-R}" y1="${Y(o.hline)}" y2="${Y(o.hline)}" stroke="var(--bad)" stroke-dasharray="6 4" stroke-width="1.5"/>`;
  series.forEach(se=>{s+=`<polyline fill="none" stroke="${se.c}" stroke-width="${se.w||2}" points="${se.x.map((x,i)=>X(x).toFixed(1)+","+Y(se.y[i]).toFixed(1)).join(" ")}"/>`;
    if(se.dots&&se.x.length<=70)se.x.forEach((x,i)=>s+=`<circle cx="${X(x).toFixed(1)}" cy="${Y(se.y[i]).toFixed(1)}" r="2.6" fill="${se.c}"/>`)});
  $(id).innerHTML=s+"</svg>";
}

function update(){
  const{p,bad}=read();$("err").textContent=bad.join(" · ");if(bad.length){last=null;return}
  const M=model(p),H=run(M.f,p.C0,p.T,p.h,"heun"),R=run(M.f,p.C0,p.T,p.h,"rk4");
  const ex=H.t.map(M.ex),eH=H.y.map((v,i)=>Math.abs(v-ex[i])),eR=R.y.map((v,i)=>Math.abs(v-ex[i]));
  const fine=[...Array(201).keys()].map(i=>p.T*i/200);
  chart("ch1",[{x:fine,y:fine.map(M.ex),c:"var(--ex)",w:3},{x:H.t,y:H.y,c:"var(--he)",w:1.6,dots:1},{x:R.t,y:R.y,c:"var(--rk)",w:1.6,dots:1}],{hline:LIM,yl:"CO₂ (ppm)",fmt:v=>f2(v,0),label:"Concentración de CO₂ en el tiempo"});
  chart("ch2",[{x:H.t,y:eH,c:"var(--he)"},{x:R.t,y:eR,c:"var(--rk)"}],{zero:1,yl:"|error| (ppm)",fmt:v=>v.toExponential(1),label:"Error absoluto de Heun y RK4"});
  // tiempo hasta 1000 ppm
  let ts=null;
  if(p.C0>=LIM)ts=0;else if(M.lam>0&&M.Cinf>LIM)ts=Math.log((M.Cinf-p.C0)/(M.Cinf-LIM))/M.lam;else if(M.lam===0&&M.a>0)ts=(LIM-p.C0)/M.a;
  $("tstar").textContent=ts===null?"Nunca":f2(ts,1);
  $("tnote").textContent=ts===null?"El CO₂ se estabiliza por debajo del límite":"minutos (solución analítica)";
  $("cend").textContent=f2(ex[ex.length-1],0)+" ppm";
  const Gm3=p.N*p.g/1000,Qreq=Gm3/((LIM-p.Cext)*1e-6);
  $("qreq").textContent=f2(Qreq,1)+" m³/min ("+f2(Qreq/p.V*60,1)+" renovaciones/h)";
  const mH=Math.max(...eH),mR=Math.max(...eR);
  $("emax").textContent=mH.toExponential(2)+" / "+mR.toExponential(2)+" ppm";
  // pasos
  let st="<tr><th>h (min)</th><th>Pasos</th><th>Error máx. Heun (ppm)</th><th>Error máx. RK4 (ppm)</th></tr>";
  [p.h,p.h/2,p.h/4].forEach(h=>{const a=run(M.f,p.C0,p.T,h,"heun"),b=run(M.f,p.C0,p.T,h,"rk4");st+=`<tr><td>${f2(h,3)}</td><td>${a.t.length-1}</td><td>${maxErr(M,a).toExponential(3)}</td><td>${maxErr(M,b).toExponential(3)}</td></tr>`});
  $("steps").innerHTML=st;
  // tabla
  let tb="<tr><th>n</th><th>t (min)</th><th>Analítica</th><th>Heun</th><th>RK4</th><th>|e| Heun</th><th>|e| RK4</th><th>e% Heun</th><th>e% RK4</th></tr>";
  H.t.forEach((t,i)=>{tb+=`<tr><td>${i}</td><td>${f2(t,2)}</td><td>${f2(ex[i],4)}</td><td>${f2(H.y[i],4)}</td><td>${f2(R.y[i],4)}</td><td>${eH[i].toExponential(2)}</td><td>${eR[i].toExponential(2)}</td><td>${(eH[i]/ex[i]*100).toExponential(2)}</td><td>${(eR[i]/ex[i]*100).toExponential(2)}</td></tr>`});
  $("tbl").innerHTML=tb;
  // interpretación
  const better=mR<mH?"RK4":"Heun",ratio=mH/(mR||1e-300);
  let r=ts===null?`<p>Con estos parámetros el CO₂ se estabiliza en torno a ${f2(M.Cinf,0)} ppm, por debajo del límite de 1000 ppm. El aire del aula se mantiene en un rango aceptable.</p>`
   :ts===0?`<p>El aula ya parte por encima de 1000 ppm, así que hay que ventilar de inmediato.</p>`
   :`<p>Con ${p.N} personas y ${f2(p.Q,1)} m³/min de ventilación, el aula supera las 1000 ppm a los <b>${f2(ts,1)} minutos</b>. Si el CO₂ se estabilizara, llegaría a ${isFinite(M.Cinf)?f2(M.Cinf,0)+" ppm":"un valor que crece sin límite (sin ventilación)"}.</p><p>Para no pasar de 1000 ppm hacen falta unos <b>${f2(Qreq,1)} m³/min</b> de aire fresco. Eso equivale a abrir ventanas y puerta de modo que el aire se renueve ${f2(Qreq/p.V*60,1)} veces por hora.</p>`;
  r+=`<p>En este ensayo (h = ${p.h} min), <b>${better}</b> tuvo menor error máximo: ${(better==="RK4"?mR:mH).toExponential(2)} ppm contra ${(better==="RK4"?mH:mR).toExponential(2)} ppm${isFinite(ratio)&&ratio>1.5?" (unas "+f2(ratio,0)+" veces menos)":""}. Al reducir h, ambos errores bajan: Heun de forma cuadrática y RK4 mucho más rápido (orden 4), como muestra la tabla de pasos.</p><p class="sub">Limitaciones: el modelo supone aire bien mezclado, ocupación y ventilación constantes y valores hipotéticos. Es una simulación, no una predicción comprobada con mediciones.</p>`;
  $("interp").innerHTML=r;extra(p,mH,mR,Qreq);last={p,ts,Qreq,mH,mR,cend:ex[ex.length-1],nmax:Math.max(0,Math.floor(p.Q*(LIM-p.Cext)/(1000*p.g)))};
}
function tstar(m,p){if(p.C0>=LIM)return 0;return m.lam>0&&m.Cinf>LIM?Math.log((m.Cinf-p.C0)/(m.Cinf-LIM))/m.lam:null}
function extra(p,mH,mR,Qreq){
  const sc=[["Ventanas cerradas",0.6,"var(--rk)"],["Ventanas entreabiertas",2.5,"var(--he)"],["Ventanas y puerta abiertas",8,"var(--ex)"]].map(([n,ach,c])=>{const Q=ach*p.V/60,m=model({...p,Q}),t=[...Array(121).keys()].map(i=>p.T*i/120);return{n,ach,Q,m,c,t,y:t.map(m.ex),ts:tstar(m,p)}});
  chart("ch3",sc.map(s=>({x:s.t,y:s.y,c:s.c,w:2.5})),{hline:LIM,yl:"CO₂ (ppm)",fmt:v=>f2(v,0),label:"Concentración de CO₂ según la ventilación"});
  const fm=s=>s.ts===null?"No lo supera":s.ts===0?"Ya parte arriba":f2(s.ts,1);
  $("scen").innerHTML="<tr><th style='text-align:left'>Escenario</th><th>Renov./h</th><th>Q (m³/min)</th><th>CO₂ estable (ppm)</th><th>Min hasta 1000 ppm</th><th>CO₂ a los "+p.T+" min</th></tr>"+sc.map(s=>`<tr><td style="text-align:left">${s.n}</td><td>${s.ach}</td><td>${f2(s.Q,1)}</td><td>${f2(s.m.Cinf,0)}</td><td>${fm(s)}</td><td>${f2(s.y[s.y.length-1],0)}</td></tr>`).join("");
  const [c,e,a]=sc,tt=s=>s.ts===null?"nunca lo supera":s.ts===0?"ya parte por encima del límite":"lo supera a los "+f2(s.ts,1)+" min";
  const nmax=Math.max(0,Math.floor(p.Q*(LIM-p.Cext)/(1000*p.g)));
  let rec=a.ts===null?"Abrir ventanas y puerta desde antes de empezar y mantenerlas abiertas durante la clase mantiene el aire bajo el límite.":"Ni con todo abierto se evita el límite con estas condiciones: hay que reducir el número de personas o hacer pausas fuera del aula.";
  rec+=e.ts===null?" Con las ventanas solo entreabiertas ya alcanza.":" Si solo se pueden entreabrir las ventanas, conviene hacer una pausa de ventilación antes de los "+f2(Math.max(e.ts*0.8,1),0)+" min.";
  const better=mR<mH?"RK4":"Heun";
  $("concl").innerHTML=`<ol>
<li><b>Respuesta a la pregunta.</b> Con ${p.N} estudiantes en ${p.V} m³, con las ventanas cerradas el aula ${tt(c)}; entreabiertas, ${tt(e)}; con ventanas y puerta abiertas, ${tt(a)}. Para no pasar de 1000 ppm se necesitan al menos ${f2(Qreq,1)} m³/min de aire fresco.</li>
<li><b>Recomendación para el salón.</b> ${rec} Con la ventilación actual (${f2(p.Q,1)} m³/min), el aire se mantendría bajo el límite con hasta unas ${nmax} personas.</li>
<li><b>Qué método fue mejor.</b> ${better} tuvo menor error en los ensayos (${mH.toExponential(2)} ppm con Heun y ${mR.toExponential(2)} ppm con RK4, con h = ${p.h} min). Ambos son más que suficientes para este problema, pero RK4 mejora mucho más al reducir h.</li>
<li><b>Limitaciones.</b> Los parámetros son hipotéticos; el modelo supone aire bien mezclado y ventilación constante. Para usarlo como diagnóstico real habría que medir el CO₂ del aula con un sensor y ajustar g y Q con esos datos.</li>
</ol>`;
}
const KEY='co2_aula_historial_v1';let last=null,armed=0;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\x22/g,'&quot;');
function load(){try{const a=JSON.parse(localStorage.getItem(KEY));return Array.isArray(a)?a:[]}catch(e){return[]}}
function store(a){try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){$('hmsg').textContent='No se pudo guardar: el navegador bloquea el almacenamiento.';return false}}
function hrender(){const a=load();
 $('hist').innerHTML=a.length?"<tr><th style='text-align:left'>Escenario</th><th>Fecha</th><th>N</th><th>V</th><th>Q</th><th>Min hasta 1000</th><th>CO₂ final</th><th>Aforo máx.</th><th>Error Heun</th><th>Error RK4</th><th></th></tr>"+a.map((r,i)=>`<tr><td style='text-align:left'>${esc(r.name)}</td><td>${esc(r.date)}</td><td>${r.p.N}</td><td>${r.p.V}</td><td>${r.p.Q}</td><td>${r.ts===null?'nunca':f2(r.ts,1)}</td><td>${f2(r.cend,0)}</td><td>${r.nmax}</td><td>${r.mH.toExponential(2)}</td><td>${r.mR.toExponential(2)}</td><td><button type='button' data-a='load' data-i='${i}'>Cargar</button> <button type='button' data-a='del' data-i='${i}'>Borrar</button></td></tr>`).join(''):"<tr><td style='text-align:left'>Aún no hay simulaciones guardadas.</td></tr>"}
async function dl(text){const name='historial_co2_aula.csv';
 try{if(window.claude&&claude.use){const d=await claude.use('downloads');if(d){await d.save({filename:name,data:text});return}}}catch(e){}
 const u=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
$('bsave').addEventListener('click',()=>{if(!last){$('hmsg').textContent='Corrige los parámetros antes de guardar.';return}
 const a=load(),n=$('sname').value.trim()||'Simulación '+(a.length+1);
 a.unshift({name:n,date:new Date().toLocaleString('es'),p:{...last.p},ts:last.ts,cend:last.cend,Qreq:last.Qreq,nmax:last.nmax,mH:last.mH,mR:last.mR});
 if(store(a.slice(0,200))){$('hmsg').textContent='Guardada: '+n;$('sname').value='';hrender()}});
$('hist').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const a=load(),i=+b.dataset.i;
 if(b.dataset.a==='del'){a.splice(i,1);store(a);hrender()}
 else if(b.dataset.a==='load'&&a[i]){DEF.forEach(d=>{$(d[0]).value=a[i].p[d[0]]});$('sname').value=a[i].name;update();$('sim').scrollIntoView({behavior:'smooth'})}});
$('bclr').addEventListener('click',()=>{if(!armed){armed=1;$('bclr').textContent='¿Seguro? Pulsa otra vez';setTimeout(()=>{armed=0;$('bclr').textContent='Borrar todo'},4000);return}
 armed=0;$('bclr').textContent='Borrar todo';store([]);hrender();$('hmsg').textContent='Historial borrado.'});
$('bcsv').addEventListener('click',async()=>{const a=load();if(!a.length){$('hmsg').textContent='No hay nada que exportar todavía.';return}
 const D=String.fromCharCode(34),q=v=>D+String(v).split(D).join(D+D)+D;
 const H=['escenario','fecha','estudiantes','g_L_min','volumen_m3','ventilacion_m3_min','co2_ext_ppm','c0_ppm','T_min','h_min','min_hasta_1000ppm','co2_final_ppm','vent_min_m3_min','aforo_max','error_max_heun_ppm','error_max_rk4_ppm'];
 const rows=a.map(r=>[r.name,r.date,r.p.N,r.p.g,r.p.V,r.p.Q,r.p.Cext,r.p.C0,r.p.T,r.p.h,r.ts===null?'nunca':r.ts.toFixed(2),r.cend.toFixed(1),r.Qreq.toFixed(2),r.nmax,r.mH,r.mR].map(q).join(','));
 await dl('\ufeff'+H.join(',')+'\n'+rows.join('\n'))});
hrender();
DEF.forEach(d=>$(d[0]).addEventListener("input",update));

update();
