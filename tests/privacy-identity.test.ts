import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '@/server/auth/session';
import {
  completeOnboarding,
  getMe,
  updateAnonymous,
  updatePrivacy,
} from '@/server/profiles/service';
import {
  serializeAnonymousProfile,
  serializePrivateProfile,
} from '@/server/api/serializers';
import { resetStore } from '@/server/store';

describe('Anonymous Identity & Privacy Isolation', () => {
  beforeEach(() => {
    resetStore();
  });

  it('completes onboarding and maintains strict separation between private and public identity', async () => {
    const user = await createUser('privacy_test@railbandhan.in', 'Password1234!');

    const { profile, anonymousProfile } = await completeOnboarding({
      userId: user.id,
      realName: 'Aarav Sharma',
      age: 28,
      gender: 'Male',
      publicHandle: 'Passenger_Chai42',
    });

    expect(profile).not.toBeNull();
    expect(anonymousProfile).not.toBeNull();
    expect(profile!.realName).toBe('Aarav Sharma');
    expect(profile!.age).toBe(28);
    expect(anonymousProfile!.publicHandle).toBe('Passenger_Chai42');
    expect(anonymousProfile!.onboardingComplete).toBe(true);

    // Serialization check: Public profile must NEVER include real name, email or age
    const publicSerialized = serializeAnonymousProfile(anonymousProfile!);
    expect(publicSerialized).not.toHaveProperty('real_name');
    expect(publicSerialized).not.toHaveProperty('email');
    expect(publicSerialized).not.toHaveProperty('age');
    expect(publicSerialized).not.toHaveProperty('user_id');
    expect(publicSerialized.public_handle).toBe('Passenger_Chai42');

    // Private profile contains real name
    const privateSerialized = serializePrivateProfile(profile!);
    expect(privateSerialized.real_name).toBe('Aarav Sharma');
    expect(privateSerialized.age).toBe(28);
  });

  it('prevents handle collision across users', async () => {
    const user1 = await createUser('u1@railbandhan.in', 'Password1234!');
    const user2 = await createUser('u2@railbandhan.in', 'Password1234!');

    await completeOnboarding({
      userId: user1.id,
      realName: 'User One',
      publicHandle: 'Passenger_SpeedyTrain',
    });

    await expect(
      completeOnboarding({
        userId: user2.id,
        realName: 'User Two',
        publicHandle: 'Passenger_SpeedyTrain',
      }),
    ).rejects.toThrow('Handle is already taken');
  });

  it('updates privacy preferences without leaking sensitive data', async () => {
    const user = await createUser('prefs@railbandhan.in', 'Password1234!');
    await completeOnboarding({
      userId: user.id,
      realName: 'Privacy Champion',
      publicHandle: 'Passenger_Quiet',
    });

    const updated = await updatePrivacy({
      userId: user.id,
      discoveryVisible: false,
      messagingPolicy: 'nobody',
      coachVisibility: 'never',
    });

    expect(updated.discoveryVisible).toBe(false);
    expect(updated.messagingPolicy).toBe('nobody');
    expect(updated.coachVisibility).toBe('never');

    const me = await getMe(user.id);
    expect(me.anonymousProfile?.messagingPolicy).toBe('nobody');
  });
});
