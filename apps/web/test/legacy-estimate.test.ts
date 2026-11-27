import assert from "node:assert/strict";
import test from "node:test";
import { estimateSample } from "../app/legacy-estimate";

test("legacy landing calculator preserves rupiah grouping and rounds the example fee and token amount", () => {
  assert.deepEqual(estimateSample(" 250.000 "), {
    amount: 250000n, fee: 1250n, tokens: "0,062187",
  });
  assert.deepEqual(estimateSample("10100"), {
    amount: 10100n, fee: 51n, tokens: "0,002512",
  });
  assert.equal(estimateSample("100.000.000")?.tokens, "24,875");
});

test("legacy landing calculator accepts only whole rupiah in its supported range", () => {
  assert.equal(estimateSample("10.000")?.amount, 10000n);
  assert.equal(estimateSample("00010000")?.amount, 10000n);
  for (const value of ["", "9.999", "100.000.001", "10.0", "10,000", "1e4"]) {
    assert.equal(estimateSample(value), null);
  }
});
