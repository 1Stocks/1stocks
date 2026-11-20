# 1Stocks

1Stocks adalah prototipe web desktop untuk membantu pengguna Indonesia membandingkan token yang memberi eksposur ke saham AS dan mencoba alur pembelian dalam rupiah. Demo berfokus pada Apple, dengan target membandingkan tiga penawaran penerbit agar pengguna bisa melihat dasar pemilihan token.

## Scope MVP

1. Bandingkan penawaran token Apple dan tampilkan dasar rekomendasinya.
2. Peragakan alur dari nominal rupiah hingga estimasi token dan hasil swap demo.
3. Setelah alur perbandingan dan swap siap, sederhanakan onboarding wallet. Login Google dengan dompet otomatis masuk rencana MVP.

## Rencana teknis demo

- **Solana** adalah jaringan utama. **BNB Chain** disimpan sebagai opsi cadangan.
- Targetnya, data harga atau quote diambil dari **Solana mainnet** setelah sumber dan rute masing-masing token diverifikasi.
- Target eksekusi swap adalah **Solana devnet** dengan token SPL tiruan dan dana uji. Jika rute uji belum siap, backend dapat menjalankan simulasi yang diberi label di UI.

## Alur kontribusi

Gunakan satu branch dan satu pull request per tiket. Rocket meriview PR, lalu Geral melakukan merge ke `main`.
