# 1Stocks web

## Jalankan di WSL

Gunakan Node.js 22 atau lebih baru dan jalankan dari root repo.

```bash
npm ci
npm run dev
```

Buka [beranda](http://localhost:3000) atau [halaman Apple](http://localhost:3000/saham/apple) dari browser Windows. Perintah dev mengikat server ke `localhost:3000` dan melaporkan konflik jika port itu terpakai.

## Privy dan Google OAuth lokal

Isi `NEXT_PUBLIC_PRIVY_APP_ID` untuk app development di `apps/web/.env.local` sesuai [template env](.env.example), lalu mulai ulang server. App Client ID bersifat opsional. Jika App ID kosong, halaman Apple menyediakan pratinjau tamu.

- Di **Login methods** pada Privy Dashboard, aktifkan **Google** untuk app development. [Dokumentasi OAuth Privy](https://docs.privy.io/authentication/user-authentication/login-methods/oauth)
- Jika app development memakai **Configuration → App settings → Domains → Allowed origins → Web & mobile web**, masukkan `http://localhost:3000` tanpa path. [Dokumentasi allowed origins](https://docs.privy.io/recipes/dashboard/allowed-domains)
- Privy kembali ke halaman tempat login dimulai, yaitu `http://localhost:3000/` atau `http://localhost:3000/saham/apple`. Gunakan app development dengan **Allowed OAuth redirect URLs** kosong untuk HTTP lokal. Pengaturan daftar redirect terpisah dari allowed origins dan didokumentasikan untuk URL HTTPS. Pertahankan pengaturan redirect HTTPS pada app produksi. [Dokumentasi allowed OAuth redirects](https://docs.privy.io/recipes/react/allowed-oauth-redirects)

`http://127.0.0.1:3000` adalah origin browser yang berbeda. Pengujian standar memakai `http://localhost:3000`, jadi origin IP loopback tidak perlu didaftarkan. Jika alur lain sengaja menjalankan OAuth melalui IP loopback, konfigurasi origin itu secara terpisah jika didukung dashboard.

## Verifikasi

Dari root repo, jalankan unit test, lint, typecheck, dan build.

```bash
npm test
npm run lint
npm run build # Termasuk typecheck.
```

Setelah `npm run dev`, jalankan smoke test HTTP di terminal kedua.

```bash
node --test apps/web/tests/smoke.test.mjs
```

Smoke test memakai `http://localhost:3000` secara default. Gunakan URL itu juga sebagai `baseURL` pada pemeriksaan Playwright lokal. Smoke test guest preview dijalankan dengan App ID Privy kosong.

## Ringkasan historis GER-14

File baru:

- `.gitignore` (root): dependencies, output build, env lokal, keypair Solana.
- `apps/web/package.json` dan `package-lock.json`: dependency serta skrip npm.
- `apps/web/tsconfig.json`, `eslint.config.mjs`, `next.config.ts`: konfigurasi TypeScript, ESLint, dan batas root Turbopack.
- `apps/web/app/layout.tsx`, `app/page.tsx`, `app/globals.css`: layout, metadata, dan halaman bootstrap.
- `apps/web/tests/smoke.test.mjs`: smoke test HTTP menggunakan test runner bawaan Node.
- `apps/web/README.md`: panduan lokal dan ringkasan pengerjaan ini.

Tidak mengubah `AGENTS.md`, `docs/`, `.git/info/exclude`, atau README root yang sudah ada sebelumnya. Konteks lokal tetap diabaikan lewat `.git/info/exclude`.

### Hasil verifikasi lokal

- `npm ci`: berhasil; audit melaporkan 0 vulnerability.
- `npm run lint`: berhasil, 0 warning lint.
- `npm run typecheck`: berhasil.
- `npm run build`: berhasil; `/` di-prerender statis.
- `npm run dev`: berjalan; `http://localhost:3000/` merespons HTTP 200.
- `npm test` terhadap dev: 2/2 test lulus; terhadap `npm start` di port 3100: 2/2 test lulus.
- Pemindaian `.next/static` untuk nama secret, header private key, dan endpoint quote langsung: tidak ada kecocokan (pemeriksaan pola, bukan audit keamanan menyeluruh).
- `agentRules: false` mencegah `next dev` membuat AGENTS.md otomatis; instruksi tim yang sudah ada tetap utuh.
- `git check-ignore -v`: node_modules, .next, .env lokal, id.json, dan treasury-keypair.json terabaikan; `.env.example` tidak diabaikan.
- Ignore lokal `AGENTS.md` dan `docs/adr/` tetap berasal dari `.git/info/exclude`.

Catatan dependency: instalasi ESLint 10 mengeluarkan peer warning dari plugin bawaan `eslint-config-next` yang belum mencantumkan ESLint 10 dalam rentang peer. Dokumentasi Next.js 16.4.6 menyebut kondisi ini secara eksplisit dan mendukung ESLint 10; lint aktual berhasil tanpa workaround atau `--legacy-peer-deps`.

### Commit dasar dan PR pertama

- Branch implementasi: `feat/14-bootstrap-frontend`.
- Saat pengerjaan, checkout belum memiliki commit dan `git ls-remote --heads origin` tidak mengembalikan branch; commit dasar di `main` belum tersedia.
- GER-5 menugaskan Geral membuat commit dasar README di `main`. README root yang sudah ada masih menyebut BNB Chain; perbaikannya tetap lingkup GER-5, bukan diubah diam-diam pada GER-14.
- Commit dan push implementasi dilakukan hanya melalui branch fitur atas permintaan Geral; hash/status aktual dapat diperiksa lewat `git log` dan remote. Tidak ada perubahan/push ke `main`. Pembuatan PR ke `main` menunggu commit dasar GER-5. Karena implementasi dimulai saat repo belum memiliki commit, setelah base tersedia bawa commit implementasi ke branch yang berinduk pada `origin/main` (misalnya cherry-pick), lalu buka PR ke `main` untuk review Rocket dan merge oleh Geral.

Usulan judul PR: `feat(web): bootstrap frontend 1Stocks (#GER-14)`.

Deskripsi PR harus menyertakan tiket GER-14, ADR 0001, daftar perubahan di atas, hasil verifikasi, peer warning ESLint, dan status commit dasar GER-5. Tidak ada keputusan backend/database/wallet/RPC baru dalam perubahan ini.
