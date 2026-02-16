#!/usr/bin/env bash
set -euo pipefail

FACTORY_ACCOUNT="ironwallet.testnet"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

FACTORY_WASM="$ROOT_DIR/contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm"
MULTISIG_WASM="$ROOT_DIR/contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm"

echo "==> Deploying factory contract..."
near contract deploy "$FACTORY_ACCOUNT" use-file "$FACTORY_WASM" without-init-call network-config testnet sign-with-legacy-keychain send

echo ""
echo "==> Initializing factory..."
near contract call-function as-transaction "$FACTORY_ACCOUNT" new json-args '{}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-with-legacy-keychain send

echo ""
echo "==> Storing multisig contract code..."
near contract call-function as-transaction "$FACTORY_ACCOUNT" store_contract file-args "$MULTISIG_WASM" prepaid-gas '300.0 Tgas' attached-deposit '0 NEAR' sign-with-legacy-keychain send

echo ""
echo "==> Verifying..."
near contract call-function as-read-only "$FACTORY_ACCOUNT" has_code json-args '{}' network-config testnet now
near contract call-function as-read-only "$FACTORY_ACCOUNT" get_wallet_count json-args '{}' network-config testnet now

echo ""
echo "✅ Factory deployed successfully to $FACTORY_ACCOUNT"
echo "✅ Config already set in frontend/src/config/near.ts"
echo ""
echo "Run: cd frontend && bun dev"
