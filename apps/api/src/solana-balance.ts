import {
  type Address, createSolanaRpc, isSolanaError, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
} from "@solana/kit";

export class SolanaBalanceRateLimit extends Error {}

export async function readSolanaBalance(rpcUrl: string, account: Address): Promise<bigint> {
  const rpc = createSolanaRpc(rpcUrl);
  try {
    const { value } = await rpc.getBalance(account, { commitment: "confirmed" })
      .send({ abortSignal: AbortSignal.timeout(5_000) });
    if (typeof value !== "bigint" || value < 0n) throw new Error("Invalid Solana balance");
    return value;
  } catch (error) {
    if (isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR) &&
        error.context.statusCode === 429) {
      throw new SolanaBalanceRateLimit();
    }
    throw error;
  }
}
