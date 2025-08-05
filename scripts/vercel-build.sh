#!/bin/bash
set -e

echo "Setting up corepack..."
corepack enable

echo "Installing correct pnpm version..."
corepack prepare pnpm@10.14.0 --activate

echo "Verifying pnpm version..."
pnpm --version

echo "Building docs..."
pnpm build-docs