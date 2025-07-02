// Using Web Crypto API (available in modern browsers and Node.js >= 15)

const SALT = "savora-static-salt-v1"; // Should be unique and constant for your app
const ITERATIONS = 100000; // PBKDF2 iterations, higher is more secure but slower
const KEY_ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256; // AES-256

interface EncryptedData {
  iv: string; // Base64 encoded IV
  ciphertext: string; // Base64 encoded ciphertext
}

export class EncryptionService {
  private static textEncoder = new TextEncoder();
  private static textDecoder = new TextDecoder();

  private static async deriveKey(pin: string, saltString: string = SALT): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      this.textEncoder.encode(pin),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const salt = this.textEncoder.encode(saltString);

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: KEY_ALGORITHM, length: KEY_LENGTH },
      true, // Exportable: false, as we only use it internally
      ["encrypt", "decrypt"]
    );
  }

  public static async encryptData(data: object, pin: string): Promise<string | null> {
    try {
      const key = await this.deriveKey(pin);
      const iv = crypto.getRandomValues(new Uint8Array(12)); // Recommended IV size for AES-GCM
      const dataString = JSON.stringify(data);
      const encodedData = this.textEncoder.encode(dataString);

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: KEY_ALGORITHM, iv: iv },
        key,
        encodedData
      );

      const encryptedPayload: EncryptedData = {
        iv: this.bufferToBase64(iv),
        ciphertext: this.bufferToBase64(encryptedBuffer),
      };
      return JSON.stringify(encryptedPayload);
    } catch (error) {
      console.error("Encryption failed:", error);
      return null;
    }
  }

  public static async decryptData(encryptedPayloadString: string, pin: string): Promise<any | null> {
    try {
      const key = await this.deriveKey(pin);
      const encryptedPayload: EncryptedData = JSON.parse(encryptedPayloadString);

      const iv = this.base64ToBuffer(encryptedPayload.iv);
      const ciphertext = this.base64ToBuffer(encryptedPayload.ciphertext);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: KEY_ALGORITHM, iv: iv },
        key,
        ciphertext
      );

      const decryptedString = this.textDecoder.decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error)
      // Common error for wrong PIN is "DOMException: OperationError" or similar during decrypt
      console.error("Decryption failed (possibly wrong PIN or corrupted data):", error);
      return null;
    }
  }

  // Helper to convert ArrayBuffer to Base64 string
  private static bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Helper to convert Base64 string to Uint8Array
  private static base64ToBuffer(base64: string): Uint8Array {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  }
}

// --- Example Usage (for testing) ---
/*
async function testEncryption() {
  const myPin = "123456";
  const myData = { apiKey: "sk-mySuperSecretApiKey", userPreference: "darkMode" };

  console.log("Original Data:", myData);

  const encrypted = await EncryptionService.encryptData(myData, myPin);
  if (encrypted) {
    console.log("Encrypted Payload String:", encrypted);

    // Test decryption with correct PIN
    const decryptedCorrect = await EncryptionService.decryptData(encrypted, myPin);
    console.log("Decrypted with correct PIN:", decryptedCorrect); // Should match myData

    // Test decryption with wrong PIN
    const decryptedWrong = await EncryptionService.decryptData(encrypted, "wrongPin");
    console.log("Decrypted with wrong PIN:", decryptedWrong); // Should be null or throw error handled by decrypt
  } else {
    console.log("Encryption failed.");
  }
}

// testEncryption();
*/
