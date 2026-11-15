export interface SpamCheckContext {
  userId: string;
  body: string;
  recentMessagesLastMinute?: number;
  recentSimilarBodies?: string[];
  reputation?: number;
}

export interface SpamCheckResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
}

const PROMOTIONAL_PATTERNS = [
  /\b(?:whatsapp|telegram|call me|earn money|crypto|betting|lottery|pnr prediction for free)\b/i,
  /\b(?:https?:\/\/|t\.me\/|wa\.me\/|bit\.ly\/)\S+/i,
  /(.)\1{5,}/, // 6 or more identical consecutive characters
];

const ABUSIVE_PATTERNS = [
  /\b(?:bitch|bastard|idiot|scam|fraud)\b/i,
];

export function detectSpamAndAbuse(ctx: SpamCheckContext): SpamCheckResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Message velocity
  if (ctx.recentMessagesLastMinute && ctx.recentMessagesLastMinute >= 5) {
    score += 0.4;
    reasons.push('High message velocity (rate limit warning)');
  } else if (ctx.recentMessagesLastMinute && ctx.recentMessagesLastMinute >= 3) {
    score += 0.2;
    reasons.push('Moderate message velocity');
  }

  // 2. Duplicate text detection
  if (ctx.recentSimilarBodies && ctx.recentSimilarBodies.length > 0) {
    const isDup = ctx.recentSimilarBodies.some(
      (prev) => prev.trim().toLowerCase() === ctx.body.trim().toLowerCase(),
    );
    if (isDup) {
      score += 0.35;
      reasons.push('Duplicate message text');
    }
  }

  // 3. Promotional patterns
  for (const pattern of PROMOTIONAL_PATTERNS) {
    if (pattern.test(ctx.body)) {
      score += 0.65;
      reasons.push('Promotional keyword or external link');
      break;
    }
  }

  // 4. Abusive language pattern
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(ctx.body)) {
      score += 0.5;
      reasons.push('Potentially abusive or hostile language');
      break;
    }
  }

  // 5. Reputation adjustment
  if (ctx.reputation && ctx.reputation > 50) {
    score = Math.max(0, score - 0.2);
  }

  const finalScore = Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
  return {
    isSpam: finalScore >= 0.6,
    score: finalScore,
    reasons,
  };
}
