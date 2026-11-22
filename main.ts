// The Opera House Caper — entrypoint for make.fun (Node 22, stdlib only).
//
// What this program does, in three deliberate steps:
//   1. Works out where the repository lives (beside this file) and where the
//      output goes (MAKEFUN_OUTPUT_DIR, or /output inside the grader).
//   2. Walks game/ and screenshots/ and copies them into the output tree,
//      file by file, so the copy is byte-identical to the repo.
//   3. Asks the vendored make.fun library to write /output/dossier.json,
//      the summary the judge reads, with the same caps the gate enforces.
//
// Determinism: nothing here reads the clock, the environment (beyond the
// output directory) or any random source, so two runs write identical bytes.

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outputRoot = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// Copy one directory tree, recreating subdirectories as they are found.
// Symlinks are refused rather than followed: the gate wants plain files.
function copyTree(sourceDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  for (const name of readdirSync(sourceDir)) {
    const from = join(sourceDir, name);
    const to = join(targetDir, name);
    const info = statSync(from);
    if (info.isDirectory()) {
      copyTree(from, to);
    } else if (info.isFile()) {
      copyFileSync(from, to);
    } else {
      throw new Error(`refusing non-regular entry in the game tree: ${from}`);
    }
  }
}

function handIn() {
  mkdirSync(outputRoot, { recursive: true });

  // Fail loudly (instead of handing in half a game) when the entry is broken.
  if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
    throw new Error('game/index.html is missing; refusing to hand in');
  }

  // The playable game: static files only, served offline from game/.
  copyTree(join(repoRoot, 'game'), join(outputRoot, 'game'));

  // The screenshots: 3 or 4 real renders, the first by name is the cover.
  const shotsDir = join(repoRoot, 'screenshots');
  const shotsOut = join(outputRoot, 'screenshots');
  if (existsSync(shotsDir)) copyTree(shotsDir, shotsOut);
  else mkdirSync(shotsOut, { recursive: true });

  // The dossier, written by the kit's own library from the copied files.
  const dossier = buildDossier(outputRoot, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputRoot, 'dossier.json'), dossier);
}

handIn();
