# Factory Deployment Guide

The factory contract needs to be deployed once to NEAR testnet. Here are your options:

## Option 1: Deploy via MyNearWallet (Easiest)

1. Go to https://testnet.mynearwallet.com and login with your `ironwallet.testnet` account

2. Click "Deploy a Contract"

3. Upload the factory WASM:
   ```
   contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm
   ```

4. After deployment, call the `new` method (initialization):
   - Method: `new`
   - Arguments: `{}`
   - Gas: 100 TGas

5. Call `store_contract` to upload the multisig WASM:
   - Method: `store_contract`
   - Upload file: `contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm`
   - Gas: 300 TGas

## Option 2: Deploy via NEAR CLI (Command Line)

If you have NEAR CLI installed and logged in:

```bash
# Login first
near login

# Deploy factory
near deploy ironwallet.testnet contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm

# Initialize
near call ironwallet.testnet new '{}' --accountId ironwallet.testnet

# Store multisig code
near call ironwallet.testnet store_contract --base64File contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm --accountId ironwallet.testnet --gas 300000000000000
```

## Option 3: Use near-cli-rs with Keychain

```bash
# Make sure you're logged in
near account list

# Deploy
near contract deploy ironwallet.testnet use-file contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm without-init-call network-config testnet sign-with-keychain send

# Initialize
near contract call-function as-transaction ironwallet.testnet new json-args '{}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-with-keychain send

# Store multisig code
near contract call-function as-transaction ironwallet.testnet store_contract file-args contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm prepaid-gas '300.0 Tgas' attached-deposit '0 NEAR' sign-with-keychain send
```

## Verify Deployment

```bash
near contract call-function as-read-only ironwallet.testnet has_code json-args '{}' network-config testnet now
```

Should return: `true`

## After Deployment

The config is already set in `frontend/src/config/near.ts`:
```ts
export const FACTORY_CONTRACT_ID = "ironwallet.testnet";
```

Just run:
```bash
cd frontend
bun dev
```

And you're ready to create multisig wallets!
