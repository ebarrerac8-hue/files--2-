(function () {
'use strict';
const B = Banker, $ = id => document.getElementById(id);
const CY = 600, RX = 600, RY = 545, SY = 470, BY = 480, EX = 1170, TREAT = 6;
const SX = i => 60 + 85 * i, BX = i => 775 + 75 * i;
const fmt = a => `A${a[0]} B${a[1]} C${a[2]}`, nm = i => 'P' + (i + 1), row = a => a.join(' ');
const sv = $('scene');

let S, orig, scn = 'safe', gen = 0, paused = true, stepping = false, busy = false, loopOn = false, done = false;
let queue = [], ready = [], treat = {}, st = [], P = [], order = [], calc = {}, demoPending = false, speed = 1;
const anims = [];

// ---------- escena ----------
function buildScene(total) {
  sv.innerHTML = Scene.background(total) +
    '<g id="bub" visibility="hidden"><rect x="490" y="340" width="220" height="38" rx="8" fill="#fff" stroke="#222" stroke-width="3"/><text id="bubt" x="600" y="364" font-size="15" font-weight="bold" text-anchor="middle" font-family="Arial,sans-serif"></text></g>' +
    [0, 1, 2, 3, 4].map(Scene.patient).join('');
}
const draw = (i, dy = 0) => { const p = P[i]; $('p' + i).setAttribute('transform', `translate(${p.x},${p.y - dy})`); };
const tag = i => { $('pr' + i).textContent = fmt(S.alloc[i]); $('ps' + i).textContent = st[i]; };
const setSt = (i, s) => { st[i] = s; tag(i); };
const msg = t => { $('msg').textContent = t; };
const bubble = t => { const b = $('bub'); b.setAttribute('visibility', t ? 'visible' : 'hidden'); if (t) $('bubt').textContent = t; };

function refresh(av) {
  const real = !av; av = av || S.avail;
  for (let j = 0; j < 3; j++) $('av' + j).textContent = `${av[j]}/${S.total[j]}`;
  $('avail').textContent = (real ? 'Disponibles: ' : 'Disponibles (prueba, aún no confirmado): ') + fmt(av) + '  |  Total: ' + fmt(S.total);
  for (let i = 0; i < 5; i++) tag(i);
  if (real && !B.conserved(S)) { msg('Error: no se conserva el total de recursos.'); console.error('Conservación violada'); }
}

// ---------- animación (el reloj respeta pausa y velocidad) ----------
const addAnim = tick => new Promise(res => anims.push({ tick, res }));
const delay = s => { let t = s; return addAnim(dt => (t -= dt) <= 0); };
const waitFor = c => addAnim(() => c());
function walk(i, pts) {
  const p = P[i]; let k = 0, tt = 0;
  return addAnim(dt => {
    let d = 190 * dt; tt += dt;
    while (d > 0 && k < pts.length) {
      const dx = pts[k][0] - p.x, dy = pts[k][1] - p.y, l = Math.hypot(dx, dy);
      if (l <= d) { p.x = pts[k][0]; p.y = pts[k][1]; d -= l; k++; } else { p.x += dx / l * d; p.y += dy / l * d; d = 0; }
    }
    draw(i, k < pts.length ? Math.abs(Math.sin(tt * 9)) * 4 : 0);
    return k >= pts.length;
  });
}
let last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000) * speed; last = ts;
  if (!paused || stepping) {
    for (const a of anims.slice()) if (a.tick(dt)) { anims.splice(anims.indexOf(a), 1); a.res(); }
    for (const k in treat) { treat[k] -= dt; if (treat[k] <= 0) { delete treat[k]; ready.push(+k); } }
  }
  requestAnimationFrame(frame);
}

