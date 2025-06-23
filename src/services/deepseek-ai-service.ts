import axios from 'axios';

// Free tier configuration
const DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";  // Free model
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

if (!DEEPSEEK_API_KEY) {
  throw new Error("DeepSeek API key is missing. Add it to your .env file as DEEPSEEK_API_KEY=your_key_here");
}

// We'll add the core function in the next step
export const getDeepSeekResponse = async (prompt: string) => {
  // Implementation coming next
};