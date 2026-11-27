import "server-only";
import { readIdrxAmount } from "@1stocks/api";

import { appleQuoteService } from "../../../_server/apple-quotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  const amount = readIdrxAmount(new URL(request.url).searchParams.get("amountIdrx"));
  if (!amount) {
    return Response.json({ code: "INVALID_AMOUNT" }, { status: 400, headers });
  }

  const service = appleQuoteService();
  if (!service) return Response.json({ code: "QUOTE_NOT_CONFIGURED" }, { status: 503, headers });

  return Response.json(await service.getAppleQuotes(amount), { headers });
}
