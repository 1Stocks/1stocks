import type { WalletSession } from "./session";

export function canPreviewApple(status: WalletSession["status"]) {
  return status === "signed-in" || status === "unconfigured";
}

export function isPrivyAppIdValid(appId: string) {
  // The Privy React provider rejects an App ID whose length is not 25.
  return appId.length === 25;
}

type LinkedAccount = {
  type: string;
  chainType?: string;
  walletClientType?: string;
  address?: string;
  walletIndex?: number | null;
};

export function embeddedSolanaAddress(accounts: readonly LinkedAccount[]) {
  const wallets = accounts.filter((account) =>
    account.type === "wallet" && account.chainType === "solana" &&
    (account.walletClientType === "privy" || account.walletClientType === "privy-v2") &&
    Boolean(account.address),
  );
  return (wallets.find((wallet) => wallet.walletIndex === 0) ?? wallets[0])?.address;
}
