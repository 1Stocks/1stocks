import "server-only";
import { type Address, isAddress } from "@solana/kit";
import { readSolanaBalance, SolanaBalanceRateLimit } from "@1stocks/api";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";

function devnetRpcUrl() {
  const configured = process.env.SOLANA_DEVNET_RPC_URL?.trim();
  const url = configured ? URL.parse(configured) : null;
  return url && (url.protocol === "https:" || url.protocol === "http:") ? url.href : null;
}

const cachedBalance = unstable_cache(async (wallet: Address) => {
  const url = devnetRpcUrl();
  if (!url) throw new Error("Missing Solana devnet configuration");
  return (await readSolanaBalance(url, wallet)).toString();
}, ["solana-devnet-public-balance"], { revalidate: 20 });

export async function GET(request: Request): Promise<Response> {
  const wallet = new URL(request.url).searchParams.get("address");
  const headers = { "Cache-Control": "no-store" };

  if (!wallet || !isAddress(wallet)) {
    return Response.json({ code: "INVALID_ADDRESS" }, { status: 400, headers });
  }
  if (!devnetRpcUrl()) {
    return Response.json({ code: "RPC_NOT_CONFIGURED" }, { status: 503, headers });
  }

  try {
    return Response.json({ cluster: "devnet", lamports: await cachedBalance(wallet) }, { headers });
  } catch (error) {
    if (error instanceof SolanaBalanceRateLimit) {
      return Response.json({ code: "RATE_LIMITED" }, {
        status: 429, headers: { ...headers, "Retry-After": "20" },
      });
    }
    return Response.json({ code: "BALANCE_UNAVAILABLE" }, { status: 502, headers });
  }
}
