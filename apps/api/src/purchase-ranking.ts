import type { PurchaseRoute } from "@1stocks/shared";
import type { evaluatePurchaseEligibility } from "./purchase-eligibility";

type Ratio = { numerator: bigint; denominator: bigint };

export type PurchaseOffer = {
  route: PurchaseRoute;
  eligibility: ReturnType<typeof evaluatePurchaseEligibility>["status"];
  budget: { unit: string; amountAtomic: string };
  economics: {
    totalCostAtomic: string;
    issuerExposure: { instrument: string; equivalenceGroup: string; numerator: string; denominator: string };
    outputAtomic: string;
    minimumAtomic: string;
    outputDecimals: number;
    priceImpactBps: number;
    maxPriceImpactBps: number;
  } | null;
};

function compare(left: Ratio, right: Ratio) {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function positive(value: string) {
  return /^[1-9]\d{0,29}$/.test(value);
}

function costsPerShare(offer: PurchaseOffer) {
  const { economics, budget } = offer;
  if (!economics || !budget.unit || !positive(budget.amountAtomic)) return null;

  const { totalCostAtomic, outputAtomic, minimumAtomic, outputDecimals, issuerExposure,
    priceImpactBps, maxPriceImpactBps } = economics;
  if (![totalCostAtomic, outputAtomic, minimumAtomic, issuerExposure.numerator, issuerExposure.denominator].every(positive) ||
      !issuerExposure.instrument || !issuerExposure.equivalenceGroup.trim() ||
      !Number.isInteger(outputDecimals) || outputDecimals < 0 || outputDecimals > 255 ||
      !Number.isInteger(priceImpactBps) || !Number.isInteger(maxPriceImpactBps) ||
      priceImpactBps < 0 || maxPriceImpactBps > 10_000 || priceImpactBps > maxPriceImpactBps) return null;

  const total = BigInt(totalCostAtomic);
  const output = BigInt(outputAtomic);
  const minimum = BigInt(minimumAtomic);
  if (total > BigInt(budget.amountAtomic) || minimum > output) return null;

  const numerator = total * BigInt(issuerExposure.denominator) * 10n ** BigInt(outputDecimals);
  const sharesPerToken = BigInt(issuerExposure.numerator);
  return {
    offer,
    exposure: issuerExposure,
    estimated: { numerator, denominator: output * sharesPerToken },
    atMinimum: { numerator, denominator: minimum * sharesPerToken },
  };
}

export function formatIdrx(ratio: Ratio) {
  const atomic = (ratio.numerator + ratio.denominator / 2n) / ratio.denominator;
  return (atomic / 100n).toString() + "." + (atomic % 100n).toString().padStart(2, "0");
}

export function rankPurchaseOffers(offers: readonly PurchaseOffer[]) {
  const eligible = offers.filter(offer => offer.eligibility === "ELIGIBLE");
  const costs = eligible.map(costsPerShare);
  if (!eligible.length || costs.some(entry => entry === null)) {
    return { status: "unavailable", reason: "MISSING_COMPARISON_DATA", compared: [] } as const;
  }
  const compared = costs.flatMap(entry => entry ? [entry] : []);
  const first = compared[0];
  if (!compared.every(({ offer, exposure }) =>
    offer.budget.unit === first.offer.budget.unit && offer.budget.amountAtomic === first.offer.budget.amountAtomic &&
    exposure.instrument === first.exposure.instrument && exposure.equivalenceGroup === first.exposure.equivalenceGroup
  )) {
    return { status: "unavailable", reason: "INCOMPARABLE_PRODUCTS", compared: [] } as const;
  }

  compared.sort((left, right) => compare(left.estimated, right.estimated));
  const [best, runnerUp] = compared;
  if (runnerUp && compare(best.estimated, runnerUp.estimated) === 0) {
    return { status: "unavailable", reason: "COST_TIE", compared } as const;
  }
  if (runnerUp && compare(best.atMinimum, runnerUp.estimated) >= 0) {
    return { status: "unavailable", reason: "COST_RANGES_OVERLAP", compared } as const;
  }
  return { status: "recommended", winner: best.offer.route, compared } as const;
}
