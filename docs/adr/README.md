# Keputusan arsitektur 1Stocks

[PRD utama](../product/PRD.md) menjelaskan tujuan dan alur pengguna. [Arsitektur](../architecture/tokenized-equities.md) mencatat perilaku sistem saat ini. Gunakan tabel berikut untuk membedakan keputusan tim dan usulan sebelum mengubah arsitektur.

| ID | Keputusan | Status |
| --- | --- | --- |
| 0001 | [Solana, penyedia kuotasi, dan strategi demo awal](#keputusan-0001) | Diterima 17 November 2026. |
| 0002 | [Seleksi produk lintas penerbit dan jaringan berdasarkan kelayakan](0002-seleksi-produk-lintas-jaringan.md) | Usulan. Menunggu persetujuan tim. |

## Keputusan 0001

Ringkasan keputusan yang diterima pada 17 November 2026. Salinan lengkap dengan catatan konsultasi tersedia di checkout internal.

- Gunakan Solana untuk MVP saat itu. Mainnet dipakai untuk data harga dan kuotasi baca-saja. Seluruh eksekusi demo memakai devnet.
- Prioritaskan AAPLx dan dukung AAPLon. Tampilkan AAPLB sebagai informasi tanpa pembelian. Pada rancangan saat itu, pembatas utamanya adalah jaringan. Bukti penerbit untuk Indonesia kini dicatat di [matriks kelayakan](../architecture/eligibility-evidence.md).
- Utamakan Jupiter, gunakan LI.FI sebagai opsi, dan simpan akses penyedia di backend. Rencanakan eksekusi demo dengan token SPL uji dan adapter mock. Program Anchor custom bersifat opsional.
- Gunakan unit atomik, desimal terverifikasi, dan aturan pembulatan yang eksplisit. Pilihan SDK wallet dan client Solana saat itu masih terbuka.

## Yang perlu keputusan tim

Implementasi saat ini memakai LI.FI untuk pratinjau Apple, Privy untuk akun dan wallet, serta tooling SPL untuk transfer devnet. Jalur transaksi produksi tetap dinonaktifkan. ADR 0002 mengusulkan kemampuan per deployment dan rute dengan bukti pendanaan dan kelayakan. Tim perlu menentukan butir ADR 0001 yang akan digantikan, kapan kemampuan multichain boleh diaktifkan, dan batas demo serta distribusi produksi. Pembaruan dokumentasi ini mempertahankan status kedua ADR.
