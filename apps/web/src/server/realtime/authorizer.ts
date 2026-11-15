import { requireVerifiedMembership } from "@/server/authz/membership";
import { getStore } from "@/server/store";

export interface ChannelSubscriptionRequest {
  userId: string;
  channelName: string;
}

export interface ChannelAuthorizationResult {
  allowed: boolean;
  channelName: string;
  journeyId: string | null;
  reason?: string;
}

export class RealtimeChannelAuthorizer {
  /**
   * Authorizes subscription to private journey/community channels.
   * Format: `journey:<journey_id>:chat` or `journey:<journey_id>:community:<community_id>` or `user:<user_id>:notifications`
   */
  static async authorizeSubscription(
    req: ChannelSubscriptionRequest,
  ): Promise<ChannelAuthorizationResult> {
    const parts = req.channelName.split(":");
    const scope = parts[0];

    // User personal notification channel
    if (
      scope === "user" &&
      parts.length === 3 &&
      parts[2] === "notifications"
    ) {
      const targetUserId = parts[1];
      if (targetUserId === req.userId) {
        return { allowed: true, channelName: req.channelName, journeyId: null };
      }
      return {
        allowed: false,
        channelName: req.channelName,
        journeyId: null,
        reason: "Cannot subscribe to another user notification channel",
      };
    }

    // Journey-scoped channel
    if (
      scope === "journey" &&
      ((parts.length === 3 && parts[2] === "chat") ||
        (parts.length === 4 && parts[2] === "community"))
    ) {
      const journeyId = parts[1];
      if (!journeyId) {
        return {
          allowed: false,
          channelName: req.channelName,
          journeyId: null,
          reason: "Invalid journey channel format",
        };
      }

      try {
        await requireVerifiedMembership(req.userId, journeyId);
        if (parts[2] === "community") {
          const community = await getStore().getCommunityById(parts[3]);
          if (community?.journeyId !== journeyId)
            throw new Error("Invalid community scope");
        }
        return { allowed: true, channelName: req.channelName, journeyId };
      } catch {
        return {
          allowed: false,
          channelName: req.channelName,
          journeyId,
          reason: "User is not a verified passenger on this journey",
        };
      }
    }

    // Unrecognized or public channel
    return {
      allowed: false,
      channelName: req.channelName,
      journeyId: null,
      reason: "Unknown private channel namespace",
    };
  }
}
