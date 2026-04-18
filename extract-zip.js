#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const zipPath = path.join(__dirname, '..', 'rms-v2.zip');
const targetDir = path.join(__dirname, '..');

console.log('Checking for rms-v2.zip...');
console.log('Zip path:', zipPath);
console.log('Exists:', fs.existsSync(zipPath));

if (fs.existsSync(zipPath)) {
  console.log('Extracting rms-v2.zip...');
  try {
    // Use unzip command to extract
    execSync(`unzip -o "${zipPath}" -d "${targetDir}"`, { stdio: 'inherit' });
    console.log('Extraction completed!');
    
    // List extracted files
    const files = fs.readdirSync(targetDir);
    console.log('\nExtracted files:');
    files.forEach(f => {
      if (f !== 'rms-v2.zip' && f !== '.git' && !f.startsWith('.')) {
        console.log('  -', f);
      }
    });
  } catch (err) {
    console.error('Extraction failed:', err.message);
  }
} else {
  console.error('rms-v2.zip not found at', zipPath);
}
