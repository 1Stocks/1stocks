import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test, { type TestContext } from "node:test";
import { address } from "@solana/kit";
import { tokenRegistry } from "@1stocks/shared";
import { readOfficialAppleHoldings } from "../src/solana-apple-holdings";
import { readSolanaBalance, SolanaBalanceRateLimit } from "../src/solana-balance";

const wallet = address("28FQ5wVeihjGnZw93RctyAtUdtBdd6vGXWUkke49mEAw");

async function rpcFixture(context: TestContext, status: number, reply: (id: string, params: unknown[]) => string) {
  const calls: { method: string; params: unknown[] }[] = [];
  const server = createServer(async (request, response) => {
    assert.equal(request.method, "POST");
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(chunk);
    const { id, method, params } = JSON.parse(Buffer.concat(chunks).toString());
    calls.push({ method, params });
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(reply(id, params));
  });
  server.listen(0, "127.0.0.1");
  context.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  await once(server, "listening");
  const info = server.address();
  assert.ok(info && typeof info === "object");
  return { url: `http://127.0.0.1:${info.port}`, calls };
}

test("reads only the public balance and preserves lamport precision above Number.MAX_SAFE_INTEGER", async (context) => {
  const { url, calls } = await rpcFixture(context, 200, (id) =>
    `{"jsonrpc":"2.0","id":${JSON.stringify(id)},"result":{"context":{"slot":1},"value":9007199254740993}}`);

  assert.equal(await readSolanaBalance(url, wallet), 9007199254740993n);
  assert.deepEqual(calls, [{ method: "getBalance", params: [wallet, { commitment: "confirmed" }] }]);
});

test("classifies RPC rate limits", async (context) => {
  const { url } = await rpcFixture(context, 429, () => "{}");
  await assert.rejects(readSolanaBalance(url, wallet), SolanaBalanceRateLimit);
});

const appleMint = tokenRegistry.AAPLx.solanaMainnet.mint;
const ondoMint = tokenRegistry.AAPLon.solanaMainnet.mint;
const tokenAccount = "11111111111111111111111111111111";
const tokenProgram = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

function holdingsResponse(id: string, params: unknown[], owner = wallet.toString()) {
  const includeApple = JSON.stringify(params[1]) === JSON.stringify({ mint: appleMint.address });
  return JSON.stringify({
    jsonrpc: "2.0", id, result: {
      context: { slot: 1 },
      value: includeApple ? [{
        pubkey: tokenAccount, account: {
          owner: tokenProgram, lamports: 1, executable: false, rentEpoch: 0, space: 165,
          data: { program: "spl-token-2022", space: 165, parsed: { type: "account", info: {
            owner, mint: appleMint.address, tokenAmount: {
              amount: "9007199254740993", decimals: 8, uiAmountString: "99079191.802151", uiAmount: 99079191.802151,
            },
          } } },
        },
      }] : [],
    },
  });
}

test("reads only official Apple mints and keeps the RPC display amount as a string", async context => {
  const { url, calls } = await rpcFixture(context, 200, holdingsResponse);

  assert.deepEqual(await readOfficialAppleHoldings(wallet, url), [{
    token: "AAPLx", account: tokenAccount, amountAtomic: "9007199254740993", amountDisplay: "99079191.802151",
  }]);
  const options = { commitment: "confirmed", encoding: "jsonParsed" };
  assert.equal(calls.length, 2);
  for (const mint of [appleMint.address, ondoMint.address]) {
    assert.ok(calls.some(call => JSON.stringify(call) === JSON.stringify({
      method: "getTokenAccountsByOwner", params: [wallet, { mint }, options],
    })));
  }
});

test("rejects inconsistent token ownership and distinguishes throttling from a zero balance", async context => {
  const badOwner = await rpcFixture(context, 200, (id, params) => holdingsResponse(id, params, tokenAccount));
  await assert.rejects(readOfficialAppleHoldings(wallet, badOwner.url), /Invalid official Solana token account/);
  const limited = await rpcFixture(context, 429, () => "{}");
  await assert.rejects(readOfficialAppleHoldings(wallet, limited.url), SolanaBalanceRateLimit);
});
