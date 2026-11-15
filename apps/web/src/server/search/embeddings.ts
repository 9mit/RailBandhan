import { getAIProvider } from '@/server/ai/provider';

export function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += (a[i] ?? 0) * (b[i] ?? 0);
  }
  return sum;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  if (normA === 0 || normB === 0) return 0;
  return dotProduct(a, b) / (normA * normB);
}

export async function createEmbedding(text: string): Promise<number[]> {
  const ai = getAIProvider();
  return ai.generateEmbedding(text);
}
