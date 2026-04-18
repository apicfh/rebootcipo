import https from 'https';
import { createWriteStream } from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

const zipUrl = 'https://v0chat-agent-data-prod.s3.us-east-1.amazonaws.com/vm-binary/KZ5Wp00qvtn/944350a9193281a3fc1001c5ad14a64945f13613bfa727211c6968cc305907ba.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA52KF4VHQLNRSVMKG%2F20260418%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260418T104640Z&X-Amz-Expires=3600&X-Amz-Signature=d45913bcae078b80a07d626ba7681a5e1e9d33c1848b86c03fd9e5d4d8b8f742&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject';
const targetDir = path.join(__dirname, '..');
const zipPath = path.join(targetDir, 'rms-v2-downloaded.zip');

console.log('[v0] Scaricando zip da S3...');
console.log('[v0] Destinazione:', targetDir);

// Download the file
const downloadPromise = new Promise((resolve, reject) => {
  https.get(zipUrl, (response) => {
    if (response.statusCode !== 200) {
      reject(new Error(`Failed to download: ${response.statusCode}`));
      return;
    }
    
    const file = createWriteStream(zipPath);
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log('[v0] Download completato');
      resolve();
    });
    
    file.on('error', (err) => {
      file.close();
      reject(err);
    });
  }).on('error', reject);
});

try {
  await downloadPromise;
  
  // Extract the zip
  console.log('[v0] Estraendo archivio...');
  const { stdout } = await execAsync(`cd ${targetDir} && unzip -q ${zipPath} && rm ${zipPath}`);
  
  console.log('[v0] Estrazione completata!');
  
  // List files
  const { stdout: ls } = await execAsync(`ls -la ${targetDir} | head -20`);
  console.log('[v0] Contenuto directory:');
  console.log(ls);
  
} catch (error) {
  console.error('[v0] Errore:', error.message);
  process.exit(1);
}
