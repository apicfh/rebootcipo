const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function setupExtract() {
  const currentDir = process.cwd();
  const zipPath = path.join(currentDir, 'rms-v2.zip');
  
  if (fs.existsSync(zipPath) && !fs.existsSync(path.join(currentDir, 'app'))) {
    try {
      console.log('[v0] Estrazione progetto...');
      execSync(`unzip -o "${zipPath}" -d "${currentDir}"`, { stdio: 'inherit' });
      console.log('[v0] ✓ Progetto estratto con successo');
    } catch (error) {
      console.error('[v0] Errore estrazione:', error.message);
    }
  }
}

module.exports = { setupExtract };
