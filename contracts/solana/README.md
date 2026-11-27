# Token demo Solana

Workspace ini berisi tooling operator SPL Token klasik. Build Next.js tidak menjalankan tooling ini. Direktori `programs/` dapat ditambahkan ketika ada kebutuhan program Rust yang disetujui. Token biasa memakai program SPL yang sudah ada.

Prasyarat lokal: Node versi repo, npm ci, Solana CLI, dan spl-token CLI. Simpan keypair baru khusus devnet di luar checkout. Deployer membayar biaya, mint authority menandatangani mint, dan dompet Privy penerima/pengirim tetap memegang otoritas akun masing-masing. Jangan gunakan keypair mainnet.

Konfigurasi nama token dan desimal ada di `config/demo-tokens.json`. Token tersedia untuk Apple, Tesla, dan NVIDIA. Token demo tidak memberi hak ekuitas, hak penebusan, atau nilai finansial. Metadata demo disimpan secara lokal dan tidak mengatasnamakan penerbit resmi.

Dari root, jalankan operator dengan `node --import tsx contracts/solana/scripts/token.ts <operasi> <simbol> [alamat] [jumlah]`.

- Isi `DEMO_FEE_PAYER_KEYPAIR` dengan path keypair payer devnet yang memiliki SOL. Isi `DEMO_MINT_AUTHORITY_ADDRESS` dengan alamat publik mint authority.
- Siapkan keypair mint berbeda untuk setiap token. Isi `DEMO_NEW_MINT_KEYPAIR` dengan path-nya, lalu jalankan `create DEMO-AAPL-1STOCKS`. Simpan receipt publik yang asli di `.state/` untuk penggunaan ulang. `verify` memeriksa tanda tangan pembuatan, hubungan transaksi dan mint, program, desimal, supply, dan authority. Back up receipt publik sebelum berpindah mesin.
- `account <simbol> <alamat-wallet>` membuat atau menggunakan kembali associated token account. `balance <simbol> <alamat-wallet>` membaca saldo dari RPC.
- Isi `DEMO_MINT_AUTHORITY_KEYPAIR` dengan path signer yang sesuai, lalu jalankan `mint <simbol> <alamat-wallet> <jumlah>`. Perintah eksplisit `transfer` memakai `DEMO_SENDER_KEYPAIR` untuk dompet uji yang dikelola operator. Untuk dompet Privy gunakan UI yang meminta persetujuan pengguna.
- Gunakan output Explorer dan simpan signature publik untuk catatan demo. Jika status pengiriman belum bisa diverifikasi, periksa jaringan sebelum mengulang operasi.
- Mint authority tetap aktif saat perlu menyiapkan saldo demo. Setup tidak membuat freeze authority dan tidak mencabut authority. Cabut mint authority hanya lewat keputusan operator terpisah setelah provisioning selesai.

Untuk UI, isi `SOLANA_DEMO_TOKEN_REGISTRY` dengan objek JSON yang memetakan simbol DEMO ke mint publik yang telah lolos `verify`. Konfigurasi lama `SOLANA_DEMO_TOKEN_MINT` tetap menjadi fallback. Penerima transfer Privy harus sudah punya akun token terkait. Jangan menyimpan keypair, mnemonic atau secret di env web.

## Uji validator lokal

Jalankan `solana-test-validator --ledger /tmp/1stocks-catalog-validator --rpc-port 18899 --faucet-port 19900` di terminal terpisah, lalu `RUN_LOCAL_SOLANA_TESTS=1 npm --prefix contracts/solana test`. Pengujian loopback memakai keypair sementara yang baru dibuat dan memeriksa saldo sebelum menganggap transfer berhasil. CLI operator tetap menggunakan endpoint devnet tetap.
