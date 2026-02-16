import { JsonRpcProvider } from "@near-js/providers";
import { actionCreators } from "@near-js/transactions";
import type { WalletSelector } from "@near-wallet-selector/core";
import { getConfig } from "@/config/near";
import type {
  MultiSigRequestInput,
  MultiSigRequestView,
  WalletInfo,
} from "@/types";

const config = getConfig();
const provider = new JsonRpcProvider({ url: config.nodeUrl });

const { createAccount, transfer, deployContract, functionCall } =
  actionCreators;

// ── Helpers ──────────────────────────────────────────────────────────────────

function encodeArgs(args: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(args)).toString("base64");
}

function decodeResult(result: unknown): unknown {
  const res = result as { result: number[] };
  return JSON.parse(Buffer.from(res.result).toString());
}

// ── View calls (no wallet needed) ────────────────────────────────────────────

export async function viewMethod(
  contractId: string,
  methodName: string,
  args: Record<string, unknown> = {}
): Promise<unknown> {
  const res = await provider.query({
    request_type: "call_function",
    account_id: contractId,
    method_name: methodName,
    args_base64: encodeArgs(args),
    finality: "final",
  });
  return decodeResult(res);
}

export async function getWalletInfo(
  contractId: string
): Promise<WalletInfo> {
  return (await viewMethod(contractId, "get_wallet_info")) as WalletInfo;
}

export async function getMembers(contractId: string): Promise<string[]> {
  return (await viewMethod(contractId, "get_members")) as string[];
}

export async function getRequests(
  contractId: string
): Promise<MultiSigRequestView[]> {
  return (await viewMethod(
    contractId,
    "get_requests"
  )) as MultiSigRequestView[];
}

export async function getRequest(
  contractId: string,
  requestId: number
): Promise<MultiSigRequestView | null> {
  return (await viewMethod(contractId, "get_request", {
    request_id: requestId,
  })) as MultiSigRequestView | null;
}

export async function getNumConfirmations(
  contractId: string
): Promise<number> {
  return (await viewMethod(
    contractId,
    "get_num_confirmations"
  )) as number;
}

export async function getAccountBalance(
  accountId: string
): Promise<string> {
  const account = await provider.query({
    request_type: "view_account",
    account_id: accountId,
    finality: "final",
  });
  return (account as unknown as { amount: string }).amount;
}

// ── Constants ────────────────────────────────────────────────────────────────

const GAS_100T = BigInt("100000000000000");

// ── Change calls (wallet required) ──────────────────────────────────────────

export async function addRequest(
  selector: WalletSelector,
  contractId: string,
  request: MultiSigRequestInput
) {
  const wallet = await selector.wallet();
  return wallet.signAndSendTransaction({
    receiverId: contractId,
    actions: [
      functionCall("add_request", request, GAS_100T, BigInt(0)),
    ],
  });
}

export async function confirmRequest(
  selector: WalletSelector,
  contractId: string,
  requestId: number
) {
  const wallet = await selector.wallet();
  return wallet.signAndSendTransaction({
    receiverId: contractId,
    actions: [
      functionCall(
        "confirm",
        { request_id: requestId },
        GAS_100T,
        BigInt(0)
      ),
    ],
  });
}

export async function revokeConfirmation(
  selector: WalletSelector,
  contractId: string,
  requestId: number
) {
  const wallet = await selector.wallet();
  return wallet.signAndSendTransaction({
    receiverId: contractId,
    actions: [
      functionCall(
        "revoke_confirmation",
        { request_id: requestId },
        GAS_100T,
        BigInt(0)
      ),
    ],
  });
}

export async function deleteRequest(
  selector: WalletSelector,
  contractId: string,
  requestId: number
) {
  const wallet = await selector.wallet();
  return wallet.signAndSendTransaction({
    receiverId: contractId,
    actions: [
      functionCall(
        "delete_request",
        { request_id: requestId },
        GAS_100T,
        BigInt(0)
      ),
    ],
  });
}

// ── Deploy a new multisig wallet ─────────────────────────────────────────────

export async function deployMultisigWallet(
  selector: WalletSelector,
  newAccountId: string,
  members: string[],
  numConfirmations: number,
  wasmBytes: Uint8Array,
  initialBalance: string
) {
  const wallet = await selector.wallet();

  return wallet.signAndSendTransaction({
    receiverId: newAccountId,
    actions: [
      createAccount(),
      transfer(BigInt(initialBalance)),
      deployContract(wasmBytes),
      functionCall(
        "new",
        { members, num_confirmations: numConfirmations },
        GAS_100T,
        BigInt(0)
      ),
    ],
  });
}

// ── Utility ──────────────────────────────────────────────────────────────────

export function nearToYocto(near: string): string {
  const [whole = "0", decimal = ""] = near.split(".");
  const padded = decimal.padEnd(24, "0").slice(0, 24);
  return (whole === "" ? "0" : whole) + padded;
}

export function yoctoToNear(yocto: string): string {
  const padded = yocto.padStart(25, "0");
  const whole = padded.slice(0, -24).replace(/^0+/, "") || "0";
  const decimal = padded.slice(-24).replace(/0+$/, "");
  return decimal ? `${whole}.${decimal}` : whole;
}

export function formatNear(yocto: string, decimals = 4): string {
  const near = yoctoToNear(yocto);
  const [whole, decimal = ""] = near.split(".");
  const trimmed = decimal.slice(0, decimals);
  return trimmed ? `${whole}.${trimmed}` : whole;
}
