export const SOLANA_MAINNET_LIFI_CHAIN_ID = 1151111081099710;

export type TokenSymbol = "IDRX" | "USDC" | "AAPLx" | "AAPLon" | "AAPLB";
export type AppleBuyToken = "AAPLx" | "AAPLon";
export type OfficialAppleHolding = {
  token: AppleBuyToken;
  account: string;
  amountAtomic: string;
  amountDisplay: string | null;
};

export type AppleIssuerToken = AppleBuyToken | "AAPLB";

type TokenMint = {
  address: string;
  decimals: number;
  sourceUrl: string;
};

type TokenDeployment =
  | { status: "verified"; mint: TokenMint }
  | { status: "unverified" | "not-listed"; mint: null };

type TokenRecord = {
  symbol: TokenSymbol;
  issuer: string;
  supportsAppleQuotePreview: boolean;
  solanaMainnet: TokenDeployment;
  solanaDevnet: TokenDeployment;
};

const unverified = { status: "unverified", mint: null } as const;
const circleMints = "https://developers.circle.com/stablecoins/usdc-contract-addresses";

function verified(address: string, decimals: number, sourceUrl: string) {
  return { status: "verified", mint: { address, decimals, sourceUrl } } as const;
}

export const tokenRegistry = {
  IDRX: {
    symbol: "IDRX",
    issuer: "IDRX",
    supportsAppleQuotePreview: false,
    solanaMainnet: verified(
      "idrxZcP8xiKkYk6XGD4uz1dxEYCWSgKDHqgjsBbwDur", 2,
      "https://docs.idrx.co/introduction/supported-chain-and-contract-address",
    ),
    solanaDevnet: unverified,
  },
  USDC: {
    symbol: "USDC",
    issuer: "Circle",
    supportsAppleQuotePreview: false,
    solanaMainnet: verified("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 6, circleMints),
    solanaDevnet: verified("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", 6, circleMints),
  },
  AAPLx: {
    symbol: "AAPLx",
    issuer: "Backed Assets (JE) Limited",
    supportsAppleQuotePreview: true,
    solanaMainnet: verified(
      "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", 8,
      "https://assets.backed.fi/products/apple-xstock",
    ),
    solanaDevnet: unverified,
  },
  AAPLon: {
    symbol: "AAPLon",
    issuer: "Ondo Global Markets (BVI) Limited",
    supportsAppleQuotePreview: true,
    solanaMainnet: verified(
      "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo", 9,
      "https://github.com/ondoprotocol/gm-solana-simulator#token-list",
    ),
    solanaDevnet: unverified,
  },
  AAPLB: {
    symbol: "AAPLB",
    issuer: "Binance bStocks",
    supportsAppleQuotePreview: false,
    solanaMainnet: { status: "not-listed", mint: null },
    solanaDevnet: unverified,
  },
} as const satisfies Record<TokenSymbol, TokenRecord>;

export const apple = {
  name: "Apple",
  ticker: "AAPL",
  buyTokens: ["AAPLx", "AAPLon"] as const satisfies readonly AppleBuyToken[],
  issuerTokens: ["AAPLx", "AAPLon", "AAPLB"] as const satisfies readonly AppleIssuerToken[],
} as const;
