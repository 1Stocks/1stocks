import type { AppleBuyToken, TokenSymbol } from "./tokens";

export type QuoteAmount<Symbol extends string = TokenSymbol> = {
  symbol: Symbol;
  mint: string;
  decimals: number;
  amountAtomic: string;
};

export type QuoteFee = {
  name: string;
  amount: QuoteAmount<string>;
  included?: boolean;
};

export type QuoteErrorCode =
  | "NO_ROUTE"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "BUSY";

export type AppleQuoteResult =
  | {
      status: "quoted";
      token: AppleBuyToken;
      quoteId: string;
      fetchedAt: string;
      expiresAt: string;
      router: string | null;
      output: QuoteAmount<AppleBuyToken>;
      minimumOutputAtomic: string;
      idrxPerToken: string;
      feeCosts: QuoteFee[];
      gasCosts: QuoteFee[];
    }
  | { status: "unavailable"; token: AppleBuyToken; code: QuoteErrorCode };

export type AppleQuotesResponse = {
  source: "LI.FI";
  cluster: "solana-mainnet";
  mode: "quote-only";
  input: QuoteAmount<"IDRX">;
  quotes: AppleQuoteResult[];
};
