import assert from "node:assert/strict";
import test from "node:test";
import { SOLANA_MAINNET_LIFI_CHAIN_ID as chain, tokenRegistry } from "@1stocks/shared";
import { createAppleQuoteService, isSolanaPublicAddress, readIdrxAmount } from "../src";

const fromAddress = "28FQ5wVeihjGnZw93RctyAtUdtBdd6vGXWUkke49mEAw";
const idrx = tokenRegistry.IDRX.solanaMainnet.mint;
const aaplx = tokenRegistry.AAPLx.solanaMainnet.mint;
const aaplon = tokenRegistry.AAPLon.solanaMainnet.mint;
const amount = "10000000";

function success(input: Parameters<typeof fetch>[0]) {
  const url = new URL(String(input));
  const to = url.searchParams.get("toToken") === aaplx.address ? aaplx : aaplon;
  return Response.json({
    id: `quote-${to.decimals}`,
    tool: "test-router",
    action: {
      fromToken: { ...idrx, chainId: chain },
      toToken: { ...to, chainId: chain },
      fromAmount: url.searchParams.get("fromAmount"),
    },
    estimate: {
      toAmount: to.decimals === 8 ? "2500000" : "25000000",
      toAmountMin: to.decimals === 8 ? "2400000" : "24000000",
      feeCosts: [{ name: "LI.FI fee", amount: "25000", token: { ...idrx, symbol: "IDRX" }, included: true }],
      gasCosts: [{ type: "SEND", amount: "5000", token: { address: fromAddress, symbol: "SOL", decimals: 9 } }],
    },
    transactionRequest: { data: "never-return-this" },
  });
}

test("IDRX user input preserves atomic amounts without floating point", () => {
  assert.equal(readIdrxAmount("100000"), amount);
  assert.equal(readIdrxAmount("0.01"), "1");
  assert.equal(readIdrxAmount("0001.20"), "120");
  for (const input of ["0", "-1", "1,25", "1.001", "1e6", "1000000000000", "", null]) {
    assert.equal(readIdrxAmount(input), null);
  }
  assert.equal(isSolanaPublicAddress(fromAddress), true);
  assert.equal(isSolanaPublicAddress("1".repeat(33)), false);
});

test("quotes both Apple tokens for the same input, with prices and fees but without transaction data", async () => {
  const service = createAppleQuoteService({
    fromAddress,
    apiKey: "test-key",
    now: () => 0,
    fetcher: async (url, init) => {
      assert.equal(new URL(String(url)).origin, "https://li.quest");
      const query = new URL(String(url)).searchParams;
      assert.equal(query.get("fromAddress"), fromAddress);
      assert.equal(query.get("fromChain"), String(chain));
      assert.equal(query.get("toChain"), String(chain));
      assert.equal(query.get("fromToken"), idrx.address);
      assert.equal(query.get("fromAmount"), amount);
      assert.equal(new Headers(init?.headers).get("x-lifi-api-key"), "test-key");
      return success(url);
    },
  });
  const response = await service.getAppleQuotes(amount);
  assert.equal(response.source, "LI.FI");
  assert.equal(response.mode, "quote-only");
  assert.deepEqual(response.selection.decision, { status: "unavailable", reason: "MISSING_COMPARISON_DATA" });
  assert.deepEqual(response.selection.candidates[2], { token: "AAPLB", status: "excluded", reason: "UNSUPPORTED_SOLANA" });
  assert.deepEqual(response.quotes.map((row) => row.token), ["AAPLx", "AAPLon"]);
  for (const row of response.quotes) {
    assert.equal(row.status, "quoted");
    if (row.status !== "quoted") assert.fail("expected quote");
    assert.equal(row.idrxPerToken, "4000000.00");
    assert.equal(row.fetchedAt, "1970-01-01T00:00:00.000Z");
    assert.equal(row.expiresAt, "1970-01-01T00:00:30.000Z");
    assert.equal(row.feeCosts[0].amount.amountAtomic, "25000");
    assert.equal(row.feeCosts[0].included, true);
    assert.equal(row.gasCosts[0].amount.symbol, "SOL");
  }
  assert.doesNotMatch(JSON.stringify(response), /never-return-this|test-key/);
});

test("preserves an available quote when the other token has no route", async () => {
  const service = createAppleQuoteService({
    fromAddress,
    fetcher: async (url) => new URL(String(url)).searchParams.get("toToken") === aaplx.address
      ? success(url)
      : Response.json({ code: 1002, message: "No available quotes for the requested transfer" }, { status: 404 }),
  });
  const { quotes } = await service.getAppleQuotes(amount);
  assert.equal(quotes[0].status, "quoted");
  assert.deepEqual(quotes[1], { status: "unavailable", token: "AAPLon", code: "NO_ROUTE" });
});

test("rejects a quote returned for a different amount", async () => {
  const service = createAppleQuoteService({
    fromAddress,
    fetcher: async (url) => {
      const body = await success(url).json();
      body.action.fromAmount = "15";
      return Response.json(body);
    },
  });
  const { quotes } = await service.getAppleQuotes(amount);
  assert.ok(quotes.every((row) => row.status === "unavailable" && row.code === "UPSTREAM_ERROR"));
});

test("classifies upstream timeouts", async () => {
  const service = createAppleQuoteService({
    fromAddress,
    fetcher: async () => { throw new DOMException("quote timed out", "TimeoutError"); },
  });
  const { quotes } = await service.getAppleQuotes(amount);
  assert.ok(quotes.every((row) => row.status === "unavailable" && row.code === "TIMEOUT"));
});

test("rate-limit response holds new quote requests until cooldown", async () => {
  let calls = 0;
  const service = createAppleQuoteService({
    fromAddress,
    fetcher: async () => {
      calls++;
      return new Response(null, { status: 429, headers: { "retry-after": "10" } });
    },
  });
  const { quotes } = await service.getAppleQuotes(amount);
  assert.ok(quotes.every((row) => row.status === "unavailable" && row.code === "RATE_LIMITED"));
  await service.getAppleQuotes("20000000");
  assert.equal(calls, 2);
});

test("deduplicates concurrent requests, caches both quotes and refreshes expired entries", async () => {
  let calls = 0;
  let time = 0;
  const service = createAppleQuoteService({
    fromAddress,
    now: () => time,
    fetcher: async (url) => { calls++; return success(url); },
  });
  const [first, concurrent] = await Promise.all([service.getAppleQuotes(amount), service.getAppleQuotes(amount)]);
  assert.deepEqual(first, concurrent);
  time = 29_999;
  assert.deepEqual(await service.getAppleQuotes(amount), first);
  assert.equal(calls, 2);
  time = 30_000;
  const refreshed = await service.getAppleQuotes(amount);
  assert.equal(calls, 4);
  assert.notDeepEqual(refreshed, first);
});
