import assert from "node:assert/strict";
import test from "node:test";

// Run against a local dev or production server, never an external service.
const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const url = new URL(baseUrl);
if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
  throw new Error("TEST_BASE_URL must point to localhost");
}

test("homepage serves 1Stocks with Indonesian document metadata", async () => {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  const html = await response.text();
  assert.match(html, /<html[^>]*lang="id"/);
  assert.match(html, /<title>1Stocks \| Beli token saham pakai rupiah<\/title>/);
  assert.match(html, /<h1[^>]*>\s*<span[^>]*>Investasi saham AS,/);
  assert.match(html, /<main\b/);
  assert.match(html, /href="\/saham\/apple"/);
  assert.match(html, /href="#cara-kerja"/);
  assert.match(html, /href="#disclaimer"/);
  assert.match(html, /\/landing\/brand-mark\.svg/);
  assert.match(html, /\/landing\/apple-sparkline\.svg/);
  assert.match(html, /Harga simulasi/);
  assert.match(html, /AAPLB<\/dt><dd[^>]*>Tidak tersedia/);
  assert.doesNotMatch(html, /AAPLB · Terbaik|Deposit Rupiah via VA|Lihat harga live/);
});

test("Apple purchase preview is reachable and accepts rupiah", async () => {
  const response = await fetch(new URL("/saham/apple", url), {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Apple \(AAPL\) \| 1Stocks<\/title>/);
  assert.match(html, /<h1>Apple Inc\.<\/h1>/);
  assert.match(html, /Jumlah \(rupiah\)/);
  assert.match(html, /Lihat estimasi/);
  assert.match(html, /href="\/pasar"/);
});

test("the application routes expose market search and real empty states", async () => {
  const routes = [
    ["/beranda", /Belum ada aset tercatat/],
    ["/pasar?q=aapl", /Apple.*AAPL/],
    ["/pasar?q=Netflix", /Tidak ada hasil untuk/],
    ["/portofolio", /Belum ada aset saham tercatat/],
    ["/riwayat?jenis=beli", /Belum ada transaksi beli/],
    ["/pengaturan", /Verifikasi identitas.*belum tersedia/],
    ["/pengaturan/keamanan", /Pengaturan passkey.*belum tersedia/],
    ["/bantuan", /Apa itu token saham\?/],
    ["/deposit", /<button[^>]*disabled[^>]*>Lanjut bayar<\/button>/],
    ["/withdraw", /<button[^>]*disabled[^>]*>Tarik dana<\/button>/],
  ];
  for (const [path, expected] of routes) {
    const response = await fetch(new URL(path, url), { signal: AbortSignal.timeout(30_000) });
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), expected, path);
  }
});

test("Apple quote endpoint rejects invalid amounts before contacting the provider", async () => {
  const response = await fetch(new URL("/api/quotes/apple?amountIdrx=0", url), {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { code: "INVALID_AMOUNT" });
});

test("Solana balance endpoint rejects invalid public addresses", async () => {
  const response = await fetch(new URL("/api/wallet/solana-balance?address=invalid", url), {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { code: "INVALID_ADDRESS" });
});

test("unknown routes return 404", async () => {
  const response = await fetch(new URL("/not-a-real-page", url), {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 404);
});