// ---------- flujos ligados a eventos del algoritmo ----------
async function requestFlow(i) {
  setSt(i, 'solicitando'); msg(`${nm(i)} se dirige a recepción.`);
  await walk(i, [[SX(i), CY], [RX, CY], [RX, RY]]);
  const demo = demoPending && scn === 'safe' && i === 4; if (demo) demoPending = false;
  const nd = B.needOf(S.max, S.alloc)[i], req = demo ? [3, 3, 0] : nd;
  bubble(`${nm(i)} solicita ${fmt(req)}`);
  msg(`${nm(i)} solicita ${fmt(req)}. Need = ${fmt(nd)}, Available = ${fmt(S.avail)}. Se evalúa la solicitud.`);
  await delay(1.3);
  const r = B.request(S, i, req); calc = { req: r, safety: r.check || calc.safety };
  if (r.tentative) {
    refresh(r.tentative);
    msg(`Prueba temporal: Available quedaría en ${fmt(r.tentative)}. Se ejecuta la comprobación de seguridad.`);
    await delay(1.6);
  }
  if (r.decision === 'grant') {
    refresh(); bubble('');
    msg(`Estado seguro (secuencia ${r.check.seq.map(nm).join(' → ')}). Se confirma: ${nm(i)} recibe ${fmt(req)} y pasa a tratamiento.`);
    setSt(i, 'en tratamiento');
    await walk(i, [[RX, CY], [BX(i), CY], [BX(i), BY]]);
    treat[i] = TREAT;
  } else {
    if (r.decision === 'wait' && r.reason === 'inseguro') {
      refresh(); // se revierte la prueba
      msg(`Con esa asignación no se puede garantizar que todos finalicen (no significa que ya haya interbloqueo). Se retiene la solicitud y se restauran los datos: Available vuelve a ${fmt(S.avail)}.`);
      await delay(2.2);
    } else {
      msg(r.decision === 'error' ? `La solicitud excede Need; se rechaza.` : `Request ${fmt(req)} > Available ${fmt(S.avail)}: ${nm(i)} debe esperar.`);
      await delay(1.5);
    }
    bubble(''); setSt(i, 'esperando');
    await walk(i, [[RX, CY], [SX(i), CY], [SX(i), SY]]);
  }
}

async function dischargeFlow(i) {
  const ret = B.release(S, i);
  if (!ret) return;
  order.push(i); setSt(i, 'finalizado'); refresh();
  msg(`${nm(i)} termina su atención y devuelve ${fmt(ret)}. Available = ${fmt(S.avail)}. Sale por alta médica y se reintentan las solicitudes pendientes. Orden real de finalización: ${order.map(nm).join(', ')}.`);
  await walk(i, [[BX(i), CY], [EX, CY]]);
  $('p' + i).setAttribute('visibility', 'hidden');
  queue = [0, 1, 2, 3, 4].filter(k => st[k] === 'esperando');
}

async function doStep() {
  if (ready.length) return dischargeFlow(ready.shift());
  if (queue.length) return requestFlow(queue.shift());
  if (Object.keys(treat).length) { msg('Hay pacientes en tratamiento; se espera a que terminen y devuelvan recursos.'); return waitFor(() => ready.length > 0); }
  done = true;
  const pend = [0, 1, 2, 3, 4].filter(i => S.active[i]);
  msg(pend.length ? `Fin: ${pend.map(nm).join(', ')} siguen esperando y ninguna solicitud puede atenderse con seguridad. No se puede garantizar que todos finalicen.` : `Todos los pacientes fueron atendidos. Orden real: ${order.map(nm).join(' → ')}.`);
}
async function step() {
  if (busy || done || !S) return;
  busy = true; const g = gen;
  try { await doStep(); } finally { if (g === gen) { busy = false; stepping = false; } }
}
function run() {
  if (loopOn || !S) return; loopOn = true; const g = gen;
  (async () => {
    while (g === gen && !paused && !done) { await step(); if (g !== gen) return; await delay(0.35); }
    if (g === gen) loopOn = false;
  })();
}

// ---------- carga / reinicio ----------
function load(k) {
  gen++; anims.length = 0; ready = []; treat = {}; order = []; busy = stepping = loopOn = done = false; paused = true; scn = k;
  const E = B.EXAMPLES[k], errs = B.validate(E.alloc, E.max, E.avail);
  if (errs.length) { msg(errs.join(' ')); S = null; return; }
  S = { alloc: B.clone(E.alloc), max: B.clone(E.max), avail: E.avail.slice(), active: E.alloc.map(() => true) };
  S.total = B.totalOf(S); orig = { alloc: B.clone(E.alloc), max: B.clone(E.max), avail: E.avail.slice() };
  queue = k === 'safe' ? [4, 0, 1, 2, 3] : [0, 1, 2, 3, 4]; demoPending = k === 'safe';
  buildScene(S.total);
  for (let i = 0; i < 5; i++) { P[i] = { x: SX(i), y: SY }; st[i] = 'esperando'; draw(i); }
  const c = B.safety(S.avail, S.alloc, S.max, S.active); calc = { req: null, safety: c };
  refresh();
  msg(c.safe ? `Ejemplo seguro cargado. Secuencia segura calculada: ${c.seq.map(nm).join(' → ')}. Pulsa Iniciar o Siguiente paso. P5 intentará primero pedir A3 B3 C0.`
    : `Ejemplo inseguro cargado (Available = A0 B0 C0). No se puede garantizar que todos finalicen: con Work = 0 0 0 ninguna Need es satisfacible (${c.stuck.map(i => nm(i) + ' necesita ' + fmt(c.need[i])).join('; ')}).`);
}

