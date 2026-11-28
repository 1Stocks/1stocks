# Diagnosis simulasi kuotasi Apple di Solana

Pengujian ulang pada 28 November 2026 sekitar 10.30 WIB mengisolasi `InvalidAccountData` pada kedua payload beli LI.FI ke instruksi pemungutan biaya 250 IDRX. Instruksi `TransferChecked` membaca associated token account (ATA) IDRX milik wallet kuotasi yang belum ada. Kedua simulasi berhenti sebelum swap dan sebelum transfer token Apple. Audit PR #11 mencatat error yang sama pada indeks 3 untuk kedua produk. Atribusi penyebab di sini berlaku untuk dua payload dari kuotasi baru. [PR #11](https://github.com/1Stocks/1stocks/pull/11) · [Bukti audit sebelumnya](eligibility-evidence.md)

## Hasil simulasi

Dua permintaan `GET /v1/quote` memakai LI.FI chain ID Solana `1151111081099710`, input 100.000 IDRX (`10000000` unit atomik), dan wallet publik yang sama sebagai sumber dan penerima. Metadata kuotasi cocok dengan parameter permintaan. Kedua payload memakai pesan v0, fee payer cocok dengan wallet kuotasi, dan seluruh slot tanda tangan kosong. Payload asli disimulasikan di `api.mainnet-beta.solana.com` dengan `commitment: confirmed`, `sigVerify: false`, `replaceRecentBlockhash: true`, dan `innerInstructions: true`. Tidak ada transaksi yang ditandatangani atau disiarkan. [LI.FI, kuotasi](https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer) · [Solana, simulasi](https://solana.com/developers/docs/rpc/http/simulatetransaction)

| Produk / tool | Slot simulasi | Instruksi yang gagal (indeks dari 0) | Instruksi berikutnya |
| --- | --- | --- | --- |
| AAPLx / Titan | `474801986` | `[2, "InvalidAccountData"]` | Router Titan di indeks 3. |
| AAPLon / Jupiter | `474801989` | `[3, "InvalidAccountData"]` | Dua `CreateIdempotent` di indeks 4–5, lalu router Jupiter di indeks 6. |

Kedua payload memulai dengan dua instruksi Compute Budget yang sukses. AAPLon juga menjalankan program `3i5JeuZuUxeKtVysUnwQNGerJP2bSMX9fTFfS4Nxe3Br` di indeks 2 yang mencetak `LI.FI TX` dan sukses. Setelah itu, RPC mencatat `Program log: Error: InvalidAccountData` dari SPL Token klasik `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`. Tidak ada CPI yang tercatat sebelum kegagalan. [Solana, struktur pesan dan hasil simulasi](https://solana.com/developers/docs/rpc/json-structures)

## Instruksi fee dan keadaan wallet

Address lookup tables (ALT) diperiksa dari RPC untuk memetakan indeks akun. Pesan AAPLx memuat 21 akun statis, 22 writable dari empat ALT, dan 11 readonly dari ALT. Pesan AAPLon memuat 15 akun statis, 11 writable dari dua ALT, dan 7 readonly dari ALT. Mint IDRX diselesaikan dari ALT pada indeks 45 (AAPLx) dan 27 (AAPLon). [Solana, indeks akun dan ALT](https://solana.com/developers/docs/rpc/json-structures#address-table-lookups)

Instruksi SPL Token yang gagal memiliki data `0ca86100000000000002` di kedua pesan. Tag `0c` adalah `TransferChecked`, jumlah `u64` little-endian adalah `25000`, dan desimal `02` cocok dengan mint IDRX. Jumlah ini cocok dengan `LIFI Fixed Fee` pada respons kuotasi. [SPL Token, dekode instruksi dan urutan akun](https://github.com/solana-program/token/blob/main/interface/src/instruction.rs#L1299-L1330)

| Posisi | Peran | Alamat | Hasil pembacaan akun |
| --- | --- | --- | --- |
| 0 | ATA IDRX sumber | ATA turunan wallet uji | `null` di kedua pembacaan. Alamat hasil derivasi dari wallet, SPL Token klasik, dan mint IDRX. |
| 1 | Mint IDRX | `idrxZcP8xiKkYk6XGD4uz1dxEYCWSgKDHqgjsBbwDur` | Mint SPL Token klasik, 2 desimal. |
| 2 | Akun IDRX penerima fee | `A8uv9g4UToebWkLazAFX9D4nHgHNrfHdcnmLHwzVZNgF` | Akun SPL Token klasik berstatus `initialized`, dengan mint IDRX yang benar. |
| 3 | Otoritas sumber dan fee payer | Wallet publik uji | Akun milik System Program dengan saldo SOL yang memungkinkan kedua simulasi mencapai instruksi fee. |

Pembacaan akun berada pada slot `474801986` dan `474801990`. SPL Token melakukan unpack data akun sumber sebelum memeriksa saldo, mint, desimal, atau otoritas. Karena ATA sumber tidak ada, program menerima data yang tidak bisa di-decode sebagai akun token. Simulasi terpisah yang hanya berisi instruksi fee dengan empat akun yang sama kembali menghasilkan `[0, "InvalidAccountData"]` pada slot `474802282`. Pencarian `getTokenAccountsByOwner` dengan filter mint IDRX pada slot `474802283` mengembalikan nol akun. Saldo SOL wallet cukup untuk mencapai instruksi fee dalam dua simulasi. Kecukupan SOL untuk seluruh swap dan penyimpanan akun belum teruji. [SPL Token, urutan proses transfer](https://github.com/solana-program/token/blob/main/program/src/processor.rs#L207-L245) · [Solana, pembacaan akun](https://solana.com/developers/docs/rpc/http/getmultipleaccounts) · [Solana, akun token milik wallet](https://solana.com/developers/docs/rpc/http/gettokenaccountsbyowner)

## ATA tujuan dan kondisi Token-2022

| Produk / mint | ATA tujuan wallet | Penyiapan dalam payload |
| --- | --- | --- |
| AAPLx / `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp` | ATA AAPLx turunan wallet uji | ATA belum ada dan terdaftar sebagai akun instruksi router Titan. Payload tidak memuat pembuatan ATA sebagai instruksi tingkat atas. Penyiapan oleh router belum terbukti lewat simulasi. |
| AAPLon / `123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo` | ATA AAPLon turunan wallet uji | ATA belum ada. `CreateIdempotent` di indeks 4 memakai mint AAPLon, wallet sebagai payer dan pemilik, serta Token-2022. Indeks 5 menyiapkan ATA USDC klasik yang sudah ada. Kedua instruksi berada setelah fee. |

Kedua mint dimiliki Token-2022 (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`). Pada saat pemeriksaan, keduanya memiliki `defaultAccountState.accountState = initialized`, `pausableConfig.paused = false`, dan ekstensi `transferHook` dengan `programId = null`. Tanpa program hook yang dikonfigurasi, transfer tidak memerlukan `ExtraAccountMetaList` untuk hook pada snapshot ini. Jika program hook dikonfigurasi kemudian, validasi perlu memakai PDA `extra-account-metas` dan daftar akun untuk transfer yang relevan. Status on-chain ini tidak membuktikan kelayakan wallet atau persetujuan distribusi. [Solana, ATA dan program token](https://solana.com/developers/docs/tokens/basics/create-token-account) · [Solana, integrasi transfer hook](https://solana.com/developers/docs/tokens/extensions/transfer-hook-integration) · [Kelayakan produk untuk Indonesia](eligibility-evidence.md)

## Rekonsiliasi fee kuotasi

Kuotasi baru untuk AAPLx dan AAPLon dengan input 100.000 IDRX menandai fee protokol 250 IDRX sebagai termasuk dalam input. Langkah protokol mencatat 10.000.000 unit atomik masuk dan 9.975.000 unit dilanjutkan ke swap. Rent akun sebesar 1.559.560 lamport dilaporkan terpisah dari input IDRX. Pengembalian gas dan rent perlu dihitung dalam basis biaya sebelum penawaran layak diperingkat. Fee berasal dari instruksi SPL yang benar-benar ada dalam payload LI.FI dan instruksinya dipertahankan.

## Prasyarat verifikasi lanjutan

- Gunakan wallet sumber yang sudah berwenang untuk pengujian, dengan ATA IDRX yang cocok, saldo IDRX untuk seluruh debit kuotasi termasuk fee, dan SOL yang cukup untuk biaya jaringan dan rent akun yang dibebankan kepadanya.
- Ambil kuotasi baru untuk wallet itu. Periksa akun sumber dan tujuan, cara penyiapan ATA Token-2022, konfigurasi mint dan hook saat itu, biaya, minimum output, serta program setiap langkah. Simulasikan payload yang sama secara utuh. Bukti pada setiap rute perlu mencakup CPI yang terjadi dan perubahan saldo penerima yang memenuhi minimum output.
- Kelayakan investor dan persetujuan distribusi 1Stocks tetap berstatus `VERIFICATION_REQUIRED`. Penyelesaian transaksi dan keberhasilan kedua swap mainnet belum terverifikasi. [Bukti kelayakan dan tingkat pembuktian](eligibility-evidence.md)
