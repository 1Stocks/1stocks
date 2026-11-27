import type { Metadata } from "next";
import { SettingsPanel } from "../_components/settings-panel";

export const metadata: Metadata = { title: "Keamanan | 1Stocks" };

export default function SecurityPage() {
  return <SettingsPanel security />;
}
