import type { AppleShareExposure } from "@1stocks/shared";

const multiplierEndpoint = "https://api.xstocks.fi/api/v2/public/assets/AAPLx/multiplier";
const basisSource = "https://docs.xstocks.fi/developers/multipliers";

type Snapshot = {
  ratio: { numerator: bigint; denominator: bigint };
  observedAt: string;
};

export async function readXstocksExposure(network: "Solana" | "Ethereum", fetcher: typeof fetch, signal: AbortSignal, now: () => number) {
  try {
    const response = await fetcher(multiplierEndpoint + "?network=" + network, { signal, cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.text();
    const metadata = JSON.parse(payload);
    // Keep the issuer's decimal digits instead of using a binary floating-point multiplier.
    const decimal = /"currentMultiplier"\s*:\s*(\d{1,5}(?:\.\d{1,20})?)(?=\s*[,}])/.exec(payload)?.[1];
    if (!decimal || Number(decimal) !== metadata.currentMultiplier ||
        metadata.newMultiplier !== 0 || metadata.activationDateTime !== 0) return null;
    const [whole, fraction = ""] = decimal.split(".");
    const numerator = BigInt(whole + fraction);
    if (numerator <= 0n) return null;
    return { ratio: { numerator, denominator: 10n ** BigInt(fraction.length) }, observedAt: new Date(now()).toISOString() };
  } catch {
    return null;
  }
}

export function normalizeXstocksExposure(
  network: "Solana" | "Ethereum", estimateAtomic: string, minimumAtomic: string, decimals: number,
  snapshot: Snapshot | null,
): AppleShareExposure | null {
  if (!snapshot) return null;
  // ERC-20 transfers on the verified xStocks deployment already use equity-adjusted units.
  const convert = network === "Ethereum" ? (amount: string) => amount
    : (amount: string) => (BigInt(amount) * snapshot.ratio.numerator / snapshot.ratio.denominator).toString();
  return {
    estimateAtomic: convert(estimateAtomic), minimumAtomic: convert(minimumAtomic),
    decimals, source: basisSource, observedAt: snapshot.observedAt,
    basis: network === "Solana" ? "raw-times-issuer-multiplier" : "evm-equity-adjusted",
  };
}
