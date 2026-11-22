// The Opera House Caper — staged scenes for screenshots.
// One file, one job: composed mid-heist states used by ?scene= so the
// screenshots are real renders of the game's own code, posed, never faked.
// Each scene sets positions, alarm and loot, then the normal loop renders it.

export const SCENES = {
  // Cover: the thief crosses the stalls, guards with cones, cameras, a loot
  // target and the alarm meter all in one frame.
  cover(game) {
    game.thief.x = 640;
    game.thief.y = 430;
    game.thief.dir = -Math.PI / 2;
    game.alarm = 34;
    game.watchers.guards[0].x = 640;
    game.watchers.guards[0].y = 300;
    game.watchers.guards[0].angle = Math.PI / 2;
    game.watchers.guards[1].x = 250;
    game.watchers.guards[1].y = 420;
    game.watchers.guards[1].angle = 0;
    game.watchers.guards[2].x = 700;
    game.watchers.guards[2].y = 660;
    game.watchers.guards[2].angle = -Math.PI / 2;
    game.watchers.guards[3].x = 1100;
    game.watchers.guards[3].y = 200;
    game.watchers.guards[3].angle = Math.PI;
    // Jewels still glittering on the stage, safe untouched in the foyer.
    game.state = 'playing';
  },

  // The thief, costumed, strolls past the foyer guard toward the safe.
  disguise(game) {
    game.thief.x = 500;
    game.thief.y = 700;
    game.thief.dir = 0;
    game.thief.disguised = true;
    game.thief.disguise = 62;
    game.alarm = 12;
    game.watchers.guards[2].x = 620;
    game.watchers.guards[2].y = 700;
    game.watchers.guards[2].angle = Math.PI;
    game.watchers.cameras[1].angle = -0.4;
    game.state = 'playing';
  },

  // The Stradivarius grab: backstage, spotlight sweeping, guard closing in.
  loot(game) {
    game.thief.x = 1120;
    game.thief.y = 170;
    game.thief.dir = -Math.PI / 2;
    game.thief.loot = ['jewels'];
    game.thief.score = 500;
    game.world.loot[0].taken = true;
    game.alarm = 61;
    game.watchers.guards[3].x = 1060;
    game.watchers.guards[3].y = 300;
    game.watchers.guards[3].angle = -Math.PI / 2;
    game.watchers.guards[3].state = 'chase';
    game.watchers.guards[3].lastSeen = { x: 1120, y: 170 };
    game.state = 'playing';
  },

  // The getaway: two treasures in hand, stage door open, alarm cooling.
  escape(game) {
    game.thief.x = 1150;
    game.thief.y = 90;
    game.thief.dir = Math.PI / 2;
    game.thief.loot = ['jewels', 'strad'];
    game.thief.score = 900;
    game.world.loot[0].taken = true;
    game.world.loot[1].taken = true;
    game.alarm = 22;
    game.watchers.guards[3].x = 1080;
    game.watchers.guards[3].y = 260;
    game.watchers.guards[3].angle = Math.PI / 2;
    game.state = 'playing';
  },
};

export function applyScene(game, name) {
  const scene = SCENES[name];
  if (!scene) return false;
  scene(game);
  // One deterministic tick so cones and spotlights settle to their pose.
  game.tick(0.05, { up: false, down: false, left: false, right: false, run: false, disguise: false }, false);
  return true;
}
