import assert from "node:assert/strict";
import test from "node:test";
import { catalog, catalogAvailability, normalizeCatalog, searchCatalog } from "../../../packages/asset-catalog/registry/catalog";
import { readDemoRegistry } from "../../../packages/asset-catalog/registry/demo";
import { discoverXstocks } from "../../../packages/asset-catalog/providers/sources";
import { deployment } from "../../../packages/asset-catalog/providers/normalize";

const now = Date.parse("2026-11-28T00:00:00Z");

test("market search normalizes by ISIN and preserves Apple as the only quote-enabled asset", () => {
  const apple = searchCatalog("aapl").find(asset => asset.id === "us0378331005");
  assert.ok(apple && searchCatalog(" Apple ").includes(apple));
  assert.deepEqual(searchCatalog("not-an-asset-of-1stocks"), []);
  assert.equal(apple.products.filter(product => catalogAvailability(product, now) === "quote-only").length, 2);
  assert.equal(catalog.filter(asset => asset.products.some(product => catalogAvailability(product, now) === "quote-only")).length, 1);
  assert.equal(catalogAvailability(apple.products.find(product => product.issuer === "bstocks")!, now), "unsupported-chain");
});

test("same ticker with different ISIN stays distinct and conflicting mint claims are dropped", () => {
  const product = catalog[0].products[0];
  const other = { ...product, underlying: { ...product.underlying, isin: "US88160R1014" } };
  assert.deepEqual(normalizeCatalog([product, other]), []);
  assert.deepEqual(normalizeCatalog([product, { ...product, issuer: "bstocks" }]), []);
  const distinct = { ...other, deployments: [{ chain: "eip155:56", address: "0x0123456789abcdef0123456789abcdef01234567", standard: "BEP-20" }] };
  assert.equal(normalizeCatalog([product, distinct]).length, 2);
  assert.equal(normalizeCatalog([product, product])[0].products.length, 1);
});

test("stale or restricted catalog entries cannot be offered as live quotes", () => {
  const product = catalog[0].products[0];
  assert.equal(catalogAvailability({ ...product, halted: true }, now), "restricted");
  assert.equal(catalogAvailability({ ...product, verifiedAt: "2020-01-01" }, now), "stale");
  assert.deepEqual(deployment("solana-mainnet", "0x1111111111111111111111111111111111111111", "Token-2022"), []);
});

test("demo admission requires DEMO name and valid public address and never alters the official catalog", () => {
  const mint = "11111111111111111111111111111111";
  const result = readDemoRegistry(JSON.stringify({ AAPLx: mint, "DEMO-AAPL-1STOCKS": mint, "DEMO-NVDA-1STOCKS": "bad" }));
  assert.deepEqual(result.map(item => [item.assetType, item.network, item.symbol]), [["demo", "solana-devnet", "DEMO-AAPL-1STOCKS"]]);
  assert.ok(catalog.every(item => item.products.every(product => product.assetType === "official")));
});

test("provider HTTP failures and repeated pages reject instead of replacing a snapshot", async () => {
  await assert.rejects(discoverXstocks(async () => new Response(null, { status: 429 })), /429/);
  await assert.rejects(discoverXstocks(async () => Response.json({ page: { currentPage: 0, hasNextPage: true }, nodes: [] })), /pagination/);
});
