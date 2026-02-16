use near_sdk::borsh::BorshSerialize;
use near_sdk::collections::LazyOption;
use near_sdk::{env, near, AccountId, BorshStorageKey, Gas, NearToken, Promise, require};

#[derive(BorshStorageKey, BorshSerialize)]
#[borsh(crate = "near_sdk::borsh")]
enum StorageKey {
    Code,
}

#[near(contract_state)]
pub struct WalletFactory {
    owner: AccountId,
    code: LazyOption<Vec<u8>>,
    wallet_count: u64,
}

impl Default for WalletFactory {
    fn default() -> Self {
        Self {
            owner: env::predecessor_account_id(),
            code: LazyOption::new(StorageKey::Code, None),
            wallet_count: 0,
        }
    }
}

#[near]
impl WalletFactory {
    #[init]
    pub fn new() -> Self {
        require!(!env::state_exists(), "Already initialized");
        Self {
            owner: env::predecessor_account_id(),
            code: LazyOption::new(StorageKey::Code, None),
            wallet_count: 0,
        }
    }

    /// Store the multisig WASM binary. Only the factory owner can call this.
    /// The WASM bytes are passed as raw input data (not JSON).
    /// Call with: near call <factory> store_contract --base64File multisig.wasm
    pub fn store_contract(&mut self) {
        require!(
            env::predecessor_account_id() == self.owner,
            "Only the owner can store contract code"
        );
        let input = env::input().expect("No input provided");
        self.code.set(&input);
        env::log_str(&format!("Stored contract code: {} bytes", input.len()));
    }

    /// Create a new multisig wallet as a sub-account of this factory.
    /// Caller must attach enough NEAR for account creation + storage (~2 NEAR).
    /// The wallet will be: `<name>.<factory_account_id>`
    #[payable]
    pub fn create(
        &mut self,
        name: String,
        members: Vec<AccountId>,
        num_confirmations: u32,
    ) -> Promise {
        let code = self.code.get().expect("Contract code not stored yet");
        require!(!name.is_empty(), "Name cannot be empty");
        require!(!members.is_empty(), "Must have at least one member");
        require!(
            num_confirmations > 0 && num_confirmations as usize <= members.len(),
            "num_confirmations must be between 1 and member count"
        );

        let subaccount: AccountId =
            format!("{}.{}", name, env::current_account_id())
                .parse()
                .unwrap_or_else(|_| env::panic_str("Invalid account name"));

        let members_json: Vec<String> =
            members.iter().map(|m| format!("\"{}\"", m)).collect();
        let init_args = format!(
            r#"{{"members":[{}],"num_confirmations":{}}}"#,
            members_json.join(","),
            num_confirmations,
        );

        self.wallet_count += 1;

        env::log_str(&format!(
            "Creating wallet {} (#{}) with {} members, {} confirmations required",
            subaccount,
            self.wallet_count,
            members.len(),
            num_confirmations,
        ));

        Promise::new(subaccount)
            .create_account()
            .transfer(env::attached_deposit())
            .deploy_contract(code)
            .function_call(
                "new".to_string(),
                init_args.into_bytes(),
                NearToken::from_near(0),
                Gas::from_tgas(50),
            )
    }

    // ── View methods ─────────────────────────────────────────────────────────

    pub fn has_code(&self) -> bool {
        self.code.get().is_some()
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner.clone()
    }

    pub fn get_wallet_count(&self) -> u64 {
        self.wallet_count
    }
}
