import "server-only";
import { explainIssuers, readIdrxAmount } from "@1stocks/api";
import { appleQuoteService } from "../../../_server/apple-quotes";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
let budget = { started: 0, used: 0 };

export async function POST(request: Request) {
  const amount = readIdrxAmount(new URL(request.url).searchParams.get("amountIdrx"));
  if (!amount) return Response.json({ status: "INVALID_AMOUNT" }, { status: 400, headers });
  const key = process.env.OPENAI_API_KEY?.trim();
  const service = appleQuoteService();
  if (!key || !service) return Response.json({ status: "NOT_CONFIGURED" }, { status: 503, headers });
  if (request.headers.get("sec-fetch-site") !== "same-origin") {
    return Response.json({ status: "FORBIDDEN" }, { status: 403, headers });
  }
  const now = Date.now();
  if (now - budget.started >= 60_000) budget = { started: now, used: 0 };
  if (budget.used >= 4) return Response.json({ status: "RATE_LIMITED" }, { status: 429, headers });
  budget.used++;
  const result = await explainIssuers(await service.getAppleQuotes(amount), key, process.env.OPENAI_ISSUER_MODEL?.trim() || "gpt-4.1-mini");
  return Response.json(result, { headers });
}
