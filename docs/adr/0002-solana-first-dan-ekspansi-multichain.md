# ADR 0002: Solana-first dan ekspansi multichain bertahap

- Status: Usulan
- Tanggal: 2026-11-28
- Diputuskan oleh: Menunggu keputusan tim
- Berlaku untuk: katalog, kuotasi, dompet, dan eksekusi

## Konteks

Produk mengagregasi token saham resmi lintas penerbit. Katalog sudah menyimpan deployment Solana dan EVM. Aplikasi saat ini menggunakan LI.FI untuk kuotasi Apple Solana baca-saja, sementara ADR 0001 menetapkan Solana untuk MVP dan Jupiter sebagai agregator utama. Bukti rute dari penyedia belum membuktikan kelayakan pengguna atau keberhasilan eksekusi. LI.FI tidak menyediakan rute testnet.

## Opsi

1. Pertahankan Solana untuk MVP dan lanjutkan observasi multichain di luar jalur pembelian.
2. Jadikan Solana jaringan pertama, dengan kemampuan katalog, kuotasi, dan eksekusi yang diaktifkan terpisah per deployment. Tetapkan LI.FI sebagai agregator utama untuk rute yang telah diverifikasi, dengan penilaian independen atas Jupiter untuk Solana.

## Usulan keputusan

Pilih opsi kedua secara bertahap. Jika diterima tim, revisi keputusan 1, 3, dan 5 dari ADR 0001 untuk cakupan jaringan, prioritas agregator, dan batas adapter. Pertahankan batas eksekusi demo devnet, nominal atomik, kelayakan, serta cache. ADR 0001 tetap berstatus Diterima selama keputusan ini masih Usulan. Setelah persetujuan, tim dapat mencatat status penggantian parsial di ADR 0001 dengan tautan ke ADR ini.

## Aturan untuk implementasi

- HARUS mengidentifikasi deployment lewat chain dan alamat kanonis serta menyimpan bukti penerbit.
- HARUS memisahkan listing, indikasi rute, kelayakan pengguna, dan izin eksekusi.
- HARUS meminta persetujuan user atas rincian transaksi yang sudah divalidasi ulang dan memverifikasi settlement secara independen.
- HARUS memisahkan portofolio resmi dan aktivitas demo. Transfer demo yang dikonfirmasi dapat membuktikan integrasi chain pada devnet.
- JANGAN mengaktifkan kuotasi EVM di aplikasi, membuat wallet EVM, atau membuka eksekusi mainnet sebelum tim menyetujui fase terkait dan pengujian spesifik lolos.
- JANGAN menerbitkan token produksi atau menambah kontrak custom tanpa kebutuhan yang terdokumentasi.

## Akibat

Katalog dan analisis dapat mendeskripsikan produk lintas chain sambil mempertahankan pratinjau Apple yang ada. Aktivasi jaringan lebih lanjut memerlukan verifikasi token, pembatasan penerbit, konfigurasi dompet, biaya, konfirmasi, dan prosedur pemulihan per jaringan.

## Belum terverifikasi

- Eligibility investor Indonesia, termasuk pemeriksaan transfer penerbit dan persyaratan kepatuhan.
- Wallet EVM aktif pada aplikasi Privy 1Stocks, biaya gas, penanganan allowance, dan settlement lintas chain.
- Pendanaan IDR, on-ramp, dan pendanaan stablecoin yang dapat dipertanggungjawabkan.

## Sumber

- [Arsitektur dan hasil verifikasi rute](../architecture/tokenized-equities.md)
- [LI.FI — pengujian integrasi](https://docs.li.fi/sdk/testing-integration)
- [CAIP-2 Solana](https://namespaces.chainagnostic.org/solana/caip2)
