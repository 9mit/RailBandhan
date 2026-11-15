"use client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api";
import { formatErrorMessage } from "@/lib/format-error";
import type {
  AnonymousProfile,
  Badge,
  PrivacySettings,
  PrivateProfile,
} from "@/lib/types";
import { ArrowUpRight, Award, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
type ProfileResponse = {
  anonymous: AnonymousProfile | null;
  private: PrivateProfile | null;
  privacy: PrivacySettings | null;
};
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null),
    [badges, setBadges] = useState<Badge[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(""),
    [handle, setHandle] = useState(""),
    [bio, setBio] = useState(""),
    [name, setName] = useState(""),
    [showDelete, setShowDelete] = useState(false),
    [password, setPassword] = useState("");
  useEffect(() => {
    const c = new AbortController();
    Promise.all([
      apiFetch<ProfileResponse>("/profiles/me", { signal: c.signal }),
      apiFetch<{ badges: Badge[] }>("/profiles/badges", { signal: c.signal }),
    ])
      .then(([p, b]) => {
        setProfile(p);
        setBadges(b.badges);
        setHandle(p.anonymous?.public_handle || "");
        setBio(p.anonymous?.bio || "");
        setName(p.private?.real_name || p.private?.full_name || "");
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Your profile could not be loaded.",
          );
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, []);
  async function action(key: string, work: () => Promise<void>) {
    setError("");
    setSuccess("");
    setBusy(key);
    try {
      await work();
    } catch (e) {
      setError(
        formatErrorMessage(
          e,
          "Something couldn’t be updated right now. Please try again.",
        ),
      );
    } finally {
      setBusy("");
    }
  }
  async function savePrivacy(change: Partial<PrivacySettings>) {
    await action("privacy", async () => {
      const res = await apiFetch<{ anonymous: AnonymousProfile }>(
        "/profiles/privacy",
        { method: "PATCH", body: JSON.stringify(change) },
      );
      setProfile((p) =>
        p
          ? {
              ...p,
              anonymous: res.anonymous,
              privacy: {
                discovery_visible: res.anonymous.discovery_visible,
                messaging_policy: res.anonymous.messaging_policy,
                coach_visibility: res.anonymous.coach_visibility,
              },
            }
          : p,
      );
      setSuccess("Your privacy choices are saved.");
    });
  }
  if (loading)
    return (
      <div className="rb-loading" role="status">
        Opening your travel pass…
      </div>
    );
  return (
    <div>
      <div className="rb-route-title">
        <span className="rb-eyebrow">A LITTLE MORE YOU</span>
        <h1>
          Your story.
          <br />
          <em>Your way.</em>
        </h1>
        <p>
          Choose how you appear to the community and what you keep to yourself.
        </p>
      </div>
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError("")}
          className="mb-5"
        />
      )}
      {success && (
        <p
          className="p-4 bg-[#e9eddf] text-[#24483f] text-sm rounded-lg mb-5"
          role="status"
        >
          {success}
        </p>
      )}
      {profile && !profile.anonymous ? (
        <div className="rb-empty-state">
          <h3>Make this pass your own.</h3>
          <p>Choose an anonymous handle before joining your community.</p>
          <Link href="/onboarding" className="rb-button">
            Set up my profile <ArrowUpRight size={17} />
          </Link>
        </div>
      ) : (
        profile?.anonymous && (
          <div className="grid xl:grid-cols-[.7fr_1.3fr] gap-7">
            <aside>
              <section className="rounded-xl bg-[#24483f] text-[#fff8e5] p-8 relative overflow-hidden">
                <span className="rb-eyebrow !text-[#dae0c7]">
                  THE RAILBANDHAN TRAVEL PASS
                </span>
                <div className="my-8">
                  <Avatar handle={profile.anonymous.public_handle} size="xl" />
                  <h2 className="font-display text-3xl font-normal mt-5">
                    {profile.anonymous.public_handle}
                  </h2>
                  <p className="text-sm text-[#d7dfcc] mt-3">
                    {profile.anonymous.bio || "A new traveller. A new story."}
                  </p>
                </div>
                <div className="flex justify-between border-t border-[#ffffff30] pt-6 text-xs text-[#dce4d0]">
                  <span>Reputation</span>
                  <strong className="text-lg">
                    {profile.anonymous.reputation || 0}
                  </strong>
                </div>
                <p className="text-xs text-[#dce4d0] mt-5 flex items-center gap-2">
                  <ShieldCheck size={16} /> Anonymous community profile
                </p>
              </section>
              <section className="rb-ui-card p-7 mt-6">
                <span className="rb-eyebrow">LITTLE MILESTONES</span>
                <h3 className="font-display text-2xl font-normal my-4">
                  Stories you’ve earned.
                </h3>
                {badges.length === 0 ? (
                  <p className="text-xs text-[var(--rail-text-muted)]">
                    Your first journey is a lovely place to start. Earned badges
                    will appear here.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {badges.map((b) => (
                      <li key={b.slug} className="flex gap-3">
                        <Award size={21} className="text-[#9c6037]" />
                        <div>
                          <h4 className="text-sm font-medium">{b.name}</h4>
                          <p className="text-xs text-[var(--rail-text-muted)] mt-1">
                            {b.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
            <div className="space-y-6">
              <section className="rb-ui-card p-7">
                <h2 className="font-display text-2xl font-normal mb-2">
                  Your public identity.
                </h2>
                <p className="text-xs text-[var(--rail-text-muted)] mb-6">
                  These are the details your fellow travellers can see.
                </p>
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void action("profile", async () => {
                      const res = await apiFetch<{
                        anonymous: AnonymousProfile;
                      }>("/profiles/anonymous", {
                        method: "PATCH",
                        body: JSON.stringify({
                          public_handle: handle.trim(),
                          bio: bio.trim(),
                        }),
                      });
                      setProfile((p) =>
                        p ? { ...p, anonymous: res.anonymous } : p,
                      );
                      setSuccess("Your profile is updated.");
                    });
                  }}
                >
                  <Input
                    id="profile-handle"
                    label="Anonymous handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    pattern="[A-Za-z0-9_]{3,24}"
                    minLength={3}
                    maxLength={24}
                    required
                    helperText="3–24 letters, numbers or underscores."
                  />
                  <div>
                    <label
                      htmlFor="profile-bio"
                      className="block text-xs font-semibold text-[#4f654f] mb-2"
                    >
                      A LITTLE ABOUT YOU
                    </label>
                    <textarea
                      id="profile-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="rb-ui-input rounded-md w-full p-3 text-sm"
                      placeholder="Your favourite window-seat ritual…"
                    />
                    <p className="text-xs text-[var(--rail-text-muted)] mt-1">
                      {bio.length}/500
                    </p>
                  </div>
                  <Button
                    type="submit"
                    isLoading={busy === "profile"}
                    disabled={!!busy}
                  >
                    Save my profile
                  </Button>
                </form>
              </section>
              <section className="rb-ui-card p-7">
                <h2 className="font-display text-2xl font-normal mb-2">
                  Your comfort comes first.
                </h2>
                <p className="text-xs text-[var(--rail-text-muted)] mb-6">
                  Changes apply to future discovery and messages.
                </p>
                <div className="space-y-6">
                  <label className="flex items-start justify-between gap-5">
                    <span>
                      <strong className="block text-sm font-medium">
                        Let fellow travellers discover me
                      </strong>
                      <span className="block text-xs text-[var(--rail-text-muted)] mt-2">
                        Visible only to members on a shared journey. Off by
                        default.
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 mt-1"
                      checked={!!profile.privacy?.discovery_visible}
                      disabled={!!busy}
                      onChange={(e) =>
                        void savePrivacy({
                          discovery_visible: e.target.checked,
                        })
                      }
                    />
                  </label>
                  <div>
                    <label
                      htmlFor="message-policy"
                      className="block text-sm mb-2"
                    >
                      Who can message me?
                    </label>
                    <select
                      id="message-policy"
                      className="rb-ui-input rounded-md p-3 w-full text-sm"
                      value={
                        profile.privacy?.messaging_policy || "same_journey"
                      }
                      disabled={!!busy}
                      onChange={(e) =>
                        void savePrivacy({
                          messaging_policy: e.target
                            .value as PrivacySettings["messaging_policy"],
                        })
                      }
                    >
                      <option value="same_journey">
                        People on a shared journey
                      </option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="coach-visibility"
                      className="block text-sm mb-2"
                    >
                      Share my coach details
                    </label>
                    <select
                      id="coach-visibility"
                      className="rb-ui-input rounded-md p-3 w-full text-sm"
                      value={profile.privacy?.coach_visibility || "never"}
                      disabled={!!busy}
                      onChange={(e) =>
                        void savePrivacy({
                          coach_visibility: e.target
                            .value as PrivacySettings["coach_visibility"],
                        })
                      }
                    >
                      <option value="never">Keep coach and seat private</option>
                      <option value="coach">Share coach on my journey</option>
                      <option value="coach_berth">
                        Share coach and berth on my journey
                      </option>
                    </select>
                  </div>
                </div>
              </section>
              <section className="rb-ui-card p-7">
                <h2 className="font-display text-2xl font-normal mb-2">
                  A private name, if you like.
                </h2>
                <p className="text-xs text-[var(--rail-text-muted)] mb-5">
                  This stays private to your account.
                </p>
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void action("private", async () => {
                      await apiFetch("/profiles/onboarding", {
                        method: "POST",
                        body: JSON.stringify({
                          real_name: name.trim() || "Passenger",
                        }),
                      });
                      setSuccess("Your private profile is updated.");
                    });
                  }}
                >
                  <Input
                    label="Private name (optional)"
                    id="private-name"
                    value={name === "Passenger" ? "" : name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    isLoading={busy === "private"}
                    disabled={!!busy}
                  >
                    Save private name
                  </Button>
                </form>
              </section>
              <div className="flex flex-wrap justify-between items-center gap-4 pt-4">
                <Button
                  variant="outline"
                  leftIcon={<LogOut size={16} />}
                  disabled={!!busy}
                  onClick={() =>
                    void action("logout", async () => {
                      await apiFetch("/auth/logout", { method: "POST" });
                      router.replace("/login");
                      router.refresh();
                    })
                  }
                >
                  Sign out
                </Button>
                <button
                  className="inline-flex items-center gap-2 text-xs text-[#a73d2b] p-3"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 size={15} /> Delete my account
                </button>
              </div>
            </div>
          </div>
        )
      )}
      <Modal
        isOpen={showDelete}
        onClose={() => {
          if (!busy) {
            setShowDelete(false);
            setPassword("");
          }
        }}
        title="Close your RailBandhan account?"
        description="This permanently removes your account and personal data. Your sessions will be signed out. This action cannot be undone."
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void action("delete", async () => {
              await apiFetch("/account", {
                method: "DELETE",
                body: JSON.stringify({ password }),
              });
              router.replace("/login");
              router.refresh();
            });
          }}
        >
          <Input
            id="delete-password"
            label="Confirm your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            maxLength={128}
          />
          {error && (
            <ErrorBanner
              message={error}
              variant="subtle"
              onDismiss={() => setError("")}
            />
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={!!busy}
              onClick={() => setShowDelete(false)}
            >
              Keep my account
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={busy === "delete"}
              disabled={!!busy}
            >
              Delete account permanently
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
