// Placeholder for Deepseek API configuration
// User needs to verify these from Deepseek documentation.
const DEEPSEEK_API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions'; // EXAMPLE - VERIFY THIS
const DEEPSEEK_MODEL_NAME = 'deepseek-chat'; // EXAMPLE - VERIFY THIS

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

interface DeepseekApiResponseBody {
  choices: DeepseekApiResponseChoice[];
  // Add other fields like 'id', 'object', 'created', 'model', 'usage' if needed
}

export class DeepseekAiService {
  private static apiKey: string | undefined = import.meta.env.VITE_DEEPSEEK_API_KEY;

  public static async getFinancialAdvice(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      console.error('Deepseek API key is not configured. Set VITE_DEEPSEEK_API_KEY.');
      throw new Error('API key not configured for AI service.');
    }

    const messages: DeepseekChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody: DeepseekApiRequestBody = {
      model: DEEPSEEK_MODEL_NAME,
      messages: messages,
      max_tokens: 1500, // Increased for potentially detailed advice
      temperature: 0.3,  // Lower temperature for more factual/deterministic financial advice
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
        return responseData.choices[0].message.content.trim();
      } else {
        console.error('Deepseek API response does not contain expected data:', responseData);
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
