// Ilustraciones SVG propias: fondo y pacientes (grupos separados para animarlos).
(function (g) {
'use strict';
const L = '#222';
const R = (x, y, w, h, f, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" stroke="${L}" stroke-width="3"/>`;
const T = (x, y, s, t, c = L) => `<text x="${x}" y="${y}" font-size="${s}" font-weight="bold" text-anchor="middle" fill="${c}" font-family="Arial,sans-serif">${t}</text>`;
const mon = (x, y) => R(x, y, 40, 28, '#2b3a42', 3) + `<polyline points="${x+5},${y+16} ${x+14},${y+16} ${x+18},${y+6} ${x+23},${y+22} ${x+27},${y+16} ${x+35},${y+16}" fill="none" stroke="#6fe08a" stroke-width="2"/>`;
const vent = (x, y) => R(x, y, 44, 34, '#9fb4c0', 4) + R(x + 6, y + 6, 20, 12, '#2b3a42', 2) +
  `<circle cx="${x+35}" cy="${y+12}" r="4" fill="#d9534f" stroke="${L}" stroke-width="2"/><circle cx="${x+35}" cy="${y+24}" r="4" fill="#f0ad4e" stroke="${L}" stroke-width="2"/>`;
const bedEq = cx => R(cx - 24, 205, 48, 14, '#f4f4ef', 3) + R(cx - 26, 192, 8, 42, '#8a6a4a', 2) + R(cx + 16, 219, 5, 14, '#777') + R(cx - 18, 219, 5, 14, '#777');
const bed = x => R(x - 36, 410, 10, 62, '#8a6a4a', 2) + R(x - 30, 434, 66, 22, '#f4f4ef', 4) + R(x - 30, 434, 22, 22, '#9cc3d9', 4) + R(x - 30, 456, 5, 16, '#777') + R(x + 31, 456, 5, 16, '#777');
const COL = ['#d98a3d', '#4a8fc4', '#5aa469'], ICON = [bedEq, c => vent(c - 22, 195), c => mon(c - 20, 198)];

function background(total) {
  let s = `<defs><pattern id="tile" width="60" height="40" patternUnits="userSpaceOnUse"><rect width="60" height="40" fill="#cfc8b6"/><path d="M0 0H60M0 0V40" stroke="#b9b19c" stroke-width="2"/></pattern></defs>`;
  s += `<rect width="1200" height="700" fill="#cde1dc"/><rect y="400" width="1200" height="300" fill="url(#tile)"/><rect y="394" width="1200" height="10" fill="#8fa8a3" stroke="${L}" stroke-width="3"/>`;
  s += `<rect x="0" y="560" width="1200" height="70" fill="#e4dec9" opacity=".55"/>`; // pasillo
  for (let x = 120; x <= 1100; x += 240) s += R(x, 8, 90, 14, '#f7f7ee', 4);
  s += R(40, 60, 90, 80, '#a9d3e8') + `<path d="M85 60V140M40 100H130" stroke="${L}" stroke-width="3"/>` + R(300, 60, 90, 80, '#a9d3e8') + `<path d="M345 60V140M300 100H390" stroke="${L}" stroke-width="3"/>`;
  s += `<circle cx="215" cy="110" r="26" fill="#fff" stroke="${L}" stroke-width="3"/><path d="M215 110V92M215 110L228 116" stroke="${L}" stroke-width="3"/>`;
  s += R(800, 50, 50, 50, '#fff', 6) + `<path d="M825 58V92M808 75H842" stroke="#c0392b" stroke-width="10"/>`;
  s += R(470, 0, 20, 400, '#a8bfba') + R(730, 0, 20, 400, '#a8bfba');
  s += R(70, 20, 330, 28, '#3d6b74', 4) + T(235, 41, 18, 'SALA DE ESPERA', '#fff');
  s += R(500, 20, 210, 28, '#3d6b74', 4) + T(605, 41, 15, 'ALMACÉN / RECEPCIÓN', '#fff');
  s += R(780, 20, 330, 28, '#3d6b74', 4) + T(945, 41, 18, 'ZONA DE TRATAMIENTO', '#fff');
  for (let i = 0; i < 5; i++) { // bancas
    const x = 60 + 85 * i;
    s += R(x - 36, 418, 72, 30, '#a07b52', 4) + R(x - 32, 448, 6, 22, '#555') + R(x + 26, 448, 6, 22, '#555');
  }
  // almacén
  s += R(495, 130, 10, 130, '#8a6a4a') + R(695, 130, 10, 130, '#8a6a4a') + R(495, 250, 210, 10, '#8a6a4a') + R(495, 130, 210, 8, '#8a6a4a');
  for (let j = 0; j < 3; j++) {
    const cx = 535 + 65 * j;
    s += R(cx - 30, 172, 60, 76, '#d9b98a', 4) + ICON[j](cx) + T(cx, 166, 16, 'ABC'[j], COL[j]);
    s += R(cx - 28, 262, 56, 30, '#fff', 4) + `<text id="av${j}" x="${cx}" y="284" font-size="18" font-weight="bold" text-anchor="middle" fill="${COL[j]}" font-family="Arial,sans-serif">0/${total[j]}</text>`;
  }
  // recepción
  s += R(530, 440, 140, 66, '#8a5a35', 4) + R(525, 432, 150, 12, '#c79a63', 3) + mon(585, 402) + R(615, 418, 26, 14, '#fff', 2);
  // estaciones de tratamiento
  for (let i = 0; i < 5; i++) {
    const x = 775 + 75 * i;
    s += mon(x - 20, 220) + vent(x - 22, 290) + `<path d="M${x+22} 305Q${x+40} 360 ${x} 430" fill="none" stroke="#5a7d8c" stroke-width="3"/>` + bed(x);
  }
  // salida
  s += R(1135, 390, 65, 240, '#7fb48a') + R(1150, 410, 50, 210, '#a9d6b2') + R(1110, 350, 90, 30, '#2f7d4a', 4) + T(1155, 372, 16, 'ALTA', '#fff');
  s += `<path d="M60 612H1120" stroke="#9c9378" stroke-width="3" stroke-dasharray="14 12" fill="none"/>`;
  return s;
}

const GOWN = ['#7fb3d5', '#a9d18e', '#f2c46d', '#d99ab8', '#9aa7d9'], HAIR = ['#3b2a20', '#222', '#8a5a2b', '#b5651d', '#666'];
function patient(i) {
  return `<g id="p${i}"><g class="body">` +
    R(-14, -32, 12, 32, '#5b6b7a', 3) + R(2, -32, 12, 32, '#5b6b7a', 3) + `<ellipse cx="-8" cy="1" rx="10" ry="4" fill="#333"/><ellipse cx="8" cy="1" rx="10" ry="4" fill="#333"/>` +
    R(-30, -68, 10, 34, '#f3cfa8', 4) + R(20, -68, 10, 34, '#f3cfa8', 4) + R(-21, -72, 42, 44, GOWN[i], 8) +
    `<circle cx="0" cy="-88" r="16" fill="#f3cfa8" stroke="${L}" stroke-width="3"/><path d="M-17 -90Q-14 -108 0 -106Q15 -108 17 -90Q8 -98 -17 -90Z" fill="${HAIR[i]}" stroke="${L}" stroke-width="3"/>` +
    `<circle cx="-6" cy="-86" r="2" fill="${L}"/><circle cx="6" cy="-86" r="2" fill="${L}"/><path d="M-5 -79Q0 -75 5 -79" stroke="${L}" stroke-width="2" fill="none"/></g>` +
    `<g class="tag"><rect x="-40" y="-152" width="80" height="44" rx="5" fill="#fff" stroke="${L}" stroke-width="2.5"/>` +
    `<text x="0" y="-138" font-size="13" font-weight="bold" text-anchor="middle" font-family="Arial,sans-serif" fill="${L}">P${i + 1}</text>` +
    `<text id="pr${i}" x="0" y="-125" font-size="11" text-anchor="middle" font-family="Arial,sans-serif" fill="${L}"></text>` +
    `<text id="ps${i}" x="0" y="-113" font-size="10" text-anchor="middle" font-family="Arial,sans-serif" fill="#555"></text></g></g>`;
}
g.Scene = { background, patient, COL };
})(window);
