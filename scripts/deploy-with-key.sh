#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# Iron Wallet — Factory Deployment with Seed Phrase
#
# SECURITY WARNING: This script uses a seed phrase. Only use for testing/development.
# Never commit seed phrases to git or share them publicly.
# ═══════════════════════════════════════════════════════════════════════════════

FACTORY_ACCOUNT="ironwallet.testnet"
SEED_PHRASE="$1"

if [ -z "$SEED_PHRASE" ]; then
  echo "Usage: $0 '<seed-phrase>'"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

FACTORY_WASM="$ROOT_DIR/contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm"
MULTISIG_WASM="$ROOT_DIR/contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm"

# Check that WASMs exist
if [ ! -f "$FACTORY_WASM" ]; then
  echo "ERROR: Factory WASM not found. Run ./build.sh first."
  exit 1
fi

if [ ! -f "$MULTISIG_WASM" ]; then
  echo "ERROR: Multisig WASM not found. Run ./build.sh first."
  exit 1
fi

echo "==> Importing account from seed phrase..."
near account import-account using-seed-phrase "$SEED_PHRASE" network-config testnet

echo ""
echo "==> Deploying factory contract to $FACTORY_ACCOUNT..."
near contract deploy "$FACTORY_ACCOUNT" use-file "$FACTORY_WASM" without-init-call network-config testnet sign-with-keychain send

echo ""
echo "==> Initializing factory..."
near contract call-function as-transaction "$FACTORY_ACCOUNT" new json-args '{}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-with-keychain send

echo ""
echo "==> Storing multisig contract code in factory..."
near contract call-function as-transaction "$FACTORY_ACCOUNT" store_contract file-args "$MULTISIG_WASM" prepaid-gas '300.0 Tgas' attached-deposit '0 NEAR' sign-with-keychain send

echo ""
echo "==> Verifying..."
near contract call-function as-read-only "$FACTORY_ACCOUNT" has_code json-args '{}' network-config testnet now

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  Factory deployed successfully!"
echo ""
echo "  Factory account:  $FACTORY_ACCOUNT"
echo ""
echo "  Config is already set in frontend/src/config/near.ts"
echo "  Run: cd frontend && bun dev"
echo "══════════════════════════════════════════════════════════════"
