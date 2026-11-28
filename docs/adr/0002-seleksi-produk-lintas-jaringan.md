# ADR 0002: Seleksi produk lintas penerbit dan jaringan berdasarkan kelayakan

- Status: Usulan
- Tanggal: 2026-11-28
- Diputuskan oleh: Menunggu keputusan tim
- Berlaku untuk: katalog, kelayakan, kuotasi, dompet, dan eksekusi

## Konteks

1Stocks mengagregasi penawaran saham tertokenisasi untuk investor ritel Indonesia. Satu saham dapat tersedia melalui beberapa penerbit, deployment, dan rute. Aplikasi saat ini memberi pratinjau Apple melalui LI.FI di Solana dan transfer demo di Solana devnet. ADR 0001 menetapkan cakupan Solana untuk MVP dan Jupiter sebagai penyedia kuotasi utama. Temuan katalog, rute, serta persyaratan penerbit perlu ditangani terpisah.

## Opsi

1. Pertahankan cakupan quote-only Solana sebagai batas produk dan perlakukan jaringan lain sebagai informasi katalog.
2. Mulai dari instrumen dan produk yang memenuhi syarat. Aktifkan masing-masing kemampuan per deployment, sumber dana, dan adapter setelah ada bukti yang memadai. Pertahankan Solana sebagai adapter yang sudah tersedia.

## Usulan keputusan

Pilih opsi kedua. Unit yang dibandingkan mencakup penerbit, deployment resmi, aset dan chain pendanaan, chain tujuan, penyedia, serta rute. Mesin seleksi memakai biaya untuk eksposur setara, batas anggaran, dan minimum output. Chain dan penerbit memperoleh hasil berdasarkan bukti untuk penawaran tersebut. LI.FI menjadi pilihan agregator awal untuk rute yang sudah diverifikasi. Adapter lain, termasuk Jupiter untuk Solana, dapat dibandingkan dengan aturan yang sama setelah disetujui.

ADR 0001 tetap berlaku selama usulan ini belum diterima. Tim perlu menyetujui perubahan cakupan jaringan dan kandidat produk (keputusan 1–2 ADR 0001), kebijakan pilihan agregator (keputusan 3), dan kontrak adapter (keputusan 5). Pemilihan dan otorisasi jalur distribusi Indonesia, KYC dan wallet, kriteria kesiapan per rute, pendanaan, serta persetujuan eksekusi produksi juga memerlukan keputusan tim. Perubahan status ADR 0001 ditulis terpisah setelah persetujuan.

## Aturan untuk implementasi

- HARUS memisahkan kebijakan penerbit, kelayakan individu, persetujuan distribusi, dan kesiapan teknis pada wallet dan rute yang tepat. Bukti yang hilang, kedaluwarsa, atau di luar cakupan menutup jalur produksi.
- HARUS menegakkan pembatasan bStocks untuk Indonesia sebelum pemanggilan quote untuk AAPLB atau produk bStocks lain. Katalog informasional tetap dapat mencatat produk dan sumber resminya.
- HARUS membandingkan biaya all-in dalam satu anggaran dan satu unit yang setara, dengan rasio saham per token dari bukti deployment yang masih berlaku. Data gas, bridge, harga, pembatasan transfer, atau biaya konversi yang belum diketahui tetap menjadi batas perbandingan.
- HARUS memisahkan kuotasi indikatif, persiapan, simulasi, persetujuan pengguna, tanda tangan, dan bukti settlement.
- HARUS menjaga AI di jalur penjelasan berbukti. Filter, normalisasi, ranking dan otorisasi tetap deterministik.
- Aktivasi dompet EVM, kuotasi EVM pada alur aplikasi, dan eksekusi lintas chain memerlukan persetujuan fase dan uji yang sesuai.
- Demo menggunakan transfer Solana devnet terpisah. Eksekusi mainnet tetap nonaktif sampai bukti kelayakan, kesiapan rute dan persetujuan pengguna terpenuhi.

## Akibat

Pratinjau Apple yang berjalan tetap tersedia sesuai batas produk. Bukti kebijakan dan teknis dapat ditambahkan tanpa perubahan cara peringkat. Dukungan deployment baru memerlukan pemeriksaan akun, pemenuhan syarat penerbit, biaya, atau verifikasi settlement yang sesuai dengan chain dan venue.

## Sumber

- [Arsitektur dan alur seleksi](../architecture/tokenized-equities.md)
- [Bukti penerbit, distribusi Indonesia, dan matriks deployment](../architecture/eligibility-evidence.md)
- [LI.FI, rute dan langkah transaksi](https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens)
