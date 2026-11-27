import assert from "node:assert/strict";
import test from "node:test";
import { canPreviewApple, embeddedSolanaAddress, isPrivyAppIdValid } from "../app/wallet/session-policy";

test("a configured Apple preview requires a signed-in session and supports the unconfigured quote demo", () => {
  assert.equal(canPreviewApple("signed-in"), true);
  assert.equal(canPreviewApple("unconfigured"), true);
  assert.equal(canPreviewApple("loading"), false);
  assert.equal(canPreviewApple("signed-out"), false);
  assert.equal(canPreviewApple("unavailable"), false);
  assert.equal(canPreviewApple("misconfigured"), false);
});

test("malformed Privy App IDs are rejected before mounting the SDK", () => {
  assert.equal(isPrivyAppIdValid("fixture-only-invalid-app"), false);
  assert.equal(isPrivyAppIdValid("x".repeat(25)), true);
});

test("restores the existing primary embedded Solana wallet without choosing an external or Ethereum wallet", () => {
  const primary = "28FQ5wVeihjGnZw93RctyAtUdtBdd6vGXWUkke49mEAw";
  const accounts = [
    { type: "wallet", chainType: "solana", walletClientType: "phantom", address: "external" },
    { type: "wallet", chainType: "ethereum", walletClientType: "privy", address: "ethereum" },
    { type: "wallet", chainType: "solana", walletClientType: "privy", address: "secondary", walletIndex: 2 },
    { type: "wallet", chainType: "solana", walletClientType: "privy-v2", address: primary, walletIndex: 0 },
  ];
  assert.equal(embeddedSolanaAddress(accounts), primary);
  assert.equal(embeddedSolanaAddress(accounts.slice(0, 2)), undefined);
  assert.equal(embeddedSolanaAddress(accounts.slice(2, 3)), "secondary");
});
