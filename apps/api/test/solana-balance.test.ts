import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test, { type TestContext } from "node:test";
import { address } from "@solana/kit";
import { readSolanaBalance, SolanaBalanceRateLimit } from "../src/solana-balance";

const wallet = address("28FQ5wVeihjGnZw93RctyAtUdtBdd6vGXWUkke49mEAw");

async function rpcFixture(context: TestContext, status: number, reply: (id: string) => string) {
  const calls: { method: string; params: unknown[] }[] = [];
  const server = createServer(async (request, response) => {
    assert.equal(request.method, "POST");
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(chunk);
    const { id, method, params } = JSON.parse(Buffer.concat(chunks).toString());
    calls.push({ method, params });
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(reply(id));
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
