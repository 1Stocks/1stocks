import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from "jose";

export function createPrivySessionVerifier(appId: string, signingKeys?: JWTVerifyGetKey) {
  const keys = signingKeys ?? createRemoteJWKSet(
    new URL(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`),
    { timeoutDuration: 4_000 },
  );

  return async (authorization: string | null) => {
    if (!authorization || authorization.length > 8_192) return "UNAUTHORIZED" as const;
    const token = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(authorization)?.[1];
    if (!token) return "UNAUTHORIZED" as const;

    try {
      const { payload } = await jwtVerify(token, keys, {
        algorithms: ["ES256"],
        issuer: "privy.io",
        audience: appId,
        requiredClaims: ["sub", "sid", "iat", "exp"],
        clockTolerance: 5,
      });
      return typeof payload.sid === "string" && payload.sid.length > 0 &&
        typeof payload.sub === "string" && /^did:privy:[A-Za-z0-9_-]+$/.test(payload.sub)
        ? "OK" as const : "UNAUTHORIZED" as const;
    } catch (error) {
      if (error instanceof errors.JOSEError &&
          !(error instanceof errors.JWKSTimeout) && error.code !== "ERR_JOSE_GENERIC") {
        return "UNAUTHORIZED" as const;
      }
      return "AUTH_UNAVAILABLE" as const;
    }
  };
}
