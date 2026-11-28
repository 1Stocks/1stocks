# Panduan kontribusi 1Stocks

## Kerja melalui branch

1. Mulai dari permintaan yang disepakati atau spesifikasi yang dirujuk. Tautkan issue jika tersedia.
2. Gunakan branch `<tipe>/<ringkas>`. Pisahkan perubahan dokumentasi dari implementasi bila keduanya bisa ditinjau sendiri.
3. Tulis judul PR `<tipe>(<cakupan>): <ringkasan>`. Cantumkan tujuan, perubahan, hasil verifikasi aktual, dan keputusan yang masih terbuka. Gunakan Conventional Commits.
4. Ajukan PR ke tim. Pertahankan perubahan partner. Gunakan proses review untuk integrasi ke `main`.

## Menyelaraskan dokumentasi dengan partner

| Topik | Acuan yang diperbarui bersama |
| --- | --- |
| Tujuan produk dan batas demo | [PRD](product/PRD.md) dan [cakupan MVP](product/MVP-SCOPE.md). |
| Perilaku UI dan desain | [Acuan desain](design/DESIGN.md), termasuk komponen, alur, dan penyajian data. |
| Implementasi dan keputusan desain teknis | [Arsitektur](architecture/tokenized-equities.md) dan ADR bila tim menetapkan atau mengganti keputusan. |
| Bukti dan syarat penerimaan | [Matriks penerimaan](quality/ACCEPTANCE-CRITERIA.md) dan bukti uji sesuai lingkungan. |

Letakkan dokumen yang siap direview di `docs/`. Perbarui satu sumber acuan dan tautannya di [indeks](README.md). Hapus duplikat yang sudah digantikan setelah rujukannya dipindahkan. Pertahankan ADR dan bukti pengujian historis, dengan penanda status dan versi. Pilih berkas yang akan di-stage secara eksplisit agar catatan lokal, materi pribadi, env, dan kredensial tetap di luar commit.

Bila kode menyimpang dari ADR yang diterima, catat perbedaannya di PR. Tim memutuskan apakah implementasi diselaraskan atau keputusan digantikan melalui ADR baru. Periksa tautan, Mermaid, konsistensi status, dan isi diff sebelum mengajukan dokumentasi. Saat perilaku aplikasi berubah, jalankan pemeriksaan proyek sesuai `package.json` dan lampirkan hasilnya.
