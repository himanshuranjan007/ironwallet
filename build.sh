#!/usr/bin/env bash
set -euo pipefail

echo "==> Building multisig contract..."
cd contracts/multisig
cargo build --target wasm32-unknown-unknown --release
cd ../..

echo "==> Building factory contract..."
cd contracts/factory
cargo build --target wasm32-unknown-unknown --release
cd ../..

echo "==> Copying multisig WASM to frontend..."
cp contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm frontend/public/multisig.wasm

echo "==> Building frontend..."
cd frontend
bun install
bun run build

echo "==> Done! All builds succeeded."
echo ""
echo "Next: deploy the factory with ./scripts/deploy-factory.sh <account-id>"
