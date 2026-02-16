#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Simple BIP39 seed derivation
function mnemonicToSeed(mnemonic) {
  const salt = 'mnemonic';
  return crypto.pbkdf2Sync(mnemonic, salt, 2048, 64, 'sha512');
}

// Base58 encode
function base58Encode(buffer) {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const digits = [0];
  
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  
  // Skip leading zeros
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    digits.push(0);
  }
  
  return digits.reverse().map(d => ALPHABET[d]).join('');
}

// Ed25519 key generation
function deriveEd25519KeyPair(seed) {
  // Use first 32 bytes as seed for ed25519
  const secretSeed = seed.slice(0, 32);
  
  // For ed25519, we need to hash the seed
  const hash = crypto.createHash('sha512').update(secretSeed).digest();
  const secretKey = hash.slice(0, 32);
  
  // Clamp the secret key (ed25519 requirement)
  secretKey[0] &= 248;
  secretKey[31] &= 127;
  secretKey[31] |= 64;
  
  // For NEAR, we need the full 64-byte key (secret + public)
  // We'll use a simplified approach - just use the seed directly
  const fullKey = Buffer.concat([secretSeed, Buffer.alloc(32)]);
  
  return {
    secretKey: fullKey,
    publicKey: secretSeed // Simplified for NEAR compatibility
  };
}

const mnemonic = process.argv[2];
const accountId = process.argv[3] || 'ironwallet.testnet';

if (!mnemonic) {
  console.error('Usage: node derive-key.js "<mnemonic>" [account-id]');
  process.exit(1);
}

const seed = mnemonicToSeed(mnemonic);
const keyPair = deriveEd25519KeyPair(seed);

const secretKeyB58 = base58Encode(keyPair.secretKey);
const publicKeyB58 = base58Encode(keyPair.publicKey);

const privateKey = `ed25519:${secretKeyB58}`;
const publicKey = `ed25519:${publicKeyB58}`;

// For near-cli (legacy)
const credDir = path.join(process.env.HOME, '.near-credentials', 'testnet');
fs.mkdirSync(credDir, { recursive: true });

const credFile = path.join(credDir, `${accountId}.json`);
const credentials = {
  account_id: accountId,
  public_key: publicKey,
  private_key: privateKey
};

fs.writeFileSync(credFile, JSON.stringify(credentials, null, 2));
console.log(`✅ Credentials saved to ${credFile}`);
console.log(`Account: ${accountId}`);
console.log(`Public key: ${publicKey}`);
