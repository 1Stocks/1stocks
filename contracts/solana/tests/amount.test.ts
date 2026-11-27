import assert from "node:assert/strict";
import test from "node:test";
import { amountInput } from "../scripts/token";

test("checks demo quantities in atomic units and rejects unsigned integer overflow", () => {
  assert.equal(amountInput("1.25", 2), "1.25");
  for (const amount of ["0", "0.001", "1e2", "-1", "999999999999999999"]) {
    assert.throws(() => amountInput(amount, 2));
  }
});
