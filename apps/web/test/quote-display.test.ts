import assert from "node:assert/strict";
import test from "node:test";
import { formatAtomic, isCurrentQuote, readRupiah, type QuotedApple } from "../app/saham/apple/quote-display";

test("rupiah input accepts whole numbers and standard Indonesian grouping only", () => {
  assert.equal(readRupiah("100000"), "100000");
  assert.equal(readRupiah("  100.000  "), "100000");
  assert.equal(readRupiah("999.999.999.999"), "999999999999");
  for (const invalid of ["", "0", "-1", "1,25", "1.50", "100.00", "1e5", "1 000", "1.000.000.000.000"]) {
    assert.equal(readRupiah(invalid), null, invalid);
  }
});

test("quote amounts preserve atomic precision across token decimals", () => {
  assert.equal(formatAtomic("10000000", 2), "100.000");
  assert.equal(formatAtomic("1484931", 8), "0,01484931");
  assert.equal(formatAtomic("14202516", 9), "0,014202516");
  assert.equal(formatAtomic("900719925474099301", 2), "9.007.199.254.740.993,01");
  assert.equal(formatAtomic("0", 9), "0");
});

test("quote is no longer current at the expiry boundary", () => {
  const expiresAt = "2026-11-27T12:30:00.000Z";
  const quote: Pick<QuotedApple, "expiresAt"> = { expiresAt };
  const cutoff = Date.parse(expiresAt);
  assert.equal(isCurrentQuote(quote, cutoff - 1), true);
  assert.equal(isCurrentQuote(quote, cutoff), false);
  assert.equal(isCurrentQuote(quote, cutoff + 1), false);
});
