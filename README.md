# Iron{Wallet}

**Multisig Smart Wallet Infrastructure on NEAR Protocol**

Iron{Wallet} is a production-grade multi-signature wallet platform built on NEAR Protocol. It enables teams and organizations to manage shared funds with configurable approval thresholds, ensuring no single party can unilaterally move assets. The system consists of a factory contract that deploys isolated multisig wallet instances as NEAR subaccounts, paired with a modern web frontend for wallet management.

---

## Table of Contents

- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Smart Contract API](#smart-contract-api)
- [Frontend Overview](#frontend-overview)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Architecture

The system follows a factory pattern where a single factory contract is deployed once to NEAR. Users interact with the factory through the web frontend to create individual multisig wallets, each deployed as an independent subaccount.

```
                        NEAR Protocol (Testnet / Mainnet)
 +-----------------------------------------------------------------+
 |                                                                   |
 |   ironwallet.testnet  (Factory Contract)                         |
 |   +-----------------------------------------------------------+  |
 |   |  - Stores multisig WASM binary                            |  |
 |   |  - Creates wallets as subaccounts                         |  |
 |   |  - Tracks total wallet count                              |  |
 |   +-----------------------------------------------------------+  |
 |          |                    |                    |               |
 |          v                    v                    v               |
 |   team.ironwallet     ops.ironwallet      dao.ironwallet         |
 |     .testnet            .testnet            .testnet              |
 |   +-----------+       +-----------+       +-----------+          |
 |   | Multisig  |       | Multisig  |       | Multisig  |          |
 |   | Contract  |       | Contract  |       | Contract  |          |
 |   +-----------+       +-----------+       +-----------+          |
 |                                                                   |
 +-----------------------------------------------------------------+

                              ^
                              |  JSON-RPC
                              |
 +-----------------------------------------------------------------+
 |                        Frontend (Next.js)                        |
 |   +-----------------------------------------------------------+  |
 |   |  Wallet Selector  -->  NearProvider  -->  Contract Calls   |  |
 |   |  (MyNearWallet,        (React            (Factory +        |  |
 |   |   HERE Wallet)          Context)           Multisig)       |  |
 |   +-----------------------------------------------------------+  |
 +-----------------------------------------------------------------+
```

### Transaction Flow

1. A member proposes a transaction (transfer, contract call, or governance change).
2. The proposer is automatically recorded as the first confirmer.
3. Other members review the pending request and submit their confirmations.
4. Once the confirmation threshold is met, the transaction executes on-chain automatically.
5. If the threshold is 1, the transaction executes immediately upon proposal.

### Security Model

- Each wallet is an independent NEAR account with its own state and balance.
- Only registered members can propose or confirm transactions.
- Governance changes (adding/removing members, changing threshold) go through the same multisig approval process.
- The factory contract is owned by the deployer; only the owner can update the stored WASM binary.

---

## How It Works

1. **Factory deployment** -- The factory contract is deployed once to a NEAR account (e.g., `ironwallet.testnet`). The multisig WASM binary is stored on-chain within the factory.

2. **Wallet creation** -- A user calls `factory.create(name, members, num_confirmations)` with an attached NEAR deposit for storage. The factory creates a new subaccount (`<name>.ironwallet.testnet`), deploys the multisig contract to it, and initializes it with the specified members and threshold.

3. **Transaction lifecycle** -- Members interact directly with their wallet contract:
   - `add_request` -- Propose a new transaction (auto-confirms for the caller)
   - `confirm` -- Approve a pending request
   - `revoke_confirmation` -- Withdraw a previous approval
   - `delete_request` -- Remove a request (original proposer only)

4. **Auto-execution** -- When a request reaches the required number of confirmations, the contract executes the associated action (NEAR transfer, cross-contract call, or governance update) in the same transaction.

---

## Project Structure

```
near-innov/
├── contracts/
│   ├── factory/                     # Factory contract (Rust, deployed once)
│   │   ├── Cargo.toml
│   │   └── src/lib.rs               # WalletFactory: create, store_contract, has_code
│   └── multisig/                    # Multisig wallet contract (Rust, deployed per wallet)
│       ├── Cargo.toml
│       └── src/lib.rs               # MultisigWallet: add_request, confirm, execute
│
├── frontend/                        # Next.js 16 web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout, metadata, fonts
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── dashboard/page.tsx   # Wallet list dashboard
│   │   │   ├── create/page.tsx      # Create new multisig wallet
│   │   │   └── wallet/[id]/page.tsx # Wallet detail (requests, members, history)
│   │   ├── components/
│   │   │   ├── LandingNavbar.tsx    # Landing page navigation
│   │   │   ├── DashboardLayout.tsx  # Sidebar layout for authenticated pages
│   │   │   ├── DashboardMockup.tsx  # Landing page UI preview
│   │   │   ├── RequestCard.tsx      # Pending transaction card
│   │   │   ├── NewRequestModal.tsx  # Transaction proposal form
│   │   │   └── TransactionHistory.tsx # Executed transaction log
│   │   ├── config/near.ts           # NEAR network configuration
│   │   ├── context/NearContext.tsx   # Wallet connection provider
│   │   ├── lib/
│   │   │   ├── multisig.ts          # Contract interaction helpers
│   │   │   ├── storage.ts           # Local wallet list persistence
│   │   │   └── history.ts           # Transaction history fetching
│   │   └── types/multisig.ts        # TypeScript type definitions
│   └── public/
│       ├── multisig.wasm            # Compiled multisig contract (for reference)
│       ├── logo.png                 # Application logo
│       ├── og-image.png             # Social sharing image
│       └── manifest.json            # PWA manifest
│
├── scripts/
│   ├── deploy-factory.sh            # Automated factory deployment
│   ├── deploy-factory.mjs           # Node.js deployment script
│   ├── deploy-with-key.sh           # Deploy with explicit key file
│   └── quick-deploy.sh              # Minimal deployment script
│
├── build.sh                         # Full build: contracts + frontend
├── DEPLOYMENT.md                    # Detailed deployment guide
└── README.md
```

---

## Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| [Bun](https://bun.sh) | 1.1+ | JavaScript runtime and package manager |
| [Rust](https://rustup.rs) | stable | Smart contract compilation |
| `wasm32-unknown-unknown` target | -- | Rust cross-compilation to WebAssembly |
| [NEAR CLI](https://docs.near.org/tools/near-cli) | latest | Contract deployment and interaction |
| NEAR testnet account | -- | Required for deployment and testing |

### Install prerequisites

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add the WASM compilation target
rustup target add wasm32-unknown-unknown

# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install NEAR CLI
npm install -g near-cli
```

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/near-innov.git
cd near-innov
```

### 2. Build the smart contracts

```bash
rustup target add wasm32-unknown-unknown
./build.sh
```

This compiles both the factory and multisig contracts, copies the multisig WASM to the frontend's public directory, and builds the Next.js application.

### 3. Deploy the factory contract

Create a NEAR testnet account at [testnet.mynearwallet.com](https://testnet.mynearwallet.com), then deploy:

```bash
near login
./scripts/deploy-factory.sh <your-factory-account>.testnet
```

This script handles deployment, initialization, and WASM binary storage in a single command. See [DEPLOYMENT.md](DEPLOYMENT.md) for alternative deployment methods.

### 4. Configure the frontend

Open `frontend/src/config/near.ts` and set your factory account:

```ts
export const FACTORY_CONTRACT_ID = "<your-factory-account>.testnet";
```

### 5. Start the development server

```bash
cd frontend
bun install
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### 6. Create your first wallet

1. Open the application and connect your NEAR testnet wallet.
2. Navigate to **Create Wallet** from the dashboard.
3. Enter a wallet name (this becomes the subaccount name).
4. Add member account IDs -- your connected account is included by default.
5. Set the confirmation threshold (minimum approvals required per transaction).
6. Submit the transaction and approve it in your wallet.

The new multisig wallet will appear on your dashboard once the transaction confirms.

---

## Configuration

All network configuration lives in `frontend/src/config/near.ts`:

| Variable | Default | Description |
|----------|---------|-------------|
| `NETWORK_ID` | `"testnet"` | NEAR network to connect to (`testnet` or `mainnet`) |
| `FACTORY_CONTRACT_ID` | `"ironwallet.testnet"` | Factory contract account ID |

The configuration object provides RPC endpoints, wallet URLs, and block explorer links for both testnet and mainnet.

---

## Smart Contract API

### Factory Contract

Deployed once. Creates and manages multisig wallet instances.

**Change methods:**

| Method | Parameters | Description |
|--------|-----------|-------------|
| `new()` | -- | Initialize the factory. Called once after deployment. |
| `store_contract()` | Raw WASM bytes as input | Store the multisig binary. Owner only. |
| `create(name, members, num_confirmations)` | `name: String`, `members: Vec<AccountId>`, `num_confirmations: u32` | Deploy a new multisig wallet. Requires attached NEAR deposit. |

**View methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `has_code()` | `bool` | Whether the multisig WASM binary has been stored. |
| `get_owner()` | `AccountId` | The factory owner account. |
| `get_wallet_count()` | `u64` | Total number of wallets created. |

---

### Multisig Wallet Contract

Deployed per wallet as a subaccount of the factory.

**Change methods:**

| Method | Parameters | Description |
|--------|-----------|-------------|
| `add_request(request)` | `MultiSigRequestInput` | Propose a new transaction. Auto-confirms for the caller. |
| `confirm(request_id)` | `request_id: u32` | Confirm a pending request. Triggers execution if threshold is met. |
| `revoke_confirmation(request_id)` | `request_id: u32` | Revoke your confirmation on a pending request. |
| `delete_request(request_id)` | `request_id: u32` | Delete a request. Only the original proposer may call this. |

**View methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `get_wallet_info()` | `WalletInfo` | Members list, threshold, and request count. |
| `get_members()` | `Vec<AccountId>` | List of all member account IDs. |
| `get_requests()` | `Vec<MultiSigRequestView>` | All pending requests with their confirmation status. |
| `get_request(request_id)` | `Option<MultiSigRequestView>` | Details of a single request. |
| `get_num_confirmations()` | `u32` | Current confirmation threshold. |
| `get_request_nonce()` | `u32` | Next request ID (total requests created). |

### Supported Action Types

| Action | Fields | Description |
|--------|--------|-------------|
| `Transfer` | `amount: U128` | Send NEAR to a specified receiver. |
| `FunctionCall` | `method_name: String`, `args: Base64VecU8`, `deposit: U128`, `gas: U64` | Call a method on an external contract. |
| `AddMember` | `member: AccountId` | Add a new member to the wallet. |
| `RemoveMember` | `member: AccountId` | Remove an existing member. |
| `ChangeNumConfirmations` | `num_confirmations: u32` | Update the approval threshold. |

---

## Frontend Overview

The frontend is a Next.js 16 application using the App Router. It communicates with NEAR through the Wallet Selector SDK, which supports MyNearWallet and HERE Wallet.

### Key modules

| Module | Path | Responsibility |
|--------|------|----------------|
| `NearProvider` | `context/NearContext.tsx` | Manages wallet connection state, exposes `signIn`, `signOut`, and `accountId` via React context. |
| `multisig.ts` | `lib/multisig.ts` | Wraps all factory and multisig contract calls (create wallet, add request, confirm, etc.). |
| `storage.ts` | `lib/storage.ts` | Persists the user's wallet list in `localStorage` for fast dashboard loading. |
| `history.ts` | `lib/history.ts` | Fetches transaction history from NEAR's indexer API for display in the wallet detail view. |

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` | Landing page with feature overview and call to action. |
| `/dashboard` | `dashboard/page.tsx` | Lists all multisig wallets associated with the connected account. |
| `/create` | `create/page.tsx` | Form to create a new multisig wallet with member and threshold configuration. |
| `/wallet/[id]` | `wallet/[id]/page.tsx` | Wallet detail view: pending requests, transaction history, and member list. |

---

## Deployment

For detailed deployment instructions including multiple approaches (MyNearWallet UI, NEAR CLI, near-cli-rs), see [DEPLOYMENT.md](DEPLOYMENT.md).

**Summary of steps:**

1. Build contracts with `./build.sh`
2. Deploy the factory contract to your NEAR account
3. Initialize the factory with `new()`
4. Store the multisig WASM with `store_contract()`
5. Verify with `has_code()` (should return `true`)
6. Update `FACTORY_CONTRACT_ID` in the frontend config
7. Deploy the frontend to your hosting platform of choice

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Rust, NEAR SDK 5.x |
| Contract Compilation | `wasm32-unknown-unknown` target |
| Frontend Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Blockchain | NEAR Protocol |
| Wallet Integration | NEAR Wallet Selector (MyNearWallet, HERE Wallet) |
| Runtime | Bun |

---

## License

MIT
