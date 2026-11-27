import assert from "node:assert/strict";
import test from "node:test";
import type { AppleQuotesResponse } from "@1stocks/shared";
import { explainIssuers, parseExplanation } from "../src/issuer-analysis";

function sample(expiresAt: string): AppleQuotesResponse {
  return {
    source: "LI.FI", cluster: "solana-mainnet", mode: "quote-only",
    input: { symbol: "IDRX", mint: "unused", amountAtomic: "100000", decimals: 2 },
    quotes: [{
      status: "quoted", token: "AAPLx", quoteId: "test",
      fetchedAt: new Date().toISOString(), expiresAt, router: null,
      output: { symbol: "AAPLx", mint: "unused", amountAtomic: "11", decimals: 8 },
      minimumOutputAtomic: "10", idrxPerToken: "0", feeCosts: [], gasCosts: [],
    }],
    selection: { candidates: [], decision: { status: "unavailable", reason: "MISSING_COMPARISON_DATA" } },
  };
}

test("rejects unknown evidence and empty explanations", () => {
  const allowed = new Set(["profile-AAPLx"]);
  assert.equal(parseExplanation({ points: [{ text: "Test", evidence: ["quote-AAPLon"] }] }, allowed), null);
  assert.equal(parseExplanation({ points: [] }, allowed), null);
});

test("abstains without fresh quotes and never calls the model", async () => {
  const request: typeof fetch = async () => { assert.fail("Model should never be called"); };
  assert.deepEqual(await explainIssuers(sample("2020-01-01"), "test", "test", request), { status: "NO_FRESH_QUOTES" });
});

test("parses structured output and handles provider rate limits and invalid evidence", async () => {
  const data = sample(new Date(Date.now() + 60_000).toISOString());
  const model = (evidence: string): typeof fetch => async () => Response.json({
    status: "completed", output: [{ type: "message", content: [{ type: "output_text",
      text: JSON.stringify({ points: [{ text: "Kelayakan belum diketahui.", evidence: [evidence] }] }),
    }] }],
  });
  assert.equal((await explainIssuers(data, "test", "test", model("eligibility"))).status, "OK");
  assert.equal((await explainIssuers(data, "test", "test", model("quote-AAPLon"))).status, "INVALID_MODEL_OUTPUT");
  assert.equal((await explainIssuers(data, "test", "test", async () => new Response(null, { status: 429 }))).status, "RATE_LIMITED");
});
