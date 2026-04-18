#!/bin/bash

# Clean Next.js build cache
echo "Cleaning .next directory..."
rm -rf .next

# Clean node_modules cache
echo "Cleaning pnpm cache..."
pnpm store prune

echo "Cache cleaned successfully!"
