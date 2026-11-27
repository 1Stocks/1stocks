import assert from "node:assert/strict";
import test from "node:test";
import { getTransferCheckedInstruction } from "@solana-program/token";
import {
  appendTransactionMessageInstruction, blockhash, compileTransaction, createTransactionMessage,
  generateKeyPairSigner, getSignatureFromTransaction, getTransactionEncoder,
  setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners,
} from "@solana/kit";
import { signedTransferSignature, transferStatus } from "../app/(dashboard)/demo-devnet/transfer";

test("only on-chain confirmed or finalized statuses count as success", () => {
  assert.equal(transferStatus(null), "pending");
  assert.equal(transferStatus({ err: null, confirmationStatus: "processed" }), "pending");
  assert.equal(transferStatus({ err: null, confirmationStatus: "confirmed" }), "confirmed");
  assert.equal(transferStatus({ err: null, confirmationStatus: "finalized" }), "confirmed");
  assert.equal(transferStatus({ err: { InstructionError: [0, "Custom"] }, confirmationStatus: "confirmed" }), "failed");
});

test("accepts the signed demo transfer only when it matches the message shown for approval", async () => {
  const [payer, source, mint, destination, otherDestination] = await Promise.all(
    Array.from({ length: 5 }, () => generateKeyPairSigner()),
  );
  const base = setTransactionMessageLifetimeUsingBlockhash({
    blockhash: blockhash("11111111111111111111111111111111"),
    lastValidBlockHeight: 1n,
  }, setTransactionMessageFeePayerSigner(payer, createTransactionMessage({ version: 0 })));
  const prepare = (to: typeof destination.address) => appendTransactionMessageInstruction(
    getTransferCheckedInstruction({
      source: source.address, mint: mint.address, destination: to,
      authority: payer.address, amount: 100n, decimals: 2,
    }), base,
  );
  const original = prepare(destination.address);
  const encode = getTransactionEncoder();
  const unsigned = new Uint8Array(encode.encode(compileTransaction(original)));
  const signed = await signTransactionMessageWithSigners(original);
  const changed = await signTransactionMessageWithSigners(prepare(otherDestination.address));

  assert.equal(
    signedTransferSignature(new Uint8Array(encode.encode(signed)), unsigned),
    getSignatureFromTransaction(signed),
  );
  assert.throws(
    () => signedTransferSignature(new Uint8Array(encode.encode(changed)), unsigned),
    /Isi transaksi berubah/,
  );
});
