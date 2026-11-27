import assert from "node:assert/strict";
import test from "node:test";
import { transferStatus } from "../app/(dashboard)/demo-devnet/transfer";

test("only on-chain confirmed or finalized statuses count as success", () => {
  assert.equal(transferStatus(null), "pending");
  assert.equal(transferStatus({ err: null, confirmationStatus: "processed" }), "pending");
  assert.equal(transferStatus({ err: null, confirmationStatus: "confirmed" }), "confirmed");
  assert.equal(transferStatus({ err: null, confirmationStatus: "finalized" }), "confirmed");
  assert.equal(transferStatus({ err: { InstructionError: [0, "Custom"] }, confirmationStatus: "confirmed" }), "failed");
});
