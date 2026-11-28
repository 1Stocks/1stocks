import type { Issuer } from "../providers/normalize";

const policyReferences = {
  xstocks: "https://docs.xstocks.fi/docs/product-legal-overview",
  ondo: "https://docs.ondo.finance/ondo-stocks/eligibility",
  bstocks: "https://www.binance.com/en-IN/blog/markets/7938718877635190290",
} satisfies Record<Issuer, string>;

export function issuerJurisdictionPolicy(issuer: Issuer, jurisdiction: string) {
  return {
    issuer, jurisdiction, scope: "third-party acquisition", verifiedAt: "2026-11-28",
    source: policyReferences[issuer],
    status: jurisdiction === "ID" && issuer === "bstocks" ? "RESTRICTED" : "VERIFICATION_REQUIRED",
  } as const;
}
