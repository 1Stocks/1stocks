import type { Metadata } from "next";
import { FundingPage } from "../_components/funding-page";

export const metadata: Metadata = { title: "Withdraw | 1Stocks" };

export default function WithdrawPage() {
  return <FundingPage withdrawal />;
}
