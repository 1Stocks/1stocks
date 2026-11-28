# Mesin seleksi dan penjelasan AI

Spesifikasi untuk tinjauan tim · [AI-001, FR-003, CMP-001, CMP-002, NFR-001](../product/PRD.md#persyaratan-produk).

## Kandidat dan bukti

Unit seleksi adalah **penerbit × deployment token × konteks pendanaan × jaringan × rute eksekusi**. Identitas rute mengikat jaringan sumber dan tujuan, penyedia, aset sumber dan tujuan, serta batas transaksi. Mulai dari saham acuan dan produk yang lolos pembatasan, lalu cari jalur yang didukung. Chain mengikuti kandidat yang tersedia dan syarat penggunaan.

| Kelompok bukti | Data minimum yang relevan |
| --- | --- |
| Produk | Penerbit, struktur dan hak pemegang, snapshot resmi, kebijakan yurisdiksi, deployment, chain dan alamat. |
| Pendanaan | Nominal IDR, kurs/acuan dan waktunya, aset serta chain sumber, saldo tersedia atau hipotetis, kebutuhan wallet dan gas. |
| Kuotasi | Provider, rute satu atau lintas jaringan, input dan output atomik, minimum, tujuan, biaya dan status termasuk atau terpisah, kedaluwarsa. |
| Eksekusi | Bukti dampak harga, approval, gas, rent, konversi, bridge, batas hasil, serta kelayakan wallet. Risiko finalitas dan keluar tetap tidak diketahui saat bukti tidak tersedia. |
| Eksposur | Desimal deployment, rasio saham per token, multiplier dan waktu berlakunya, serta bentuk hasil raw atau scaled. |

Backend mengikat bukti pada sumber, waktu, masa berlaku dan cakupan. Sumber terotorisasi memegang kebijakan penerbit, persetujuan distribusi, status pengguna dan kesiapan teknis. Katalog membuktikan informasi listing. Kuotasi membuktikan respons penyedia dalam kondisi yang tercatat. Login membuktikan sesi akun. Data dari browser atau model tidak mengisi attestasi produksi. [Batas bukti](eligibility-evidence.md)

## Keputusan deterministik

1. Pisahkan AAPLB untuk Indonesia sebelum meminta kuotasi. Jika prasyarat produksi hilang, kedaluwarsa, atau berbeda cakupan, tahan tindakan transaksi.
2. Cocokkan alamat, chain, nominal input, minimum output, kedaluwarsa, serta identitas rute. Gunakan bilangan bulat atomik dan aritmetika rasional dengan arah pembulatan yang terdokumentasi.
3. Bandingkan hanya penawaran dengan kondisi awal setara. Skenario saldo USDC yang sudah tersedia di Ethereum terpisah dari skenario USDC Solana yang melewati bridge. Biaya konversi dan eksekusi masuk biaya all-in saat berlaku. Fee tanpa unit, nilai yang gagal diurai, atau biaya kritis yang belum diketahui menahan peringkat.
4. Konversi output dan minimum ke eksposur saham per deployment. Jika unit atau rasio belum terverifikasi, tampilkan hasil mentah dengan label satuannya. Abaikan penyesuaian multiplier tambahan ketika hasil sudah scaled.
5. Nilai biaya per eksposur hanya setelah validasi lengkap. Dampak harga memakai bukti terukur. Selisih estimasi dan minimum tidak mengukur dampak harga. Bila dasar pembanding belum lengkap, hasilnya `ABSTAIN`. Biaya terendah hanya menjelaskan dimensi biaya.

## Penjelasan AI

Implementasi backend memakai OpenAI di [layanan analisis](../../apps/api/src/issuer-analysis.ts). Teruskan bukti tervalidasi dan identitas referensi. Penjelasan terstruktur membahas pilihan yang tersedia, konteks rute, batasan, dan data yang belum cukup. Server memeriksa struktur dan validitas referensi. Angka, urutan, izin, quote, dan otorisasi tetap mengikuti layanan deterministik.

Anggap deskripsi, dokumen penerbit, dan teks penyedia sebagai data. Instruksi dari sumber itu tidak masuk mandat model. Gunakan bentuk keluaran terbatas, referensi dari daftar bukti yang diizinkan, serta batas ukuran. Jangan memberi model akses wallet, private key, tanda tangan, atau eksekusi. Ketika sesi, konfigurasi, provider, skema atau referensi gagal, tampilkan fallback dan jaga alur kuotasi.

## Evaluasi

- Sumber dana berbeda. Harap tampil sebagai skenario terpisah, tanpa pemenang.
- Biaya rusak, multiplier kedaluwarsa, atau minimum tidak sah. Harap tahan peringkat.
- AAPLB punya listing atau rute pihak ketiga. Harap tetap informasional untuk pengguna Indonesia.
- Teks sumber berisi instruksi atau keluaran mengutip ID asing. Harap abaikan instruksi dan tolak respons tanpa referensi yang sah.
- Analisis menjelaskan risiko yang bukti aktualnya belum lengkap. Harap nyatakan ketidakpastian dan pertahankan jalur pratinjau.
