import { TokenUsageService } from './token-usage-service';
import { useAppStore } from '@/store/appStore';

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
    if (!apiKey) {
      throw new Error('DeepSeekProvider: API key is required.');
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
        console.error('Deepseek API Error:', response.status, errorBody);
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
        console.error('Deepseek API response does not contain expected data:', responseData);
        throw new Error('Invalid response structure from Deepseek API.');
      }
    } catch (error) {
      console.error('Error calling Deepseek API:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching AI advice.');
    }
  }
}

// --- Generic AI Chat Service ---
// This service will be responsible for selecting and using the configured AI provider.
// For now, it's a basic structure. It will be enhanced to read configuration from Zustand.

export class AiChatService {
  private provider: AiChatProvider | null = null;

  constructor() {
    // This constructor will be updated to initialize the provider based on stored settings.
    // For now, it doesn't initialize any provider automatically.
    // The user/app will need to call a method to set up the provider.
  }

  public initializeProvider(): void {
    const { decryptedAiApiKey, currentAiProvider, aiServiceBaseUrl } = useAppStore.getState();

    if (!decryptedAiApiKey) {
      console.warn('AI Service: API key not available. Provider not initialized.');
      this.provider = null;
      return;
    }

    // Later, we will use aiServiceBaseUrl for providers like Ollama
    switch (currentAiProvider) {
      case 'deepseek':
        this.provider = new DeepSeekProvider(decryptedAiApiKey);
        console.log('AI Service: Initialized with DeepSeekProvider.');
        break;
      // case 'groq':
      //   this.provider = new GroqProvider(decryptedAiApiKey, aiServiceBaseUrl); // Assuming GroqProvider might also need a base URL or model specifier
      //   console.log('AI Service: Initialized with GroqProvider.');
      //   break;
      // case 'ollama_local':
      //   this.provider = new OllamaProvider(aiServiceBaseUrl || 'http://localhost:11434'); // Ollama typically doesn't need an API key but needs a base URL
      //   console.log('AI Service: Initialized with OllamaProvider.');
      //   break;
      default:
        console.warn(`AI Service: Unknown or unsupported provider "${currentAiProvider}". Provider not initialized.`);
        this.provider = null;
    }
  }

  public isConfigured(): boolean {
    this.initializeProvider(); // Ensure provider is current with store state
    return !!this.provider;
  }

  public async getFinancialAdvice(prompt: string, systemContext?: string): Promise<AiAdviceResponse> {
    this.initializeProvider(); // Re-initialize/check provider on each call to ensure it's current

    if (!this.provider) {
      throw new Error('AI Service Provider not configured or API key missing. Please check settings.');
    }
    return this.provider.getChatCompletion(prompt, systemContext);
  }

  // Add other methods like getChatCompletionStream if needed, delegating to this.provider
}

// Export a singleton instance of the service
const aiChatServiceInstance = new AiChatService();
export default aiChatServiceInstance;

// Example of how components would use it:
// import aiChatServiceInstance from '@/services/AiChatService';
//
// async function someFunction() {
//   if (aiChatServiceInstance.isConfigured()) {
//     const result = await aiChatServiceInstance.getFinancialAdvice("My prompt");
//     console.log(result.advice);
//   } else {
//     console.log("AI Service not configured.");
//   }
// }
//
// Or, more directly if configuration is expected to be handled at app start / PIN unlock:
// const { advice } = await aiChatServiceInstance.getFinancialAdvice("My prompt");

// Placeholder for GroqProvider - to be implemented if chosen
// class GroqProvider implements AiChatProvider {
//   constructor(private apiKey: string, private model?: string) {}
//   async getChatCompletion(prompt: string, systemContext?: string): Promise<AiAdviceResponse> {
//     // Implementation for Groq API
//     console.log("GroqProvider called with prompt:", prompt, "systemContext:", systemContext, "apiKey:", this.apiKey, "model:", this.model);
//     return { advice: "Groq response placeholder", usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }};
//   }
// }

// Placeholder for OllamaProvider - to be implemented if chosen
// class OllamaProvider implements AiChatProvider {
//   constructor(private baseUrl: string, private model?: string) {}
//   async getChatCompletion(prompt: string, systemContext?: string): Promise<AiAdviceResponse> {
//     // Implementation for Ollama API
//     console.log("OllamaProvider called with prompt:", prompt, "systemContext:", systemContext, "baseUrl:", this.baseUrl, "model:", this.model);
//     return { advice: "Ollama response placeholder", usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }};
//   }
// }

// The TokenUsageService import and usage within DeepSeekProvider is maintained.
// The new AiChatService class will use Zustand store for API key and provider choice.
// Components will import and use the AiChatService instance.
// The PinLock component will be responsible for setting the API key and provider choice in Zustand.
// The AiChatService will then pick up these settings from Zustand to initialize the correct provider.
