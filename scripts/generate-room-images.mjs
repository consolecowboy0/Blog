// One-shot generator for room establishing shots. Reads every room_*.json in
// characters/modelthinker and characters/analysts, derives a scene description
// from location/time/weather/atmosphere, calls PixelLab, and saves the result
// as public/characters/rooms/<id>.png.
//
// Idempotent: skips rooms whose PNG already exists. Pass --force to regenerate.

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

const ROOM_DIRS = [
  path.join(ROOT, 'characters/modelthinker'),
  path.join(ROOT, 'characters/analysts'),
];

const OUT = path.join(ROOT, 'public/characters/rooms');
fs.mkdirSync(OUT, { recursive: true });

const STYLE_SUFFIX =
  'Photorealistic detailed pixel art establishing shot. Empty room, no people, no figures. Wide interior view, eye-level perspective, realistic proportions. Natural lighting with soft shadows. Muted realistic palette, painterly shading, dense pixel clusters. Cinematic composition. No text, no watermark, no borders, no signage, no logos.';

function buildPrompt(room) {
  if (room.image_prompt) {
    return `${STYLE_SUFFIX} Scene: ${room.image_prompt}`;
  }
  const parts = [];
  if (room.location) parts.push(room.location);
  if (room.time) parts.push('Time: ' + room.time);
  if (room.weather) parts.push('Weather: ' + room.weather);
  if (room.atmosphere?.lighting) parts.push('Lighting: ' + room.atmosphere.lighting);
  if (room.atmosphere?.smell) parts.push('Atmosphere: ' + room.atmosphere.smell);
  return `${STYLE_SUFFIX} Scene: ${parts.join(' ')}`;
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
      image_size: { width: 256, height: 160 },
      negative_description: 'people, characters, humans, figures, portraits, cartoon, anime, text, watermark, logo, letters, signature, frame, border, signage',
    }),
  });
  if (!res.ok) throw new Error(`PixelLab ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return Buffer.from(data.image.base64, 'base64');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const queue = [];
  const seen = new Set();
  for (const dir of ROOM_DIRS) {
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('room_') && f.endsWith('.json'));
    for (const file of files) {
      const id = file.replace(/^room_/, '').replace(/\.json$/, '');
      if (seen.has(id)) continue;
      seen.add(id);
      const outPath = path.join(OUT, `${id}.png`);
      if (!FORCE && fs.existsSync(outPath)) continue;
      const room = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      queue.push({ id, room, outPath });
    }
  }

  if (queue.length === 0) {
    console.log('Nothing to generate. Pass --force to regenerate everything.');
    return;
  }

  console.log(`Generating ${queue.length} room image(s)...`);
  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    process.stdout.write(`[${i + 1}/${queue.length}] ${job.id} ... `);
    try {
      const png = await generate(buildPrompt(job.room));
      fs.writeFileSync(job.outPath, png);
      console.log('ok');
    } catch (err) {
      console.log('FAIL:', err.message);
    }
    if (i < queue.length - 1) await sleep(750);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
