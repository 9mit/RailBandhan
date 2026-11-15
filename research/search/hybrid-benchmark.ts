interface SearchDoc {
  id: string;
  title: string;
  body: string;
  tags: string[];
  embedding: number[];
}

interface SearchResult {
  id: string;
  title: string;
  ftsScore: number;
  semanticScore: number;
  hybridScore: number;
}

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += (a[i] ?? 0) * (b[i] ?? 0);
  }
  return sum;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const normA = Math.sqrt(dotProduct(a, a));
  const normB = Math.sqrt(dotProduct(b, b));
  if (normA === 0 || normB === 0) return 0;
  return dotProduct(a, b) / (normA * normB);
}

// Deterministic token-based BM25 approximation for research benchmark
function tokenMatchScore(query: string, text: string): number {
  const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const textTokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0 || textTokens.length === 0) return 0;

  let matches = 0;
  for (const q of queryTokens) {
    if (textTokens.includes(q)) {
      matches += 1;
    }
  }
  return matches / queryTokens.length;
}

export function hybridRank(
  query: string,
  queryEmbedding: number[],
  docs: SearchDoc[],
  weights: { fts: number; semantic: number } = { fts: 0.4, semantic: 0.6 },
): SearchResult[] {
  return docs
    .map((doc) => {
      const ftsScore = Math.max(
        tokenMatchScore(query, doc.title) * 1.5,
        tokenMatchScore(query, doc.body),
      );
      const semanticScore = cosineSimilarity(queryEmbedding, doc.embedding);
      const hybridScore = weights.fts * ftsScore + weights.semantic * semanticScore;

      return {
        id: doc.id,
        title: doc.title,
        ftsScore: Number(ftsScore.toFixed(3)),
        semanticScore: Number(semanticScore.toFixed(3)),
        hybridScore: Number(hybridScore.toFixed(3)),
      };
    })
    .sort((a, b) => b.hybridScore - a.hybridScore);
}
