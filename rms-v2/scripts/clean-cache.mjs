import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('[v0] Cleaning .next directory...');
const nextDir = path.join(projectRoot, '.next');
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('[v0] .next directory removed');
} else {
  console.log('[v0] .next directory not found');
}

console.log('[v0] Cleaning .turbo directory...');
const turboDir = path.join(projectRoot, '.turbo');
if (fs.existsSync(turboDir)) {
  fs.rmSync(turboDir, { recursive: true, force: true });
  console.log('[v0] .turbo directory removed');
} else {
  console.log('[v0] .turbo directory not found');
}

console.log('[v0] Cache cleaned successfully!');
