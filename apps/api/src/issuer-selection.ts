import {
  apple, tokenRegistry, type AppleBuyToken, type AppleIssuerEvaluation,
  type AppleIssuerSelection, type AppleQuoteResult, type IssuerComparisonGap,
} from "@1stocks/shared";

type Quoted = Extract<AppleQuoteResult, { status: "quoted" }>;
type Quotable = Extract<AppleIssuerEvaluation, { status: "quotable" }>;

// Supplied by a trusted server-side source for the current product and user context.
// A successful quote provides neither of these attestations.
export type IssuerEvidence = {
  eligibility?: { status: "verified" | "restricted"; expiresAt: number };
  exposure?: {
    underlying: typeof apple.ticker;
    mint: string;
    equivalenceGroup: string;
    sharesNumerator: string;
    sharesDenominator: string;
    expiresAt: number;
  };
  completeFees?: boolean;
};
export type AppleIssuerEvidence = Partial<Record<AppleBuyToken, IssuerEvidence>>;

type Ratio = { numerator: bigint; denominator: bigint };
type Comparable = { candidate: Quotable; group: string; estimated: Ratio; atMinimum: Ratio };

function eligibleIssuer(token: (typeof apple.issuerTokens)[number]): token is AppleBuyToken {
  return tokenRegistry[token].canBuy && tokenRegistry[token].solanaMainnet.status === "verified";
}

function productEligibility(evidence: IssuerEvidence | undefined, now: number) {
  const eligibility = evidence?.eligibility;
  return eligibility && eligibility.expiresAt > now ? eligibility.status : "unverified";
}

function verifiedExposure(quote: Quoted, evidence: IssuerEvidence | undefined, now: number) {
  const exposure = evidence?.exposure;
  if (!exposure || exposure.expiresAt <= now || exposure.underlying !== apple.ticker ||
      exposure.mint !== quote.output.mint || !exposure.equivalenceGroup.trim() ||
      !/^[1-9]\d{0,29}$/.test(exposure.sharesNumerator) ||
      !/^[1-9]\d{0,29}$/.test(exposure.sharesDenominator)) return null;
  return exposure;
}

function totalIdrxCost(input: string, quote: Quoted, evidence: IssuerEvidence | undefined) {
  if (!evidence?.completeFees) return null;
  const idrx = tokenRegistry.IDRX.solanaMainnet.mint;
  let total = BigInt(input);
  for (const fee of [...quote.feeCosts, ...quote.gasCosts]) {
    const value = BigInt(fee.amount.amountAtomic);
    if (value === 0n || fee.included === true) continue;
    if (fee.included !== false || fee.amount.mint !== idrx.address || fee.amount.decimals !== idrx.decimals) return null;
    total += value;
  }
  return total;
}

function compare(left: Ratio, right: Ratio) {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function formatIdrx(ratio: Ratio) {
  const atomic = (ratio.numerator + ratio.denominator / 2n) / ratio.denominator;
  return `${atomic / 100n}.${(atomic % 100n).toString().padStart(2, "0")}`;
}

export async function selectAppleIssuer(
  amount: string,
  getQuote: (token: AppleBuyToken) => Promise<AppleQuoteResult>,
  now: () => number,
  evidence: AppleIssuerEvidence = {},
): Promise<{ quotes: AppleQuoteResult[]; selection: AppleIssuerSelection }> {
  const beforeFetch = now();
  const eligible = apple.issuerTokens.filter(eligibleIssuer)
    .filter((token) => productEligibility(evidence[token], beforeFetch) !== "restricted");
  const quotes = await Promise.all(eligible.map(getQuote));
  const current = now();
  const candidates: AppleIssuerEvaluation[] = [];
  const comparable: Comparable[] = [];

  for (const token of apple.issuerTokens) {
    if (!eligibleIssuer(token)) {
      candidates.push({ token, status: "excluded", reason: "UNSUPPORTED_SOLANA" });
      continue;
    }
    if (!eligible.includes(token) || productEligibility(evidence[token], current) === "restricted") {
      candidates.push({ token, status: "excluded", reason: "PRODUCT_RESTRICTED" });
      continue;
    }

    const quote = quotes.find((item) => item.token === token);
    if (!quote || quote.status === "unavailable") {
      candidates.push({ token, status: "excluded", reason: quote?.code ?? "UPSTREAM_ERROR" });
      continue;
    }
    if (!(Date.parse(quote.expiresAt) > current)) {
      candidates.push({ token, status: "excluded", reason: "QUOTE_EXPIRED" });
      continue;
    }

    const eligibility = productEligibility(evidence[token], current);
    const exposure = verifiedExposure(quote, evidence[token], current);
    const cost = totalIdrxCost(amount, quote, evidence[token]);
    const output = BigInt(quote.output.amountAtomic);
    const minimum = BigInt(quote.minimumOutputAtomic);
    const gaps: IssuerComparisonGap[] = [];
    if (eligibility !== "verified") gaps.push("ELIGIBILITY_UNVERIFIED");
    if (!exposure) gaps.push("EXPOSURE_UNVERIFIED");
    if (cost === null || minimum === 0n) gaps.push("COST_INCOMPLETE");
    const candidate: Quotable = {
      token, status: "quotable", quoteId: quote.quoteId, gaps,
      productEligibility: eligibility === "verified" ? "verified" : "unverified",
      receiveBufferBps: Number((output - minimum) * 10_000n / output),
    };
    candidates.push(candidate);

    if (exposure && cost !== null && minimum > 0n) {
      const numerator = cost * BigInt(exposure.sharesDenominator) * 10n ** BigInt(quote.output.decimals);
      const sharesPerToken = BigInt(exposure.sharesNumerator);
      const estimated = { numerator, denominator: output * sharesPerToken };
      const atMinimum = { numerator, denominator: minimum * sharesPerToken };
      comparable.push({ candidate, group: exposure.equivalenceGroup, estimated, atMinimum });
    }
  }

  const quotable = candidates.filter((candidate): candidate is Quotable => candidate.status === "quotable");
  const unavailable = (reason: Extract<AppleIssuerSelection["decision"], { status: "unavailable" }>["reason"]) =>
    ({ quotes, selection: { candidates, decision: { status: "unavailable", reason } } }) as const;
  if (quotable.length === 0) return unavailable("NO_FRESH_ROUTES");
  if (quotable.length === 1) {
    const [{ token, quoteId }] = quotable;
    return { quotes, selection: { candidates, decision: { status: "only_quotable", token, quoteId, reason: "ONLY_FRESH_ROUTE" } } };
  }
  if (comparable.length !== quotable.length || quotable.some((candidate) => candidate.gaps.length)) {
    return unavailable("MISSING_COMPARISON_DATA");
  }
  if (!comparable.every((entry) => entry.group === comparable[0].group)) return unavailable("INCOMPARABLE_PRODUCTS");
  for (const { candidate, estimated, atMinimum } of comparable) {
    candidate.costPerShare = { estimated: formatIdrx(estimated), atMinimumReceived: formatIdrx(atMinimum) };
  }
  comparable.sort((a, b) => compare(a.estimated, b.estimated));
  const [best, runnerUp] = comparable;
  if (compare(best.estimated, runnerUp.estimated) === 0) return unavailable("COST_TIE");
  if (compare(best.atMinimum, runnerUp.estimated) >= 0) return unavailable("COST_RANGES_OVERLAP");
  const { token, quoteId } = best.candidate;
  return {
    quotes,
    selection: { candidates, decision: { status: "recommended", token, quoteId, reason: "LOWEST_VERIFIED_EXECUTION_COST" } },
  };
}
