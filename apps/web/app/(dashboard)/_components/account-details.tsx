"use client";

import { SignInControl, SignOutControl, WalletDetails } from "../../wallet/account";
import { useWalletSession } from "../../wallet/session";
import { primaryButton, secondaryButton } from "./styles";

export function AccountGreeting() {
  const session = useWalletSession();
  const name = session.status === "signed-in" ? session.google?.name : undefined;
  return <p className="text-xs font-medium tracking-wider text-landing-muted uppercase">{name ? `Halo, ${name}` : "Selamat datang"}</p>;
}

export function AccountProfile({ security = false }: { security?: boolean }) {
  const session = useWalletSession();
  if (session.status !== "signed-in") {
    return (
      <div className="grid justify-items-start gap-3">
        {session.status === "unconfigured" && <p className="text-sm text-landing-muted">Mode tamu. Informasi akun dan dompet tersedia setelah masuk.</p>}
        <SignInControl className={primaryButton} />
      </div>
    );
  }

  return (
    <div className="grid justify-items-start gap-4 text-sm">
      <dl className="grid gap-3">
        {security ? (
          <>
            <div><dt className="text-landing-muted">Metode masuk</dt><dd>{session.google ? "Google" : "Privy"}</dd></div>
            <div><dt className="text-landing-muted">Sesi di browser ini</dt><dd>Aktif</dd></div>
          </>
        ) : (
          <>
            <div><dt className="text-landing-muted">Nama</dt><dd>{session.google?.name || "Belum tersedia"}</dd></div>
            <div><dt className="text-landing-muted">Email Google</dt><dd className="wrap-anywhere">{session.google?.email || "Belum tersedia"}</dd></div>
          </>
        )}
      </dl>
      <WalletDetails wallet={session.wallet} buttonClass={secondaryButton} />
      <SignOutControl className={secondaryButton} />
    </div>
  );
}

export function PortfolioWallet() {
  const session = useWalletSession();
  if (session.status === "signed-in") {
    return <WalletDetails wallet={session.wallet} buttonClass={secondaryButton} showBalance />;
  }
  if (session.status === "unconfigured") return <p className="text-landing-muted">Dompet tersedia setelah masuk dengan akun yang terhubung.</p>;
  return <SignInControl className={secondaryButton} />;
}
