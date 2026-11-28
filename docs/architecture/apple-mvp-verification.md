# Bukti verifikasi MVP Apple

Pengujian 28 November 2026. Pratinjau multichain diuji melalui flag server dalam lingkungan lokal. ADR 0002 tetap usulan sebelum aktivasi publik. AAPLB dibatasi untuk Indonesia. Status produksi semua rute masih tertahan oleh kelayakan dan distribusi.

## Pendanaan dan normalisasi

- Masukan IDR tetap tercatat dalam unit 0,01 rupiah. Kuotasi IDRX ke USDC di Solana menjadi acuan indikatif yang diverifikasi parameternya melalui LI.FI. Simpan waktu kutipan, hasil estimasi, minimum output, dan kurs minimum IDRX/USDC dari unit atomik. Hasil minimum dipakai **persis** untuk rute dengan sumber USDC Solana. Pratinjau lama tetap memakai nominal IDRX yang dimasukkan. Penawaran dengan sumber lokal di Ethereum atau BNB diberi kelompok sendiri, menggunakan saldo hipotetis dan kebutuhan wallet serta gas masing-masing. [LI.FI, advanced routes](https://docs.li.fi/api-reference/advanced/get-a-set-of-routes-for-a-request-that-describes-a-transfer-of-tokens)
- AAPLx Solana memakai kuantitas atomik sesuai desimal mint, dikalikan multiplier aktif yang dipublikasikan issuer. Saat uji live, API resmi mengembalikan 1,0038023030588032. Gunakan aritmetika rasional dengan pembulatan ke bawah dan tahan hasil normalisasi ketika API melaporkan perubahan multiplier yang dijadwalkan. AAPLx Ethereum memakai kuantitas ERC-20 yang sudah disesuaikan, sehingga faktor aktif tidak diterapkan dua kali. Data ini menggambarkan eksposur indikatif, dengan route settlement yang tetap perlu diverifikasi. [xStocks, multiplier](https://docs.xstocks.fi/developers/multipliers) · [xStocks, corporate actions](https://docs.xstocks.fi/docs/dividends-and-stock-splits)
- Ondo mempublikasikan perubahan eksposur AAPLon akibat corporate actions. RPC Solana mengembalikan mint Token-2022 dengan 9 desimal dan multiplier aktif 1,0039083015136119 pada snapshot pengujian. AAPLx Solana menggunakan 8 desimal. Pembacaan eth_call sebelumnya mengonfirmasi 18 desimal untuk kontrak Ethereum dan BNB yang diuji. Biarkan eksposur AAPLon kosong sampai ada rasio issuer dan konfirmasi unit kuotasi untuk setiap deployment. Angka multiplier SPL cukup untuk mengonfirmasi konfigurasi mint pada saat tersebut. Kesetaraan unit kuotasi dengan eksposur saham di tiga jaringan masih perlu dibuktikan. [Ondo, corporate actions](https://docs.ondo.finance/ondo-stocks/corporate-actions) · [Halaman AAPLon](https://app.ondo.finance/assets/aaplon)
- Fee LI.FI dan gas tetap dicatat per aset dengan status termasuk atau di luar kuotasi saat disediakan. Penyelesaian biaya all-in memerlukan pembuktian biaya approval, gas, rent, konversi, serta biaya lintas jaringan dan pendanaan yang berlaku. Kuotasi tidak melaporkan dampak harga terukur untuk sampel ini. Kehilangan nilai hasil estimasi dan selisih minimum tidak dipakai sebagai pengganti. Perbandingan finansial mengembalikan ABSTAIN. [Spesifikasi LI.FI](https://docs.li.fi/openapi.yaml)

## Persiapan dan simulasi mainnet baca-saja

| Jaringan dan produk | Persiapan | Hasil |
| --- | --- | --- |
| Solana, AAPLx dan AAPLon | Payload tanpa tanda tangan. Program, akun sumber, mint dan akun penerima fee diperiksa dari transaksi provider. | Simulasi gagal pada fee 250 IDRX karena ATA IDRX sumber belum ada. |
| Ethereum, AAPLx dan AAPLon | LI.FI HTTP 200. Input, chain ID, kontrak tujuan, alamat wallet uji, dan batas minimum dicocokkan dengan metadata. Router dan spender punya bytecode. Word ABI penerima, token dan minimum ditemukan di calldata. | eth_call revert dengan selector 0x7939f424. Saldo USDC dan allowance untuk spender bernilai 0. |
| BNB, AAPLon | Kuotasi tanpa wallet tersedia di pratinjau. Permintaan persiapan dengan wallet sintetis kosong mendapat HTTP 404, termasuk percobaan advanced routes. | Payload untuk wallet tersebut belum tersedia. Simulasi belum dilakukan. |

Ethereum mengembalikan selector yang sesuai dengan TransferFromFailed() dari kontrak LI.FI. Saldo dan allowance nol merupakan kondisi yang teramati. Word ABI yang cocok tidak membuktikan bahwa setiap instruksi router aman atau settlement akhir bisa terjadi. Tidak ada pengubahan payload, override saldo, approval, tanda tangan, atau broadcast mainnet. [Ethereum, eth_call](https://ethereum.org/developers/docs/apis/json-rpc/#eth_call) · [Definisi error LI.FI](https://github.com/lifinance/contracts/blob/main/src/Errors/GenericErrors.sol) · [Diagnosis Solana](apple-solana-simulation.md)

## Settlement demo Solana devnet

RPC lama tidak dapat diurai menjadi URL HTTP(S). RPC publik resmi mengembalikan genesis devnet yang sesuai. Preview terisolasi dikonfigurasi dengan URL resmi dan registry publik mint yang sudah diverifikasi perintah operator. Tooling SPL klasik memeriksa genesis sebelum membuat mint, membuat akun, dan mengirim transfer. Wallet operator yang didanai devnet membayar biaya transaksi.

- Mint DEMO-AAPL-1STOCKS memiliki 2 desimal. Saldo akun token penerima berubah dari 0 ke 100 unit atomik atau **1 token demo**.
- Transaksi berstatus **finalized** pada slot 527148416. RPC independen mengonfirmasi instruksi transfer dan saldo akun penerima.
- Ini adalah transfer SPL pada devnet oleh operator, dengan aset demo tanpa hak saham. Pemulihan wallet Privy dan transfer yang ditandatangani melalui UI memerlukan verifikasi terpisah.

[Mint demo](https://explorer.solana.com/address/chQ9gpFiowJZzuAvNHv6BJFP9qyGVuDmvQMXfm89V4F?cluster=devnet) · [Transaksi transfer final](https://explorer.solana.com/tx/4RyuDcNfRuWx3ARRtJGns14wgcvyghn7LbhwTF1Z6xDmYJvFCZoehAuvEY5PXpoMs1ovQqVzeaFntnXMfq4g5NKC?cluster=devnet) · [Klaster Solana](https://solana.com/developers/docs/references/clusters)

## Matriks pengujian aplikasi

| Bukti | Hasil |
| --- | --- |
| Kuotasi live | HTTP lokal untuk Rp200.000 mengembalikan empat kuotasi dari tiga jaringan dengan sumber USDC Solana yang sama dan minimum konversi 10,669873 USDC. AAPLx Ethereum belum memberi rute pada nominal tersebut. |
| Penawaran finansial sebanding | ABSTAIN. Kebutuhan dana wallet, biaya all-in, dampak harga, serta basis eksposur AAPLon belum terverifikasi. |
| Analisis AI | OpenAI live memberi tiga poin dengan referensi yang lolos, termasuk lebih dari satu chain tujuan. |
| Autentikasi | Modal Privy lulus desktop dan mobile. Redirect mencapai Google HTTP 200. Provisioning wallet dan pemulihan sesi penuh belum diamati dalam pemeriksaan ini. |
| Regresi | Lint, typecheck, 53 tes aplikasi, build produksi, dan Playwright 1440 serta 390 px lulus. Browser menguji pengelompokan prefunded dengan fixture. Tiga tes tooling Solana pada validator lokal lulus. |
| Eligibility | AAPLB tetap dibatasi. Seluruh penawaran produksi tetap tertahan. |
