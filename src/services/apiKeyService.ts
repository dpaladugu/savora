import { db } from '@/db'; // Assuming @ is src, path to Dexie db instance
import { EncryptionService } from './encryptionService';

const API_KEY_SETTING_KEY = 'encryptedLlmApiKey_v1'; // Added _v1 for potential future structure changes

export class ApiKeyService {

  /**
   * Encrypts the given API key with the user's PIN and saves it to app settings.
   * @param apiKey The plaintext API key to save.
   * @param pin The user's PIN for encryption.
   * @returns Promise<void>
   * @throws Error if encryption fails or saving to DB fails.
   */
  public static async saveEncryptedApiKey(apiKey: string, pin: string): Promise<void> {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key provided.');
    }
    if (!pin || typeof pin !== 'string') {
      throw new Error('Invalid PIN provided for encryption.');
    }

    const encryptedApiKeyString = await EncryptionService.encryptData({ apiKey: apiKey }, pin);

    if (!encryptedApiKeyString) {
      throw new Error('Failed to encrypt API key.');
    }

    try {
      await db.appSettings.put({
        key: API_KEY_SETTING_KEY,
        value: encryptedApiKeyString,
      });
      console.log('API key encrypted and saved successfully.');
    } catch (error) {
      console.error('Failed to save encrypted API key to database:', error);
      throw new Error('Failed to save API key to database.');
    }
  }

  /**
   * Retrieves the encrypted API key from app settings and decrypts it using the user's PIN.
   * @param pin The user's PIN for decryption.
   * @returns Promise<string | null> The decrypted API key, or null if not found or decryption fails.
   */
  public static async getDecryptedApiKey(pin: string): Promise<string | null> {
    if (!pin || typeof pin !== 'string') {
      console.error('Invalid PIN provided for decryption.');
      return null;
    }

    try {
      const setting = await db.appSettings.get(API_KEY_SETTING_KEY);
      if (!setting || typeof setting.value !== 'string') {
        console.log('No encrypted API key found in settings.');
        return null;
      }

      const encryptedPayloadString = setting.value;
      const decryptedData = await EncryptionService.decryptData(encryptedPayloadString, pin);

      if (decryptedData && typeof decryptedData.apiKey === 'string') {
        return decryptedData.apiKey;
      } else if (decryptedData) {
        // This case should ideally not happen if encryption saves { apiKey: "value" }
        console.warn('Decrypted data is not in the expected format (missing apiKey string).');
        return null;
      } else {
        // Decryption returned null (e.g. wrong PIN)
        console.log('Failed to decrypt API key, possibly due to incorrect PIN.');
        return null;
      }
    } catch (error) {
      console.error('Error retrieving or decrypting API key:', error);
      return null;
    }
  }

  /**
   * Deletes the encrypted API key from app settings.
   * @returns Promise<void>
   * @throws Error if deletion from DB fails.
   */
  public static async deleteApiKey(): Promise<void> {
    try {
      await db.appSettings.delete(API_KEY_SETTING_KEY);
      console.log('Encrypted API key deleted successfully from settings.');
    } catch (error) {
      console.error('Failed to delete API key from database:', error);
      throw new Error('Failed to delete API key from database.');
    }
  }

  /**
   * Checks if an encrypted API key exists in the settings.
   * @returns Promise<boolean> True if an API key setting exists, false otherwise.
   */
  public static async hasApiKey(): Promise<boolean> {
    try {
      const setting = await db.appSettings.get(API_KEY_SETTING_KEY);
      return !!setting && typeof setting.value === 'string';
    } catch (error) {
      console.error('Error checking for API key:', error);
      return false; // Default to false on error
    }
  }
}

// --- Example Usage (for testing during development) ---
/*
async function testApiKeyService() {
  const userPin = "secure123";
  const userApiKey = "sk-thisIsMyTestApiKey1234567890";

  try {
    // 1. Initially, no API key should exist
    console.log("Has API Key (initial)?", await ApiKeyService.hasApiKey()); // false
    let apiKey = await ApiKeyService.getDecryptedApiKey(userPin);
    console.log("Decrypted API Key (initial):", apiKey); // null

    // 2. Save the API key
    await ApiKeyService.saveEncryptedApiKey(userApiKey, userPin);
    console.log("Has API Key (after save)?", await ApiKeyService.hasApiKey()); // true

    // 3. Retrieve with correct PIN
    apiKey = await ApiKeyService.getDecryptedApiKey(userPin);
    console.log("Decrypted API Key (correct PIN):", apiKey); // should be userApiKey
    if (apiKey !== userApiKey) {
        console.error("TEST FAILED: Decrypted key does not match original.");
    }


    // 4. Attempt to retrieve with wrong PIN
    apiKey = await ApiKeyService.getDecryptedApiKey("wrongPIN123",);
    console.log("Decrypted API Key (wrong PIN):", apiKey); // null

    // 5. Delete the API key
    await ApiKeyService.deleteApiKey();
    console.log("Has API Key (after delete)?", await ApiKeyService.hasApiKey()); // false
    apiKey = await ApiKeyService.getDecryptedApiKey(userPin);
    console.log("Decrypted API Key (after delete):", apiKey); // null

    console.log("--- Test with invalid inputs ---");
    try {
        // @ts-expect-error
        await ApiKeyService.saveEncryptedApiKey(null, userPin);
    } catch(e) {
        console.error("Error saving null API key (expected):", (e as Error).message);
    }
    try {
        // @ts-expect-error
        await ApiKeyService.saveEncryptedApiKey(userApiKey, null);
    } catch(e) {
        console.error("Error saving with null PIN (expected):", (e as Error).message);
    }


  } catch (error) {
    console.error("ApiKeyService test failed:", error);
  }
}

// testApiKeyService(); // Uncomment to run test operations
*/
