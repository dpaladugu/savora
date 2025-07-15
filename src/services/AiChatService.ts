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
export class AiChatService {
  private provider: AiChatProvider | null = null;
  private currentProviderConfig: { apiKey?: string; provider?: string; baseUrl?: string; model?: string } | null = null;

  constructor() {
    // this.initializeProvider(); // Initialize based on current store state
  }

  // Initialize or re-initialize the provider if settings have changed
  private initializeProvider(): boolean {
    const { decryptedAiApiKey: apiKey, currentAiProvider: providerName, aiServiceBaseUrl: baseUrl, currentAiModel: model } = useAppStore.getState();

    // Check if configuration has actually changed to prevent unnecessary re-initialization
    if (
      this.provider &&
      this.currentProviderConfig &&
      this.currentProviderConfig.apiKey === apiKey &&
      this.currentProviderConfig.provider === providerName &&
      this.currentProviderConfig.baseUrl === baseUrl &&
      this.currentProviderConfig.model === model
    ) {
      return true; // Already configured with the same settings
    }

    this.provider = null; // Reset provider before attempting to initialize
    this.currentProviderConfig = { apiKey, provider: providerName, baseUrl, model }; // Store current config

    switch (providerName) {
      case 'deepseek':
        if (!apiKey) {
          console.warn('AI Service: API key required for DeepSeek. Provider not initialized.');
          return false;
        }
        this.provider = new DeepSeekProvider(apiKey, model || DEEPSEEK_MODEL_NAME);
        break;
      case 'groq':
        if (!apiKey) {
          console.warn('AI Service: API key required for Groq. Provider not initialized.');
          return false;
        }
        this.provider = new GroqProvider(apiKey, model || GROQ_DEFAULT_MODEL_NAME);
        break;
      case 'ollama_local':
        // Ollama typically uses a base URL and model, API key might not be needed.
        this.provider = new OllamaProvider(baseUrl || OLLAMA_DEFAULT_BASE_URL, model || OLLAMA_DEFAULT_MODEL_NAME);
        break;
      default:
        console.warn(`AI Service: Unknown or unsupported provider "${providerName}". Provider not initialized.`);
        return false;
    }
    return !!this.provider;
  }

  public isConfigured(): boolean {
    // Re-check initialization. This will also update the provider if settings changed.
    return this.initializeProvider();
  }

  public async getFinancialAdvice(prompt: string, systemContext?: string): Promise<AiAdviceResponse> {
    // Ensure the provider is initialized with the latest settings.
    // This also handles cases where settings might change after initial instantiation of AiChatService.
    if (!this.isConfigured() || !this.provider) {
      // Attempt to re-initialize if not configured. This helps if settings are updated after service creation.
      if (!this.initializeProvider() || !this.provider) {
         throw new Error('AI Service Provider not configured, API key/Base URL missing, or provider is unsupported. Please check settings.');
      }
    }

    // Timeout handling (e.g., 30 seconds)
    const timeoutPromise = new Promise<AiAdviceResponse>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out')), 30000)
    );

    try {
      // Perform the API call with timeout
      return await Promise.race([
        this.provider.getChatCompletion(prompt, systemContext),
        timeoutPromise,
      ]);
    } catch (error) {
      console.error('AI Service Error:', error);
      // Simple error fallback: re-throw the error for now.
      // More sophisticated fallback (e.g., retry, switch provider) could be implemented here.
      if (error instanceof Error) {
        throw new Error(`Failed to get financial advice: ${error.message}`);
      }
      throw new Error('An unknown error occurred while fetching financial advice.');
    }
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

// --- Groq Provider Implementation ---
const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_DEFAULT_MODEL_NAME = 'mixtral-8x7b-32768'; // A common Groq model

class GroqProvider implements AiChatProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = GROQ_DEFAULT_MODEL_NAME) {
    if (!apiKey) {
      throw new Error('GroqProvider: API key is required.');
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

    const requestBody = { // Groq uses a similar structure to OpenAI
      model: this.model,
      messages: messages,
      max_tokens: 1500,
      temperature: 0.3,
    };

    try {
      const response = await fetch(GROQ_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Groq API Error:', response.status, errorBody);
        throw new Error(`Groq API request failed with status ${response.status}: ${errorBody}`);
      }

      const responseData = await response.json(); // Assuming similar to Deepseek/OpenAI structure

      if (responseData.choices && responseData.choices.length > 0 && responseData.choices[0].message) {
        const adviceContent = responseData.choices[0].message.content.trim();
        const usageData = responseData.usage; // Groq also provides usage data

        if (usageData && typeof usageData.total_tokens === 'number') {
          TokenUsageService.addUsage(usageData.total_tokens);
        }

        return {
          advice: adviceContent,
          usage: usageData,
        };
      } else {
        console.error('Groq API response does not contain expected data:', responseData);
        throw new Error('Invalid response structure from Groq API.');
      }
    } catch (error) {
      console.error('Error calling Groq API:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching AI advice from Groq.');
    }
  }
}

// --- Ollama Provider Implementation ---
const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434';
const OLLAMA_DEFAULT_MODEL_NAME = 'llama2'; // A common default model for Ollama

class OllamaProvider implements AiChatProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = OLLAMA_DEFAULT_BASE_URL, model: string = OLLAMA_DEFAULT_MODEL_NAME) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl; // Ensure no trailing slash
    this.model = model;
  }

  async getChatCompletion(prompt: string, systemContext?: string): Promise<AiAdviceResponse> {
    const messages: AiChatMessage[] = [];
    if (systemContext) {
      messages.push({ role: 'system', content: systemContext });
    }
    messages.push({ role: 'user', content: prompt });

    // Ollama's /api/chat endpoint expects a slightly different format
    const requestBody = {
      model: this.model,
      messages: messages,
      stream: false, // For non-streaming response
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Ollama API Error:', response.status, errorBody);
        throw new Error(`Ollama API request failed with status ${response.status}: ${errorBody}`);
      }

      const responseData = await response.json();

      // Ollama's response structure for non-streaming chat
      if (responseData.message && responseData.message.content) {
        const adviceContent = responseData.message.content.trim();
        // Ollama's /api/chat response includes usage details like "total_duration", "load_duration", "prompt_eval_count", "prompt_eval_duration", "eval_count", "eval_duration"
        // We need to map these to TokenUsage if possible, or decide how to handle them.
        // For simplicity, we'll map eval_count (output tokens) and prompt_eval_count (input tokens) if available.
        const usageData: TokenUsage | undefined = responseData.prompt_eval_count && responseData.eval_count ? {
          prompt_tokens: responseData.prompt_eval_count,
          completion_tokens: responseData.eval_count,
          total_tokens: responseData.prompt_eval_count + responseData.eval_count,
        } : undefined;

        if (usageData && typeof usageData.total_tokens === 'number') {
            TokenUsageService.addUsage(usageData.total_tokens);
        }

        return {
          advice: adviceContent,
          usage: usageData,
        };
      } else {
        console.error('Ollama API response does not contain expected data:', responseData);
        throw new Error('Invalid response structure from Ollama API.');
      }
    } catch (error) {
      console.error('Error calling Ollama API:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching AI advice from Ollama.');
    }
  }
}

// The TokenUsageService import and usage within DeepSeekProvider is maintained.
// The new AiChatService class will use Zustand store for API key and provider choice.
// Components will import and use the AiChatService instance.
// The PinLock component will be responsible for setting the API key and provider choice in Zustand.
// The AiChatService will then pick up these settings from Zustand to initialize the correct provider.
