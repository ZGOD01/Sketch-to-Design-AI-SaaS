import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGroq } from '@ai-sdk/groq';
import { getEnv } from '@/lib/get-env';

export function getAIModel() {
  const provider = (process.env.AI_PROVIDER || 'google').toLowerCase();

  switch (provider) {
    case 'google': {
      const apiKey = process.env.GEMINI_API_KEY || getEnv('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY environment variable. Please configure it in your .env.local file.');
      }
      const google = createGoogleGenerativeAI({ apiKey });
      return google(process.env.GEMINI_MODEL || 'gemini-2.5-flash');
    }
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY || getEnv('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error('Missing OPENAI_API_KEY environment variable. Please configure it in your .env.local file.');
      }
      const openai = createOpenAI({ apiKey });
      return openai(process.env.OPENAI_MODEL || 'gpt-4o-mini');
    }
    case 'ollama': {
      const ollama = createOpenAI({
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
        apiKey: 'ollama', // Ollama accepts any placeholder key
      });
      return ollama(process.env.OLLAMA_MODEL || 'qwen2.5-coder');
    }
    case 'groq': {
      const apiKey = process.env.GROQ_API_KEY || getEnv('GROQ_API_KEY');
      if (!apiKey) {
        throw new Error('Missing GROQ_API_KEY environment variable. Please configure it in your .env.local file.');
      }
      const groq = createGroq({ apiKey });
      return groq(process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');
    }
    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY || getEnv('ANTHROPIC_API_KEY');
      if (!apiKey) {
        throw new Error('Missing ANTHROPIC_API_KEY environment variable. Please configure it in your .env.local file.');
      }
      const anthropic = createAnthropic({ apiKey });
      return anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest');
    }
    default:
      throw new Error(`Unsupported AI_PROVIDER: "${provider}". Supported values are: google, openai, ollama, groq, anthropic.`);
  }
}
