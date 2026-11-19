# 1Stocks web

Bootstrap frontend untuk [GER-14](https://linear.app/geral-workspace/issue/GER-14/bootstrap-frontend-1stocks), sesuai ADR 0001 lokal.

## Prasyarat dan stack

- Node.js `^22.13.0` atau `>=24` dan npm (verifikasi WSL: Node 22.23.5, npm 10.9.9).
- Next.js 16.4.6 App Router, React 19.3.1, TypeScript, ESLint 10.
- Aplikasi npm mandiri di `apps/web`; belum memilih tooling monorepo.
- Tidak membutuhkan `.env`, secret, wallet, RPC, atau layanan eksternal.

Dokumentasi diperiksa lewat Context7 dan dokumentasi yang dibundel dengan Next.js 16.4.6 di `node_modules/next/dist/docs/`: instalasi App Router, ESLint, dan opsi `turbopack.root`. Next.js 16 tidak memiliki `next lint` dan build tidak menjalankan lint; lint harus dijalankan terpisah.

## Jalankan di WSL

Dari root repo:

```bash
cd apps/web
npm ci
npm run dev
```

Buka <http://localhost:3000>. Server terikat ke loopback `127.0.0.1`, bukan jaringan publik. Halaman awal menampilkan **1Stocks**. Hentikan dengan Ctrl+C.

## Verifikasi

Dari `apps/web`:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

Smoke test membutuhkan server yang sedang berjalan. Setelah `npm run dev` di terminal pertama, jalankan dari terminal kedua:

```bash
cd apps/web
npm test
```

Test memeriksa HTTP 200, nama 1Stocks dalam heading, metadata judul, bahasa Indonesia, elemen main, pemberitahuan fitur belum tersedia, dan HTTP 404 untuk route tidak dikenal. Untuk port lain, jalankan dev dengan `npm run dev -- --port 3100` dan test dengan `TEST_BASE_URL=http://127.0.0.1:3100 npm test`.

Untuk memeriksa build produksi, hentikan dev lalu jalankan `npm start` dan `npm test` dari terminal terpisah.

## Batas lingkup

Halaman statis menggunakan Server Component dan font sistem tanpa unduhan font. Tidak ada API route/backend, login, wallet, Supabase, quote, atau swap. Konteks produk mengikuti ADR 0001: Solana mainnet hanya untuk membaca harga/quote melalui backend di tiket berikutnya; eksekusi demo memakai token mock di Solana devnet, bukan transaksi saham sungguhan.

## Ringkasan GER-14

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
