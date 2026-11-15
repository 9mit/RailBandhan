import { AppError } from "@/lib/errors";
import type {
  AnonymousProfile,
  CoachVisibility,
  MessagingPolicy,
  Profile,
} from "@/server/domain/types";
import { getStore } from "@/server/store";

export interface CompleteOnboardingInput {
  userId: string;
  realName?: string | null;
  age?: number | null;
  gender?: string | null;
  bio?: string | null;
  publicHandle?: string | null;
  discoveryVisible?: boolean;
  messagingPolicy?: AnonymousProfile["messagingPolicy"];
  coachVisibility?: AnonymousProfile["coachVisibility"];
}

export interface MeResponse {
  profile: Profile | null;
  anonymousProfile: AnonymousProfile | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function generateHandle(): string {
  const suffix = (crypto.getRandomValues(new Uint16Array(1))[0] % 9000) + 1000;
  return `Passenger_${suffix}`;
}

async function allocateUniqueHandle(): Promise<string> {
  const store = getStore();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const handle = generateHandle();
    const taken = await store.isHandleTaken(handle);
    if (!taken) {
      return handle;
    }
  }

  return `Passenger_${crypto.randomUUID().slice(0, 8)}`;
}

export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<MeResponse> {
  const store = getStore();
  if (
    input.realName &&
    (typeof input.realName !== "string" || input.realName.length > 100)
  )
    throw new AppError("validation", "Name is too long");
  if (input.bio && (typeof input.bio !== "string" || input.bio.length > 500))
    throw new AppError("validation", "Bio must be at most 500 characters");
  const timestamp = nowIso();
  const existingProfile = await store.getProfile(input.userId);

  const realName =
    (input.realName && input.realName.trim()) ||
    existingProfile?.realName ||
    "Passenger";

  if (
    input.age !== undefined &&
    input.age !== null &&
    (input.age < 13 || input.age > 120)
  ) {
    throw new AppError("validation", "Age must be between 13 and 120");
  }

  const profile = await store.upsertProfile({
    userId: input.userId,
    realName,
    age: input.age ?? existingProfile?.age ?? null,
    gender: input.gender ?? existingProfile?.gender ?? null,
    createdAt: existingProfile?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });

  const existingAnon = await store.getAnonymousProfile(input.userId);
  let publicHandle = existingAnon?.publicHandle;
  if (!publicHandle) {
    const requested = input.publicHandle?.trim();
    if (requested) {
      if (!/^[A-Za-z0-9_]{3,24}$/.test(requested)) {
        throw new AppError(
          "validation",
          "Handle must be 3-24 alphanumeric characters or underscores",
        );
      }
      const taken = await store.isHandleTaken(requested);
      if (taken) {
        throw new AppError("conflict", "Handle is already taken");
      }
      publicHandle = requested;
    } else {
      publicHandle = await allocateUniqueHandle();
    }
  }

  const rawPolicy = input.messagingPolicy ?? existingAnon?.messagingPolicy;
  const messagingPolicy: MessagingPolicy =
    rawPolicy === "nobody" || (rawPolicy as string) === "disabled"
      ? "nobody"
      : rawPolicy === "eligible" || (rawPolicy as string) === "anyone"
        ? "eligible"
        : "same_journey";

  const rawCoach = input.coachVisibility ?? existingAnon?.coachVisibility;
  const coachVisibility: CoachVisibility =
    rawCoach === "coach_berth" || (rawCoach as string) === "visible"
      ? "coach_berth"
      : rawCoach === "coach" || (rawCoach as string) === "coach_only"
        ? "coach"
        : "never";

  const anonymousProfile = await store.upsertAnonymousProfile({
    userId: input.userId,
    publicHandle,
    avatarUrl: existingAnon?.avatarUrl ?? null,
    bio: input.bio ?? existingAnon?.bio ?? null,
    reputation: existingAnon?.reputation ?? 0,
    discoveryVisible:
      input.discoveryVisible ?? existingAnon?.discoveryVisible ?? false,
    messagingPolicy,
    coachVisibility,
    onboardingComplete: true,
    createdAt: existingAnon?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });

  return { profile, anonymousProfile };
}

export async function getMe(userId: string): Promise<MeResponse> {
  const store = getStore();
  const [profile, anonymousProfile] = await Promise.all([
    store.getProfile(userId),
    store.getAnonymousProfile(userId),
  ]);

  return { profile, anonymousProfile };
}

export interface UpdatePrivacyInput {
  userId: string;
  discoveryVisible?: boolean;
  messagingPolicy?: AnonymousProfile["messagingPolicy"];
  coachVisibility?: AnonymousProfile["coachVisibility"];
}

export async function updatePrivacy(
  input: UpdatePrivacyInput,
): Promise<AnonymousProfile> {
  const store = getStore();
  const existing = await store.getAnonymousProfile(input.userId);

  if (!existing) {
    throw new AppError("not_found", "Anonymous profile not found");
  }

  let messagingPolicy = input.messagingPolicy;
  if ((messagingPolicy as string) === "anyone") messagingPolicy = "eligible";
  if ((messagingPolicy as string) === "disabled") messagingPolicy = "nobody";

  if (
    messagingPolicy !== undefined &&
    !["nobody", "same_journey", "eligible"].includes(messagingPolicy)
  ) {
    throw new AppError("validation", "Invalid messaging policy");
  }

  let coachVisibility = input.coachVisibility;
  if ((coachVisibility as string) === "visible")
    coachVisibility = "coach_berth";
  if ((coachVisibility as string) === "coach_only") coachVisibility = "coach";

  if (
    coachVisibility !== undefined &&
    !["never", "coach", "coach_berth"].includes(coachVisibility)
  ) {
    throw new AppError("validation", "Invalid coach visibility setting");
  }

  return store.upsertAnonymousProfile({
    ...existing,
    discoveryVisible: input.discoveryVisible ?? existing.discoveryVisible,
    messagingPolicy: messagingPolicy ?? existing.messagingPolicy,
    coachVisibility: coachVisibility ?? existing.coachVisibility,
    updatedAt: nowIso(),
  });
}

export interface UpdateAnonymousInput {
  userId: string;
  bio?: string | null;
  avatarUrl?: string | null;
  publicHandle?: string;
}

export async function updateAnonymous(
  input: UpdateAnonymousInput,
): Promise<AnonymousProfile> {
  const store = getStore();
  const existing = await store.getAnonymousProfile(input.userId);

  if (!existing) {
    throw new AppError("not_found", "Anonymous profile not found");
  }

  if (input.publicHandle) {
    const handle = input.publicHandle.trim();
    if (!/^[A-Za-z0-9_]{3,24}$/.test(handle)) {
      throw new AppError(
        "validation",
        "Handle must be 3-24 alphanumeric characters or underscores",
      );
    }

    const taken = await store.isHandleTaken(handle, input.userId);
    if (taken) {
      throw new AppError("conflict", "Handle is already taken");
    }
  }

  return store.upsertAnonymousProfile({
    ...existing,
    bio: input.bio !== undefined ? input.bio : existing.bio,
    avatarUrl:
      input.avatarUrl !== undefined ? input.avatarUrl : existing.avatarUrl,
    publicHandle: input.publicHandle?.trim() ?? existing.publicHandle,
    updatedAt: nowIso(),
  });
}
