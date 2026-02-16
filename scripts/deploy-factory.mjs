import { connect, keyStores, KeyPair, utils } from "near-api-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const FACTORY_ACCOUNT = "ironwallet.testnet";
const SEED_PHRASE = process.argv[2];

if (!SEED_PHRASE) {
  console.error("Usage: node deploy-factory.mjs '<seed-phrase>'");
  process.exit(1);
}

// ── Derive key from seed phrase (NEAR-compatible: BIP39 → SLIP-0010 m/44'/397'/0') ──

function mnemonicToSeed(mnemonic) {
  return crypto.pbkdf2Sync(
    Buffer.from(mnemonic.normalize("NFKD"), "utf8"),
    Buffer.from("mnemonic", "utf8"),
    2048,
    64,
    "sha512"
  );
}

function slip10DeriveKey(seed, path) {
  let key = crypto.createHmac("sha512", "ed25519 seed").update(seed).digest();
  let privateKey = key.slice(0, 32);
  let chainCode = key.slice(32);

  for (const segment of path) {
    const index = 0x80000000 + segment;
    const buf = Buffer.alloc(37);
    buf[0] = 0;
    privateKey.copy(buf, 1);
    buf.writeUInt32BE(index, 33);
    const hmac = crypto.createHmac("sha512", chainCode).update(buf).digest();
    privateKey = hmac.slice(0, 32);
    chainCode = hmac.slice(32);
  }

  return privateKey;
}

// Derive ed25519 keypair from private key seed
async function deriveKeyPair(mnemonic) {
  const { default: nacl } = await import("tweetnacl");
  const seed = mnemonicToSeed(mnemonic);
  const derivedKey = slip10DeriveKey(seed, [44, 397, 0]);
  const keyPair = nacl.sign.keyPair.fromSeed(derivedKey);
  return keyPair;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("==> Deriving key from seed phrase...");

  const { default: nacl } = await import("tweetnacl");
  const seed = mnemonicToSeed(SEED_PHRASE);
  const derivedKey = slip10DeriveKey(seed, [44, 397, 0]);
  const keyPairRaw = nacl.sign.keyPair.fromSeed(derivedKey);

  const secretKeyB58 = utils.serialize.base_encode(keyPairRaw.secretKey);
  const publicKeyB58 = utils.serialize.base_encode(keyPairRaw.publicKey);

  console.log(`   Public key: ed25519:${publicKeyB58}`);

  // Set up NEAR connection
  const keyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(`ed25519:${secretKeyB58}`);
  await keyStore.setKey("testnet", FACTORY_ACCOUNT, keyPair);

  const near = await connect({
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    keyStore,
  });

  const account = await near.account(FACTORY_ACCOUNT);

  // Verify account access
  console.log("==> Verifying account access...");
  const state = await account.state();
  console.log(
    `   Account: ${FACTORY_ACCOUNT}, Balance: ${utils.format.formatNearAmount(state.amount, 4)} NEAR`
  );

  // Step 1: Deploy factory contract
  console.log("\n==> Deploying factory contract...");
  const factoryWasm = readFileSync(
    join(
      ROOT,
      "contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm"
    )
  );
  console.log(`   WASM size: ${(factoryWasm.length / 1024).toFixed(1)} KB`);

  const deployResult = await account.deployContract(factoryWasm);
  console.log(
    `   ✅ Deployed! TX: ${deployResult.transaction.hash}`
  );

  // Step 2: Initialize factory
  console.log("\n==> Initializing factory...");
  const initResult = await account.functionCall({
    contractId: FACTORY_ACCOUNT,
    methodName: "new",
    args: {},
    gas: BigInt("100000000000000"),
  });
  console.log(
    `   ✅ Initialized! TX: ${initResult.transaction.hash}`
  );

  // Step 3: Store multisig WASM
  console.log("\n==> Storing multisig contract code in factory...");
  const multisigWasm = readFileSync(
    join(
      ROOT,
      "contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm"
    )
  );
  console.log(`   Multisig WASM size: ${(multisigWasm.length / 1024).toFixed(1)} KB`);

  const storeResult = await account.functionCall({
    contractId: FACTORY_ACCOUNT,
    methodName: "store_contract",
    args: multisigWasm,
    gas: BigInt("300000000000000"),
  });
  console.log(
    `   ✅ Stored! TX: ${storeResult.transaction.hash}`
  );

  // Step 4: Verify
  console.log("\n==> Verifying deployment...");
  const hasCode = await account.viewFunction({
    contractId: FACTORY_ACCOUNT,
    methodName: "has_code",
    args: {},
  });
  const owner = await account.viewFunction({
    contractId: FACTORY_ACCOUNT,
    methodName: "get_owner",
    args: {},
  });
  console.log(`   has_code: ${hasCode}`);
  console.log(`   owner: ${owner}`);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  ✅ Factory deployed successfully!                        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Factory account:  ${FACTORY_ACCOUNT.padEnd(36)}  ║
║  Multisig stored:  ${String(hasCode).padEnd(36)}  ║
║  Owner:            ${owner.padEnd(36)}  ║
║                                                            ║
║  Run:  cd frontend && bun dev                              ║
╚════════════════════════════════════════════════════════════╝
`);
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err.message || err);
  process.exit(1);
});
