"use client";

import Link from "next/link";
import { SignInControl } from "../wallet/account";
import { useWalletSession } from "../wallet/session";

const entryStyle =
  "inline-flex cursor-pointer items-center justify-center rounded-full border-0 bg-landing-accent px-4 text-center font-medium text-landing-action no-underline hover:bg-landing-accent-hover disabled:cursor-wait disabled:opacity-70";

export function LandingEntry({ compact = false }: { compact?: boolean }) {
  const { status } = useWalletSession();
  const className = compact
    ? `${entryStyle} min-h-10 min-w-[110px] text-sm/5 lg:min-h-[38px]`
    : `${entryStyle} min-h-12 w-full text-[15px]/5 sm:w-[220px]`;

  if (status === "signed-in" || status === "unconfigured") {
    return (
      <Link className={className} href="/saham/apple">
        {status === "signed-in" ? "Buka Apple" : compact ? "Coba demo" : "Coba pratinjau"}
      </Link>
    );
  }

  if (compact && status !== "signed-out") {
    return <a className={className} href="#mulai">Masuk</a>;
  }

  return (
    <SignInControl
      className={className}
      label={compact ? "Masuk" : undefined}
      pendingLabel={compact ? "Memuat…" : undefined}
      showError={!compact}
    />
  );
}
