import "server-only";
import { createAppleQuoteService, isSolanaPublicAddress, readIdrxAmount } from "@1stocks/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let service: ReturnType<typeof createAppleQuoteService> | undefined;
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request): Promise<Response> {
  const amount = readIdrxAmount(new URL(request.url).searchParams.get("amountIdrx"));
  if (!amount) {
    return Response.json({ code: "INVALID_AMOUNT" }, { status: 400, headers });
  }

  if (!service) {
    const fromAddress = process.env.LIFI_QUOTE_FROM_ADDRESS?.trim() ?? "";
    if (!isSolanaPublicAddress(fromAddress)) {
      return Response.json({ code: "QUOTE_NOT_CONFIGURED" }, { status: 503, headers });
    }
    service = createAppleQuoteService({ fromAddress, apiKey: process.env.LIFI_API_KEY?.trim() });
  }

  return Response.json(await service.getAppleQuotes(amount), { headers });
}
