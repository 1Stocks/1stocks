import type { Metadata } from "next";
import { SettingsPanel } from "./_components/settings-panel";

export const metadata: Metadata = { title: "Pengaturan | 1Stocks" };

export default function SettingsPage() {
  return <SettingsPanel />;
}
