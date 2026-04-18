import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const cwd = process.cwd();
const zipPath = path.join(cwd, 'rms-v2.zip');

console.log(`[v0] Directory corrente: ${cwd}`);
console.log(`[v0] Cercando zip a: ${zipPath}`);
console.log(`[v0] Esiste: ${fs.existsSync(zipPath)}`);

if (fs.existsSync(zipPath)) {
  console.log(`\n[v0] File trovato! Dimensione: ${fs.statSync(zipPath).size} bytes`);
  console.log(`[v0] Estrazione in corso...`);
  
  try {
    // Usa il comando unzip per estrarre
    execSync(`unzip -q "${zipPath}"`, { cwd, stdio: 'inherit' });
    console.log(`[v0] ✓ Estrazione completata!`);
    
    // Lista il contenuto estratto
    console.log(`\n[v0] Contenuto directory:`);
    const files = fs.readdirSync(cwd).sort();
    files.forEach(file => {
      const stat = fs.statSync(path.join(cwd, file));
      const type = stat.isDirectory() ? '/' : '';
      console.log(`  - ${file}${type}`);
    });
  } catch (error) {
    console.error(`[v0] Errore estrazione:`, error.message);
  }
} else {
  console.log(`[v0] File non trovato in ${zipPath}`);
  console.log(`[v0] File disponibili nella directory:`);
  const files = fs.readdirSync(cwd);
  files.forEach(f => console.log(`  - ${f}`));
}
