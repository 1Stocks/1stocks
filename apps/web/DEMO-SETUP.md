# Setup AI dan demo devnet

Simpan konfigurasi lokal di `apps/web/.env`. Jalankan aplikasi dari root dengan `npm run dev`.

- `OPENAI_API_KEY` mengaktifkan analisis penerbit di server. Gunakan key proyek terpisah dengan batas penggunaan. Jangan menaruh key di variabel `NEXT_PUBLIC_`.
- `OPENAI_ISSUER_MODEL` opsional. Default `gpt-4.1-mini`. Model harus mendukung Structured Outputs.
- `SOLANA_DEMO_TOKEN_MINT` adalah alamat publik mint SPL Token klasik khusus Solana devnet. Transfer demo mengirim 1 unit token dari embedded wallet pengirim ke akun token terkait milik penerima.
- Pertahankan App ID Privy, aktifkan Google pada aplikasi tersebut, dan izinkan origin lokal. Konfigurasi LI.FI tetap dipakai untuk kuotasi baca-saja.

Buat mint devnet terpisah dengan Token Program standar atau gunakan mint demo yang sudah diverifikasi tim. Buat associated token account untuk kedua dompet pada mint tersebut, mint token demo ke akun pengirim lewat otoritas mint di lingkungan tim, lalu isi SOL devnet pengirim dari faucet. Gunakan dompet demo khusus. Aplikasi tidak membutuhkan keypair treasury. RPC demo diarahkan ke endpoint publik devnet dan dapat terkena batas permintaan.

Lakukan login Google lalu buka `/demo-devnet` jika ingin menjalankan transfer. Masukkan alamat penerima demo, centang persetujuan, dan konfirmasi tanda tangan. Bukti konfirmasi tersedia melalui tautan Solana Explorer berklaster devnet. Jika RPC belum dapat memastikan hasil pengiriman, periksa status tanda tangan yang sama sebelum mencoba transfer ulang.

Untuk analisis, buka perbandingan penerbit Apple dan pilih **Minta analisis AI**. Analisis bersifat opsional dan dapat gagal jika kuota model habis atau kuotasi tidak segar. Pembatas lokal berlaku per instance server. Terapkan pembatas terdistribusi di depan endpoint sebelum mengaktifkan fitur AI pada deployment publik.

## Handoff pre-merge katalog dan design system

Audit 28 November 2026 memakai `origin/main` `a605754` dan tip PR #8 `ee66379`. PR #10 menambahkan katalog penerbit, bukti katalog untuk analisis Apple, dan workspace operator `contracts/solana`. Snapshot katalog mencatat waktu verifikasi. Data yang stale tetap bisa dibaca dengan label yang sesuai. Apple tetap satu-satunya instrumen dengan kuotasi LI.FI mainnet baca-saja.

- **Urutan merge.** Review PR #10 secara independen terhadap `main`. PR #8 perlu menyelaraskan `apps/web/app/globals.css` dan `apps/web/app/layout.tsx` dengan `main`. Kedua konflik itu juga muncul pada simulasi terhadap PR #10 karena berasal dari basis `main`. Pertahankan `PrivySessionProvider`, font lokal modal Privy, aturan `[hidden]`, dan token `landing-*` saat menggabungkan global CSS, Tailwind Preflight, tipografi, dan kelas gelap PR #8. Ulangi uji Pasar, detail penerbit, Apple, dan modal setelah resolusi tim.
- **Demo devnet.** Gunakan `SOLANA_DEMO_TOKEN_REGISTRY` untuk pemetaan simbol `DEMO-*` ke mint publik yang telah diverifikasi operator. `SOLANA_DEMO_TOKEN_MINT` tetap menjadi fallback satu mint. Operator menyimpan keypair di luar checkout. Jalankan provisioning dan verifikasi mengikuti [panduan workspace Solana](../../contracts/solana/README.md), lalu siapkan akun token dan saldo pada dompet demo. Pemanggilan RPC publik untuk mengecek jaringan tidak membuktikan transfer. Bukti transfer publik memerlukan signature berstatus `confirmed` atau `finalized` di devnet.
- **AI dan autentikasi.** Gunakan konfigurasi OpenAI terpisah untuk tes live dan terapkan autentikasi atau pembatasan akses serta kuota lintas instance sebelum mengaktifkan endpoint berbayar di publik. Header Fetch Metadata dan penghitung per instance saja tidak cukup. Verifikasi OAuth Google sampai sesi kembali ke aplikasi dan embedded wallet pulih dengan akun demo yang berwenang.
- **Prioritas berikutnya.** Siapkan mint, akun token, dan pendanaan devnet. Rekam signature transfer live dan saldo akhir. Uji analisis OpenAI live dengan bukti sumber. Perluas bStocks setelah alamat resmi bisa dicocokkan, lalu tambah instrumen yang dapat dikuotasi setelah identitas, kelayakan, dan kesetaraan ekonomi terverifikasi.

### Bukti verifikasi

- PR #10 sendiri dan percobaan gabungan PR #8 + #10 lulus lint, typecheck, 35 tes aplikasi, production build, enam smoke test HTTP, dan regresi Playwright desktop/mobile. Regresi mencakup pencarian, paginasi, detail Tesla, status AAPLB, dan pratinjau Apple dengan fixture kuotasi dan AI. Percobaan gabungan memakai resolusi lokal di checkout sementara. Font judul Pasar berubah dari Inter ke Sora, sementara token lime `landing-accent` tetap sama.
- Kuotasi LI.FI mainnet live mengembalikan HTTP 200 dalam mode `quote-only` untuk AAPLx dan AAPLon. Modal Privy mencapai Google melalui OAuth HTTP 200. Login akun penuh dan pemulihan dompet belum diuji dalam audit ini. AI live belum dikonfigurasi dan respons fallback HTTP 503 berhasil diverifikasi.
- Tiga tes workspace Solana lulus, termasuk mint, pembuatan akun token, penolakan signer yang salah, transfer dan konfirmasi pada validator loopback. RPC devnet publik merespons dengan genesis devnet yang benar. Pengiriman devnet publik belum diuji karena mint dan pendanaan demo belum tersedia.
