import CryptoJS from "crypto-js";

/**
 * VaultChain Cryptographic Utilities
 * Enforces production-grade local encryption (AES-256 + PBKDF2 + SHA-256).
 * 
 * Flow:
 * 1. Master Password + Salt -> PBKDF2 (10,000 iterations) -> 256-bit Key
 * 2. Key + Plaintext JSON -> AES-256-CBC (Random IV) -> Ciphertext
 * 3. Ciphertext + IV -> Encrypted Payload -> IPFS
 */

/**
 * Derives a 256-bit key from a password and salt using PBKDF2.
 * @param password User's master password
 * @param salt Unique user salt
 * @returns hex-encoded derived key
 */
export const deriveMasterKey = (password: string, salt: string): string => {
  const iterations = 10000;
  const keySize = 256 / 32; // 8 words = 256 bits
  const derivedBytes = CryptoJS.PBKDF2(password, salt, {
    keySize: keySize,
    iterations: iterations,
    hasher: CryptoJS.algo.SHA256,
  });
  return derivedBytes.toString(CryptoJS.enc.Hex);
};

/**
 * Encrypts data using AES-256-CBC with the derived master key.
 * @param plaintext Plaintext string to encrypt (e.g. JSON stringified password record)
 * @param hexKey Hex-encoded 256-bit key
 * @returns string JSON containing ciphertext and initialization vector (IV)
 */
export const encryptLocal = (plaintext: string, hexKey: string): string => {
  const key = CryptoJS.enc.Hex.parse(hexKey);
  const iv = CryptoJS.lib.WordArray.random(16); // 128-bit Initialization Vector

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const payload = {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Hex),
  };

  return JSON.stringify(payload);
};

/**
 * Decrypts data using AES-256-CBC with the derived master key.
 * @param encryptedJson JSON string containing ciphertext and iv
 * @param hexKey Hex-encoded 256-bit key
 * @returns string decrypted plaintext
 */
export const decryptLocal = (encryptedJson: string, hexKey: string): string => {
  try {
    const key = CryptoJS.enc.Hex.parse(hexKey);
    const { ciphertext, iv } = JSON.parse(encryptedJson);

    const decrypted = CryptoJS.AES.decrypt(
      CryptoJS.lib.CipherParams.create({
        ciphertext: CryptoJS.enc.Base64.parse(ciphertext),
      }),
      key,
      {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    const plain = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plain) {
      throw new Error("Decryption failed: empty payload (possibly invalid key)");
    }
    return plain;
  } catch (error: any) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Creates a SHA-256 hash of a string.
 * Used for storing password hashes to verify integrity or match salts.
 */
export const hashSHA256 = (text: string): string => {
  return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
};
