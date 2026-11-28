# Panduan demo Apple, AI, dan devnet

Mulai dari root dengan `npm run dev`. Gunakan [contoh konfigurasi](.env.example) dan [panduan Privy lokal](README.md#privy-dan-google-oauth-lokal). Simpan nilai nyata di env lokal atau pengaturan deployment yang sesuai.

## Pratinjau Apple dan analisis

1. Buka `/saham/apple`. Masukkan nominal IDR, periksa hasil minimum dan kedaluwarsa, lalu selesaikan pratinjau. Kuotasi LI.FI memakai akses mainnet baca-saja. AAPLB tersedia sebagai informasi dengan pembatasan Indonesia. Pembelian produksi nonaktif.
2. Untuk analisis, konfigurasi Google pada Privy dan izinkan origin aplikasi. Setelah masuk, pilih **Minta analisis AI**. Server memverifikasi sesi Privy. Pratinjau kuotasi dapat digunakan sebagai tamu.
3. Isi `OPENAI_API_KEY` di server. `OPENAI_ISSUER_MODEL` bersifat opsional dan default-nya `gpt-4.1-mini`. Gunakan model yang mendukung Structured Outputs. Pembatas lokal berlaku per instance. Kuota lintas instance perlu disiapkan sebelum membuka endpoint berbayar ke publik.

## Transfer SPL devnet

1. Konfigurasikan `SOLANA_DEMO_TOKEN_REGISTRY` dengan mint publik devnet yang telah diverifikasi operator. `SOLANA_DEMO_TOKEN_MINT` menjadi fallback satu mint. Siapkan akun token, token uji, dan SOL devnet untuk biaya sesuai [panduan operator](../../contracts/solana/README.md).
2. Masuk dengan akun demo. Buka `/demo-devnet`, masukkan penerima, dan tinjau persetujuan sebelum menandatangani. Pengujian wallet login dan pemulihan menggunakan akun Google yang diotorisasi.
3. Cocokkan signature, status `confirmed` atau `finalized`, dan perubahan saldo penerima di devnet. Jika hasil belum diketahui, periksa signature yang sama sebelum mengulang. Transfer ini memakai token uji tanpa hak atas saham.

[Cakupan MVP](../../docs/product/MVP-SCOPE.md) dan [strategi pengujian](../../docs/quality/TEST-STRATEGY.md) menjelaskan status dan bukti yang dibutuhkan. [Transfer devnet operator yang tercatat di Draft PR #12](https://github.com/1Stocks/1stocks/blob/6482457ecb0ee19c9a490475e9584bc51b6e61b2/docs/architecture/apple-mvp-verification.md#settlement-demo-solana-devnet) menjadi bukti terpisah dari transaksi melalui UI Privy. [Audit integrasi PR #10](https://github.com/1Stocks/1stocks/pull/10) menyimpan bukti historis katalog dan desain.
