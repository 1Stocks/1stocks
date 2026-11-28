import assert from "node:assert/strict";
import test from "node:test";
import { apple, tokenRegistry } from "../src";

test("only verified Solana Apple candidates are offered for a buy quote", () => {
  assert.deepEqual(apple.buyTokens, ["AAPLx", "AAPLon"]);
  for (const symbol of apple.buyTokens) {
    const token = tokenRegistry[symbol];
    assert.equal(token.supportsAppleQuotePreview, true);
    assert.equal(token.solanaMainnet.status, "verified");
    assert.match(token.solanaMainnet.mint.sourceUrl, /^https:\/\//);
    assert.deepEqual(token.solanaDevnet, { status: "unverified", mint: null });
  }
  assert.equal(tokenRegistry.AAPLB.supportsAppleQuotePreview, false);
  assert.equal(tokenRegistry.AAPLB.solanaMainnet.mint, null);
});

test("mainnet and devnet USDC use distinct mints", () => {
  assert.notEqual(
    tokenRegistry.USDC.solanaMainnet.mint.address,
    tokenRegistry.USDC.solanaDevnet.mint.address,
  );
  assert.equal(tokenRegistry.USDC.solanaDevnet.mint.decimals, 6);
});
