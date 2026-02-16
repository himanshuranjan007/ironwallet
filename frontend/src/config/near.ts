export const NETWORK_ID = "testnet";

// The factory contract that deploys multisig wallets as sub-accounts.
// Deploy your own factory using: ./scripts/deploy-factory.sh <account-id>
export const FACTORY_CONTRACT_ID = "iron-wallet.testnet";

export const NEAR_CONFIG = {
  testnet: {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://testnet.mynearwallet.com",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://testnet.nearblocks.io",
  },
  mainnet: {
    networkId: "mainnet",
    nodeUrl: "https://rpc.mainnet.near.org",
    walletUrl: "https://app.mynearwallet.com",
    helperUrl: "https://helper.mainnet.near.org",
    explorerUrl: "https://nearblocks.io",
  },
} as const;

export const getConfig = () => NEAR_CONFIG[NETWORK_ID];
