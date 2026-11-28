# 1Stocks

1Stocks adalah agregator saham tertokenisasi lintas penerbit dan jaringan untuk investor ritel Indonesia. Aplikasi menyatukan produk dari beberapa penerbit dan jaringan, dengan penjelasan AI opsional berdasarkan kuotasi dan dokumen penerbit.

## Kemampuan saat ini

- Pasar menampilkan katalog aset resmi dari xStocks, Ondo, dan bStocks. Detail menampilkan jaringan, alamat, dan sumber tiap produk.
- Pratinjau Apple membandingkan kuotasi LI.FI untuk AAPLx dan AAPLon di Solana mainnet. Masukkan nominal rupiah, bandingkan hasil, lalu tinjau pratinjau. AAPLB tercatat di BNB Chain dan dibatasi untuk Indonesia oleh penerbit. Pratinjau dasar memakai dua mint Apple di Solana. Lingkungan uji yang disetujui tim dapat menampilkan estimasi tambahan untuk deployment Apple di Ethereum dan BNB Smart Chain.
- Privy menyediakan login Google dan embedded wallet Solana jika dikonfigurasi. Portofolio membaca saldo AAPLx dan AAPLon dari Solana mainnet. Saldo SOL devnet tampil secara terpisah.
- Demo devnet berisi transfer SPL dengan aset uji dan persetujuan pengguna. Pembayaran rupiah, pembelian mainnet, dan eksekusi lintas chain masih dalam tahap rencana.

## Kelayakan sebelum pembelian

Seleksi produksi memerlukan bukti kebijakan penerbit, kelayakan investor, izin distribusi, dan kesiapan wallet serta rute. Pemeringkat membandingkan eksposur saham dan biaya dalam anggaran setara. Kuotasi baca-saja dan analisis AI membantu pengguna memahami opsi yang tersedia. Eksekusi produksi masih nonaktif.

## Pengembangan lokal

Gunakan Node.js 22 atau versi yang kompatibel, lalu jalankan:

```bash
npm ci
npm run dev
```

Buka [localhost:3000](http://localhost:3000) atau langsung [pratinjau Apple](http://localhost:3000/saham/apple). Gunakan [contoh konfigurasi](apps/web/.env.example) dan [panduan AI serta demo devnet](apps/web/DEMO-SETUP.md) untuk layanan opsional. Jalankan `npm run check` untuk lint, tes, typecheck, dan production build.

Perbandingan lintas jaringan tersedia saat `APPLE_MULTICHAIN_QUOTE_PREVIEW` bernilai true pada server lingkungan uji. UI menampilkan patokan USDC dan sumber pendanaan setiap rute. Pratinjau IDRX tetap memakai jumlah rupiah yang dimasukkan. Aktivasi di lingkungan publik menunggu review ADR 0002.

## Arsitektur dan kontribusi

- [Arsitektur, jaringan, dan batas implementasi](docs/architecture/tokenized-equities.md)
- [Usulan ADR 0002 tentang seleksi produk lintas jaringan](docs/adr/0002-seleksi-produk-lintas-jaringan.md)
- [Bukti pembatasan penerbit dan matriks kelayakan](docs/architecture/eligibility-evidence.md)
- [Diagnosis simulasi kuotasi Apple di Solana](docs/architecture/apple-solana-simulation.md)
- [Workspace operator Solana](contracts/solana/README.md)

Gunakan satu branch dan satu pull request per perubahan untuk review tim.
