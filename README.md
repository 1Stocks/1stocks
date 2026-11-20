# 1Stocks

1Stocks dirancang untuk memudahkan investor ritel Indonesia membeli token saham AS dengan rupiah. Pengguna memilih saham dan memasukkan nominal rupiah. 1Stocks menangani pemilihan token dan swap di belakang layar, lalu token masuk ke dompet pengguna. Pengguna tidak perlu mengatur wallet kripto, membeli token untuk gas, atau menukar rupiah ke USDC sendiri.

## Scope MVP

1. Peragakan alur pembelian Apple di web desktop, mulai dari nominal rupiah, estimasi, dan konfirmasi hingga hasil swap demo.
2. Gunakan agregator di backend untuk mengevaluasi penawaran token Apple dan menentukan token yang digunakan.
3. Setelah agregasi dan swap siap, sederhanakan onboarding dengan rencana login Google dan dompet otomatis.

## Rencana teknis demo

- **Solana** adalah jaringan utama. **BNB Chain** disimpan sebagai opsi cadangan.
- Harga atau quote ditargetkan berasal dari **Solana mainnet** setelah sumber dan rute token diverifikasi.
- Swap demo ditargetkan berjalan di **Solana devnet** dengan token SPL tiruan dan dana uji. Jika rute uji belum siap, backend dapat menjalankan simulasi berlabel di UI.

## Alur kontribusi

Gunakan satu branch dan satu pull request per tiket. Rocket meriview PR, lalu Geral melakukan merge ke `main`.
