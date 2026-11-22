// The Opera House Caper — the thief.
// One file, one job: movement, the costume-disguise tool, and loot pickups.

import { THIEF, PLAYER_START } from './config.js';
import { moveCircle, dist } from './world.js';

export class Thief {
  constructor() {
    this.x = PLAYER_START.x;
    this.y = PLAYER_START.y;
    this.dir = -Math.PI / 2; // facing the house
    this.disguised = false;
    this.disguise = 100; // costume charge, 0..100
    this.running = false;
    this.loot = []; // taken loot ids
    this.score = 0;
    this.moving = false;
  }

  reset() {
    this.x = PLAYER_START.x;
    this.y = PLAYER_START.y;
    this.dir = -Math.PI / 2;
    this.disguised = false;
    this.disguise = 100;
    this.loot = [];
    this.score = 0;
  }

  // keys: {up, down, left, right, run, disguise} booleans; disguisePressed is
  // an edge trigger (true only on the frame the key went down).
  update(dt, keys, disguisePressed, world) {
    if (disguisePressed) {
      if (!this.disguised && this.disguise > 15) this.disguised = true;
      else if (this.disguised) this.disguised = false;
    }
    if (this.disguised) {
      this.disguise -= THIEF.disguiseDrain * dt;
      if (this.disguise <= 0) {
        this.disguise = 0;
        this.disguised = false; // the costume falls apart mid-stride
      }
    } else {
      this.disguise = Math.min(100, this.disguise + THIEF.disguiseRefill * dt);
    }

    let mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    this.moving = mx !== 0 || my !== 0;
    this.running = Boolean(keys.run) && this.moving;
    // A costumed thief must stroll: running in costume blows the disguise.
    if (this.disguised && this.running) this.disguised = false;
    if (this.moving) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
      const speed = this.running ? THIEF.runSpeed : THIEF.walkSpeed;
      const moved = moveCircle(this.x, this.y, mx * speed * dt, my * speed * dt, THIEF.radius, world.solids);
      this.x = moved.x;
      this.y = moved.y;
      this.dir = Math.atan2(my, mx);
    }
  }

  // Returns the loot item picked up this frame, or null.
  tryGrab(world) {
    for (const item of world.loot) {
      if (item.taken) continue;
      if (dist(this.x, this.y, item.x, item.y) <= THIEF.grabRange) {
        item.taken = true;
        this.loot.push(item.id);
        this.score += item.value;
        return item;
      }
    }
    return null;
  }

  get lootCount() {
    return this.loot.length;
  }

  get lootValue() {
    return this.score;
  }
}
