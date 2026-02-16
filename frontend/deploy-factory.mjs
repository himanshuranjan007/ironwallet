import { Account } from "@near-js/accounts";
import { JsonRpcProvider } from "@near-js/providers";
import { InMemoryKeyStore } from "@near-js/keystores";
import { KeyPair } from "@near-js/crypto";
import { KeyPairSigner } from "@near-js/signers";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import nacl from "tweetnacl";
import { baseEncode, formatNearAmount } from "near-api-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const FACTORY_ACCOUNT = "ironwallet.testnet";
const RPC_URL = "https://rpc.testnet.near.org";
const SEED_PHRASE = process.argv[2];

if (!SEED_PHRASE) {
  console.error("Usage: bun deploy-factory.mjs '<seed-phrase>'");
  process.exit(1);
}

// ── SLIP-0010 key derivation (NEAR standard: m/44'/397'/0') ──────────────────

function mnemonicToSeed(mnemonic) {
  return crypto.pbkdf2Sync(
    Buffer.from(mnemonic.normalize("NFKD"), "utf8"),
    Buffer.from("mnemonic", "utf8"),
    2048,
    64,
    "sha512"
  );
}

function slip10Derive(seed, path) {
  let hmac = crypto.createHmac("sha512", "ed25519 seed").update(seed).digest();
  let key = hmac.slice(0, 32);
  let chainCode = hmac.slice(32);

  for (const idx of path) {
    const index = 0x80000000 + idx;
    const data = Buffer.alloc(37);
    data[0] = 0;
    key.copy(data, 1);
    data.writeUInt32BE(index, 33);
    hmac = crypto.createHmac("sha512", chainCode).update(data).digest();
    key = hmac.slice(0, 32);
    chainCode = hmac.slice(32);
  }
  return key;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("==> Deriving key from seed phrase...");
  const seed = mnemonicToSeed(SEED_PHRASE);
  const derivedKey = slip10Derive(seed, [44, 397, 0]);
  const keyPairRaw = nacl.sign.keyPair.fromSeed(new Uint8Array(derivedKey));
  const secretKeyB58 = baseEncode(keyPairRaw.secretKey);
  const publicKeyB58 = baseEncode(keyPairRaw.publicKey);
  console.log(`   Public key: ed25519:${publicKeyB58}`);

  // Set up provider and signer
  const provider = new JsonRpcProvider({ url: RPC_URL });
  const keyPair = KeyPair.fromString(`ed25519:${secretKeyB58}`);
  const signer = new KeyPairSigner(keyPair);
  const account = new Account(FACTORY_ACCOUNT, provider, signer);

  // Verify account access
  console.log("==> Verifying account access...");
  const state = await provider.query({
    request_type: "view_account",
    account_id: FACTORY_ACCOUNT,
    finality: "final",
  });
  console.log(`   Balance: ${formatNearAmount(state.amount, 4)} NEAR`);

  // Step 1: Deploy factory contract
  console.log("\n==> Deploying factory contract...");
  const factoryWasm = readFileSync(
    join(ROOT, "contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm")
  );
  console.log(`   Factory WASM: ${(factoryWasm.length / 1024).toFixed(1)} KB`);

  const deployResult = await account.deployContract(new Uint8Array(factoryWasm));
  console.log(`   ✅ Deployed! TX: ${deployResult.transaction.hash}`);

  // Step 2: Initialize factory
  console.log("\n==> Initializing factory...");
  const initResult = await account.functionCall({
    contractId: FACTORY_ACCOUNT,
    methodName: "new",
    args: {},
    gas: BigInt("100000000000000"),
  });
  console.log(`   ✅ Initialized! TX: ${initResult.transaction.hash}`);

  // Step 3: Store multisig WASM
  console.log("\n==> Storing multisig contract code in factory...");
  const multisigWasm = readFileSync(
    join(ROOT, "contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm")
  );
  console.log(`   Multisig WASM: ${(multisigWasm.length / 1024).toFixed(1)} KB`);

  const storeResult = await account.functionCall({
    contractId: FACTORY_ACCOUNT,
    methodName: "store_contract",
    args: new Uint8Array(multisigWasm),
    gas: BigInt("300000000000000"),
  });
  console.log(`   ✅ Stored! TX: ${storeResult.transaction.hash}`);

  // Step 4: Verify
  console.log("\n==> Verifying...");
  const hasCode = await provider.query({
    request_type: "call_function",
    account_id: FACTORY_ACCOUNT,
    method_name: "has_code",
    args_base64: btoa("{}"),
    finality: "final",
  });
  const result = JSON.parse(Buffer.from(hasCode.result).toString());
  console.log(`   has_code: ${result}`);

  console.log(`
══════════════════════════════════════════════════════════════
  ✅ Factory deployed successfully!

  Factory account:  ${FACTORY_ACCOUNT}
  Config is already set in frontend/src/config/near.ts

  Run:  cd frontend && bun dev
══════════════════════════════════════════════════════════════
`);
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err.message || err);
  if (err.message?.includes("does not exist")) {
    console.error("\nThe derived key doesn't match the account's access keys.");
    console.error("Try logging in via: near login");
  }
  process.exit(1);
});
