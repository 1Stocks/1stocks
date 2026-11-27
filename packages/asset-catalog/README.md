# Katalog aset

Snapshot resmi dapat diperbarui dari root dengan `node --import tsx packages/asset-catalog/providers/refresh.ts`. xStocks memakai endpoint paginasi resmi dan Ondo memakai CSV yang ditautkan di dokumentasi alamat. Kegagalan provider mempertahankan snapshot terakhir provider terkait. Umur snapshot dicatat dan status diturunkan setelah 30 hari. bStocks memakai referensi listing Binance dan alamat AAPLB yang dicatat di ADR 0001. Listing tanpa alamat terverifikasi tidak masuk registry.

Instrumen digabung hanya jika ISIN cocok. Baris tanpa ISIN menggunakan identitas khusus penerbit dan produk. Identitas token memakai penerbit, jaringan dan alamat. Duplikat deployment dihapus dan alamat dengan klaim instrumen yang bertentangan tidak dipakai. Bukti listing tidak membuktikan kelayakan pengguna, likuiditas, hak ekonomi, atau kesetaraan eksposur. Selain Apple pada mint Solana yang sudah diizinkan, detail saham bersifat katalog saja.

Registry demo berisi konfigurasi devnet terpisah. Kode resmi dan AI tidak membaca registry demo.
