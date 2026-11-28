import type { PurchaseRoute } from "@1stocks/shared";
import { issuerJurisdictionPolicy } from "../../../packages/asset-catalog/registry/issuer-policies";
import type { Issuer } from "../../../packages/asset-catalog/providers/normalize";

type Status = "ELIGIBLE" | "RESTRICTED" | "UNKNOWN" | "VERIFICATION_REQUIRED";
type Check = "issuerPolicy" | "investor" | "distribution" | "execution";

export type EligibilityContext = {
  issuer: Issuer;
  jurisdiction: string;
  deploymentId: string;
  investor?: { id: string; wallet: string };
  routeKey?: string;
};

// Attestations are supplied by a trusted backend, never by login state or the quote provider.
type Attestation = {
  scope: string;
  status: "ELIGIBLE" | "RESTRICTED";
  source: string;
  verifiedAt: number;
  expiresAt: number;
};

export type EligibilityEvidence = Partial<Record<Check, Attestation>>;

export function eligibilityRouteKey(route: PurchaseRoute) {
  return JSON.stringify([route.provider, route.id, route.funding.chainId, route.funding.address,
    route.deployment.chainId, route.deployment.address, route.tool]);
}

export function eligibilityScopes(context: EligibilityContext) {
  const jurisdiction = context.jurisdiction.trim().toUpperCase();
  const validProduct = /^[A-Z]{2}$/.test(jurisdiction) && context.deploymentId.trim();
  const product = [jurisdiction, context.issuer, context.deploymentId];
  const investor = context.investor?.id.trim() && context.investor.wallet.trim() ? context.investor : undefined;
  return {
    issuerPolicy: validProduct ? JSON.stringify(product) : null,
    distribution: validProduct ? JSON.stringify(product) : null,
    investor: validProduct && investor ? JSON.stringify([...product, investor.id, investor.wallet]) : null,
    execution: validProduct && investor && context.routeKey?.trim() ? JSON.stringify([...product, investor.wallet, context.routeKey]) : null,
  };
}

function verifiedStatus(evidence: Attestation | undefined, scope: string | null, now: number): Status {
  if (!evidence) return "UNKNOWN";
  if (!scope || (evidence.status !== "ELIGIBLE" && evidence.status !== "RESTRICTED") || evidence.scope !== scope || URL.parse(evidence.source)?.protocol !== "https:" ||
      !Number.isFinite(evidence.verifiedAt) || !Number.isFinite(evidence.expiresAt) ||
      !(evidence.verifiedAt <= now && evidence.expiresAt > now)) return "VERIFICATION_REQUIRED";
  return evidence.status;
}

export function evaluatePurchaseEligibility(
  context: EligibilityContext,
  now: number,
  evidence: EligibilityEvidence = {},
) {
  const scope = eligibilityScopes(context);
  const policy = issuerJurisdictionPolicy(context.issuer, context.jurisdiction.trim().toUpperCase());
  const indonesiaBstocks = policy.status === "RESTRICTED";
  const checks = {
    issuerPolicy: indonesiaBstocks ? "RESTRICTED" : verifiedStatus(evidence.issuerPolicy, scope.issuerPolicy, now),
    investor: verifiedStatus(evidence.investor, scope.investor, now),
    distribution: verifiedStatus(evidence.distribution, scope.distribution, now),
    execution: verifiedStatus(evidence.execution, scope.execution, now),
  } satisfies Record<Check, Status>;

  const statuses = Object.values(checks);
  const status = statuses.includes("RESTRICTED") ? "RESTRICTED"
    : statuses.every(check => check === "ELIGIBLE") ? "ELIGIBLE"
    : statuses.every(check => check === "UNKNOWN") ? "UNKNOWN" : "VERIFICATION_REQUIRED";

  return {
    checks,
    status,
    reason: indonesiaBstocks ? "ISSUER_RESTRICTS_INDONESIA" : null,
  } as const;
}
