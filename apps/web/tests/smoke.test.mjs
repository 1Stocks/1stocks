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
  assert.match(html, /<title>1Stocks<\/title>/);
  assert.match(html, /<h1>1Stocks<\/h1>/);
  assert.match(html, /<main>/);
  assert.match(html, /transaksi belum tersedia/);
});

test("unknown routes return 404", async () => {
  const response = await fetch(new URL("/not-a-real-page", url), {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 404);
});
