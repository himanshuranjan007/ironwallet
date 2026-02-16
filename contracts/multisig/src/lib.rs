use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap, UnorderedSet};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near, AccountId, BorshStorageKey, Gas, NearToken, Promise, require};

#[derive(BorshStorageKey, BorshSerialize)]
#[borsh(crate = "near_sdk::borsh")]
enum StorageKey {
    Members,
    Requests,
    Confirmations,
    ConfirmationSet { request_id: u32 },
}

// ── Actions that a multisig request can perform ──────────────────────────────

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
#[serde(tag = "type")]
pub enum MultiSigAction {
    Transfer {
        amount: U128,
    },
    FunctionCall {
        method_name: String,
        args: String,
        deposit: U128,
        gas: U128,
    },
    AddMember {
        member: AccountId,
    },
    RemoveMember {
        member: AccountId,
    },
    ChangeNumConfirmations {
        num_confirmations: u32,
    },
}

// ── A stored multisig request ────────────────────────────────────────────────

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct MultiSigRequest {
    pub requester: AccountId,
    pub receiver_id: AccountId,
    pub actions: Vec<MultiSigAction>,
    pub description: String,
}

// ── View-only response with confirmations ────────────────────────────────────

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct MultiSigRequestView {
    pub id: u32,
    pub requester: AccountId,
    pub receiver_id: AccountId,
    pub actions: Vec<MultiSigAction>,
    pub description: String,
    pub confirmations: Vec<AccountId>,
    pub required: u32,
}

// ── Input struct (requester set automatically) ───────────────────────────────

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct MultiSigRequestInput {
    pub receiver_id: AccountId,
    pub actions: Vec<MultiSigAction>,
    pub description: String,
}

// ── Wallet info view ─────────────────────────────────────────────────────────

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct WalletInfo {
    pub members: Vec<AccountId>,
    pub num_confirmations: u32,
    pub request_nonce: u32,
    pub active_requests: u32,
}

// ═══════════════════════════════════════════════════════════════════════════════
// Contract
// ═══════════════════════════════════════════════════════════════════════════════

#[near(contract_state)]
pub struct MultisigWallet {
    members: UnorderedSet<AccountId>,
    num_confirmations: u32,
    request_nonce: u32,
    requests: UnorderedMap<u32, MultiSigRequest>,
    confirmations: UnorderedMap<u32, UnorderedSet<AccountId>>,
}

impl Default for MultisigWallet {
    fn default() -> Self {
        env::panic_str("MultisigWallet must be initialized with new()")
    }
}

#[near]
impl MultisigWallet {
    /// Initialize the multisig wallet with a set of members and a confirmation
    /// threshold.
    #[init]
    pub fn new(members: Vec<AccountId>, num_confirmations: u32) -> Self {
        require!(!env::state_exists(), "Already initialized");
        require!(!members.is_empty(), "Must have at least one member");
        require!(
            num_confirmations > 0 && num_confirmations as usize <= members.len(),
            "num_confirmations must be between 1 and members count"
        );

        let mut member_set = UnorderedSet::new(StorageKey::Members);
        for m in &members {
            require!(member_set.insert(m), "Duplicate member");
        }

        Self {
            members: member_set,
            num_confirmations,
            request_nonce: 0,
            requests: UnorderedMap::new(StorageKey::Requests),
            confirmations: UnorderedMap::new(StorageKey::Confirmations),
        }
    }

    // ── Mutative methods ─────────────────────────────────────────────────────

    /// Propose a new transaction.  The caller is auto-added as the first
    /// confirmer.  If `num_confirmations == 1` the request executes immediately.
    pub fn add_request(&mut self, request: MultiSigRequestInput) -> u32 {
        self.assert_member();

        let request_id = self.request_nonce;
        let caller = env::predecessor_account_id();

        let stored = MultiSigRequest {
            requester: caller.clone(),
            receiver_id: request.receiver_id,
            actions: request.actions,
            description: request.description,
        };

        self.requests.insert(&request_id, &stored);

        let mut conf_set =
            UnorderedSet::new(StorageKey::ConfirmationSet { request_id });
        conf_set.insert(&caller);
        let count = conf_set.len();
        self.confirmations.insert(&request_id, &conf_set);

        self.request_nonce += 1;

        if count as u32 >= self.num_confirmations {
            self.execute_request(request_id);
        }

        request_id
    }

