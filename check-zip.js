const fs = require('fs');
const zlib = require('zlib');
const { Transform } = require('stream');

// Leggi il primo megabyte del file per capire la struttura
const fd = fs.openSync('rms-v2.zip', 'r');
const buffer = Buffer.alloc(1024);
fs.readSync(fd, buffer, 0, 1024, 0);
fs.closeSync(fd);

// Cerca le signature di file ZIP
console.log('File signature (hex):', buffer.slice(0, 4).toString('hex'));
console.log('Probabile file ZIP:', buffer.slice(0, 4).toString('hex') === '504b0304');
