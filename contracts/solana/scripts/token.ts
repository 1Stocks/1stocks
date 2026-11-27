import { execFileSync } from "node:child_process";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { address, createSolanaRpc, signature, type Address } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import tokens from "../config/demo-tokens.json";

const endpoint = "https://api.devnet.solana.com";
const rpc = createSolanaRpc(endpoint);
const stateDirectory = new URL("../.state/", import.meta.url);
const operations = ["create", "verify", "account", "mint", "transfer", "balance"];
type Receipt = { mint: Address; provisioningSignature: string };

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function keypair(name: string) {
  const path = resolve(required(process.env[name], name));
  if (path.startsWith(resolve(".") + "/")) throw new Error("Store demo keypairs outside the repository");
  return path;
}

function run(command: string, args: string[]) {
  return execFileSync(command, args, { encoding: "utf8", timeout: 90_000, stdio: ["ignore", "pipe", "pipe"] });
}

function spl(args: string[]) {
  return JSON.parse(run("spl-token", [
    "--url", endpoint, "--program-id", TOKEN_PROGRAM_ADDRESS, "--output", "json",
    "--fee-payer", keypair("DEMO_FEE_PAYER_KEYPAIR"), ...args,
  ]));
}

async function confirm(raw: unknown) {
  if (typeof raw !== "string") throw new Error("CLI did not return a signature");
  const tx = signature(raw);
  const status = (await rpc.getSignatureStatuses([tx], { searchTransactionHistory: true })
    .send({ abortSignal: AbortSignal.timeout(15_000) })).value[0];
  if (status?.err || (status?.confirmationStatus !== "confirmed" && status?.confirmationStatus !== "finalized")) {
    throw new Error(`Confirmation not verified. Inspect https://explorer.solana.com/tx/${tx}?cluster=devnet before retrying.`);
  }
  return tx;
}

export function amountInput(raw: string | undefined, decimals: number) {
  if (!raw || !/^\d{1,18}(?:\.\d{1,9})?$/.test(raw)) throw new Error("Provide a positive decimal amount");
  const [whole, fraction = ""] = raw.split(".");
  if (fraction.length > decimals) throw new Error("Too many decimal places");
  const units = BigInt(whole + fraction.padEnd(decimals, "0"));
  if (units <= 0n || units > 18_446_744_073_709_551_615n) throw new Error("Amount outside the SPL u64 range");
  return raw;
}

async function inspect(mint: Address, decimals: number) {
  const account = (await rpc.getAccountInfo(mint, { encoding: "jsonParsed", commitment: "confirmed" })
    .send({ abortSignal: AbortSignal.timeout(15_000) })).value;
  const data = account?.data;
  if (account?.owner !== TOKEN_PROGRAM_ADDRESS || !data || !("parsed" in data)) throw new Error("Expected a classic SPL mint");
  const parsed = data.parsed as { type: string; info: { decimals: number; mintAuthority?: string; freezeAuthority?: string; supply: string } };
  if (parsed.type !== "mint" || parsed.info.decimals !== decimals || parsed.info.freezeAuthority) {
    throw new Error("Unexpected mint configuration. Freeze authority must be absent.");
  }
  return parsed.info;
}

