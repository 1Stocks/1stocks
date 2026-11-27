import type { AppleBuyToken, AppleIssuerToken, TokenSymbol } from "./tokens";

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

export type IssuerComparisonGap = "ELIGIBILITY_UNVERIFIED" | "EXPOSURE_UNVERIFIED" | "COST_INCOMPLETE";

export type IssuerProfile = {
  documentUrl: string;
  instrument: string;
  dividendTreatment: string;
  restriction: string;
};

export type AppleIssuerEvaluation =
  | {
      token: AppleIssuerToken;
      status: "excluded";
      reason: "UNSUPPORTED_SOLANA" | "PRODUCT_RESTRICTED" | "QUOTE_EXPIRED" | QuoteErrorCode;
    }
  | {
      token: AppleBuyToken;
      status: "quotable";
      quoteId: string;
      productEligibility: "verified" | "unverified";
      receiveBufferBps: number;
      gaps: IssuerComparisonGap[];
      costPerShare?: { estimated: string; atMinimumReceived: string };
    };

export type AppleIssuerSelection = {
  candidates: AppleIssuerEvaluation[];
  decision:
    | { status: "recommended"; token: AppleBuyToken; quoteId: string; reason: "LOWEST_VERIFIED_EXECUTION_COST" }
    | { status: "only_quotable"; token: AppleBuyToken; quoteId: string; reason: "ONLY_FRESH_ROUTE" }
    | { status: "unavailable"; reason: "NO_FRESH_ROUTES" | "MISSING_COMPARISON_DATA" | "INCOMPARABLE_PRODUCTS" | "COST_TIE" | "COST_RANGES_OVERLAP" };
};

export type AppleQuotesResponse = {
  source: "LI.FI";
  cluster: "solana-mainnet";
  mode: "quote-only";
  input: QuoteAmount<"IDRX">;
  quotes: AppleQuoteResult[];
  selection: AppleIssuerSelection;
};
