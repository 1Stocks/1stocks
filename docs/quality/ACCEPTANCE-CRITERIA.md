# Kriteria penerimaan 1Stocks

Matriks ini memakai ID dari [PRD](../product/PRD.md#persyaratan-produk). Metode, lingkungan, dan status hasil dijelaskan di [strategi pengujian](TEST-STRATEGY.md).

| ID | Hasil yang harus terbukti | Pemeriksaan |
| --- | --- | --- |
| FR-001 | Cari Apple dan buka hasil yang mengelompokkan produk berdasarkan saham acuan. | Tes pencarian, paginasi, dan Playwright desktop/mobile. |
| FR-002 | Anggaran rupiah tetap sesuai input. Opsi yang tersedia menunjukkan hasil minimum, masa berlaku, dan pratinjau. Konfirmasi kedaluwarsa tertahan. | Tes kontrak kuotasi, akses LI.FI baca-saja, dan regresi browser. |
| FR-003 | Penawaran beda sumber dana dipisahkan. Peringkat hanya muncul saat basis setara, data lengkap, dan aturan mengizinkan. | Fixture same-chain, cross-chain, dan saldo hipotetis, plus sampel baca-saja dengan flag internal. |
| FR-004 | OAuth kembali ke aplikasi, wallet tersedia dengan alamat stabil setelah reload, dan logout menghapus sesi. | Jalur tamu dan kegagalan memakai fixture. Alur penuh butuh akun Google dan App ID yang diotorisasi. |
| FR-005 | Saldo sesuai deployment. Riwayat mencocokkan transaksi, status, dan explorer. | Uji provider RPC dan integrasi settlement. Riwayat produksi direncanakan. |
| AI-001 | Konten memiliki referensi sah, menjelaskan asumsi, dan tidak menciptakan peringkat atau izin. | Tes validasi skema, referensi, penolakan keluaran, fallback, dan satu permintaan model live jika dikonfigurasi. |
| BC-001 | Chain dan alamat dari sumber penerbit cocok dengan registry. Deployment yang bertabrakan pada chain yang sama ditolak. | Tes registry dan verifikasi sumber penerbit/RPC baca-saja. |
| BC-002 | Pengguna mengotorisasi tepat transaksi yang ditinjau. Hasil cocok dengan konfirmasi serta saldo. | Validator lokal, satu transfer devnet publik yang diotorisasi, dan audit simulasi tanpa broadcast mainnet. |
| CMP-001 | Empat attestasi sesuai cakupan dan berlaku. Ketidaklengkapan atau kedaluwarsa menahan produksi. | Tes negatif kebijakan, investor, distribusi, teknis, dan bukti yang salah cakupan. |
| CMP-002 | AAPLB terlihat dengan peringatan Indonesia. AAPLB tidak masuk permintaan kuotasi, peringkat, atau pilihan pembelian. | Tes seleksi/adapter dan pemeriksaan kartu katalog, detail, serta perbandingan Apple. |
| NFR-001 | Konversi, desimal, multiplier, dan minimum memakai satuan yang benar. Fee atau rasio rusak menahan peringkat. | Tes batas atomik, fixture tiap deployment, kontrol unit raw/scaled, dan uji biaya tidak lengkap. |
| NFR-002 | Kegagalan sesi, penyedia, atau RPC memberikan status dan pemulihan yang sesuai. Rahasia tetap di server. | Tes fallback, akses tanpa sesi, rate limit, token kedaluwarsa, dan pemindaian diff. |