async function main() {
  const [operation, symbol, wallet, amount] = process.argv.slice(2);
  if (!operations.includes(operation) || !Object.hasOwn(tokens, symbol)) throw new Error("Usage: token.ts create|verify|account|mint|transfer|balance DEMO-SYMBOL [wallet] [amount]");
  const config = tokens[symbol as keyof typeof tokens];
  const file = new URL(`${symbol}.json`, stateDirectory);
  const genesis = await rpc.getGenesisHash().send({ abortSignal: AbortSignal.timeout(12_000) });
  if (genesis !== "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG") throw new Error("Only Solana devnet is permitted");
  let receipt = await readFile(file, "utf8").then(text => JSON.parse(text) as Receipt, error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });

  if (!receipt && operation === "create") {
    const authority = address(required(process.env.DEMO_MINT_AUTHORITY_ADDRESS, "DEMO_MINT_AUTHORITY_ADDRESS"));
    const mintKey = keypair("DEMO_NEW_MINT_KEYPAIR");
    const mint = address(run("solana-keygen", ["pubkey", mintKey]).trim());
    const output = spl(["create-token", "--decimals", String(config.decimals), "--mint-authority", authority, mintKey]);
    receipt = { mint, provisioningSignature: required(output.commandOutput?.transactionData?.signature, "create-token signature") };
    await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
    await writeFile(file, JSON.stringify(receipt), { flag: "wx", mode: 0o600 });
  }
  if (!receipt) throw new Error("Create the demo mint or restore its original provisioning receipt first");
  const mint = address(receipt.mint);
  const creation = await confirm(receipt.provisioningSignature);
  const transaction = await rpc.getTransaction(creation, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 })
    .send({ abortSignal: AbortSignal.timeout(12_000) });
  const initializesMint = transaction?.transaction.message.instructions.some(instruction => {
    if (instruction.programId !== TOKEN_PROGRAM_ADDRESS || !("parsed" in instruction)) return false;
    const parsed = instruction.parsed as { type: string; info: { mint: string } };
    return /^initializeMint2?$/.test(parsed.type) && parsed.info.mint === mint;
  });
  if (!initializesMint) throw new Error("Provisioning signature does not initialize this mint");
  const info = await inspect(mint, config.decimals);
  const metadata = { ...receipt, ...config, ...info, symbol, assetType: "demo", issuer: "1Stocks Demo",
    network: "solana-devnet", program: TOKEN_PROGRAM_ADDRESS, verifiedAt: new Date().toISOString(),
    source: "locally provisioned by 1Stocks",
    explorer: `https://explorer.solana.com/address/${mint}?cluster=devnet`,
  };
  if (operation === "create" || operation === "verify") { console.log(JSON.stringify(metadata, null, 2)); return; }
  const owner = address(required(wallet, "recipient wallet address"));
  const [ata] = await findAssociatedTokenPda({ owner, mint, tokenProgram: TOKEN_PROGRAM_ADDRESS });
  if (operation === "balance") {
    const balance = await rpc.getTokenAccountBalance(ata).send({ abortSignal: AbortSignal.timeout(12_000) });
    console.log(JSON.stringify({ ...metadata, account: ata, balance: balance.value }, null, 2));
    return;
  }
  if (operation === "account") {
    const existing = await rpc.getAccountInfo(ata, { commitment: "confirmed" }).send({ abortSignal: AbortSignal.timeout(12_000) });
    if (existing.value?.owner === TOKEN_PROGRAM_ADDRESS) { console.log(ata); return; }
  }
  let output;
  if (operation === "mint") {
    const signer = keypair("DEMO_MINT_AUTHORITY_KEYPAIR");
    if (run("solana-keygen", ["pubkey", signer]).trim() !== info.mintAuthority) throw new Error("Configured signer does not control this mint");
    output = spl(["mint", mint, amountInput(amount, config.decimals), ata, "--mint-authority", signer]);
  } else if (operation === "transfer") {
    output = spl(["transfer", mint, amountInput(amount, config.decimals), ata, "--owner", keypair("DEMO_SENDER_KEYPAIR")]);
  } else {
    output = spl(["create-account", mint, "--owner", owner]);
  }
  const tx = signature(required(output.signature ?? output.commandOutput?.transactionData?.signature, "operation signature"));
  await appendFile(new URL("transactions.jsonl", stateDirectory), JSON.stringify({ operation, mint, signature: tx }) + "\n", { mode: 0o600 });
  await confirm(tx);
  console.log(JSON.stringify({ signature: tx, explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet`, account: ata }, null, 2));
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message.split("\n")[0] : "Demo token operation failed");
    process.exitCode = 1;
  });
}
