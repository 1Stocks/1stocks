import type { Metadata } from "next";
import { ApplePreview } from "../../../saham/apple/apple-preview";

export const metadata: Metadata = {
  title: "Apple (AAPL) | 1Stocks",
  description: "Lihat estimasi token Apple dari LI.FI di Solana.",
};

export default function ApplePage() {
  return <ApplePreview />;
}
