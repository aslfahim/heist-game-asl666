// The Opera House Caper — configuration.
// One file, one job: every number that tunes the heist lives here so the
// other modules can stay about behaviour, not magic constants.

export const VIEW = { width: 1280, height: 800 };

export const PALETTE = {
  floorWood: '#6b4a2f',
  floorWoodDark: '#5a3d26',
  carpet: '#7a1f2b',
  carpetDark: '#651824',
  stageFloor: '#8a6a3b',
  wall: '#2b1d33',
  wallTop: '#3d2b47',
  gold: '#d9a441',
  goldBright: '#f2c14e',
  velvet: '#a4123f',
  velvetDark: '#7d0d30',
  curtain: '#8f0f2e',
  seat: '#4a1f2e',
  seatBack: '#5d2839',
  pillar: '#c9a86a',
  safe: '#3a3f4a',
  coneGuard: 'rgba(255, 214, 90, 0.20)',
  coneGuardHot: 'rgba(255, 80, 60, 0.28)',
  coneCamera: 'rgba(90, 180, 255, 0.18)',
  coneSpot: 'rgba(255, 240, 180, 0.16)',
  hudBg: 'rgba(12, 8, 18, 0.82)',
  text: '#f5e9c8',
  textDim: '#c9b48a',
};

export const THIEF = {
  radius: 13,
  walkSpeed: 165,
  runSpeed: 245,
  disguiseDrain: 14, // per second while costumed
  disguiseRefill: 9, // per second while not costumed
  disguiseGuardRange: 78, // guards still spot a costumed thief closer than this
  grabRange: 34,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 62,
  chaseSpeed: 118,
  coneRange: 215,
  coneHalfAngle: 0.46, // radians, ~26 degrees each side
  turnSpeed: 2.6,
  catchRange: 24,
};

export const CAMERA = {
  range: 235,
  halfAngle: 0.38,
  sweepSpeed: 0.55, // radians per second
  sweepArc: 0.85,
};

export const SPOTLIGHT = {
  range: 300,
  halfAngle: 0.30,
  sweepSpeed: 0.42,
  sweepArc: 1.05,
};

export const ALARM = {
  guardRate: 34, // per second while a guard sees the thief
  cameraRate: 26,
  spotRate: 20,
  decay: 9,
  chaseThreshold: 55, // guards start chasing above this
  graceSeconds: 1.2, // fair caught moment: alarm at 100 gives this long to break sight
};

// Loot: id, name, value, position, room label. All three are original items.
export const LOOT_DEFS = [
  { id: 'jewels', name: "Prima Donna's Jewels", value: 500, x: 640, y: 92, room: 'STAGE' },
  { id: 'strad', name: 'The Stradivarius', value: 400, x: 1152, y: 128, room: 'BACKSTAGE' },
  { id: 'safe', name: 'Box-Office Safe', value: 350, x: 148, y: 706, room: 'FOYER' },
];

export const EXIT = { x: 1246, y: 34, w: 26, h: 52, label: 'STAGE DOOR' };
export const PLAYER_START = { x: 640, y: 748 };
export const MIN_LOOT_TO_ESCAPE = 2;
export const TIME_BONUS_START = 240; // seconds of par time; faster = bigger bonus
