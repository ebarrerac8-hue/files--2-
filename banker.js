(function (g) {
'use strict';
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const leq = (a, b) => a.every((v, i) => v <= b[i]);
const clone = m => m.map(r => r.slice());
const needOf = (M, A) => M.map((r, i) => sub(r, A[i]));

const EXAMPLES = {
  safe: { alloc: [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]],
          max: [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]], avail: [3,3,2] },
  unsafe: { alloc: [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]],
            max: [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]], avail: [0,0,0] }
};

function validate(A, M, av) {
  const e = [], m = av.length, isN = v => Number.isInteger(v) && v >= 0;
  if (!A.length || A.length !== M.length) e.push('Allocation y Max deben tener los mismos procesos.');
  if (!av.every(isN)) e.push('Available debe contener enteros no negativos.');
  A.forEach((r, i) => {
    if (r.length !== m || M[i].length !== m) e.push('P' + (i + 1) + ': dimensiones incorrectas.');
    else if (!r.every(isN) || !M[i].every(isN)) e.push('P' + (i + 1) + ': solo enteros no negativos.');
    else if (!leq(r, M[i])) e.push('P' + (i + 1) + ': Max debe ser >= Allocation.');
  });
  return e;
}

// Comprobación de seguridad: trabaja solo sobre copias.
function safety(avail, A, M, active) {
  const nd = needOf(M, A), work = avail.slice(), fin = A.map((_, i) => !active[i]);
  const seq = [], steps = [];
  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < A.length; i++) {
      if (fin[i]) continue;
      const ok = leq(nd[i], work), s = { p: i, need: nd[i].slice(), work: work.slice(), ok };
      if (ok) {
        for (let j = 0; j < work.length; j++) work[j] += A[i][j];
        fin[i] = true; seq.push(i); s.after = work.slice(); progress = true;
      }
      steps.push(s);
    }
  }
  const stuck = fin.map((f, i) => f ? -1 : i).filter(i => i >= 0);
  return { safe: stuck.length === 0, seq, steps, work, finish: fin, stuck, need: nd };
}

// Evaluación de solicitud. La prueba se hace en copias; solo si es segura se confirma.
function request(S, i, req) {
  const nd = sub(S.max[i], S.alloc[i]);
  const r = { i, req: req.slice(), need: nd, avail: S.avail.slice() };
  if (!req.every(v => Number.isInteger(v) && v >= 0)) return { ...r, decision: 'error', reason: 'invalida' };
  if (!leq(req, nd)) return { ...r, decision: 'error', reason: 'excede' };
  if (!leq(req, S.avail)) return { ...r, decision: 'wait', reason: 'recursos' };
  const av2 = sub(S.avail, req), A2 = clone(S.alloc);
  A2[i] = add(A2[i], req);
  const check = safety(av2, A2, S.max, S.active);
  if (!check.safe) return { ...r, decision: 'wait', reason: 'inseguro', check, tentative: av2 };
  S.avail = av2; S.alloc = A2;
  return { ...r, decision: 'grant', check, tentative: av2 };
}

// Libera una sola vez por proceso.
function release(S, i) {
  if (!S.active[i]) return null;
  const ret = S.alloc[i].slice();
  S.avail = add(S.avail, ret);
  S.alloc[i] = ret.map(() => 0);
  S.active[i] = false;
  return ret;
}

const totalOf = S => S.alloc.reduce((t, r) => add(t, r), S.avail.slice());
const conserved = S => {
  const act = S.alloc.reduce((t, r, i) => S.active[i] ? add(t, r) : t, S.avail.slice());
  return act.every((v, j) => v === S.total[j]);
};

const API = { EXAMPLES, validate, safety, request, release, totalOf, conserved, needOf, clone };
g.Banker = API;
if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
