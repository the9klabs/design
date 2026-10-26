import type { I9kIconName } from '../types/icons';

export type I9kAskAiProvider = 'chatgpt' | 'perplexity' | 'claude';

export interface I9kAskAiProviderInfo {
  id: I9kAskAiProvider;
  name: string;
  icon: I9kIconName;
  /** The address that opens the assistant with `prompt` already typed in. */
  url: (prompt: string) => string;
}

// Each assistant reads its `q` parameter as the first message of a new chat.
// The prompt is encoded whole, so a question that holds a URL, `&` or Arabic
// text reaches the assistant as written.
export const I9K_ASK_AI_PROVIDERS: Record<I9kAskAiProvider, I9kAskAiProviderInfo> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: 'chatgpt',
    url: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    icon: 'perplexity',
    url: (prompt) => `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}`,
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    icon: 'claude',
    url: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
};

export const askAiUrl = (provider: I9kAskAiProvider, prompt: string): string =>
  I9K_ASK_AI_PROVIDERS[provider].url(prompt);
