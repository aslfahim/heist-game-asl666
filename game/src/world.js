// The Opera House Caper — the house itself.
// Builds the floor plan: walls, rooms, seat rows, curtains, pillars and the
// patrol/camera/spotlight placements. Also owns line-of-sight, which every
// vision cone in the game asks before it can see the thief.

import { VIEW, LOOT_DEFS, EXIT } from './config.js';

// A wall is an axis-aligned rectangle {x, y, w, h}. Movement and sight both
// respect walls; curtains block sight but not movement (you slip behind them).
export function buildWalls() {
  const W = VIEW.width;
  const H = VIEW.height;
  const walls = [
    // Outer shell (thick so nothing escapes the canvas).
    { x: -20, y: -20, w: W + 40, h: 26 },
    { x: -20, y: H - 6, w: W + 40, h: 26 },
    { x: -20, y: 0, w: 26, h: H },
    { x: W - 6, y: 0, w: 26, h: H },
    // Stage front wall (proscenium) with a wide centre opening.
    { x: 300, y: 168, w: 260, h: 14 },
    { x: 720, y: 168, w: 260, h: 14 },
    // Stage / backstage divider with a door gap.
    { x: 980, y: 0, w: 14, h: 96 },
    { x: 980, y: 150, w: 14, h: 110 },
    // Balcony corridor divider with a door gap.
    { x: 300, y: 0, w: 14, h: 96 },
    { x: 300, y: 150, w: 14, h: 110 },
    // Stalls / foyer divider with two door gaps (left and right aisles).
    { x: 6, y: 560, w: 300, h: 14 },
    { x: 470, y: 560, w: 340, h: 14 },
    { x: 970, y: 560, w: 304, h: 14 },
  ];
  return walls;
}

// Seat rows in the stalls: solid blocks you must walk around, with aisles.
export function buildSeats() {
  const seats = [];
  const rows = [300, 348, 396, 444, 492];
  for (const y of rows) {
    seats.push({ x: 330, y, w: 250, h: 26 });
    seats.push({ x: 700, y, w: 250, h: 26 });
  }
  return seats;
}

// Curtains hang at the stage edges and beside the proscenium: walking behind
// one breaks every line of sight, so they are the thief's best friends.
export function buildCurtains() {
  return [
    { x: 316, y: 20, w: 26, h: 148, label: 'curtain' },
    { x: 938, y: 20, w: 26, h: 148, label: 'curtain' },
    { x: 330, y: 560, w: 26, h: 130, label: 'curtain' },
    { x: 924, y: 560, w: 26, h: 130, label: 'curtain' },
  ];
}

// Pillars block movement and sight; they anchor the foyer and stalls.
export function buildPillars() {
  return [
    { x: 340, y: 590, w: 22, h: 22 },
    { x: 918, y: 590, w: 22, h: 22 },
    { x: 340, y: 220, w: 22, h: 22 },
    { x: 918, y: 220, w: 22, h: 22 },
    { x: 1040, y: 300, w: 22, h: 22 },
    { x: 60, y: 300, w: 22, h: 22 },
  ];
}

// Every solid obstacle: walls + seats + pillars (curtains are sight-only).
export function buildSolids() {
  return [...buildWalls(), ...buildSeats(), ...buildPillars()];
}

export function buildLoot() {
  return LOOT_DEFS.map((d) => ({ ...d, taken: false, bob: Math.random() * 6 }));
}

export function buildWorld() {
  return {
    walls: buildWalls(),
    seats: buildSeats(),
    curtains: buildCurtains(),
    pillars: buildPillars(),
    solids: buildSolids(),
    loot: buildLoot(),
    exit: { ...EXIT },
  };
}

// --- geometry helpers -------------------------------------------------------

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function circleHitsSolids(x, y, r, solids) {
  const box = { x: x - r, y: y - r, w: r * 2, h: r * 2 };
  return solids.some((s) => rectsOverlap(box, s));
}

// Move a circle against solids, axis by axis so it slides along walls.
export function moveCircle(x, y, dx, dy, r, solids) {
  let nx = x + dx;
  if (!circleHitsSolids(nx, y, r, solids)) x = nx;
  let ny = y + dy;
  if (!circleHitsSolids(x, ny, r, solids)) y = ny;
  return { x, y };
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Liang-Barsky clipping: true when the segment crosses the rectangle.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rect.x, rect.x + rect.w - x1, y1 - rect.y, rect.y + rect.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

// Sight is blocked by walls, pillars and curtains — never by seats (low backs).
export function hasLineOfSight(x1, y1, x2, y2, world) {
  const blockers = [...world.walls, ...world.pillars, ...world.curtains];
  for (const b of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, b)) return false;
  }
  return true;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Smallest signed difference between two angles, in (-PI, PI].
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}
