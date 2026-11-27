# Setup AI dan demo devnet

Simpan konfigurasi lokal di `apps/web/.env`. Jalankan aplikasi dari root dengan `npm run dev`.

- `OPENAI_API_KEY` mengaktifkan analisis penerbit di server. Gunakan key proyek terpisah dengan batas penggunaan. Jangan menaruh key di variabel `NEXT_PUBLIC_`.
- `OPENAI_ISSUER_MODEL` opsional. Default `gpt-4.1-mini`. Model harus mendukung Structured Outputs.
- `SOLANA_DEMO_TOKEN_MINT` adalah alamat publik mint SPL Token klasik khusus Solana devnet. Transfer demo mengirim 1 unit token dari embedded wallet pengirim ke akun token terkait milik penerima.
- Pertahankan App ID Privy, aktifkan Google pada aplikasi tersebut, dan izinkan origin lokal. Konfigurasi LI.FI tetap dipakai untuk kuotasi baca-saja.

Buat mint devnet terpisah dengan Token Program standar atau gunakan mint demo yang sudah diverifikasi tim. Buat associated token account untuk kedua dompet pada mint tersebut, mint token demo ke akun pengirim lewat otoritas mint di lingkungan tim, lalu isi SOL devnet pengirim dari faucet. Gunakan dompet demo khusus. Aplikasi tidak membutuhkan keypair treasury. RPC demo diarahkan ke endpoint publik devnet dan dapat terkena batas permintaan.

Lakukan login Google lalu buka `/demo-devnet` jika ingin menjalankan transfer. Masukkan alamat penerima demo, centang persetujuan, dan konfirmasi tanda tangan. Bukti konfirmasi tersedia melalui tautan Solana Explorer berklaster devnet. Jika RPC belum dapat memastikan hasil pengiriman, periksa status tanda tangan yang sama sebelum mencoba transfer ulang.

Untuk analisis, buka perbandingan penerbit Apple dan pilih **Minta analisis AI**. Analisis bersifat opsional dan dapat gagal jika kuota model habis atau kuotasi tidak segar. Pembatas lokal berlaku per instance server. Terapkan pembatas terdistribusi di depan endpoint sebelum mengaktifkan fitur AI pada deployment publik.
