import type { Metadata } from "next";
import { FundingPage } from "../_components/funding-page";

export const metadata: Metadata = { title: "Deposit Rupiah | 1Stocks" };

export default function DepositPage() {
  return <FundingPage />;
}
