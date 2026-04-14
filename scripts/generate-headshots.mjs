// One-shot generator: calls PixelLab for each character in characters/modelthinker
// and characters/analysts, saves the result as public/characters/headshots/<set>/<id>.png.
//
// Idempotent: skips any (set, id) whose PNG already exists. To regenerate a single
// headshot, delete the file and re-run.
//
// Usage:
//   node scripts/generate-headshots.mjs           # generate any missing
//   node scripts/generate-headshots.mjs --force   # regenerate everything
//
// Requires PIXELLAB_API_KEY in .env (already used by src/pages/api/pixellab.js).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const API_KEY = process.env.PIXELLAB_API_KEY;
if (!API_KEY) {
  console.error('PIXELLAB_API_KEY not set in .env');
  process.exit(1);
}

const FORCE = process.argv.includes('--force');

const SETS = [
  { name: 'modelthinker', dir: path.join(ROOT, 'characters/modelthinker') },
  { name: 'analysts', dir: path.join(ROOT, 'characters/analysts') },
];

const OUT_BASE = path.join(ROOT, 'public/characters/headshots');
fs.mkdirSync(OUT_BASE, { recursive: true });

// Shared style string so every portrait has a consistent aesthetic. Kept short so
// the per-character appearance dominates.
const STYLE_SUFFIX =
  'Shoulders-up portrait. Facing forward. Neutral dark background. 16-bit RPG character portrait, clean pixel edges, limited palette, soft directional lighting, no text, no watermark.';

function buildPrompt(character) {
  const appearance = character.appearance || '';
  const name = character.name || 'Character';
  return `Pixel art headshot of ${name}: ${appearance} ${STYLE_SUFFIX}`;
}

async function generate(description) {
  const res = await fetch('https://api.pixellab.ai/v1/generate-image-pixflux', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      description,
      image_size: { width: 128, height: 128 },
      negative_description: 'blurry, low quality, text, watermark, full body, multiple characters, cropped head',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PixelLab ${res.status}: ${err}`);
  }
  const data = await res.json();
  return Buffer.from(data.image.base64, 'base64');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const queue = [];
  for (const set of SETS) {
    const outDir = path.join(OUT_BASE, set.name);
    fs.mkdirSync(outDir, { recursive: true });
    const files = fs.readdirSync(set.dir).filter((f) =>
      f.endsWith('.json') && !f.startsWith('room_') && !f.startsWith('relationships')
    );
    for (const file of files) {
      const id = file.replace('.json', '');
      const outPath = path.join(outDir, `${id}.png`);
      if (!FORCE && fs.existsSync(outPath)) continue;
      const character = JSON.parse(fs.readFileSync(path.join(set.dir, file), 'utf-8'));
      queue.push({ set: set.name, id, character, outPath });
    }
  }

  if (queue.length === 0) {
    console.log('Nothing to generate. Pass --force to regenerate everything.');
    return;
  }

  console.log(`Generating ${queue.length} headshot(s)...`);
  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    const prompt = buildPrompt(job.character);
    process.stdout.write(`[${i + 1}/${queue.length}] ${job.set}/${job.id} ... `);
    try {
      const png = await generate(prompt);
      fs.writeFileSync(job.outPath, png);
      console.log('ok');
    } catch (err) {
      console.log('FAIL:', err.message);
    }
    // Gentle throttle — PixelLab tolerates faster, but no need to hammer.
    if (i < queue.length - 1) await sleep(750);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
