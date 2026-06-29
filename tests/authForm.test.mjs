import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const authFormUrl = new URL("../components/AuthForm.jsx", import.meta.url);

test("AuthForm defines autocomplete attributes for name, email, and password fields", async () => {
  const source = await readFile(authFormUrl, "utf8");
  assert.match(source, /autoComplete="name"/);
  assert.match(source, /autoComplete="email"/);
  assert.match(source, /autoComplete=\{isRegister \? "new-password" : "current-password"\}/);
});
