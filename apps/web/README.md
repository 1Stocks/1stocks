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

Lihat [indeks dokumentasi](../../docs/README.md) untuk acuan produk, desain, dan pengujian.
