import { boundedJson } from "@/server/outbound";
export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIProvider {
  generateCompletion(
    prompt: string,
    options?: GenerationOptions,
  ): Promise<string>;
  classifyText(
    text: string,
    categories: string[],
  ): Promise<{ category: string; confidence: number }>;
  generateEmbedding(text: string): Promise<number[]>;
}

export class DeterministicLocalAIProvider implements AIProvider {
  async generateCompletion(
    prompt: string,
    options?: GenerationOptions,
  ): Promise<string> {
    if (options?.systemPrompt?.includes("GROUNDED_DATA")) {
      // Extract grounded facts and present cleanly
      const dataMatch = options.systemPrompt.match(
        /<GROUNDED_DATA>([\s\S]*?)<\/GROUNDED_DATA>/,
      );
      const facts = dataMatch ? dataMatch[1].trim() : "";
      return `Based on the available journey data: ${facts}`;
    }
    return `I can help with the available journey details. Live observations may be unavailable.`;
  }

  async classifyText(
    text: string,
    categories: string[],
  ): Promise<{ category: string; confidence: number }> {
    const lower = text.toLowerCase();
    for (const cat of categories) {
      if (lower.includes(cat.toLowerCase())) {
        return { category: cat, confidence: 0.9 };
      }
    }
    return { category: categories[0] ?? "general", confidence: 0.7 };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Deterministic 384-dimensional pseudo-embedding based on string character hashes
    const embedding = new Array<number>(384).fill(0);
    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i);
      const idx = (i * 13 + code) % 384;
      embedding[idx] = (embedding[idx] + (code % 256) / 256) / 2;
    }
    // Normalize to unit vector
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)) || 1;
    return embedding.map((v) => Number((v / norm).toFixed(6)));
  }
}

export class OllamaLocalAIProvider implements AIProvider {
  constructor(
    private readonly baseUrl: string = process.env.OLLAMA_BASE_URL ??
      "http://localhost:11434",
  ) {}

  async generateCompletion(
    prompt: string,
    options?: GenerationOptions,
  ): Promise<string> {
    const model = options?.model ?? "qwen2.5:1.5b";
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      redirect: "error",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        system: options?.systemPrompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.2,
          num_predict: options?.maxTokens ?? 256,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed with status ${res.status}`);
    }

    const json = (await boundedJson(res)) as { response: string };
    return json.response;
  }

  async classifyText(
    text: string,
    categories: string[],
  ): Promise<{ category: string; confidence: number }> {
    const prompt = `Classify this text into EXACTLY ONE of [${categories.join(", ")}]. Text: "${text}". Reply with only the category name.`;
    const response = await this.generateCompletion(prompt, {
      model: "qwen2.5:0.5b",
      temperature: 0.0,
      maxTokens: 16,
    });
    const matched = categories.find((c) =>
      response.toLowerCase().includes(c.toLowerCase()),
    );
    return { category: matched ?? categories[0], confidence: 0.85 };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      redirect: "error",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "bge-small-en:latest",
        prompt: text,
      }),
    });

    if (!res.ok) {
      const fallback = new DeterministicLocalAIProvider();
      return fallback.generateEmbedding(text);
    }

    const json = (await boundedJson(res)) as { embedding: number[] };
    return json.embedding;
  }
}

let aiProviderInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!aiProviderInstance) {
    const providerType =
      process.env.AI_PROVIDER?.toLowerCase() ?? "deterministic";
    if (!["deterministic", "mock", "ollama"].includes(providerType))
      throw new Error("Unsupported AI_PROVIDER");
    if (providerType === "mock" && process.env.NODE_ENV === "production")
      throw new Error("Mock AI is forbidden in production");
    if (providerType === "ollama") {
      aiProviderInstance = new OllamaLocalAIProvider();
    } else {
      aiProviderInstance = new DeterministicLocalAIProvider();
    }
  }
  return aiProviderInstance;
}

// Compatibility for historical benchmark imports; not a model or live-data source.
export { DeterministicLocalAIProvider as MockLocalAIProvider };
