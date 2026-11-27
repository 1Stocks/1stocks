import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { address, createSolanaRpc, signature } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

test("local validator creates mint and accounts, rejects wrong authority, and confirms transfer", {
  skip: process.env.RUN_LOCAL_SOLANA_TESTS !== "1",
}, async () => {
  const directory = mkdtempSync(join(tmpdir(), "1stocks-local-spl-"));
  const url = "http://127.0.0.1:18899";
  const call = (command: string, args: string[]) => execFileSync(command, args, {
    encoding: "utf8", timeout: 40_000, stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  const key = (role: string) => {
    const path = join(directory, `${role}.json`);
    call("solana-keygen", ["new", "--no-bip39-passphrase", "--silent", "-o", path]);
    return { path, owner: address(call("solana-keygen", ["pubkey", path])) };
  };
  const payer = key("payer");
  const authority = key("authority");
  const recipient = key("recipient");
  const token = key("mint");
  call("solana", ["-u", url, "airdrop", "2", payer.owner]);
  const spl = (...args: string[]) => JSON.parse(call("spl-token", [
    "-u", url, "-p", TOKEN_PROGRAM_ADDRESS, "--fee-payer", payer.path, "--output", "json", ...args,
  ]));
  const created = spl("create-token", "--decimals", "2", "--mint-authority", authority.owner, token.path);
  assert.equal(created.commandOutput.address, token.owner);
  spl("create-account", token.owner, "--owner", authority.owner);
  spl("create-account", token.owner, "--owner", recipient.owner);
  const [source] = await findAssociatedTokenPda({ owner: authority.owner, mint: token.owner, tokenProgram: TOKEN_PROGRAM_ADDRESS });
  const [target] = await findAssociatedTokenPda({ owner: recipient.owner, mint: token.owner, tokenProgram: TOKEN_PROGRAM_ADDRESS });
  assert.throws(() => spl("mint", token.owner, "3", source, "--mint-authority", payer.path));
  const issued = spl("mint", token.owner, "3", source, "--mint-authority", authority.path);
  const sent = spl("transfer", token.owner, "1", target, "--owner", authority.path);
  const rpc = createSolanaRpc(url);
  const statuses = await rpc.getSignatureStatuses([
    signature(created.commandOutput.transactionData.signature),
    signature(issued.signature ?? issued.commandOutput?.transactionData?.signature),
    signature(sent.signature ?? sent.commandOutput?.transactionData?.signature),
  ]).send();
  assert.ok(statuses.value.every(status => status && !status.err && status.confirmationStatus !== "processed"));
  assert.equal((await rpc.getTokenAccountBalance(target).send()).value.amount, "100");
  assert.equal((await rpc.getTokenAccountBalance(source).send()).value.amount, "200");
});
