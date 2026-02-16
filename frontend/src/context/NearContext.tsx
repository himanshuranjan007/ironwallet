"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { setupWalletSelector } from "@near-wallet-selector/core";
import type { WalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { NETWORK_ID } from "@/config/near";

import "@near-wallet-selector/modal-ui/styles.css";

interface NearContextValue {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accountId: string | null;
  isSignedIn: boolean;
  loading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const NearContext = createContext<NearContextValue>({
  selector: null,
  modal: null,
  accountId: null,
  isSignedIn: false,
  loading: true,
  signIn: () => {},
  signOut: async () => {},
});

export const useNear = () => useContext(NearContext);

export function NearProvider({ children }: { children: ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const _selector = await setupWalletSelector({
        network: NETWORK_ID,
        modules: [
          setupMyNearWallet(),
          setupHereWallet(),
        ],
      });

      const _modal = setupModal(_selector, { contractId: "" });

      const state = _selector.store.getState();
      if (state.accounts.length > 0) {
        setAccountId(state.accounts[0].accountId);
      }

      _selector.store.observable.subscribe((next) => {
        const accs = next.accounts;
        setAccountId(accs.length > 0 ? accs[0].accountId : null);
      });

      setSelector(_selector);
      setModal(_modal);
      setLoading(false);
    };

    init().catch((err) => {
      console.error("Failed to initialize NEAR:", err);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(() => {
    modal?.show();
  }, [modal]);

  const signOut = useCallback(async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    await wallet.signOut();
    setAccountId(null);
  }, [selector]);

  return (
    <NearContext.Provider
      value={{
        selector,
        modal,
        accountId,
        isSignedIn: !!accountId,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </NearContext.Provider>
  );
}
