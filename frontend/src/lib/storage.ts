import type { StoredWallet } from "@/types";

const STORAGE_KEY = "near-multisig-wallets";

export function getStoredWallets(): StoredWallet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addStoredWallet(wallet: StoredWallet): void {
  const wallets = getStoredWallets();
  const existing = wallets.findIndex(
    (w) => w.accountId === wallet.accountId
  );
  if (existing >= 0) {
    wallets[existing] = wallet;
  } else {
    wallets.push(wallet);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}

export function removeStoredWallet(accountId: string): void {
  const wallets = getStoredWallets().filter(
    (w) => w.accountId !== accountId
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
}
