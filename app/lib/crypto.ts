import { webcrypto } from 'crypto';

const ALGORITHM = 'AES-GCM';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

// Function to convert string to ArrayBuffer is tricky with encoding, 
// usually buffers are better handled as Uint8Array.
// But we receive binary data.

export async function decryptPayload(encryptedData: ArrayBuffer, password: string): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await webcrypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const combined = new Uint8Array(encryptedData);
  
  if (combined.length < 44) {
      throw new Error("Encrypted payload is too short.");
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const authTag = combined.slice(28, 44);
  const encryptedContent = combined.slice(44);

  // In Web Crypto API (and Node's webcrypto), GCM ciphertext usually includes the tag appended at the end.
  // The Java code extracts it explicitly as separate range (28-44) and encrypted (44-end), 
  // then concatenates them as `encryptedWithTag`. 
  // So we should reconstruct [ciphertext + tag] for Web Crypto.
  
  const encryptedWithTag = new Uint8Array(encryptedContent.length + authTag.length);
  encryptedWithTag.set(encryptedContent);
  encryptedWithTag.set(authTag, encryptedContent.length);

  const keyMaterial = await webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['decrypt']
  );

  const decrypted = await webcrypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      // The authentication tag length is implicitly determined by the ciphertext size if using AES-GCM in basic mode?
      // No, usually we configure tagLength. Default is 128.
      // And the tag must be appended to the ciphertext.
    },
    keyMaterial,
    encryptedWithTag
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
