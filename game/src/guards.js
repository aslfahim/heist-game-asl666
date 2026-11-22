// The Opera House Caper — guards, cameras and sweeping spotlights.
// One file, one job: everything that watches the thief, and how it sees.

import { GUARD, CAMERA, SPOTLIGHT, THIEF } from './config.js';
import { angleDiff, angleTo, dist, hasLineOfSight, moveCircle } from './world.js';

// A watcher is any cone: {x, y, angle, range, halfAngle, kind}.
// Returns true when the thief is inside the cone with a clear sight line.
export function coneSees(watcher, thief, world, ignoreDisguise) {
  const d = dist(watcher.x, watcher.y, thief.x, thief.y);
  if (d > watcher.range) return false;
  const a = angleTo(watcher.x, watcher.y, thief.x, thief.y);
  if (Math.abs(angleDiff(a, watcher.angle)) > watcher.halfAngle) return false;
  if (!ignoreDisguise && thief.disguised && d > THIEF.disguiseGuardRange) return false;
  return hasLineOfSight(watcher.x, watcher.y, thief.x, thief.y, world);
}

export class Guard {
  constructor(waypoints, facing) {
    this.waypoints = waypoints;
    this.wp = 0;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.angle = facing ?? 0;
    this.speed = GUARD.patrolSpeed;
    this.state = 'patrol'; // patrol | suspicious | chase
    this.wait = 0;
    this.lastSeen = null;
    this.seesThief = false;
  }

  update(dt, thief, world, alarm) {
    const d = dist(this.x, this.y, thief.x, thief.y);
    this.seesThief = coneSees(
      { x: this.x, y: this.y, angle: this.angle, range: GUARD.coneRange, halfAngle: GUARD.coneHalfAngle },
      thief, world, false,
    );
    if (this.seesThief) this.lastSeen = { x: thief.x, y: thief.y };

    if (this.seesThief && alarm >= 55) {
      this.state = 'chase';
    } else if (this.seesThief) {
      this.state = 'suspicious';
    } else if (this.state !== 'patrol' && this.lastSeen) {
      // Lost sight: walk to where the thief was last seen, then resume patrol.
      this.state = 'chase';
      if (d < 30 || dist(this.x, this.y, this.lastSeen.x, this.lastSeen.y) < 26) {
        this.lastSeen = null;
        this.state = 'patrol';
      }
    }

    if (this.state === 'chase' && this.lastSeen) {
      this.speed = GUARD.chaseSpeed;
      this.steerToward(this.lastSeen.x, this.lastSeen.y, dt, world);
      return;
    }

    this.speed = GUARD.patrolSpeed;
    if (this.wait > 0) {
      this.wait -= dt;
      // Scan the room while waiting at a waypoint.
      this.angle += Math.sin(performance.now() / 900 + this.x) * 0.012;
      return;
    }
    const target = this.waypoints[this.wp];
    const td = dist(this.x, this.y, target.x, target.y);
    if (td < 10) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      this.wait = 1.1;
      return;
    }
    this.steerToward(target.x, target.y, dt, world);
  }

  steerToward(tx, ty, dt, world) {
    const want = angleTo(this.x, this.y, tx, ty);
    const turn = Math.max(-GUARD.turnSpeed * dt, Math.min(GUARD.turnSpeed * dt, angleDiff(want, this.angle)));
    this.angle += turn;
    const step = this.speed * dt;
    const moved = moveCircle(this.x, this.y, Math.cos(this.angle) * step, Math.sin(this.angle) * step, GUARD.radius, world.solids);
    this.x = moved.x;
    this.y = moved.y;
  }

  get cone() {
    return { x: this.x, y: this.y, angle: this.angle, range: GUARD.coneRange, halfAngle: GUARD.coneHalfAngle, kind: 'guard' };
  }
}

export class Camera {
  constructor(x, y, baseAngle, phase) {
    this.x = x;
    this.y = y;
    this.baseAngle = baseAngle;
    this.phase = phase;
    this.angle = baseAngle;
    this.seesThief = false;
  }

  update(dt, time, thief, world) {
    this.angle = this.baseAngle + Math.sin(time * CAMERA.sweepSpeed + this.phase) * CAMERA.sweepArc;
    // Cameras are not fooled by a costume: a lens sees through the disguise.
    this.seesThief = coneSees(
      { x: this.x, y: this.y, angle: this.angle, range: CAMERA.range, halfAngle: CAMERA.halfAngle },
      thief, world, true,
    );
  }

  get cone() {
    return { x: this.x, y: this.y, angle: this.angle, range: CAMERA.range, halfAngle: CAMERA.halfAngle, kind: 'camera' };
  }
}

export class Spotlight {
  constructor(x, y, baseAngle, phase) {
    this.x = x;
    this.y = y;
    this.baseAngle = baseAngle;
    this.phase = phase;
    this.angle = baseAngle;
    this.seesThief = false;
  }

  update(dt, time, thief, world) {
    this.angle = this.baseAngle + Math.sin(time * SPOTLIGHT.sweepSpeed + this.phase) * SPOTLIGHT.sweepArc;
    this.seesThief = coneSees(
      { x: this.x, y: this.y, angle: this.angle, range: SPOTLIGHT.range, halfAngle: SPOTLIGHT.halfAngle },
      thief, world, true,
    );
  }

  get cone() {
    return { x: this.x, y: this.y, angle: this.angle, range: SPOTLIGHT.range, halfAngle: SPOTLIGHT.halfAngle, kind: 'spot' };
  }
}

export function buildWatchers() {
  const guards = [
    // Stalls usher: sweeps the centre aisle between the seat blocks.
    new Guard([{ x: 640, y: 280 }, { x: 640, y: 540 }], Math.PI / 2),
    // Balcony corridor guard: paces the west wing.
    new Guard([{ x: 90, y: 90 }, { x: 90, y: 480 }, { x: 250, y: 480 }, { x: 250, y: 90 }], 0),
    // Foyer guard: circles the box office and the main doors.
    new Guard([{ x: 380, y: 700 }, { x: 900, y: 700 }, { x: 900, y: 620 }, { x: 380, y: 620 }], 0),
    // Backstage guard: watches the dressing rooms and the stage door.
    new Guard([{ x: 1060, y: 60 }, { x: 1060, y: 330 }, { x: 1220, y: 330 }, { x: 1220, y: 90 }], Math.PI),
  ];
  const cameras = [
    new Camera(640, 182, Math.PI / 2, 0), // above the proscenium, sweeping the stalls
    new Camera(20, 560, 0, 1.7), // foyer west corner, sweeping the box office
    new Camera(1260, 560, Math.PI, 3.1), // foyer east corner, sweeping the doors
    new Camera(994, 262, Math.PI / 2, 0.9), // backstage door, sweeping the corridor
  ];
  const spotlights = [
    new Spotlight(420, 8, Math.PI / 2 + 0.5, 0), // stage left follow-spot
    new Spotlight(860, 8, Math.PI / 2 - 0.5, 2.2), // stage right follow-spot
  ];
  return { guards, cameras, spotlights };
}
