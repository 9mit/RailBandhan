import { describe, it, expect } from 'vitest';
import { detectSpamAndAbuse } from '@/server/moderation/spam-detector';

describe('Layered Content Moderation & Spam Detection Engine', () => {
  it('flags promotional links and telegram channel invites as spam', () => {
    const res = detectSpamAndAbuse({
      userId: 'user_spammer',
      body: 'Join our telegram group t.me/free_crypto_pnr for 100% confirmed seat prediction!',
    });

    expect(res.isSpam).toBe(true);
    expect(res.score).toBeGreaterThanOrEqual(0.6);
    expect(res.reasons.some((r) => r.includes('Promotional'))).toBe(true);
  });

  it('flags high velocity bursts and duplicate text flooding', () => {
    const res = detectSpamAndAbuse({
      userId: 'user_flooder',
      body: 'Selling ticket confirm seat call 9999999999',
      recentMessagesLastMinute: 6,
      recentSimilarBodies: ['Selling ticket confirm seat call 9999999999'],
    });

    expect(res.isSpam).toBe(true);
    expect(res.score).toBeGreaterThan(0.7);
    expect(res.reasons.some((r) => r.includes('velocity'))).toBe(true);
    expect(res.reasons.some((r) => r.includes('Duplicate'))).toBe(true);
  });

  it('allows clean legitimate passenger conversation without false positives', () => {
    const res = detectSpamAndAbuse({
      userId: 'user_normal',
      body: 'Hey everyone, does anyone know if the pantry car serves breakfast before Bhopal?',
      recentMessagesLastMinute: 1,
      reputation: 60,
    });

    expect(res.isSpam).toBe(false);
    expect(res.score).toBeLessThan(0.3);
  });
});
