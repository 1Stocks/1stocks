import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPair, SignJWT, type JWTPayload } from "jose";
import { createPrivySessionVerifier } from "../app/_server/privy-session";

const appId = "test-privy-app";
const now = Math.floor(Date.now() / 1_000);
const claims = {
  iss: "privy.io",
  aud: appId,
  sub: "did:privy:sample",
  sid: "sample-session",
  iat: now,
  exp: now + 600,
};

test("accepts only an app-scoped, unexpired Privy access token signed by the app key", async () => {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const verify = createPrivySessionVerifier(appId, async () => publicKey);
  const sign = (payload: JWTPayload) => new SignJWT(payload).setProtectedHeader({ alg: "ES256" }).sign(privateKey);

  assert.equal(await verify(`Bearer ${await sign(claims)}`), "OK");

  for (const overrides of [
    { aud: "different-app" },
    { iss: "different-issuer" },
    { exp: now - 60 },
    { sub: "not-a-privy-user" },
    { sid: undefined },
  ]) {
    const token = await sign({ ...claims, ...overrides });
    assert.equal(await verify(`Bearer ${token}`), "UNAUTHORIZED");
  }

  const other = await generateKeyPair("ES256");
  const forged = await new SignJWT(claims).setProtectedHeader({ alg: "ES256" }).sign(other.privateKey);
  assert.equal(await verify(`Bearer ${forged}`), "UNAUTHORIZED");
});

test("rejects absent or malformed bearer credentials without hitting Privy", async () => {
  const verify = createPrivySessionVerifier(appId, async () => assert.fail("must not resolve keys"));
  assert.equal(await verify(null), "UNAUTHORIZED");
  assert.equal(await verify("Bearer malformed"), "UNAUTHORIZED");
  assert.equal(await verify(`Bearer ${"x".repeat(8_200)}.a.b`), "UNAUTHORIZED");
});

test("distinguishes a verifier outage from invalid credentials", async () => {
  const { privateKey } = await generateKeyPair("ES256");
  const token = await new SignJWT(claims).setProtectedHeader({ alg: "ES256" }).sign(privateKey);
  const verify = createPrivySessionVerifier(appId, async () => { throw new TypeError("unreachable"); });
  assert.equal(await verify(`Bearer ${token}`), "AUTH_UNAVAILABLE");
});
