import axios from 'axios';

const DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";  // Free model
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

if (!DEEPSEEK_API_KEY) {
  throw new Error("DeepSeek API key is missing. Add it to your .env file as DEEPSEEK_API_KEY=your_key_here");
}

export const getFinancialInsight = async (userPrompt: string): Promise<string> => {
  try {
    const response = await axios.post(
      DEEPSEEK_API_ENDPOINT,
      {
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: "You're a financial assistant helping users manage personal finances. Provide concise, actionable suggestions."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Error:", error.response?.data || error.message);
    throw new Error("Failed to get financial insights");
  }
};