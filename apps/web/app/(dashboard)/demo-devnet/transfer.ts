import { findAssociatedTokenPda, getTransferCheckedInstruction, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import {
  address, appendTransactionMessageInstruction, compileTransaction, createSolanaRpc,
  createTransactionMessage, getBase58Decoder, getBase64Decoder, getSignatureFromTransaction,
  getTransactionDecoder, getTransactionEncoder, setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash, type Address, type Signature,
} from "@solana/kit";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

export class DemoTransferError extends Error {}

async function tokenAccount(owner: Address, mint: Address) {
  const [account] = await findAssociatedTokenPda({ owner, mint, tokenProgram: TOKEN_PROGRAM_ADDRESS });
  return account;
}

export async function confirmedTokenBalance(owner: Address, mint: Address) {
  const account = await tokenAccount(owner, mint);
  const { value } = await rpc.getTokenAccountBalance(account, { commitment: "confirmed" })
    .send({ abortSignal: AbortSignal.timeout(6_000) });
  return value;
}

export async function prepareTransfer(from: Address, mint: Address, recipient: string) {
  const to = address(recipient);
  if (to === from) throw new DemoTransferError("Gunakan alamat penerima yang berbeda.");
  const [source, destination] = await Promise.all([tokenAccount(from, mint), tokenAccount(to, mint)]);
  const options = { abortSignal: AbortSignal.timeout(10_000) };
  const [sourceBalance, destinationBalance, sol, latest] = await Promise.all([
    rpc.getTokenAccountBalance(source, { commitment: "confirmed" }).send(options).catch(() => null),
    rpc.getTokenAccountBalance(destination, { commitment: "confirmed" }).send(options).catch(() => null),
    rpc.getBalance(from, { commitment: "confirmed" }).send(options),
    rpc.getLatestBlockhash({ commitment: "confirmed" }).send(options),
  ]);
  if (!sourceBalance || !destinationBalance) throw new DemoTransferError("Akun token demo pengirim atau penerima belum tersedia, atau RPC gagal membacanya.");
  const decimals = sourceBalance.value.decimals;
  const amount = 10n ** BigInt(decimals);
  if (BigInt(sourceBalance.value.amount) < amount) throw new DemoTransferError("Saldo token demo kurang dari 1.");
  if (sol.value === 0n) throw new DemoTransferError("Dompet memerlukan SOL devnet untuk biaya jaringan.");
  const message = appendTransactionMessageInstruction(
    getTransferCheckedInstruction({ source, destination, mint, authority: from, amount, decimals }),
    setTransactionMessageLifetimeUsingBlockhash(latest.value,
      setTransactionMessageFeePayer(from, createTransactionMessage({ version: 0 }))),
  );
  return {
    transaction: new Uint8Array(getTransactionEncoder().encode(compileTransaction(message))),
    balance: sourceBalance.value,
  };
}

export function signedTransferSignature(bytes: Uint8Array, original: Uint8Array): Signature {
  const decoder = getTransactionDecoder();
  const signed = decoder.decode(bytes);
  const unsigned = decoder.decode(original);
  const expected = getBase58Decoder().decode(unsigned.messageBytes);
  if (getBase58Decoder().decode(signed.messageBytes) !== expected) throw new DemoTransferError("Isi transaksi berubah setelah ditandatangani.");
  return getSignatureFromTransaction(signed);
}

export async function submitTransfer(bytes: Uint8Array) {
  const encoded = getBase64Decoder().decode(bytes);
  return rpc.sendTransaction(encoded as Parameters<typeof rpc.sendTransaction>[0], {
    encoding: "base64", preflightCommitment: "confirmed",
  }).send({ abortSignal: AbortSignal.timeout(12_000) });
}

export function transferStatus(status: { err: unknown; confirmationStatus?: string | null } | null) {
  if (status?.err) return "failed";
  return status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized"
    ? "confirmed" : "pending";
}

export async function checkTransfer(signature: Signature) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const result = await rpc.getSignatureStatuses([signature], { searchTransactionHistory: true })
      .send({ abortSignal: AbortSignal.timeout(6_000) });
    const status = transferStatus(result.value[0]);
    if (status !== "pending") return status;
    await new Promise(resolve => setTimeout(resolve, 1_500));
  }
  return "pending";
}
