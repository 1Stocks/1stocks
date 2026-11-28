# 1Stocks

1Stocks adalah agregator saham tertokenisasi lintas penerbit dan jaringan untuk investor ritel Indonesia. Aplikasi menyatukan produk dari beberapa penerbit dan jaringan, dengan penjelasan AI opsional berdasarkan kuotasi dan dokumen penerbit.

## Kemampuan saat ini

- Pasar menampilkan katalog aset resmi dari xStocks, Ondo, dan bStocks. Detail menampilkan jaringan, alamat, dan sumber tiap produk.
- Pratinjau Apple membandingkan kuotasi LI.FI untuk AAPLx dan AAPLon di Solana mainnet. Masukkan nominal rupiah, bandingkan hasil, lalu tinjau pratinjau. AAPLB tercatat di BNB Chain dan dibatasi untuk Indonesia oleh penerbit. Kuotasi dalam aplikasi saat ini terbatas pada pratinjau dua mint Apple di Solana.
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

## Arsitektur dan kontribusi

- [Arsitektur, jaringan, dan batas implementasi](docs/architecture/tokenized-equities.md)
- [Usulan ADR 0002 tentang seleksi produk lintas jaringan](docs/adr/0002-seleksi-produk-lintas-jaringan.md)
- [Bukti pembatasan penerbit dan matriks kelayakan](docs/architecture/eligibility-evidence.md)
- [Workspace operator Solana](contracts/solana/README.md)

Gunakan satu branch dan satu pull request per perubahan untuk review tim.
