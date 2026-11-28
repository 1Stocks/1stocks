import {
  type Address, address, createSolanaRpc, isAddress, isSolanaError, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
} from "@solana/kit";
import { apple, tokenRegistry, type OfficialAppleHolding } from "@1stocks/shared";
import { SolanaBalanceRateLimit } from "./solana-balance";

const mainnetRpc = "https://api.mainnet-beta.solana.com";
const token2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export async function readOfficialAppleHoldings(owner: Address, rpcUrl = mainnetRpc): Promise<OfficialAppleHolding[]> {
  const rpc = createSolanaRpc(rpcUrl);
  const abortSignal = AbortSignal.timeout(5_000);

  try {
    const byMint = await Promise.all(apple.buyTokens.map(async token => {
      const { address: mint, decimals } = tokenRegistry[token].solanaMainnet.mint;
      const { value } = await rpc.getTokenAccountsByOwner(owner, { mint: address(mint) }, {
        commitment: "confirmed", encoding: "jsonParsed",
      }).send({ abortSignal });

      const holdings: OfficialAppleHolding[] = [];
      const seen = new Set<Address>();
      for (const { pubkey, account } of value) {
        const parsed = account.data.parsed;
        const info = parsed?.info;
        const amount = info?.tokenAmount;
        if (!isAddress(pubkey) || seen.has(pubkey) || account.owner !== token2022 ||
          parsed?.type !== "account" || info?.owner !== owner || info.mint !== mint ||
          !amount || amount.decimals !== decimals || typeof amount.amount !== "string" ||
          !/^\d{1,20}$/.test(amount.amount) || BigInt(amount.amount) > 18_446_744_073_709_551_615n) {
          throw new Error("Invalid official Solana token account");
        }
        seen.add(pubkey);
        if (BigInt(amount.amount) === 0n) continue;

        // Scaled UI Amount can change the displayed balance without changing atomic units.
        const display = amount.uiAmountString;
        holdings.push({
          token, account: pubkey, amountAtomic: amount.amount,
          amountDisplay: typeof display === "string" && /^\d+(?:\.\d+)?$/.test(display) ? display : null,
        });
      }
      return holdings;
    }));
    return byMint.flat();
  } catch (error) {
    if (isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR) && error.context.statusCode === 429) {
      throw new SolanaBalanceRateLimit();
    }
    throw error;
  }
}
