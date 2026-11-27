"use client";

import { createContext, useContext } from "react";

export type Wallet =
  | { status: "loading" }
  | { status: "unavailable"; retry: () => void }
  | { status: "ready"; address: string };

export type WalletSession =
  | { status: "unconfigured" | "misconfigured" | "loading" | "unavailable" }
  | { status: "signed-out"; login: () => void; pending: boolean; failed: boolean }
  | {
      status: "signed-in";
      userId: string;
      google?: { name: string | null; email: string };
      wallet: Wallet;
      logout: () => void;
      pending: boolean;
      failed: boolean;
    };

export const WalletSessionContext = createContext<WalletSession>({ status: "unconfigured" });

export function useWalletSession() {
  return useContext(WalletSessionContext);
}
