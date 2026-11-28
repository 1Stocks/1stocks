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
  reportedUsd?: string;
};

export type QuoteErrorCode =
  | "NO_ROUTE"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "BUSY";

type RouteAsset = { chainId: string; address: string };

export type PurchaseRoute = {
  id: string;
  issuer: "xstocks" | "ondo" | "bstocks";
  funding: RouteAsset;
  deployment: RouteAsset;
  provider: string;
  tool: string | null;
};

export type AppleQuoteResult =
  | {
      status: "quoted";
      token: AppleBuyToken;
      quoteId: string;
      fetchedAt: string;
      expiresAt: string;
      router: string | null;
      route?: PurchaseRoute;
      output: QuoteAmount<AppleBuyToken>;
      minimumOutputAtomic: string;
      idrxPerToken: string;
      feeCosts: QuoteFee[];
      gasCosts: QuoteFee[];
      costData?: "reported" | "partial";
    }
  | { status: "unavailable"; token: AppleBuyToken; code: QuoteErrorCode };

export type IssuerComparisonGap = "ELIGIBILITY_UNVERIFIED" | "EXPOSURE_UNVERIFIED" | "COST_INCOMPLETE" | "BUDGET_EXCEEDED" | "PRICE_IMPACT_EXCEEDED";

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
      reason: "UNSUPPORTED_SOLANA" | "JURISDICTION_RESTRICTED" | "PRODUCT_RESTRICTED" | "QUOTE_EXPIRED" | QuoteErrorCode;
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
    | { status: "recommended"; token: AppleBuyToken; quoteId: string; route: PurchaseRoute; reason: "LOWEST_VERIFIED_EXECUTION_COST" }
    | { status: "only_quotable"; token: AppleBuyToken; quoteId: string; reason: "ONLY_FRESH_ROUTE" }
    | { status: "unavailable"; reason: "NO_FRESH_ROUTES" | "MISSING_COMPARISON_DATA" | "INCOMPARABLE_PRODUCTS" | "COST_TIE" | "COST_RANGES_OVERLAP" };
};

export type AppleQuoteNetwork = "Solana" | "Ethereum" | "BNB Smart Chain";

export type AppleFundingBasis = "solana-usdc" | "ethereum-prefunded-usdc" | "bnb-prefunded-binance-peg-usdc";

export type AppleFundingBenchmark = {
  idrBudgetAtomic: string;
  conversion: "LI.FI IDRX to USDC on Solana";
  minimumUsdcAtomic: string;
  expectedUsdcAtomic: string;
  minimumRateUsdcPerIdrx: string;
  fetchedAt: string;
  expiresAt: string;
};

export type AppleShareExposure = {
  estimateAtomic: string;
  minimumAtomic: string;
  decimals: number;
  source: string;
  observedAt: string;
  basis: "raw-times-issuer-multiplier" | "evm-equity-adjusted";
};

export type AppleMultichainOffer = { token: AppleBuyToken; network: AppleQuoteNetwork } & (
  | { status: "unavailable"; code: QuoteErrorCode }
  | {
      status: "quoted";
      route: PurchaseRoute;
      funding: QuoteAmount<"USDC">;
      fundingBasis: AppleFundingBasis;
      walletRequirements: {
        balance: "hypothetical";
        sourceWallet: AppleQuoteNetwork;
        destinationWallet: AppleQuoteNetwork;
        sourceGasAsset: "SOL" | "ETH" | "BNB";
        destinationGas: "same-chain" | "unverified";
      };
      shareExposure: AppleShareExposure | null;
      output: QuoteAmount<AppleBuyToken>;
      minimumOutputAtomic: string;
      feeCosts: QuoteFee[];
      gasCosts: QuoteFee[];
      costData: "reported" | "partial";
      fetchedAt: string;
      expiresAt: string;
    }
);

export type AppleMultichainPreview = {
  mode: "indicative";
  productionEligibility: "UNKNOWN";
  benchmark: AppleFundingBenchmark | null;
  financialComparison: "ABSTAIN";
  offers: AppleMultichainOffer[];
};

export type AppleQuotesResponse = {
  source: "LI.FI";
  cluster: "solana-mainnet";
  mode: "quote-only";
  input: QuoteAmount<"IDRX">;
  quotes: AppleQuoteResult[];
  selection: AppleIssuerSelection;
  multichain?: AppleMultichainPreview;
};
