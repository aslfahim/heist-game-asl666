// The Opera House Caper — rendering.
// One file, one job: everything the player sees, drawn on one canvas.
// Safe cover (curtains, seats), danger (cones) and loot are colour-coded at
// a glance: gold = loot, red = curtain cover, warm yellow = guard cones,
// blue = camera cones, pale gold = spotlights.

import { VIEW, PALETTE, GUARD, CAMERA, SPOTLIGHT, THIEF, MIN_LOOT_TO_ESCAPE } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, cone, fill) {
  ctx.beginPath();
  ctx.moveTo(cone.x, cone.y);
  ctx.arc(cone.x, cone.y, cone.range, cone.angle - cone.halfAngle, cone.angle + cone.halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawFloor(ctx, world) {
  const { width: W, height: H } = VIEW;
  // Stage: golden boards.
  ctx.fillStyle = PALETTE.stageFloor;
  ctx.fillRect(314, 6, 666, 162);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let x = 330; x < 980; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 6);
    ctx.lineTo(x, 168);
    ctx.stroke();
  }
  // Stalls: deep red carpet with a centre aisle.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(6, 260, W - 12, 300);
  ctx.fillStyle = PALETTE.carpetDark;
  ctx.fillRect(580, 260, 120, 300);
  // Foyer: chequered wood.
  for (let ry = 0; ry < 4; ry++) {
    for (let rx = 0; rx < 16; rx++) {
      ctx.fillStyle = (rx + ry) % 2 === 0 ? PALETTE.floorWood : PALETTE.floorWoodDark;
      ctx.fillRect(6 + rx * 80, 574 + ry * 56, 80, 56);
    }
  }
  // Balcony corridor (west) and backstage (east): darker boards.
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(6, 6, 294, 254);
  ctx.fillStyle = '#54402a';
  ctx.fillRect(994, 6, 280, 254);
  // Room labels, painted on the floor like the house's own signage.
  ctx.fillStyle = 'rgba(245,233,200,0.55)';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('— STAGE —', 640, 160);
  ctx.fillText('STALLS', 640, 556);
  ctx.fillText('FOYER', 640, 790);
  ctx.save();
  ctx.translate(26, 130);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('BALCONY CORRIDOR', 0, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(1254, 130);
  ctx.rotate(Math.PI / 2);
  ctx.fillText('BACKSTAGE', 0, 0);
  ctx.restore();
}

function drawWalls(ctx, world) {
  for (const w of world.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 3);
  }
  for (const p of world.pillars) {
    ctx.fillStyle = PALETTE.pillar;
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6a3b';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  for (const c of world.curtains) {
    ctx.fillStyle = PALETTE.curtain;
    roundRect(ctx, c.x, c.y, c.w, c.h, 6);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = c.y + (c.h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(c.x, y);
      ctx.lineTo(c.x + c.w, y);
      ctx.stroke();
    }
  }
}

function drawSeats(ctx, world) {
  for (const s of world.seats) {
    ctx.fillStyle = PALETTE.seat;
    roundRect(ctx, s.x, s.y, s.w, s.h, 5);
    ctx.fill();
    ctx.fillStyle = PALETTE.seatBack;
    ctx.fillRect(s.x + 6, s.y + 4, s.w - 12, 6);
    ctx.fillStyle = 'rgba(217,164,65,0.5)';
    for (let x = s.x + 18; x < s.x + s.w - 10; x += 30) {
      ctx.fillRect(x, s.y + 14, 3, 8);
    }
  }
}

function drawLoot(ctx, world, time) {
  for (const item of world.loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2.4 + item.bob) * 3;
    const x = item.x;
    const y = item.y + bob;
    // Glow ring so loot reads at a glance.
    ctx.beginPath();
    ctx.arc(x, y, 26 + Math.sin(time * 3 + item.bob) * 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(242,193,78,0.18)';
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (item.id === 'jewels') ctx.fillText('💎', x, y);
    else if (item.id === 'strad') ctx.fillText('🎻', x, y);
    else ctx.fillText('🔒', x, y);
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(item.name.toUpperCase(), x, y + 36);
  }
}

