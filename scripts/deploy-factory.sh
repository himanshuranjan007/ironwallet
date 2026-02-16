#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# Iron Wallet — Factory Deployment Script
#
# Prerequisites:
#   1. Install NEAR CLI: npm i -g near-cli  (or: cargo install near-cli-rs)
#   2. Create a testnet account at https://testnet.mynearwallet.com
#   3. Login: near login
#
# Usage:
#   ./scripts/deploy-factory.sh <factory-account-id>
#
# Example:
#   ./scripts/deploy-factory.sh iron-wallet.testnet
# ═══════════════════════════════════════════════════════════════════════════════

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <factory-account-id>"
  echo "Example: $0 iron-wallet.testnet"
  exit 1
fi

FACTORY_ACCOUNT="$1"
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

echo "==> Deploying factory contract to $FACTORY_ACCOUNT..."
near deploy "$FACTORY_ACCOUNT" "$FACTORY_WASM"

echo ""
echo "==> Initializing factory..."
near call "$FACTORY_ACCOUNT" new '{}' --accountId "$FACTORY_ACCOUNT"

echo ""
echo "==> Storing multisig contract code in factory..."
# Use base64 file upload for the WASM binary
near call "$FACTORY_ACCOUNT" store_contract \
  --base64File "$MULTISIG_WASM" \
  --accountId "$FACTORY_ACCOUNT" \
  --gas 300000000000000

echo ""
echo "==> Verifying..."
near view "$FACTORY_ACCOUNT" has_code '{}'
near view "$FACTORY_ACCOUNT" get_owner '{}'

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  Factory deployed successfully!"
echo ""
echo "  Factory account:  $FACTORY_ACCOUNT"
echo ""
echo "  Next steps:"
echo "    1. Update FACTORY_CONTRACT_ID in frontend/src/config/near.ts"
echo "       Set it to: \"$FACTORY_ACCOUNT\""
echo "    2. Run: cd frontend && bun dev"
echo "══════════════════════════════════════════════════════════════"
