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

    expect(key1).toBeDefined();
    expect(key1.length).toBe(64); // Hex representation of 256-bit (32 bytes) key
    expect(key1).toBe(key2);
  });

  it("should derive a different key for a different password or salt", () => {
    const key1 = deriveMasterKey(masterPassword, salt);
    const key2 = deriveMasterKey("wrongPassword", salt);
    const key3 = deriveMasterKey(masterPassword, "different-salt");

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it("should encrypt and successfully decrypt the data", () => {
    const key = deriveMasterKey(masterPassword, salt);
    const encryptedPayload = encryptLocal(plainData, key);

    expect(encryptedPayload).toBeDefined();
    const parsed = JSON.parse(encryptedPayload);
    expect(parsed.ciphertext).toBeDefined();
    expect(parsed.iv).toBeDefined();

    const decryptedData = decryptLocal(encryptedPayload, key);
    expect(decryptedData).toBe(plainData);
    const parsedDecrypted = JSON.parse(decryptedData);
    expect(parsedDecrypted.password).toBe("mySecretGooglePassword");
  });

  it("should fail to decrypt if an incorrect key is provided", () => {
    const correctKey = deriveMasterKey(masterPassword, salt);
    const wrongKey = deriveMasterKey("wrongPassword", salt);

    const encryptedPayload = encryptLocal(plainData, correctKey);

    expect(() => {
      decryptLocal(encryptedPayload, wrongKey);
    }).toThrow();
  });

  it("should hash a string with SHA-256 and return consistent hex", () => {
    const str = "hello";
    const hash = hashSHA256(str);
    expect(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });
});
