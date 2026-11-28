# Dokumentasi 1Stocks

1Stocks membantu investor ritel di berbagai negara memahami dan membandingkan representasi saham tertokenisasi lintas penerbit dan jaringan. Indonesia adalah pasar awal. Ketersediaan produk dan transaksi ditentukan per yurisdiksi, pengguna, kanal distribusi, dan rute.

## Mulai dari sini

| Kebutuhan | Dokumen acuan |
| --- | --- |
| Alur kerja dan review dokumentasi tim | [Panduan kontribusi](CONTRIBUTING.md) |
| Visi, persyaratan produk, dan alur pengguna menyeluruh | [PRD utama](product/PRD.md) |
| Keputusan arsitektur dan statusnya | [Indeks ADR](adr/README.md) |
| Demo Day, prioritas setelah demo, dan prasyarat produksi | [Cakupan MVP](product/MVP-SCOPE.md) dan [peta jalan](roadmap/ROADMAP.md) |
| Komponen, data, dan batas sistem | [Arsitektur tokenized equities](architecture/tokenized-equities.md) |
| Kebijakan penerbit, deployment, dan bukti teknis | [Bukti kelayakan](architecture/eligibility-evidence.md) |
| Seleksi deterministik dan penjelasan model | [Spesifikasi mesin keputusan AI](architecture/AI-DECISION-ENGINE.md) |
| Riset pasar dan pembanding | [Riset pasar](research/MARKET-RESEARCH.md) |
| Desain UI dan penyajian informasi finansial | [Acuan desain](design/DESIGN.md) |
| Cara membuktikan setiap syarat | [Matriks penerimaan](quality/ACCEPTANCE-CRITERIA.md) dan [strategi pengujian](quality/TEST-STRATEGY.md) |
| Prasyarat lokal, AI, dan devnet | [Panduan demo](../apps/web/DEMO-SETUP.md) dan [tooling operator](../contracts/solana/README.md) |

## Keputusan dan riwayat verifikasi

- [Indeks ADR](adr/README.md) merangkum keputusan yang berlaku, selisih dengan implementasi, dan usulan perubahan yang masih menunggu keputusan tim.
- [Diagnosis simulasi Solana](architecture/apple-solana-simulation.md) menyimpan detail audit. [Bukti lanjutan pada Draft PR #12](https://github.com/1Stocks/1stocks/blob/6482457ecb0ee19c9a490475e9584bc51b6e61b2/docs/architecture/apple-mvp-verification.md) adalah hasil historis dari commit yang ditautkan dan ditinjau terpisah dari baseline dokumentasi.

## Pemeliharaan

PRD menjelaskan hasil produk yang dituju. Cakupan menetapkan batas rilis. ADR mencatat keputusan teknis tim. Dokumen arsitektur menunjuk ke kode dan membedakan perilaku saat ini dari rancangan. Spesifikasi memperinci persyaratan. Bukti mencatat hasil pemeriksaan berikut lingkungan, versi, dan batasnya. Peta jalan berisi urutan pekerjaan. Saat ada perbedaan, catat konflik dan ajukan keputusan kepada pemiliknya sebelum mengubah perilaku.

Gunakan ID persyaratan dari PRD pada spesifikasi dan bukti uji. Ikuti [panduan kontribusi](CONTRIBUTING.md) saat meninjau atau mengganti dokumen acuan.
