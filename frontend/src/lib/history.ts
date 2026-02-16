import { NETWORK_ID } from "@/config/near";

const API_BASE =
  NETWORK_ID === "testnet"
    ? "https://api-testnet.nearblocks.io/v1"
    : "https://api.nearblocks.io/v1";

const EXPLORER_BASE =
  NETWORK_ID === "testnet"
    ? "https://testnet.nearblocks.io"
    : "https://nearblocks.io";

export interface TxHistoryItem {
  hash: string;
  signer: string;
  receiver: string;
  blockTimestamp: number;
  deposit: string;
  status: boolean;
  methodName: string | null;
  explorerUrl: string;
}

export async function getTransactionHistory(
  accountId: string,
  limit = 25
): Promise<TxHistoryItem[]> {
  try {
    const res = await fetch(
      `${API_BASE}/account/${accountId}/txns?limit=${limit}&order=desc`
    );
    if (!res.ok) return [];
    const data = await res.json();

    const txns = data.txns ?? data.data ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return txns.map((tx: any) => ({
      hash: tx.transaction_hash ?? "",
      signer: tx.signer_account_id ?? tx.predecessor_account_id ?? "",
      receiver: tx.receiver_account_id ?? "",
      blockTimestamp: Math.floor(
        Number(tx.block_timestamp ?? 0) / 1_000_000
      ),
      deposit: String(tx.actions_agg?.deposit ?? "0"),
      status: tx.outcomes_agg?.status !== false,
      methodName: tx.actions?.[0]?.method ?? null,
      explorerUrl: `${EXPLORER_BASE}/txns/${tx.transaction_hash}`,
    }));
  } catch {
    return [];
  }
}
