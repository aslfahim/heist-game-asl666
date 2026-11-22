// The Opera House Caper — game loop and rules.
// One file, one job: input, state machine, the alarm, the fair caught
// moment, and the getaway payoff. Rendering lives in render.js, watching
// lives in guards.js, the thief lives in player.js.

import { VIEW, ALARM, MIN_LOOT_TO_ESCAPE, TIME_BONUS_START } from './config.js';
import { buildWorld } from './world.js';
import { buildWatchers } from './guards.js';
import { Thief } from './player.js';
import { SoundBank } from './audio.js';
import { render } from './render.js';
import { applyScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export class Game {
  constructor() {
    this.world = buildWorld();
    this.watchers = buildWatchers();
    this.thief = new Thief();
    this.sound = new SoundBank();
    this.state = 'title'; // title | playing | grace | won | caught
    this.alarm = 0;
    this.time = 0;
    this.elapsed = 0;
    this.graceLeft = 0;
    this.finalScore = 0;
    this.timeBonus = 0;
    this.keys = { up: false, down: false, left: false, right: false, run: false, disguise: false };
    this.disguisePressed = false;
    this.lastTick = performance.now();
  }

  reset() {
    this.world = buildWorld();
    this.watchers = buildWatchers();
    this.thief.reset();
    this.alarm = 0;
    this.time = 0;
    this.elapsed = 0;
    this.graceLeft = 0;
    this.finalScore = 0;
    this.timeBonus = 0;
    this.state = 'playing';
    this.sound.stopAlarm();
  }

  start() {
    if (this.state === 'title') {
      this.state = 'playing';
      this.sound.ensure();
    }
  }

  // One fixed step. Pure enough for the screenshot scenes to call directly.
  tick(dt, keys, disguisePressed) {
    this.time += dt;
    if (this.state !== 'playing' && this.state !== 'grace') return;
    this.elapsed += dt;

    // Watchers move first so their cones are current when the thief moves.
    for (const g of this.watchers.guards) g.update(dt, this.thief, this.world, this.alarm);
    for (const c of this.watchers.cameras) c.update(dt, this.time, this.thief, this.world);
    for (const s of this.watchers.spotlights) s.update(dt, this.time, this.thief, this.world);

    this.thief.update(dt, keys, disguisePressed, this.world);

    // Alarm: every watcher that sees the thief pushes it up; silence lets it fall.
    let rise = 0;
    let anySeen = false;
    for (const g of this.watchers.guards) {
      if (g.seesThief) { rise += ALARM.guardRate; anySeen = true; }
    }
    for (const c of this.watchers.cameras) {
      if (c.seesThief) { rise += ALARM.cameraRate; anySeen = true; }
    }
    for (const s of this.watchers.spotlights) {
      if (s.seesThief) { rise += ALARM.spotRate; anySeen = true; }
    }
    if (rise > 0) {
      const before = this.alarm;
      this.alarm = Math.min(100, this.alarm + rise * dt);
      if (before < 40 && this.alarm >= 40) this.sound.spotted();
    } else {
      this.alarm = Math.max(0, this.alarm - ALARM.decay * dt);
    }
    this.sound.alarmTick(this.alarm);

    // Loot: walk into it (or press E) to steal it.
    const grabbed = this.thief.tryGrab(this.world);
    if (grabbed) {
      this.sound.pickup();
      this.alarm = Math.min(100, this.alarm + 6); // every theft rattles the house
    }

    // Fair caught moment: at 100% the alarm gives a grace window to break
    // line of sight. Survive it and the alarm drops back to 85.
    if (this.state === 'playing' && this.alarm >= 100) {
      this.state = 'grace';
      this.graceLeft = ALARM.graceSeconds;
      this.sound.spotted();
    }
    if (this.state === 'grace') {
      this.graceLeft -= dt;
      if (!anySeen && this.alarm < 100) {
        this.alarm = 85;
        this.state = 'playing';
      } else if (this.graceLeft <= 0) {
        this.state = 'caught';
        this.sound.stopAlarm();
        this.sound.caught();
        return;
      }
    }

    // A guard who touches the thief catches them outright.
    for (const g of this.watchers.guards) {
      if (Math.hypot(g.x - this.thief.x, g.y - this.thief.y) < 24) {
        this.state = 'caught';
        this.sound.stopAlarm();
        this.sound.caught();
        return;
      }
    }

    // The getaway: reach the stage door with enough loot.
    const e = this.world.exit;
    const inDoor = this.thief.x > e.x - 6 && this.thief.x < e.x + e.w + 6
      && this.thief.y > e.y - 6 && this.thief.y < e.y + e.h + 6;
    if (inDoor && this.thief.lootCount >= MIN_LOOT_TO_ESCAPE) {
      this.state = 'won';
      this.timeBonus = Math.max(0, Math.round((TIME_BONUS_START - this.elapsed) * 2));
      this.finalScore = this.thief.lootValue + this.timeBonus;
      this.sound.stopAlarm();
      this.sound.win();
    }
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.lastTick) / 1000);
    this.lastTick = now;
    this.tick(dt, this.keys, this.disguisePressed);
    this.disguisePressed = false;
    render(ctx, this);
    requestAnimationFrame((t) => this.frame(t));
  }
}

