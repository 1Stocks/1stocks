"use client";

import { PrivyProvider, useLogin, useModalStatus, usePrivy, type PrivyClientConfig, type User } from "@privy-io/react-auth";
import { useCreateWallet, useWallets } from "@privy-io/react-auth/solana";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { type WalletSession, WalletSessionContext } from "./session";
import { embeddedSolanaAddress, isPrivyAppIdValid } from "./session-policy";

const config: PrivyClientConfig = {
  loginMethods: ["google"],
  appearance: {
    walletChainType: "solana-only",
    theme: "#0B100A",
    accentColor: "#B3DC62",
    logo: "/brand/logo-dark.svg",
    landingHeader: "Selamat datang di OneStocks",
    loginMessage: "Masuk untuk menjelajahi saham dan melihat estimasi token.",
  },
  embeddedWallets: {
    showWalletUIs: false,
    solana: { createOnLogin: "off" },
  },
  externalWallets: { disableAllExternalWallets: true },
};

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID?.trim() || undefined;

function getOriginStatus() {
  const { protocol, hostname } = window.location;
  return protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1"
    ? "ready" : "misconfigured";
}

const subscribeOrigin = () => () => {};
const getServerOriginStatus = () => "loading" as const;

export function PrivySessionProvider({ children }: { children: ReactNode }) {
  const origin = useSyncExternalStore<"loading" | "ready" | "misconfigured">(
    subscribeOrigin, getOriginStatus, getServerOriginStatus,
  );
  if (!appId) return children;
  const status = isPrivyAppIdValid(appId) ? origin : "misconfigured";
  if (status !== "ready") {
    return <WalletSessionContext.Provider value={{ status }}>{children}</WalletSessionContext.Provider>;
  }

  return (
    <PrivyProvider appId={appId} clientId={clientId} config={config}>
      <SessionBridge>{children}</SessionBridge>
    </PrivyProvider>
  );
}

function useReadinessTimeout(ready: boolean) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setTimedOut(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [ready]);
  return !ready && timedOut;
}

function SessionBridge({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const { isOpen } = useModalStatus();
  const [loginFailed, setLoginFailed] = useState(false);
  const { login: openLogin } = useLogin({
    onComplete: () => {
      if (window.location.pathname === "/") router.replace("/beranda");
    },
    onError: (error) => {
      setLoginFailed(error !== "exited_auth_flow");
    },
  });
  const sessionReady = ready && (!authenticated || user !== null);
  const timedOut = useReadinessTimeout(sessionReady);

  function login() {
    if (isOpen) return;
    setLoginFailed(false);
    try {
      openLogin();
    } catch {
      setLoginFailed(true);
    }
  }

  if (sessionReady && authenticated && user) {
    return (
      <AuthenticatedSession key={user.id} user={user} logout={async () => {
        await logout();
      setLoginFailed(false);
      }}>
        {children}
      </AuthenticatedSession>
    );
  }

  const session: WalletSession = sessionReady
    ? {
        status: "signed-out",
        login,
        pending: isOpen,
        failed: loginFailed,
      }
    : { status: timedOut ? "unavailable" : "loading" };
  return <WalletSessionContext.Provider value={session}>{children}</WalletSessionContext.Provider>;
}

function AuthenticatedSession({ user, logout, children }: {
  user: User;
  logout: () => Promise<void>;
  children: ReactNode;
}) {
  const { getAccessToken } = usePrivy();
  const { ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const [logoutAction, setLogoutAction] = useState<"idle" | "pending" | "failed">("idle");
  const [attempt, setAttempt] = useState(0);
  const [created, setCreated] = useState<{ attempt: number; address?: string }>();
  const started = useRef(-1);
  const linkedAddress = embeddedSolanaAddress(user.linkedAccounts);
  const timedOut = useReadinessTimeout(walletsReady || Boolean(linkedAddress));

  useEffect(() => {
    if (!walletsReady || linkedAddress || started.current === attempt) return;
    started.current = attempt;
    // Leave additional wallets disabled, including if another browser tab provisions one first.
    void createWallet({ createAdditional: false }).then(
      ({ wallet }) => setCreated({ attempt, address: wallet.address }),
      () => setCreated({ attempt }),
    );
  }, [walletsReady, linkedAddress, attempt, createWallet]);

  async function endSession() {
    setLogoutAction("pending");
    try {
      await logout();
      setLogoutAction("idle");
    } catch {
      setLogoutAction("failed");
    }
  }

  const result = created?.attempt === attempt ? created : undefined;
  const address = linkedAddress ?? result?.address;
  function retry() {
    if (walletsReady) setAttempt((number) => number + 1);
    else window.location.reload();
  }
  const session: WalletSession = {
    status: "signed-in",
    userId: user.id,
    getAccessToken,
    google: user.google ? { name: user.google.name, email: user.google.email } : undefined,
    logout: endSession,
    pending: logoutAction === "pending",
    failed: logoutAction === "failed",
    wallet: address ? { status: "ready", address }
      : result || timedOut ? { status: "unavailable", retry }
        : { status: "loading" },
  };
  return <WalletSessionContext.Provider value={session}>{children}</WalletSessionContext.Provider>;
}