// ---------- ver cálculo ----------
function calcHTML() {
  const nd = B.needOf(S.max, S.alloc), s = calc.safety, r = calc.req;
  let h = '<h2>Allocation, Max y Need</h2><table><tr><th>P</th><th>Allocation inicial</th><th>Allocation actual</th><th>Max</th><th>Need = Max − Allocation</th><th>Estado</th></tr>';
  for (let i = 0; i < 5; i++) h += `<tr><td>${nm(i)}</td><td>${row(orig.alloc[i])}</td><td>${row(S.alloc[i])}</td><td>${row(orig.max[i])}</td><td>${S.active[i] ? row(nd[i]) : '—'}</td><td>${st[i]}</td></tr>`;
  h += `</table><p><b>Available real:</b> ${row(S.avail)} (inicial ${row(orig.avail)}). <b>Total:</b> ${row(S.total)} = Available + Allocation de activos: <span class="${B.conserved(S) ? 'ok' : 'bad'}">${B.conserved(S) ? 'se cumple' : 'NO se cumple'}</span>.</p>`;
  h += '<h2>Solicitud actual y decisión</h2>';
  if (!r) h += '<p>Aún no hay solicitudes.</p>';
  else {
    const why = { grant: 'CONFIRMADA: el estado resultante es seguro.', error: 'RECHAZADA: Request > Need.', wait: r.reason === 'recursos' ? 'ESPERA: Request > Available.' : 'RETENIDA: el estado de prueba es inseguro; se revirtieron los cambios (no se puede garantizar que todos finalicen).' };
    h += `<p>${nm(r.i)} pide ${row(r.req)}. Need = ${row(r.need)} → Request ≤ Need: ${(r.req.every((v, j) => v <= r.need[j]) ? 'sí' : 'no')}. Available al evaluar = ${row(r.avail)} → Request ≤ Available: ${r.req.every((v, j) => v <= r.avail[j]) ? 'sí' : 'no'}.<br><b>${why[r.decision]}</b></p>`;
  }
  h += `<h2>Comprobación de seguridad (${r && r.check ? 'estado de prueba con la solicitud' : 'estado real'})</h2>`;
  if (s) {
    h += '<ol>' + s.steps.map(x => `<li>${nm(x.p)}: Need ${row(x.need)} ≤ Work ${row(x.work)}? ${x.ok ? `<span class="ok">sí</span> → Work = Work + Allocation = ${row(x.after)}` : '<span class="bad">no</span>'}</li>`).join('') + '</ol>';
    h += `<table><tr><th>P</th>${[0, 1, 2, 3, 4].map(i => `<th>${nm(i)}</th>`).join('')}</tr><tr><td>Finish</td>${s.finish.map(f => `<td>${f}</td>`).join('')}</tr></table>`;
    h += `<p>Work final: ${row(s.work)}. <b>Secuencia segura hipotética:</b> ${s.safe ? s.seq.map(nm).join(' → ') : '<span class="bad">no existe</span>'}. ${s.safe ? '' : 'No se puede garantizar que todos finalicen; sin satisfacer: ' + s.stuck.map(nm).join(', ') + '.'}</p>`;
  }
  return h + `<h2>Orden real de finalización</h2><p>${order.length ? order.map(nm).join(' → ') : 'Ninguno todavía.'} (puede diferir de la secuencia hipotética).</p>`;
}

// ---------- controles ----------
$('bStart').onclick = () => { if (S && !done) { paused = false; run(); } };
$('bPause').onclick = () => { paused = true; };
$('bNext').onclick = () => { if (!S || done) return; paused = true; stepping = true; if (!busy) step(); };
$('bReset').onclick = () => load(scn);
$('bSafe').onclick = () => load('safe');
$('bUnsafe').onclick = () => load('unsafe');
$('speed').oninput = e => { speed = +e.target.value; };
$('bCalc').onclick = () => { if (!S) return; $('calc').innerHTML = calcHTML(); $('modal').hidden = false; };
$('bClose').onclick = () => { $('modal').hidden = true; };
$('modal').onclick = e => { if (e.target.id === 'modal') $('modal').hidden = true; };

load('safe');
requestAnimationFrame(frame);
})();
