import assert from "node:assert/strict";
import test from "node:test";
import { searchStocks } from "../app/(dashboard)/pasar/stocks";

test("market search finds Apple by name or ticker regardless of case", () => {
  const apple = [{ name: "Apple", ticker: "AAPL", href: "/saham/apple" }];
  assert.deepEqual(searchStocks(" apple "), apple);
  assert.deepEqual(searchStocks("aapl"), apple);
  assert.deepEqual(searchStocks("Netflix"), []);
});

test("Apple is the only actionable market listing", () => {
  assert.deepEqual(searchStocks("").filter((stock) => "href" in stock).map(({ ticker }) => ticker), ["AAPL"]);
});
