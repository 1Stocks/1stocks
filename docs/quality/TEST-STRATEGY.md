# Strategi pengujian 1Stocks

Catat commit, waktu, perintah, lingkungan, hasil, dan batas pengujian. Kaitkan bukti dengan [ID penerimaan](ACCEPTANCE-CRITERIA.md). Status bukti dapat berlapis.

| Status | Arti |
| --- | --- |
| `IMPLEMENTED` | Jalur ditemukan di kode. |
| `TESTED_LOCALLY` | Perilaku diamati dengan tes, fixture, validator lokal, atau browser lokal. |
| `LIVE_VERIFIED` | Hasil berasal dari layanan atau jaringan publik dan mencantumkan batas lingkungan. |
| `SIMULATED` | Simulasi dijalankan. Catat berhasil atau gagal beserta alasannya. |
| `BLOCKED` | Prasyarat atau bukti tidak tersedia. |
| `PLANNED` | Jalur atau verifikasi masih direncanakan. |

## Lapisan verifikasi

| Lapisan | Cakupan |
| --- | --- |
| Unit dan kalkulasi | Registry, mint, konflik deployment, format angka, biaya, konversi, rasio, kelayakan, dan ranking. Jalankan `npm test`. |
| Integrasi dan kontrak API | LI.FI, FX/acuan pendanaan, umur kuotasi, error provider, OpenAI, validasi server Privy, serta RPC mainnet/devnet. Fixture harus menyebut layanan yang digantikan. |
| Regresi browser | Landing, Pasar, detail, perbandingan Apple, AAPLB, quote refresh dan konfirmasi, AI dan fallback, serta status akun. Jalankan di 1440 px dan 390 px. Pengujian mock untuk UI dan sesi menggunakan status `TESTED_LOCALLY`. |
| Privy live | Verifikasi OAuth kembali ke origin aplikasi, sesi aktif, embedded wallet dipulihkan setelah reload, dan logout. Redirect HTTP 200 saja membuktikan respons dari penyedia login. |
| Blockchain | Validator lokal menguji aturan instruksi dalam lingkungan terisolasi. Devnet publik membuktikan transfer aset demo dengan saldo sebelum/sesudah dan finalitas. Mainnet dibatasi pada kuotasi, pembacaan, persiapan tanpa tanda tangan, atau simulasi baca-saja. |
| Pemeriksaan rilis | `npm run check` menjalankan lint, tes, typecheck, dan production build. Lanjutkan dengan cek HTTP dan browser terhadap build. |

## Bukti sebelumnya

[Draft PR #12 pada 6482457](https://github.com/1Stocks/1stocks/blob/6482457ecb0ee19c9a490475e9584bc51b6e61b2/docs/architecture/apple-mvp-verification.md) mencatat 53 tes aplikasi, tiga tes validator lokal, lint, typecheck, build, dan browser desktop/mobile lulus saat itu. Audit tersebut juga mencatat kuotasi mainnet serta OpenAI live, simulasi Solana dan Ethereum yang gagal, dan transfer SPL yang finalized di devnet oleh operator. Login Google sampai pemulihan wallet dan transfer lewat UI belum diverifikasi. Bukti ini tidak dijalankan ulang dalam perubahan dokumentasi.
