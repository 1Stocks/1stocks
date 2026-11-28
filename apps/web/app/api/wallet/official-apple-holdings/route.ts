import "server-only";
import { readOfficialAppleHoldings, SolanaBalanceRateLimit } from "@1stocks/api";
import { type Address, isAddress } from "@solana/kit";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };
const cachedHoldings = unstable_cache(
  (wallet: Address) => readOfficialAppleHoldings(wallet),
  ["official-apple-holdings-solana-mainnet"],
  { revalidate: 20 },
);

export async function GET(request: Request) {
  const wallet = new URL(request.url).searchParams.get("address");
  if (!wallet || !isAddress(wallet)) {
    return Response.json({ code: "INVALID_ADDRESS" }, { status: 400, headers });
  }

  try {
    return Response.json({ cluster: "mainnet-beta", holdings: await cachedHoldings(wallet) }, { headers });
  } catch (error) {
    if (error instanceof SolanaBalanceRateLimit) {
      return Response.json({ code: "RATE_LIMITED" }, {
        status: 429, headers: { ...headers, "Retry-After": "20" },
      });
    }
    return Response.json({ code: "HOLDINGS_UNAVAILABLE" }, { status: 502, headers });
  }
}
