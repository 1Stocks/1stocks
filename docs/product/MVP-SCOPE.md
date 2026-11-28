# Cakupan MVP 1Stocks

Draf untuk tinjauan tim · Demo Day 12 Desember 2026 · Baseline `acdcd90`.

## Demo Day

| Prioritas | ID | Hasil yang ditunjukkan | Keadaan dan batas bukti |
| --- | --- | --- | --- |
| Wajib | FR-001, BC-001 | Cari Apple, lihat AAPLx dan AAPLon, dan buka detail penerbit serta jaringan. | Tersedia di baseline. Ulangi cek browser sebelum demo. |
| Wajib | CMP-002 | AAPLB tetap terlihat. Status pembatasan jelas pada detail dan perbandingan. | Pengecualian di mesin seleksi dan teks pembatasan di halaman Apple sudah ada. Periksa konsistensi tiap layar sebelum demo. |
| Wajib | FR-002, NFR-001 | Masukkan IDR, ambil kuotasi yang tersedia, tinjau minimum serta kedaluwarsa, dan selesaikan pratinjau. | AAPLx dan AAPLon di Solana lewat LI.FI. Pembayaran dan transaksi mainnet tidak aktif. |
| Wajib | NFR-002, CMP-001 | Jika kuotasi, AI, atau data perbandingan kurang, pengguna memahami alasannya dan tidak melihat rekomendasi yang belum didukung. | Jalur fallback ada. Periksa kembali kondisi dan label di build demo. |
| Jika konfigurasi siap | AI-001, FR-004 | Analisis memakai bukti aktual. Tampilkan mode tamu atau status konfigurasi yang sesuai. | AI live tercatat pada Draft PR #12. Login kembali dari Google dan pemulihan wallet belum diverifikasi penuh. |
| Demonstrasi teknis terpisah | BC-002 | Jelaskan transfer SPL aset demo, jaringan devnet, konfirmasi, dan saldo penerima. | Draft PR #12 mencatat transfer public devnet oleh operator. Transfer lewat UI Privy dan swap devnet belum terbukti. |
| Uji internal | FR-003 | Tampilkan skenario multichain sebagai indikatif dan pisahkan sumber dana. | Flag server tersedia. Aktivasi publik menunggu review arsitektur. Peringkat ditahan saat biaya, rasio, atau pendanaan tidak lengkap. |

Skrip demo utama mengikuti alur Apple → nominal IDR → penawaran yang tersedia → analisis bila tersedia → pratinjau selesai. Operator dapat menampilkan bukti transfer devnet sebagai demonstrasi terpisah sesudah alur utama. [Bukti Draft PR #12](https://github.com/1Stocks/1stocks/blob/6482457ecb0ee19c9a490475e9584bc51b6e61b2/docs/architecture/apple-mvp-verification.md)

Usulan teks UI untuk pengguna Indonesia ialah **“AAPLB — Dibatasi untuk Indonesia. Informasi saja. Kuotasi dan pembelian tidak tersedia.”** Tempatkan status di kartu katalog atau detail yang menawarkan penerbit alternatif. Teks pembatasan tetap terlihat di samping produk yang ditampilkan dan memiliki arti tanpa bergantung pada warna.

## Setelah demo

- **FR-004, BC-002.** Selesaikan login Google, pemulihan embedded wallet, dan satu transfer devnet yang ditandatangani pengguna dengan bukti saldo serta explorer.
- **FR-003, NFR-001, AI-001.** Lengkapi biaya, data eksposur, dan kelompok pendanaan. Uji apakah penjelasan model membantu pengguna memahami perbedaan yang benar-benar didukung.
- **FR-005.** Verifikasi portofolio lintas deployment dan riwayat berdasarkan settlement. Pertahankan pemisahan saldo mainnet dengan demo.

## Prasyarat produksi

Persetujuan distribusi dan klasifikasi produk per yurisdiksi, kelayakan pengguna yang dapat diaudit, izin penerbit, pendanaan, wallet dan gas, pengujian simulasi, otorisasi transaksi, observabilitas, dan proses penanganan kegagalan. Saat ini pembelian produksi nonaktif. Jika pembatasan AAPLB berubah, sumber resmi, kelayakan pengguna, dan otorisasi kanal harus diverifikasi ulang sebelum mengubah status. [Bukti kelayakan](../architecture/eligibility-evidence.md)
