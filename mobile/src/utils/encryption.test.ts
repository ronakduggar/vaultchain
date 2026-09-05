import { describe, it } from "node:test";
import assert from "node:assert";
import { deriveMasterKey, encryptLocal, decryptLocal, hashSHA256 } from "./encryption";

describe("Cryptographic Utilities", () => {
  const masterPassword = "SuperSecurePassword123!";
  const salt = "user-unique-salt-uuid-or-email";
  const plainData = JSON.stringify({
    website: "https://google.com",
    username: "ronak",
    password: "mySecretGooglePassword",
  });

  it("should derive the same key for the same password and salt", () => {
    const key1 = deriveMasterKey(masterPassword, salt);
    const key2 = deriveMasterKey(masterPassword, salt);

    assert.ok(key1);
    assert.strictEqual(key1.length, 64); // Hex representation of 256-bit (32 bytes) key
    assert.strictEqual(key1, key2);
  });

  it("should derive a different key for a different password or salt", () => {
    const key1 = deriveMasterKey(masterPassword, salt);
    const key2 = deriveMasterKey("wrongPassword", salt);
    const key3 = deriveMasterKey(masterPassword, "different-salt");

    assert.notStrictEqual(key1, key2);
    assert.notStrictEqual(key1, key3);
  });

  it("should encrypt and successfully decrypt the data", () => {
    const key = deriveMasterKey(masterPassword, salt);
    const encryptedPayload = encryptLocal(plainData, key);

    assert.ok(encryptedPayload);
    const parsed = JSON.parse(encryptedPayload);
    assert.ok(parsed.ciphertext);
    assert.ok(parsed.iv);

    const decryptedData = decryptLocal(encryptedPayload, key);
    assert.strictEqual(decryptedData, plainData);
    const parsedDecrypted = JSON.parse(decryptedData);
    assert.strictEqual(parsedDecrypted.password, "mySecretGooglePassword");
  });

  it("should fail to decrypt if an incorrect key is provided", () => {
    const correctKey = deriveMasterKey(masterPassword, salt);
    const wrongKey = deriveMasterKey("wrongPassword", salt);

    const encryptedPayload = encryptLocal(plainData, correctKey);

    assert.throws(() => {
      decryptLocal(encryptedPayload, wrongKey);
    });
  });

  it("should hash a string with SHA-256 and return consistent hex", () => {
    const str = "hello";
    const hash = hashSHA256(str);
    assert.strictEqual(hash, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });
});
