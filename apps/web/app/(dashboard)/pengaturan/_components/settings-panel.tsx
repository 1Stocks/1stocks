import Link from "next/link";
import { AccountProfile } from "../../_components/account-details";
import { pageTitle, panel, secondaryButton } from "../../_components/styles";

export function SettingsPanel({ security = false }: { security?: boolean }) {
  const title = security ? "Keamanan" : "Profil";

  return (
    <div className="grid gap-[18px]">
      <h1 className={pageTitle}>Profil &amp; pengaturan</h1>
      <div className="grid gap-[18px] md:grid-cols-[minmax(180px,228px)_minmax(0,1fr)]">
        <nav aria-label="Bagian pengaturan" className="flex flex-wrap content-start gap-2 md:flex-col">
          <Link href="/pengaturan" aria-current={!security ? "page" : undefined} className={`${secondaryButton} md:justify-start aria-[current]:border-landing-accent aria-[current]:text-landing-accent`}>Profil</Link>
          <Link href="/pengaturan/keamanan" aria-current={security ? "page" : undefined} className={`${secondaryButton} md:justify-start aria-[current]:border-landing-accent aria-[current]:text-landing-accent`}>Keamanan</Link>
          <Link href="/bantuan" className={`${secondaryButton} md:justify-start`}>Bantuan</Link>
          <Link href="/#disclaimer" className={`${secondaryButton} md:justify-start`}>Disclaimer</Link>
        </nav>
        <section className={`${panel} grid gap-4`} aria-label={title}>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <AccountProfile security={security} />
          {security ? (
            <p className="border-t border-solid border-landing-border pt-3 text-sm text-landing-muted">Pengaturan passkey dan pengelolaan akses perangkat belum tersedia di demo ini.</p>
          ) : (
            <p className="border-t border-solid border-landing-border pt-3 text-sm text-landing-muted">Verifikasi identitas, rekening bank, dan perubahan profil belum tersedia di demo ini.</p>
          )}
        </section>
      </div>
    </div>
  );
}
