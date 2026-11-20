# 1Stocks

1Stocks adalah MVP web desktop untuk membantu pengguna Indonesia membandingkan token saham Apple dan mencoba alur pembelian dengan rupiah (IDRX). Demo mencakup perbandingan harga, swap, serta login Google dengan dompet otomatis.

## Strategi demo

- **Solana** adalah jaringan utama MVP. **BNB Chain** disimpan sebagai opsi cadangan.
- Harga dan quote untuk AAPLx dan AAPLon mengacu pada data **Solana mainnet**. AAPLB tampil sebagai pembanding.
- Demo swap berjalan di **Solana devnet** dengan token SPL tiruan (`mIDRX`, `mUSDC`, `mAAPLx`, dan `mAAPLon`). Alur demo diberi label devnet dan memakai dana uji.

## Alur kontribusi

Gunakan satu branch dan satu pull request per tiket. Rocket meriview PR, lalu Geral melakukan merge ke `main`.
