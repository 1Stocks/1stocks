# Acuan desain 1Stocks

Dokumen ini merujuk desain yang berjalan dan menetapkan cara menampilkan data produk. [PR #8](https://github.com/1Stocks/1stocks/pull/8) memasukkan sistem desain Figcraft dan shadcn/ui. [Figma OneStocks](https://www.figma.com/design/MDYDYzVnes5ocXVVPpyThx/OneStocks--Copy-) menyediakan rujukan visual. [Kriteria penerimaan](../quality/ACCEPTANCE-CRITERIA.md) mencatat pemeriksaan antarlayar.

| Bagian | Acuan dan perilaku |
| --- | --- |
| Merek dan visual | Gunakan logo serta aset yang sudah dipakai landing dan cangkang aplikasi. Token semantik Figcraft menggunakan aksen oranye. Halaman yang masih memakai token `landing-*` mempertahankan aksen lime sampai tim frontend menyelaraskannya. [CSS global](../../apps/web/app/globals.css) |
| Tipografi | Inter untuk teks, Sora untuk tampilan, JetBrains Mono untuk token font mono. Modal Privy memakai font lokal yang dikonfigurasi di [root layout](../../apps/web/app/layout.tsx). |
| Komponen | Gunakan [primitif UI yang tersedia](../../apps/web/components/ui) untuk kontrol baru yang sesuai. Gunakan label teks, fokus keyboard, dan aturan `[hidden]` yang berlaku. |
| Landing dan sesi | Pertahankan navigasi ke aplikasi dan login bermerek. Tampilkan loading, sesi tamu, serta cara mencoba lagi saat konfigurasi atau OAuth gagal. |
| Pasar dan detail | Tampilkan pencarian, daftar kosong, paginasi, nama penerbit, identitas jaringan, dan keterbatasan sumber. Untuk AAPLB di Indonesia, peringatan terlihat dengan teks dan tindakan pembelian ditiadakan. |
| Pratinjau Apple | Masukan utama tetap IDR. Nilai estimasi, minimum, biaya, masa berlaku, dan asumsi terlihat dekat penawaran. Jelaskan alasan tidak ada peringkat dan tampilkan analisis AI dengan referensi bila tersedia. |
| Portofolio dan demo | Beri label jaringan pada saldo. Pisahkan akun mainnet dari devnet. Bukti transaksi demo menampilkan jenis aktivitas, hasil, dan tautan explorer sesuai lingkungan. |

Periksa desktop 1440 px dan mobile 390 px. Prioritaskan navigasi yang dapat dipakai dengan keyboard, fokus dialog, keterbacaan teks dan angka, pengumuman status, serta aksi utama yang masih terjangkau pada layar sempit. Harga dan nilai harus berkonteks sumber, mata uang, waktu, serta status estimasi. Gunakan lencana dan teks bersama agar status tidak bergantung pada warna.
