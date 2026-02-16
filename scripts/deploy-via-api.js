#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Iron Wallet Factory - Manual Deployment Required             ║
╚════════════════════════════════════════════════════════════════╝

The seed phrase you provided doesn't match the access keys on ironwallet.testnet.

Current access keys on the account:
  • ed25519:2KHP1WLo6mgc3pSbHfcinCQx5xS1XMgyHKrinjso6g2B
  • ed25519:6Ga6GFt6ddWGsmLSr8M2t45biSvJTbSKiq7KUSLz7AeS  
  • ed25519:74SyzV3HMdDMCoXiqCYhn32yLGnZfp3rTKNYBMgZC79M
  • ed25519:CfmB8P9PvRCCnjL7ZXM3Kwtvb5SAFEY9AbLQep9bbsN4

Please deploy manually using one of these methods:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 OPTION 1: Deploy via Web Wallet (Easiest)

1. Go to: https://testnet.mynearwallet.com
2. Login with ironwallet.testnet
3. Navigate to "Deploy Contract"
4. Upload: contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm
5. Call "new" method with args: {}
6. Call "store_contract" method and upload: contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💻 OPTION 2: Deploy via NEAR CLI

near login  # Login with ironwallet.testnet in the browser

near deploy ironwallet.testnet \\
  contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm

near call ironwallet.testnet new '{}' --accountId ironwallet.testnet

near call ironwallet.testnet store_contract \\
  --base64File contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm \\
  --accountId ironwallet.testnet \\
  --gas 300000000000000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After deployment, the frontend is ready to use:

  cd frontend && bun dev

The config is already set to use ironwallet.testnet as the factory.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