const game = new Game();
window.__game = game; // playtests and screenshots drive the game through this.

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'run', ShiftRight: 'run',
};

window.addEventListener('keydown', (event) => {
  const mapped = KEYMAP[event.code];
  if (mapped) {
    game.keys[mapped] = true;
    event.preventDefault();
  }
  if (event.code === 'KeyC' && !event.repeat) {
    game.disguisePressed = true;
    game.sound.disguiseOn();
  }
  if (event.code === 'KeyM' && !event.repeat) game.sound.toggleMute();
  if (event.code === 'KeyE' && !event.repeat) game.thief.tryGrab(game.world);
  if (event.code === 'Enter') game.start();
  if (event.code === 'KeyR' && (game.state === 'won' || game.state === 'caught')) game.reset();
  if (event.code === 'KeyR' && game.state === 'title') game.reset();
});

window.addEventListener('keyup', (event) => {
  const mapped = KEYMAP[event.code];
  if (mapped) game.keys[mapped] = false;
});

// Mouse: click the canvas to start, and click-to-move nudges the thief
// toward the click while held (keyboard stays the precise control).
let mouseHeld = false;
let mouseTarget = null;
canvas.addEventListener('mousedown', (event) => {
  game.start();
  game.sound.ensure();
  mouseHeld = true;
  const rect = canvas.getBoundingClientRect();
  mouseTarget = {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
});
window.addEventListener('mouseup', () => { mouseHeld = false; mouseTarget = null; });
window.addEventListener('mousemove', (event) => {
  if (!mouseHeld) return;
  const rect = canvas.getBoundingClientRect();
  mouseTarget = {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.height,
  };
});

// Feed the click target into the thief's keys each frame.
const baseTick = game.tick.bind(game);
game.tick = (dt, keys, disguisePressed) => {
  if (mouseHeld && mouseTarget && game.state === 'playing') {
    const dx = mouseTarget.x - game.thief.x;
    const dy = mouseTarget.y - game.thief.y;
    if (Math.hypot(dx, dy) > 18) {
      keys = {
        ...keys,
        up: dy < -10, down: dy > 10, left: dx < -10, right: dx > 10,
      };
    }
  }
  baseTick(dt, keys, disguisePressed);
};

// ?scene=cover|disguise|loot|escape stages a composed mid-heist state for
// screenshots. The scene is a real render of the game's own code.
const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
if (scene) {
  game.state = 'playing';
  applyScene(game, scene);
}

requestAnimationFrame((t) => game.frame(t));
