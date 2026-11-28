import assert from "node:assert/strict";
import test from "node:test";
import { catalog, catalogDeployments, normalizeCatalog, type CatalogProduct } from "../../asset-catalog/registry/catalog";
import { catalogDeploymentId, SOLANA_MAINNET_CHAIN_ID } from "../../asset-catalog/registry/networks";

const current = Date.parse("2026-11-29T00:00:00Z");
const apple = catalog.find(item => item.id === "us0378331005");
assert.ok(apple);

test("identical EVM addresses on separate networks remain separate deployments", () => {
  const xstocks = apple.products.find(product => product.issuer === "xstocks");
  assert.ok(xstocks);
  const deployments = catalogDeployments(xstocks, current);
  const eth = deployments.find(token => token.network.id === "eip155:1");
  const bnb = deployments.find(token => token.network.id === "eip155:56");
  assert.ok(eth && bnb);
  assert.equal(eth.address, bnb.address);
  assert.notEqual(eth.id, bnb.id);
  assert.equal(eth.id, catalogDeploymentId("eip155:1", eth.address.toUpperCase()));
  assert.equal(eth.decimals, null);

  const conflicting: CatalogProduct = { ...xstocks, issuer: "ondo", deployments: [{ ...eth, address: eth.address.toUpperCase() }] };
  const normalized = normalizeCatalog([xstocks, conflicting]);
  assert.ok(normalized[0].products.every(product => product.deployments.every(token => token.chain !== eth.chain)));
  assert.ok(normalized[0].products.some(product => product.deployments.some(token => token.chain === bnb.chain)));
});

test("only exact, fresh Solana Apple deployments have application quote availability", () => {
  for (const product of apple.products) {
    const deployments = catalogDeployments(product, current);
    assert.equal(deployments.filter(token => token.quoteMode).length, product.issuer === "bstocks" ? 0 : 1);
    for (const token of deployments) {
      if (token.quoteMode) {
        assert.equal(token.network.id, SOLANA_MAINNET_CHAIN_ID);
        assert.equal(token.decimals, product.issuer === "xstocks" ? 8 : 9);
      }
    }
    for (const unavailable of [
      catalogDeployments(product, Date.parse("2027-02-01T00:00:00Z")),
      catalogDeployments({ ...product, halted: true }, current),
    ]) assert.ok(unavailable.every(token => token.quoteMode === null));
  }
});
