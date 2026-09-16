import type { GeminiClient } from '../gemini/client.js';
export interface Account { id: string; client: GeminiClient; enabled: boolean; failures: number; lastUsedAt: number; }