    /// Confirm an existing request.
    pub fn confirm(&mut self, request_id: u32) {
        self.assert_member();
        require!(
            self.requests.get(&request_id).is_some(),
            "Request not found"
        );

        let mut confs = self
            .confirmations
            .get(&request_id)
            .expect("Confirmations not found");

        let caller = env::predecessor_account_id();
        require!(!confs.contains(&caller), "Already confirmed");

        confs.insert(&caller);
        let count = confs.len();
        self.confirmations.insert(&request_id, &confs);

        if count as u32 >= self.num_confirmations {
            self.execute_request(request_id);
        }
    }

    /// Revoke your own confirmation on a pending request.
    pub fn revoke_confirmation(&mut self, request_id: u32) {
        self.assert_member();
        require!(
            self.requests.get(&request_id).is_some(),
            "Request not found"
        );

        let mut confs = self
            .confirmations
            .get(&request_id)
            .expect("Confirmations not found");

        let caller = env::predecessor_account_id();
        require!(confs.contains(&caller), "Not confirmed");

        confs.remove(&caller);
        self.confirmations.insert(&request_id, &confs);
    }

    /// Delete a request entirely.  Only the original requester may delete.
    pub fn delete_request(&mut self, request_id: u32) {
        self.assert_member();
        let request = self
            .requests
            .get(&request_id)
            .expect("Request not found");
        require!(
            request.requester == env::predecessor_account_id(),
            "Only the requester can delete"
        );
        self.requests.remove(&request_id);
        self.confirmations.remove(&request_id);
    }

    // ── View methods ─────────────────────────────────────────────────────────

    pub fn get_request(&self, request_id: u32) -> Option<MultiSigRequestView> {
        self.requests.get(&request_id).map(|r| {
            let confs = self
                .confirmations
                .get(&request_id)
                .map(|c| c.to_vec())
                .unwrap_or_default();
            MultiSigRequestView {
                id: request_id,
                requester: r.requester,
                receiver_id: r.receiver_id,
                actions: r.actions,
                description: r.description,
                confirmations: confs,
                required: self.num_confirmations,
            }
        })
    }

    pub fn get_requests(&self) -> Vec<MultiSigRequestView> {
        self.requests
            .iter()
            .map(|(id, r)| {
                let confs = self
                    .confirmations
                    .get(&id)
                    .map(|c| c.to_vec())
                    .unwrap_or_default();
                MultiSigRequestView {
                    id,
                    requester: r.requester,
                    receiver_id: r.receiver_id,
                    actions: r.actions,
                    description: r.description,
                    confirmations: confs,
                    required: self.num_confirmations,
                }
            })
            .collect()
    }

    pub fn get_members(&self) -> Vec<AccountId> {
        self.members.to_vec()
    }

    pub fn get_num_confirmations(&self) -> u32 {
        self.num_confirmations
    }

    pub fn get_request_nonce(&self) -> u32 {
        self.request_nonce
    }

    pub fn get_wallet_info(&self) -> WalletInfo {
        WalletInfo {
            members: self.members.to_vec(),
            num_confirmations: self.num_confirmations,
            request_nonce: self.request_nonce,
            active_requests: self.requests.len() as u32,
        }
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    fn assert_member(&self) {
        require!(
            self.members.contains(&env::predecessor_account_id()),
            "Caller is not a member of this wallet"
        );
    }

    fn execute_request(&mut self, request_id: u32) {
        let request = self
            .requests
            .get(&request_id)
            .expect("Request not found");

        for action in &request.actions {
            match action {
                MultiSigAction::Transfer { amount } => {
                    let _ = Promise::new(request.receiver_id.clone())
                        .transfer(NearToken::from_yoctonear(amount.0))
                        .as_return();
                }
                MultiSigAction::FunctionCall {
                    method_name,
                    args,
                    deposit,
                    gas,
                } => {
                    let _ = Promise::new(request.receiver_id.clone())
                        .function_call(
                            method_name.clone(),
                            args.clone().into_bytes(),
                            NearToken::from_yoctonear(deposit.0),
                            Gas::from_gas(gas.0 as u64),
                        )
                        .as_return();
                }
                MultiSigAction::AddMember { member } => {
                    self.members.insert(member);
                }
                MultiSigAction::RemoveMember { member } => {
                    self.members.remove(member);
                    require!(
                        self.members.len() as u32 >= self.num_confirmations,
                        "Cannot remove: would make confirmations impossible"
                    );
                }
                MultiSigAction::ChangeNumConfirmations {
                    num_confirmations,
                } => {
                    require!(
                        *num_confirmations > 0
                            && (*num_confirmations as u64) <= self.members.len(),
                        "Invalid number of confirmations"
                    );
                    self.num_confirmations = *num_confirmations;
                }
            }
        }

        self.requests.remove(&request_id);
        self.confirmations.remove(&request_id);

        env::log_str(&format!("Request {} executed", request_id));
    }
}
