import assert from "node:assert/strict";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { amountInput, externalKeypairPath } from "../scripts/token";

test("checks demo quantities in atomic units and rejects unsigned integer overflow", () => {
  assert.equal(amountInput("1.25", 2), "1.25");
  for (const amount of ["0", "0.001", "1e2", "-1", "999999999999999999"]) {
    assert.throws(() => amountInput(amount, 2));
  }
});

test("rejects keypair paths inside the checkout, including symlinks from outside", () => {
  const tracked = fileURLToPath(new URL("../config/demo-tokens.json", import.meta.url));
  const dir = mkdtempSync(join(tmpdir(), "1stocks-keypair-path-"));
  try {
    const alias = join(dir, "alias.json");
    symlinkSync(tracked, alias);
    assert.throws(() => externalKeypairPath(tracked), /outside the repository/);
    assert.throws(() => externalKeypairPath(alias), /outside the repository/);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
