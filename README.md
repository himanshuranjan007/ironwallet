# NearVault — Multisig Smart Wallet on NEAR

A multi-signature smart wallet built on the NEAR blockchain. Users can create shared wallets that require multiple approvals before any transaction is executed.

## Architecture

```
near-innov/
├── contracts/multisig/      # Rust smart contract (NEAR SDK)
│   ├── Cargo.toml
│   └── src/lib.rs
├── frontend/                # Next.js 16 app (TypeScript, Tailwind CSS)
│   ├── src/
│   │   ├── app/             # Pages (landing, dashboard, create, wallet detail)
│   │   ├── components/      # UI components (Navbar, RequestCard, NewRequestModal)
│   │   ├── config/          # NEAR network config
│   │   ├── context/         # NearProvider (wallet-selector integration)
│   │   ├── lib/             # Contract helpers, local storage
│   │   └── types/           # TypeScript types
│   └── public/multisig.wasm # Compiled contract binary
└── README.md
```

## Features

- **Create Multisig Wallets** — Deploy a new multisig contract as a NEAR sub-account with configurable members and confirmation threshold
- **Propose Transactions** — Any member can propose NEAR transfers, contract function calls, or governance changes (add/remove members, change threshold)
- **Confirm / Revoke** — Members review pending requests and approve or revoke their confirmation
- **Auto-Execute** — Once the required number of confirmations is reached, the transaction executes on-chain automatically
- **Dashboard** — View all your wallets, balances, members, and pending requests

## Prerequisites

- [Bun](https://bun.sh) (v1.1+)
- [Rust](https://rustup.rs) with `wasm32-unknown-unknown` target
- A NEAR testnet account (create one at [testnet.mynearwallet.com](https://testnet.mynearwallet.com))

## Quick Start

### 1. Build the Smart Contract

```bash
cd contracts/multisig
rustup target add wasm32-unknown-unknown
cargo build --target wasm32-unknown-unknown --release

# Copy WASM to the frontend
cp target/wasm32-unknown-unknown/release/multisig.wasm ../../frontend/public/
```

### 2. Run the Frontend

```bash
cd frontend
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Usage Flow

1. **Connect** your NEAR testnet wallet (MyNearWallet or HERE Wallet)
2. **Create** a new multisig wallet — choose a name, add member accounts, set the confirmation threshold
3. **Fund** the wallet with an initial NEAR balance (min ~2 NEAR for storage)
4. **Propose** transactions from the wallet dashboard
5. **Confirm** pending transactions — share the wallet URL with other members so they can approve
6. Transactions **auto-execute** once the threshold is met

## Smart Contract API

### Initialization

```
new(members: Vec<AccountId>, num_confirmations: u32)
```

### Change Methods

| Method | Description |
|--------|-------------|
| `add_request(request)` | Propose a new transaction (auto-confirms for caller) |
| `confirm(request_id)` | Confirm a pending request |
| `revoke_confirmation(request_id)` | Revoke your confirmation |
| `delete_request(request_id)` | Delete a request (requester only) |

### View Methods

| Method | Description |
|--------|-------------|
| `get_wallet_info()` | Members, threshold, request count |
| `get_members()` | List of member account IDs |
| `get_requests()` | All pending requests with confirmations |
| `get_request(request_id)` | Single request details |
| `get_num_confirmations()` | Required confirmation threshold |

### Supported Actions

- **Transfer** — Send NEAR to any account
- **FunctionCall** — Call a method on any contract
- **AddMember** — Add a new signer (requires multisig approval)
- **RemoveMember** — Remove a signer (requires multisig approval)
- **ChangeNumConfirmations** — Update the threshold (requires multisig approval)

## Tech Stack

- **Smart Contract**: Rust + NEAR SDK 5.x
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Blockchain**: NEAR Protocol (testnet by default)
- **Wallet**: NEAR Wallet Selector (MyNearWallet, HERE Wallet)
- **Runtime**: Bun

## Network

The app defaults to **NEAR testnet**. To switch to mainnet, update `NETWORK_ID` in `frontend/src/config/near.ts`.

## License

MIT
