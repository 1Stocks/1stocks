import { tokenRegistry } from "../../shared/src/tokens";
import { sources, verifiedBstocks } from "../providers/sources";
import type { Issuer, OfficialAsset } from "../providers/normalize";
import { catalogDeploymentId, catalogNetwork, SOLANA_MAINNET } from "./networks";
import xstocks from "./xstocks.json";
import ondo from "./ondo.json";

export const issuers = {
  xstocks: { name: "xStocks", legalEntity: "Backed Assets (JE) Limited", source: sources.xstocks },
  ondo: { name: "Ondo", legalEntity: "Ondo Global Markets (BVI) Limited", source: sources.ondo },
  bstocks: { name: "bStocks", legalEntity: "BTech Holdings Limited", source: sources.bstocks },
} satisfies Record<Issuer, { name: string; legalEntity: string; source: string }>;

export type CatalogProduct = OfficialAsset & { verifiedAt: string };
export type Instrument = CatalogProduct["underlying"] & { id: string; products: CatalogProduct[] };

export function normalizeCatalog(products: readonly CatalogProduct[]) {
  const groups = new Map<string, Instrument>();
  const identities = new Set<string>();
  const owners = new Map<string, Set<string>>();
  for (const product of products) {
    for (const token of product.deployments) {
      const key = catalogDeploymentId(token.chain, token.address);
      const claims = owners.get(key) ?? new Set<string>();
      claims.add(`${product.issuer}:${product.underlying.isin ?? product.symbol}`);
      owners.set(key, claims);
    }
  }
  for (const product of products) {
    const deployments = product.deployments.filter(({ chain, address }) => {
      const identity = catalogDeploymentId(chain, address);
      if ((owners.get(identity)?.size ?? 0) > 1 || identities.has(identity)) return false;
      identities.add(identity);
      return true;
    });
    if (!deployments.length) continue;
    const underlying = product.underlying;
    const id = (underlying.isin ?? `${product.issuer}-${product.symbol}`).toLowerCase();
    const existing = groups.get(id);
    const entry = existing ?? { ...underlying, id, products: [] };
    entry.products.push({ ...product, deployments });
    groups.set(id, entry);
  }
  return [...groups.values()].sort((a, b) => (a.id === "us0378331005" ? -1 : b.id === "us0378331005" ? 1 : a.ticker.localeCompare(b.ticker)));
}

export const catalog = normalizeCatalog([
  ...ondo.assets.map(asset => ({ ...asset, verifiedAt: ondo.verifiedAt }) as CatalogProduct),
  ...xstocks.assets.map(asset => ({ ...asset, verifiedAt: xstocks.verifiedAt }) as CatalogProduct),
  ...verifiedBstocks.map(asset => ({ ...asset, verifiedAt: "2026-11-28" })),
]);

function verifiedAppleMint(product: CatalogProduct) {
  if (product.underlying.isin !== "US0378331005") return null;
  if (product.issuer === "xstocks") return tokenRegistry.AAPLx.solanaMainnet.mint;
  if (product.issuer === "ondo") return tokenRegistry.AAPLon.solanaMainnet.mint;
  return null;
}

export function catalogAvailability(product: CatalogProduct, now = Date.now()) {
  if (product.halted) return "restricted";
  if (!(Date.parse(product.verifiedAt) + 30 * 86_400_000 > now)) return "stale";
  if (!product.deployments.some(deployment => deployment.chain === SOLANA_MAINNET)) return "unsupported-chain";
  const mint = verifiedAppleMint(product);
  if (product.deployments.some(deployment => deployment.chain === SOLANA_MAINNET && deployment.address === mint?.address)) {
    return "quote-only";
  }
  return "catalog-only";
}

export function catalogDeployments(product: CatalogProduct, now = Date.now()) {
  const mint = verifiedAppleMint(product);
  const availability = catalogAvailability(product, now);

  return product.deployments.map(deployment => {
    const network = catalogNetwork(deployment.chain);
    const officialMint = deployment.chain === SOLANA_MAINNET && deployment.address === mint?.address;
    return {
      ...deployment,
      id: catalogDeploymentId(deployment.chain, deployment.address),
      network,
      decimals: officialMint ? mint.decimals : null,
      quoteMode: officialMint && availability === "quote-only" ? "quote-only" : null,
    } as const;
  });
}

export const availabilityLabels = {
  restricted: "Dibatasi penerbit", stale: "Perlu verifikasi ulang",
  "unsupported-chain": "Di luar jaringan MVP", "quote-only": "Pratinjau kuotasi",
  "catalog-only": "Kuotasi belum tersedia",
};

export function searchCatalog(query: string) {
  const text = query.trim().toLowerCase();
  return catalog.filter(({ name, ticker }) => `${name} ${ticker}`.toLowerCase().includes(text));
}
