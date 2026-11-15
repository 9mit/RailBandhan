import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/server/auth/session';
import { createReport, listReports, resolveReport } from '@/server/moderation/service';
import { getStore, resetStore } from '@/server/store';

describe('Moderation & User Reporting System', () => {
  beforeEach(() => {
    resetStore();
  });

  it('allows passengers to file safety reports', async () => {
    const passenger = await createUser('reporter@railbandhan.in', 'Password1234!');
    const badUser = await createUser('bad_actor@railbandhan.in', 'Password1234!');

    const report = await createReport({
      reporterId: passenger.id,
      targetType: 'user',
      targetId: badUser.id,
      reason: 'Inappropriate language in train chat',
    });

    expect(report.id).toBeDefined();
    expect(report.status).toBe('open');
    expect(report.reason).toBe('Inappropriate language in train chat');
  });

  it('restricts report listing and resolution to moderators/admins', async () => {
    const regularUser = await createUser('regular@railbandhan.in', 'Password1234!');
    const moderator = await createUser('mod@railbandhan.in', 'Password1234!');

    const store = getStore();
    await store.setAuthUserRole(moderator.id, 'moderator');

    const report = await createReport({
      reporterId: regularUser.id,
      targetType: 'post',
      targetId: 'post_123',
      reason: 'Spam advertisement',
    });

    // Regular user cannot view reports
    await expect(listReports(regularUser.id)).rejects.toThrow('Moderator access required');

    // Moderator can list reports
    const reports = await listReports(moderator.id);
    expect(reports.length).toBeGreaterThanOrEqual(1);

    // Moderator resolves report
    const resolved = await resolveReport({
      userId: moderator.id,
      reportId: report.id,
      status: 'resolved',
      resolution: 'Post was removed and warning issued.',
    });

    expect(resolved.status).toBe('resolved');
    expect(resolved.resolution).toBe('Post was removed and warning issued.');

    // Dismiss report
    const dismissed = await resolveReport({
      userId: moderator.id,
      reportId: report.id,
      status: 'dismissed',
      resolution: 'False alarm, message compliant.',
    });
    expect(dismissed.status).toBe('dismissed');
    expect(dismissed.resolution).toBe('False alarm, message compliant.');
  });
});
