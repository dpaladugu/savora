import { TokenUsageService } from './token-usage-service'; // Import TokenUsageService

// User needs to verify these from Deepseek documentation.
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions'; // EXAMPLE - VERIFY THIS (Ensure this is your actual endpoint)
const DEEPSEEK_MODEL_NAME = 'deepseek-chat'; // EXAMPLE - VERIFY THIS (Ensure this is your actual model)

import { useAppStore } from '@/store/appStore'; // Import Zustand store

// Correctly access the API key using Vite's import.meta.env
// const VITE_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY; // No longer directly used here

interface DeepseekChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepseekApiRequestBody {
  model: string;
  messages: DeepseekChatMessage[];
  max_tokens?: number;
  temperature?: number;
  // Add any other parameters required by Deepseek API
}

interface DeepseekApiResponseChoice {
  message: {
    role: 'assistant';
    content: string;
  };
  // Add other fields if present in the response, like finish_reason
}

interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface DeepseekApiResponseBody {
  choices: DeepseekApiResponseChoice[];
  usage?: TokenUsage; // Add usage object, make it optional as it might not always be there
  // Add other fields like 'id', 'object', 'created', 'model' if needed
}

export interface AiAdviceResponse {
  advice: string;
  usage?: TokenUsage;
// Removed misplaced import { TokenUsageService } from './token-usage-service';
}

export class DeepseekAiService {

  public static async getFinancialAdvice(prompt: string, systemPrompt?: string): Promise<AiAdviceResponse> {
    const apiKey = useAppStore.getState().decryptedApiKey;

    if (!apiKey) {
      console.error('Deepseek API key is not available (App might be locked or key not decrypted).');
      // Option 1: Throw an error to be caught by the caller
      throw new Error('API key not available for AI service. Unlock the app or check PIN setup.');
      // Option 2: Return a specific error structure (less ideal if Promise<AiAdviceResponse> is strict)
      // return { advice: "Error: API Key not available.", usage: undefined };
    }

    const messages: DeepseekChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody: DeepseekApiRequestBody = {
      model: DEEPSEEK_MODEL_NAME,
      messages: messages,
      max_tokens: 1500,
      temperature: 0.3,
    };

    try {
      const response = await fetch(DEEPSEEK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`, // Use apiKey from Zustand store
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Deepseek API Error:', response.status, errorBody);
        throw new Error(`Deepseek API request failed with status ${response.status}: ${errorBody}`);
      }

      const responseData = (await response.json()) as DeepseekApiResponseBody;

      // Log the full response for debugging token usage structure if needed
      // console.log("Full Deepseek Response:", JSON.stringify(responseData, null, 2));

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
        console.error('Deepseek API response does not contain expected data (choices or message missing):', responseData);
        throw new Error('Invalid response structure from Deepseek API.');
      }
    } catch (error) {
      console.error('Error calling Deepseek API:', error);
      if (error instanceof Error) {
        throw error; // Re-throw original error if it's already an Error instance
      }
      throw new Error('An unexpected error occurred while fetching AI advice.');
    }
  }
}

// Example Usage (Conceptual - would be in a component)
/*
async function fetchAdvice() {
  const userPrompt = "What are some tips for saving money on groceries?";
  // The detailed persona/system prompt is now part of the main prompt in step 3 of the plan.
  // However, a short system prompt can still be useful.
  const systemContext = "You are a helpful financial assistant providing concise advice.";
  try {
    const advice = await DeepseekAiService.getFinancialAdvice(userPrompt, systemContext);
    console.log("AI Advice:", advice);
  } catch (error) {
    console.error("Failed to get advice:", error);
  }
}
*/