function drawWatchers(ctx, watchers) {
  // Cones first (under the actors), hot cones when they see the thief.
  for (const s of watchers.spotlights) {
    drawCone(ctx, s.cone, PALETTE.coneSpot);
  }
  for (const c of watchers.cameras) {
    drawCone(ctx, c.cone, c.seesThief ? 'rgba(90,180,255,0.38)' : PALETTE.coneCamera);
  }
  for (const g of watchers.guards) {
    drawCone(ctx, g.cone, g.seesThief ? PALETTE.coneGuardHot : PALETTE.coneGuard);
  }
  for (const s of watchers.spotlights) {
    ctx.fillStyle = '#e8d9a0';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6a3b';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  for (const c of watchers.cameras) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = c.seesThief ? '#ff5a4a' : '#5ab4ff';
    roundRect(ctx, -4, -6, 18, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#1c2733';
    ctx.beginPath();
    ctx.arc(14, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Wall mount.
    ctx.fillStyle = '#3a3f4a';
    ctx.fillRect(c.x - 4, c.y - 4, 8, 8);
  }
  for (const g of watchers.guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    // Body: navy usher uniform with gold trim.
    ctx.fillStyle = g.state === 'chase' ? '#a4123f' : '#22345e';
    ctx.beginPath();
    ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing wedge.
    ctx.rotate(g.angle);
    ctx.fillStyle = '#f5e9c8';
    ctx.beginPath();
    ctx.moveTo(6, -6);
    ctx.lineTo(18, 0);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (g.state !== 'patrol') {
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.state === 'chase' ? '!' : '?', g.x, g.y - 20);
    }
  }
}

function drawThief(ctx, thief) {
  ctx.save();
  ctx.translate(thief.x, thief.y);
  if (thief.disguised) {
    // Costume: a crimson opera cloak with a white mask — guards read it as staff.
    ctx.fillStyle = '#7d0d30';
    ctx.beginPath();
    ctx.arc(0, 0, THIEF.radius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f5e9c8';
    ctx.beginPath();
    ctx.arc(0, -2, 7, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#1d1d26';
    ctx.beginPath();
    ctx.arc(0, 0, THIEF.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.rotate(thief.dir);
    ctx.fillStyle = '#f5e9c8';
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(16, 0);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Loot carried, as small gold pips above the thief.
  for (let i = 0; i < thief.lootCount; i++) {
    ctx.fillStyle = PALETTE.goldBright;
    ctx.beginPath();
    ctx.arc(thief.x - 10 + i * 10, thief.y - 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExit(ctx, world, thief) {
  const e = world.exit;
  const open = thief.lootCount >= MIN_LOOT_TO_ESCAPE;
  ctx.fillStyle = open ? '#2e7d4f' : '#5a3d26';
  roundRect(ctx, e.x, e.y, e.w, e.h, 4);
  ctx.fill();
  ctx.strokeStyle = open ? '#7dff9e' : PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.save();
  ctx.fillStyle = open ? '#7dff9e' : '#f5e9c8';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText('STAGE DOOR', VIEW.width - 8, e.y - 8);
  ctx.restore();
}

// Alarm meter, loot, disguise charge, timer and objectives — drawn on the
// canvas itself so every screenshot carries the full HUD.
export function drawHud(ctx, game) {
  const { thief, alarm, elapsed, state } = game;
  ctx.fillStyle = PALETTE.hudBg;
  roundRect(ctx, 10, 10, 330, 104, 10);
  ctx.fill();

  // Title + alarm meter.
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('THE OPERA HOUSE CAPER', 22, 34);
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillStyle = alarm >= 75 ? '#ff6a5a' : PALETTE.textDim;
  ctx.fillText('ALARM', 22, 56);
  const barX = 78;
  const barW = 200;
  ctx.fillStyle = '#2a1a24';
  roundRect(ctx, barX, 44, barW, 14, 7);
  ctx.fill();
  const frac = Math.max(0, Math.min(1, alarm / 100));
  ctx.fillStyle = alarm >= 75 ? '#ff4a3a' : alarm >= 40 ? '#f2a13c' : '#4caf6d';
  if (frac > 0) {
    roundRect(ctx, barX, 44, barW * frac, 14, 7);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`${Math.round(alarm)}%`, barX + barW + 8, 56);

  // Loot + disguise + timer (timer on its own line so nothing overlaps).
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px Georgia, serif';
  ctx.fillText(`LOOT  ${thief.lootCount}/3   $${thief.lootValue}`, 22, 76);
  ctx.fillText(`COSTUME  ${Math.round(thief.disguise)}%  (C)`, 22, 94);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px monospace';
  const t = Math.max(0, Math.floor(elapsed));
  ctx.fillText(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, 328, 94);
  ctx.textAlign = 'left';

  // Objective line under the HUD.
  ctx.fillStyle = 'rgba(12,8,18,0.7)';
  roundRect(ctx, 10, 120, 330, 24, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px Georgia, serif';
  const goal = thief.lootCount >= MIN_LOOT_TO_ESCAPE
    ? 'Escape through the STAGE DOOR (top right)!'
    : `Steal ${MIN_LOOT_TO_ESCAPE} loot, then reach the STAGE DOOR.`;
  ctx.fillText(goal, 20, 136);

  // Grace warning: the fair caught moment, flashing while you can still run.
  if (state === 'grace') {
    const blink = Math.floor(performance.now() / 150) % 2 === 0;
    if (blink) {
      ctx.fillStyle = 'rgba(255,40,30,0.85)';
      ctx.font = 'bold 34px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPOTTED!  BREAK LINE OF SIGHT!', VIEW.width / 2, 200);
      ctx.textAlign = 'left';
    }
  }

  // Disguise hint when costumed.
  if (thief.disguised) {
    ctx.fillStyle = 'rgba(242,193,78,0.9)';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('IN COSTUME — stroll, do not run, cameras still see you', VIEW.width / 2, 250);
    ctx.textAlign = 'left';
  }
}

export function drawTitle(ctx) {
  ctx.fillStyle = 'rgba(8,5,14,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE OPERA HOUSE CAPER', VIEW.width / 2, 250);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('One thief. One prima donna’s jewels. One very awake opera house.', VIEW.width / 2, 292);
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = PALETTE.textDim;
  const lines = [
    'WASD / arrows — move      SHIFT — run (noisy)      C — costume disguise (stroll past guards)',
    'E or walk into loot — steal      M — mute      R — restart',
    'Steal at least 2 of the 3 treasures, then slip out the STAGE DOOR, top right.',
    'Guards chase when the alarm passes 55%. Cameras see through any costume.',
    'Hide behind curtains — no eye in the house can see through velvet.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 350 + i * 28));
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Press ENTER or click to begin', VIEW.width / 2, 540);
  ctx.textAlign = 'left';
}

export function drawEnd(ctx, game) {
  ctx.fillStyle = 'rgba(8,5,14,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  if (game.state === 'won') {
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText('CURTAIN CALL — YOU ESCAPED!', VIEW.width / 2, 300);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(`Loot: ${game.thief.lootCount}/3 treasures  •  $${game.thief.lootValue}  •  Time bonus $${game.timeBonus}`, VIEW.width / 2, 350);
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillStyle = '#7dff9e';
    ctx.fillText(`FINAL SCORE  $${game.finalScore}`, VIEW.width / 2, 400);
    ctx.font = 'italic 17px Georgia, serif';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText('The audience never knew. The jewels did.', VIEW.width / 2, 440);
  } else {
    ctx.fillStyle = '#ff6a5a';
    ctx.font = 'bold 48px Georgia, serif';
    ctx.fillText('CAUGHT IN THE AISLE!', VIEW.width / 2, 300);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(`You carried ${game.thief.lootCount}/3 treasures when the ushers closed in.`, VIEW.width / 2, 350);
    ctx.font = '17px Georgia, serif';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText('Tip: read the cones before you move, and let the velvet hide you.', VIEW.width / 2, 390);
  }
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press R to try again', VIEW.width / 2, 480);
  ctx.textAlign = 'left';
}

export function render(ctx, game) {
  const { world, watchers, thief, time } = game;
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, world);
  drawSeats(ctx, world);
  drawWalls(ctx, world);
  drawExit(ctx, world, thief);
  drawLoot(ctx, world, time);
  drawWatchers(ctx, watchers);
  drawThief(ctx, thief);
  drawHud(ctx, game);
  if (game.state === 'title') drawTitle(ctx);
  if (game.state === 'won' || game.state === 'caught') drawEnd(ctx, game);
}
