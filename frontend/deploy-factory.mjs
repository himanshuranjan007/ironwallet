import { Account } from "@near-js/accounts";
import { JsonRpcProvider } from "@near-js/providers";
import { KeyPair } from "@near-js/crypto";
import { KeyPairSigner } from "@near-js/signers";
import { actionCreators } from "@near-js/transactions";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import nacl from "tweetnacl";
import { baseEncode } from "near-api-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const FACTORY_ACCOUNT = "ironwallet.testnet";
const RPC_URL = "https://rpc.testnet.near.org";
const SEED_PHRASE = process.argv[2];

if (!SEED_PHRASE) {
  console.error("Usage: bun deploy-factory.mjs '<seed-phrase>'");
  process.exit(1);
}

function mnemonicToSeed(mnemonic) {
  return crypto.pbkdf2Sync(
    Buffer.from(mnemonic.normalize("NFKD"), "utf8"),
    Buffer.from("mnemonic", "utf8"),
    2048, 64, "sha512"
  );
}

function slip10Derive(seed, path) {
  let hmac = crypto.createHmac("sha512", "ed25519 seed").update(seed).digest();
  let key = hmac.slice(0, 32);
  let chainCode = hmac.slice(32);
  for (const idx of path) {
    const data = Buffer.alloc(37);
    data[0] = 0;
    key.copy(data, 1);
    data.writeUInt32BE(0x80000000 + idx, 33);
    hmac = crypto.createHmac("sha512", chainCode).update(data).digest();
    key = hmac.slice(0, 32);
    chainCode = hmac.slice(32);
  }
  return key;
}

async function main() {
  console.log("==> Deriving key from seed phrase...");
  const seed = mnemonicToSeed(SEED_PHRASE);
  const derivedKey = slip10Derive(seed, [44, 397, 0]);
  const keyPairRaw = nacl.sign.keyPair.fromSeed(new Uint8Array(derivedKey));
  const secretKeyB58 = baseEncode(keyPairRaw.secretKey);
  const publicKeyB58 = baseEncode(keyPairRaw.publicKey);
  console.log(`   Public key: ed25519:${publicKeyB58}`);

  const provider = new JsonRpcProvider({ url: RPC_URL });
  const keyPair = KeyPair.fromString(`ed25519:${secretKeyB58}`);
  const signer = new KeyPairSigner(keyPair);
  const account = new Account(FACTORY_ACCOUNT, provider, signer);

  // Step 1: Deploy factory + init in one transaction
  console.log("\n==> Deploying factory contract...");
  const factoryWasm = readFileSync(
    join(ROOT, "contracts/factory/target/wasm32-unknown-unknown/release/iron_wallet_factory.wasm")
  );
  console.log(`   Factory WASM: ${(factoryWasm.length / 1024).toFixed(1)} KB`);

  const deployResult = await account.signAndSendTransaction({
    receiverId: FACTORY_ACCOUNT,
    actions: [
      actionCreators.deployContract(new Uint8Array(factoryWasm)),
      actionCreators.functionCall("new", new Uint8Array(Buffer.from("{}")), BigInt("50000000000000"), BigInt(0)),
    ],
  });
  console.log(`   ✅ Deploy + Init TX: ${deployResult.transaction.hash}`);

  // Step 2: Store multisig WASM
  console.log("\n==> Storing multisig contract code in factory...");
  const multisigWasm = readFileSync(
    join(ROOT, "contracts/multisig/target/wasm32-unknown-unknown/release/multisig.wasm")
  );
  console.log(`   Multisig WASM: ${(multisigWasm.length / 1024).toFixed(1)} KB`);

  const storeResult = await account.signAndSendTransaction({
    receiverId: FACTORY_ACCOUNT,
    actions: [
      actionCreators.functionCall("store_contract", new Uint8Array(multisigWasm), BigInt("300000000000000"), BigInt(0)),
    ],
  });
  console.log(`   ✅ Store TX: ${storeResult.transaction.hash}`);

  // Step 3: Verify
  console.log("\n==> Verifying...");
  await new Promise(r => setTimeout(r, 2000));

  const hasCodeRes = await provider.query({
    request_type: "call_function",
    account_id: FACTORY_ACCOUNT,
    method_name: "has_code",
    args_base64: btoa("{}"),
    finality: "final",
  });
  const hasCode = JSON.parse(Buffer.from(hasCodeRes.result).toString());

  const ownerRes = await provider.query({
    request_type: "call_function",
    account_id: FACTORY_ACCOUNT,
    method_name: "get_owner",
    args_base64: btoa("{}"),
    finality: "final",
  });
  const owner = JSON.parse(Buffer.from(ownerRes.result).toString());

  console.log(`   has_code: ${hasCode}`);
  console.log(`   owner: ${owner}`);

  console.log(`
══════════════════════════════════════════════════════════════
  ✅ Iron Wallet Factory deployed successfully!

  Factory:  ${FACTORY_ACCOUNT}
  Owner:    ${owner}
  Code:     ${hasCode ? "stored" : "NOT stored"}

  Run:  cd frontend && bun dev
══════════════════════════════════════════════════════════════
`);
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err.message || err);
  process.exit(1);
});
