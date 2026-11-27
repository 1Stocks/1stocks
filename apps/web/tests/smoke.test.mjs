import assert from "node:assert/strict";
import test from "node:test";

// Run against a local dev or production server, never an external service.
const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const url = new URL(baseUrl);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
  throw new Error("TEST_BASE_URL must point to localhost");
}

test("homepage serves 1Stocks with Indonesian document metadata", async () => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="id"/);
  assert.match(html, /<title>1Stocks \| Beli token saham pakai rupiah<\/title>/);
  assert.match(html, /<h1[^>]*>Beli token saham/);
  assert.match(html, /<main\b/);
  assert.match(html, /href="\/saham\/apple"/);
});

test("Apple purchase preview is reachable and accepts rupiah", async () => {
  const response = await fetch(new URL("/saham/apple", url), {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Apple \(AAPL\) \| 1Stocks<\/title>/);
  assert.match(html, /<h1>Apple Inc\.<\/h1>/);
  assert.match(html, /Jumlah \(rupiah\)/);
  assert.match(html, /Lihat estimasi/);
});

test("Apple quote endpoint rejects invalid amounts before contacting the provider", async () => {
  const response = await fetch(new URL("/api/quotes/apple?amountIdrx=0", url), {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { code: "INVALID_AMOUNT" });
});

test("unknown routes return 404", async () => {
  const response = await fetch(new URL("/not-a-real-page", url), {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 404);
});
