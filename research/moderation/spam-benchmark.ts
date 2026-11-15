export interface SpamEvaluationContext {
  userId: string;
  accountAgeHours: number;
  reputation: number;
  recentMessageCountLastMinute: number;
  body: string;
  previousRecentBodies: string[];
}

export interface SpamAnalysisResult {
  isSpam: boolean;
  spamScore: number; // 0.0 to 1.0
  reasons: string[];
}

const SPAM_PATTERNS = [
  /\b(?:whatsapp|telegram|call me|earn money|crypto|betting|lottery|pnr prediction for free)\b/i,
  /\b(?:https?:\/\/|t\.me\/|wa\.me\/|bit\.ly\/)\S+/i,
  /(.)\1{5,}/, // Excessive repeated characters
];

export function analyzeSpamSignals(ctx: SpamEvaluationContext): SpamAnalysisResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Burst Frequency (Rate limiting signal)
  if (ctx.recentMessageCountLastMinute >= 5) {
    score += 0.4;
    reasons.push('High message burst velocity');
  } else if (ctx.recentMessageCountLastMinute >= 3) {
    score += 0.2;
    reasons.push('Moderate message velocity');
  }

  // 2. Duplicate Text Flooding
  const isDuplicate = ctx.previousRecentBodies.some(
    (prev) => prev.trim().toLowerCase() === ctx.body.trim().toLowerCase(),
  );
  if (isDuplicate) {
    score += 0.35;
    reasons.push('Duplicate message text');
  }

  // 3. Promotional keywords / external links
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(ctx.body)) {
      score += 0.3;
      reasons.push('Matches promotional or link pattern');
      break;
    }
  }

  // 4. Account age & reputation discount
  if (ctx.accountAgeHours < 1 && ctx.reputation <= 0) {
    score += 0.15;
    reasons.push('Fresh unverified account');
  } else if (ctx.reputation > 50) {
    // Trusted user discount
    score = Math.max(0, score - 0.2);
  }

  const finalScore = Number(Math.min(1.0, Math.max(0.0, score)).toFixed(2));
  return {
    isSpam: finalScore >= 0.65,
    spamScore: finalScore,
    reasons,
  };
}
