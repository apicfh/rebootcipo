#!/bin/bash
cd /vercel/share/v0-project
if [ -f "rms-v2.zip" ]; then
  echo "[v0] Estrazione rms-v2.zip in corso..."
  unzip -o rms-v2.zip
  echo "[v0] Estrazione completata!"
  echo "[v0] Contenuto:"
  ls -la | head -20
else
  echo "[v0] File rms-v2.zip non trovato!"
fi
