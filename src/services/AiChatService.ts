import { TokenUsageService } from './token-usage-service';
import { useAppStore } from '@/store/appStore';
// import { shallow } from 'zustand/shallow'; // Uncomment if using Zustand subscription with shallow equality

// --- Interfaces ---
interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AiAdviceResponse {
  advice: string;
  usage?: TokenUsage;
}

export interface AiChatProvider {
  getChatCompletion(prompt: string, systemContext?: string): Promise<AiAdviceResponse>;
}

// --- DeepSeek Provider Implementation ---
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL_NAME = 'deepseek-chat'; // Default model

interface DeepseekApiRequestBody {
  model: string;
  messages: AiChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface DeepseekApiResponseChoice {
  message: {
    role: 'assistant';
    content: string;
  };
}

interface DeepseekApiResponseBody {
  choices: DeepseekApiResponseChoice[];
  usage?: TokenUsage;
}

class DeepSeekProvider implements AiChatProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = DEEPSEEK_MODEL_NAME) {
    if (!apiKey || apiKey.trim() === '') { // More robust check
      throw new Error('DeepSeekProvider: API key is required and cannot be empty.');
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  async getChatCompletion(prompt: string, systemContext?: string): Promise<AiAdviceResponse> {
    const messages: AiChatMessage[] = [];
    if (systemContext) {
      messages.push({ role: 'system', content: systemContext });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody: DeepseekApiRequestBody = {
      model: this.model,
      messages: messages,
      max_tokens: 1500,
      temperature: 0.3,
    };

    try {
      const response = await fetch(DEEPSEEK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[DeepSeekProvider] API Error:', response.status, errorBody);
        throw new Error(`Deepseek API request failed with status ${response.status}: ${errorBody}`);
      }

      const responseData = (await response.json()) as DeepseekApiResponseBody;

      if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
        const adviceContent = responseData.choices[0].message.content.trim();
        const usageData = responseData.usage;

        if (usageData && typeof usageData.total_tokens === 'number') {
          TokenUsageService.addUsage(usageData.total_tokens);
        }

        return {
          advice: adviceContent,
          usage: usageData,
        };
      } else {
        console.error('[DeepSeekProvider] API response does not contain expected data:', responseData);
        throw new Error('Invalid response structure from Deepseek API.');
      }
    } catch (error) {
      console.error('[DeepSeekProvider] Error calling Deepseek API:', error);
      if (error instanceof Error) {
        throw error; // Re-throw original error if it's already an Error instance
      }
      throw new Error('An unexpected error occurred while fetching AI advice from DeepSeek.');
    }
  }
}

// --- Generic AI Chat Service ---
export class AiChatService {
  private provider: AiChatProvider | null = null;

  constructor() {
    console.log('[AiChatService] Constructor: Initializing service and attempting first provider setup.');
    this.initializeProvider();

    // Optional: Subscribe to store changes for more reactive provider updates
    // Make sure to import `shallow` from `zustand/shallow` if you uncomment this.
    /*
    useAppStore.subscribe(
      (state) => ({
        apiKey: state.decryptedAiApiKey,
        provider: state.currentAiProvider,
        baseUrl: state.aiServiceBaseUrl
      }),
      (newConfig, oldConfig) => {
        if (newConfig.apiKey !== oldConfig.apiKey ||
            newConfig.provider !== oldConfig.provider ||
            newConfig.baseUrl !== oldConfig.baseUrl) {
          console.log('[AiChatService] AI Config changed in store, re-initializing provider.');
          this.initializeProvider();
        }
      },
      { equalityFn: shallow }
    );
    */
  }

  public initializeProvider(): void {
    const { decryptedAiApiKey, currentAiProvider, aiServiceBaseUrl } = useAppStore.getState();
    console.log('[AiChatService] initializeProvider called. Store state:', { decryptedAiApiKey: decryptedAiApiKey ? '********' : null, currentAiProvider, aiServiceBaseUrl });

    this.provider = null; // Reset provider before attempting to initialize

    if (!currentAiProvider) {
      console.warn('[AiChatService] currentAiProvider is null or empty. Provider not initialized.');
      return;
    }

    try {
      switch (currentAiProvider) {
        case 'deepseek':
          if (!decryptedAiApiKey || decryptedAiApiKey.trim() === '') {
            console.warn('[AiChatService] DeepSeek selected, but API key is empty or null. Provider not initialized.');
            return;
          }
          this.provider = new DeepSeekProvider(decryptedAiApiKey);
          console.log('[AiChatService] Initialized with DeepSeekProvider.');
          break;
        case 'groq':
          if (!decryptedAiApiKey || decryptedAiApiKey.trim() === '') {
            console.warn('[AiChatService] Groq selected, but API key is empty or null. Provider not initialized.');
            return;
          }
          // Placeholder: Replace with actual GroqProvider instantiation
          // this.provider = new GroqProvider(decryptedAiApiKey);
          console.warn('[AiChatService] GroqProvider not yet implemented. Provider not initialized.');
          break;
        case 'ollama_local':
          if (!aiServiceBaseUrl || aiServiceBaseUrl.trim() === '') {
            console.warn('[AiChatService] Ollama (Local) selected, but Base URL is not available or empty. Provider not initialized.');
            return;
          }
          // Placeholder: Replace with actual OllamaProvider instantiation
          // this.provider = new OllamaProvider(aiServiceBaseUrl);
          console.warn('[AiChatService] OllamaProvider not yet implemented. Provider not initialized.');
          break;
        case 'google_gemini':
            if (!decryptedAiApiKey || decryptedAiApiKey.trim() === '') {
              console.warn('[AiChatService] Google Gemini selected, but API key is empty or null. Provider not initialized.');
              return;
            }
            // Placeholder: this.provider = new GoogleGeminiProvider(decryptedAiApiKey);
            console.warn('[AiChatService] GoogleGeminiProvider not yet implemented. Provider not initialized.');
            break;
        default:
          console.warn(`[AiChatService] Unknown or unsupported provider "${currentAiProvider}". Provider not initialized.`);
      }
    } catch (error) {
        console.error(`[AiChatService] Error initializing provider '${currentAiProvider}':`, error);
        this.provider = null; // Ensure provider is null if instantiation fails
    }
  }

  public isConfigured(): boolean {
    // Consider if initializeProvider is needed here if using the subscription model.
    // If not using subscription, then yes, keep it to reflect latest store state.
    this.initializeProvider();
    console.log('[AiChatService] isConfigured called. Provider is currently:', this.provider ? 'Set' : 'Not Set');
    return !!this.provider;
  }

  public async getFinancialAdvice(prompt: string, systemContext?: string): Promise<AiAdviceResponse> {
    // Consider if initializeProvider is needed here if using the subscription model.
    this.initializeProvider();

    if (!this.provider) {
      console.error('[AiChatService] getFinancialAdvice called but provider is not configured.');
      throw new Error('AI Service Provider not configured. Please check PIN/Settings for API key, provider, and Base URL if applicable.');
    }
    console.log(`[AiChatService] Calling getChatCompletion on provider for prompt: "${prompt.substring(0, 100)}..."`);
    return this.provider.getChatCompletion(prompt, systemContext);
  }
}

const aiChatServiceInstance = new AiChatService();
export default aiChatServiceInstance;
