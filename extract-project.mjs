import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const currentDir = process.cwd();
const zipPath = path.join(currentDir, 'rms-v2.zip');

console.log('[v0] Directory corrente:', currentDir);
console.log('[v0] Cercando:', zipPath);
console.log('[v0] Esiste:', fs.existsSync(zipPath));

if (fs.existsSync(zipPath)) {
  try {
    console.log('[v0] Estrazione in corso...');
    execSync(`unzip -o "${zipPath}" -d "${currentDir}"`, { stdio: 'inherit' });
    console.log('[v0] ✓ Estrazione completata!');
    
    // List the extracted files
    const files = fs.readdirSync(currentDir);
    console.log('[v0] Contenuto estratto:');
    files.slice(0, 10).forEach(f => {
      const stat = fs.statSync(path.join(currentDir, f));
      console.log(`  - ${f}${stat.isDirectory() ? '/' : ''}`);
    });
    if (files.length > 10) {
      console.log(`  ... e ${files.length - 10} altri file/cartelle`);
    }
  } catch (error) {
    console.error('[v0] Errore durante l\'estrazione:', error.message);
  }
} else {
  console.error('[v0] File zip non trovato!');
}
