export const SOLANA_MAINNET = "solana-mainnet";
export const SOLANA_MAINNET_CHAIN_ID = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

const networks = {
  [SOLANA_MAINNET]: { id: SOLANA_MAINNET_CHAIN_ID, label: "Solana", environment: "mainnet" },
  "eip155:1": { id: "eip155:1", label: "Ethereum", environment: "mainnet" },
  "eip155:56": { id: "eip155:56", label: "BNB Smart Chain", environment: "mainnet" },
} as const;

export function catalogNetwork(chain: string) {
  if (Object.hasOwn(networks, chain)) return networks[chain as keyof typeof networks];
  return { id: chain, label: chain, environment: null };
}

export function catalogDeploymentId(chain: string, address: string) {
  const network = catalogNetwork(chain);
  const canonicalAddress = network.id.startsWith("eip155:") ? address.toLowerCase() : address;
  return `${network.id}:${canonicalAddress}`;
}
