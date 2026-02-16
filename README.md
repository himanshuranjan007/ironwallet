# Iron Wallet — Multisig Smart Wallet on NEAR

A multi-signature smart wallet built on the NEAR blockchain. Users can create shared wallets that require multiple approvals before any transaction is executed.

## Architecture

```
near-innov/
├── contracts/
│   ├── multisig/              # Multisig wallet contract (deployed per wallet)
│   │   └── src/lib.rs
│   └── factory/               # Factory contract (deployed once, creates wallets)
│       └── src/lib.rs
├── frontend/                  # Next.js 16 app
│   ├── src/
│   │   ├── app/               # Pages: landing, dashboard, create, wallet detail
│   │   ├── components/        # Navbar, RequestCard, NewRequestModal
│   │   ├── config/            # NEAR network + factory config
│   │   ├── context/           # NearProvider (wallet-selector integration)
│   │   ├── lib/               # Contract helpers, local storage
│   │   └── types/             # TypeScript types
│   └── public/multisig.wasm   # Compiled multisig contract
├── scripts/
│   └── deploy-factory.sh      # One-command factory deployment
└── README.md
```

## How It Works

1. A **factory contract** is deployed once to NEAR (e.g. `iron-wallet.testnet`)
2. The factory stores the multisig WASM binary on-chain
3. Users call `factory.create(name, members, threshold)` to deploy a new wallet
4. Each wallet lives at `<name>.<factory-account>` (e.g. `team-vault.iron-wallet.testnet`)
5. Members propose, confirm, and auto-execute transactions through the multisig contract

## Features

- **Create Multisig Wallets** — Deploy via factory with configurable members and confirmation threshold
- **Smart Member Selection** — Connected wallet auto-added, on-chain validation of member addresses
- **Propose Transactions** — NEAR transfers, contract calls, or governance changes
- **Confirm / Revoke** — Members review and approve pending requests
- **Auto-Execute** — Transactions run automatically once the threshold is met
- **Dashboard** — View all wallets, balances, members, and pending requests

## Prerequisites

- [Bun](https://bun.sh) (v1.1+)
- [Rust](https://rustup.rs) with `wasm32-unknown-unknown` target
- [NEAR CLI](https://docs.near.org/tools/near-cli) (`npm i -g near-cli`)
- A NEAR testnet account ([testnet.mynearwallet.com](https://testnet.mynearwallet.com))

## Quick Start

### 1. Build Everything

```bash
rustup target add wasm32-unknown-unknown
./build.sh
```

### 2. Deploy the Factory

Create a testnet account for the factory (e.g. `iron-wallet.testnet`), then:

```bash
near login
./scripts/deploy-factory.sh iron-wallet.testnet
```

### 3. Configure the Frontend

Update `FACTORY_CONTRACT_ID` in `frontend/src/config/near.ts`:

```ts
export const FACTORY_CONTRACT_ID = "iron-wallet.testnet"; // your factory account
```

### 4. Run the Frontend

```bash
cd frontend
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Usage Flow

1. **Connect** your NEAR testnet wallet
2. **Create** a new multisig wallet — your connected wallet is auto-added as a signer
3. **Add members** by entering their NEAR account IDs (validated on-chain)
4. **Set threshold** — how many approvals needed per transaction
5. **Propose** transactions from the wallet dashboard
6. **Share** the wallet URL with other members so they can approve
7. Transactions **auto-execute** when the threshold is met

## Smart Contract API

### Factory Contract

| Method | Description |
|--------|-------------|
| `create(name, members, num_confirmations)` | Create a new multisig wallet (attach NEAR for storage) |
| `has_code()` | Check if multisig WASM is stored |
| `get_wallet_count()` | Total wallets created |

### Multisig Wallet Contract

**Change Methods:**

| Method | Description |
|--------|-------------|
| `add_request(request)` | Propose a new transaction (auto-confirms for caller) |
| `confirm(request_id)` | Confirm a pending request |
| `revoke_confirmation(request_id)` | Revoke your confirmation |
| `delete_request(request_id)` | Delete a request (requester only) |

**View Methods:**

| Method | Description |
|--------|-------------|
| `get_wallet_info()` | Members, threshold, request count |
| `get_members()` | List of member account IDs |
| `get_requests()` | All pending requests with confirmations |
| `get_request(request_id)` | Single request details |

### Supported Actions

- **Transfer** — Send NEAR to any account
- **FunctionCall** — Call a method on any contract
- **AddMember / RemoveMember** — Manage signers (requires multisig approval)
- **ChangeNumConfirmations** — Update the threshold (requires multisig approval)

## Tech Stack

- **Smart Contracts**: Rust + NEAR SDK 5.x
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS
- **Blockchain**: NEAR Protocol (testnet by default)
- **Wallet**: NEAR Wallet Selector (MyNearWallet, HERE Wallet)
- **Runtime**: Bun

## Network

Defaults to **NEAR testnet**. To switch to mainnet, update `NETWORK_ID` in `frontend/src/config/near.ts`.

## License

MIT
