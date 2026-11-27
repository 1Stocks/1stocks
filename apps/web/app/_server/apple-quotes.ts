import "server-only";
import { createAppleQuoteService, isSolanaPublicAddress } from "@1stocks/api";

let service: ReturnType<typeof createAppleQuoteService> | undefined;

export function appleQuoteService() {
  if (service) return service;
  const fromAddress = process.env.LIFI_QUOTE_FROM_ADDRESS?.trim() ?? "";
  if (!isSolanaPublicAddress(fromAddress)) return undefined;
  service = createAppleQuoteService({ fromAddress, apiKey: process.env.LIFI_API_KEY?.trim() });
  return service;
}
