// ── Multisig Action Types ────────────────────────────────────────────────────

export interface TransferAction {
  type: "Transfer";
  amount: string; // yoctoNEAR as string
}

export interface FunctionCallAction {
  type: "FunctionCall";
  method_name: string;
  args: string;
  deposit: string;
  gas: string;
}

export interface AddMemberAction {
  type: "AddMember";
  member: string;
}

export interface RemoveMemberAction {
  type: "RemoveMember";
  member: string;
}

export interface ChangeConfirmationsAction {
  type: "ChangeNumConfirmations";
  num_confirmations: number;
}

export type MultiSigAction =
  | TransferAction
  | FunctionCallAction
  | AddMemberAction
  | RemoveMemberAction
  | ChangeConfirmationsAction;

// ── Request Types ────────────────────────────────────────────────────────────

export interface MultiSigRequestInput {
  receiver_id: string;
  actions: MultiSigAction[];
  description: string;
}

export interface MultiSigRequestView {
  id: number;
  requester: string;
  receiver_id: string;
  actions: MultiSigAction[];
  description: string;
  confirmations: string[];
  required: number;
}

// ── Wallet Info ──────────────────────────────────────────────────────────────

export interface WalletInfo {
  members: string[];
  num_confirmations: number;
  request_nonce: number;
  active_requests: number;
}

// ── Stored Wallet (local storage) ────────────────────────────────────────────

export interface StoredWallet {
  accountId: string;
  name: string;
  createdAt: number;
}
