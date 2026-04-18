#!/bin/bash
set -e

echo "Extracting rms-v2.zip..."
cd /vercel/share/v0-project
unzip -o rms-v2.zip

echo "Installing dependencies..."
npm install || pnpm install || yarn install || bun install

echo "Starting dev server..."
npm run dev || pnpm dev || yarn dev || bun dev
