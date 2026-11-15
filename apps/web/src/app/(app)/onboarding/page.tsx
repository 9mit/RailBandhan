"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { safeNextPath } from "@/lib/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  RefreshCw,
  Train,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SAMPLE_INTERESTS = [
  "Chai & Station Snacks",
  "Ludo Grandmaster",
  "Window Seat Observer",
  "Book Voyager",
  "Audiobook & Podcasts",
  "Station Photographer",
  "Night Train Traveller",
  "Regional Food Explorer",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Public Anonymous Identity
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 2: Private Safety Profile (Never shown to others)
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate random handle on initial mount
  useEffect(() => {
    generateRandomHandle();
  }, []);

  function generateRandomHandle() {
    const prefixes = [
      "Passenger",
      "Traveller",
      "Yatri",
      "Nomad",
      "RailRider",
      "Voyager",
    ];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setHandle(`${randomPrefix}_${randomNum}`);
  }

  function toggleInterest(interest: string) {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, interest]);
      }
    }
  }

  async function handleComplete() {
    setSaving(true);
    setError(null);
    try {
      const fullBio = [
        bio.trim(),
        selectedInterests.length > 0 ? selectedInterests.join(" · ") : "",
      ]
        .filter(Boolean)
        .join(" | ");

      // Complete onboarding with all fields
      await apiFetch("/profiles/onboarding", {
        method: "POST",
        body: JSON.stringify({
          real_name: fullName.trim() || "Passenger",
          age: age ? Number(age) : undefined,
          gender: gender || undefined,
          public_handle: handle.trim() || undefined,
          bio: fullBio || undefined,
        }),
      });

      router.replace(
        safeNextPath(new URLSearchParams(window.location.search).get("next")),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save profile. Please try again.",
      );
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#1F1A17] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto space-y-8 select-none">
      {/* Brand & Step Stepper */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[var(--rail-surface)] text-[var(--rail-text)] shadow-md shadow-[#7B1123]/25 border border-[#9E1A33] mx-auto">
          <Train className="h-6 w-6 text-[var(--rail-text)]" />
        </div>
        <h1 className="rb-screen-heading font-display text-2xl font-bold tracking-tight text-[#1F1A17]">
          Welcome to Rail<span className="text-[#7B1123]">Bandhan</span>
        </h1>
        <p className="text-xs text-[#6E655F]">
          Indian Rail Social Layer · Step {step} of 3
        </p>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span
            className={`h-2 rounded-full transition-all duration-300 ${
              step >= 1 ? "w-8 bg-[var(--rail-surface)]" : "w-2 bg-[#E8E0D2]"
            }`}
          />
          <span
            className={`h-2 rounded-full transition-all duration-300 ${
              step >= 2 ? "w-8 bg-[var(--rail-surface)]" : "w-2 bg-[#E8E0D2]"
            }`}
          />
          <span
            className={`h-2 rounded-full transition-all duration-300 ${
              step === 3 ? "w-8 bg-[var(--rail-surface)]" : "w-2 bg-[#E8E0D2]"
            }`}
          />
        </div>
      </div>

      {/* Step 1: Anonymous Identity */}
      {step === 1 && (
        <Card className="p-8 sm:p-10 space-y-6 bg-white border-[#E8E0D2] shadow-sm animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <Badge variant="royal">Identity Creation</Badge>
            <h2 className="font-display text-2xl font-bold text-[#1F1A17]">
              Choose your Passenger Identity
            </h2>
            <p className="text-xs sm:text-sm text-[#6E655F] max-w-md mx-auto">
              This is the anonymous persona fellow passengers will see in train
              chat and multiplayer games.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-3 py-2">
            <Avatar handle={handle} size="xl" />
            <span className="text-xs font-bold text-[#7B1123]">
              Public Avatar Preview
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                label="Public Anonymous Handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. Voyager_4092"
                required
              />
              <div className="pt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={generateRandomHandle}
                  title="Generate Random Handle"
                >
                  <RefreshCw className="h-4 w-4 text-[#7B1123]" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6E655F]">
                Short Passenger Bio (Optional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Traveling to Delhi for work... Chai lover and window seat enthusiast."
                rows={2}
                className="w-full rounded-xl border border-[#E8E0D2] bg-[#FAF7F2] p-3 text-sm text-[#1F1A17] focus:outline-none focus:bg-white focus:border-[#7B1123] placeholder:text-[#9B9186]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              size="md"
              variant="royal"
              disabled={!handle.trim()}
              onClick={() => setStep(2)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue to Safety
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Private Safety Profile */}
      {step === 2 && (
        <Card className="p-8 sm:p-10 space-y-6 bg-white border-[#E8E0D2] shadow-sm animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <Badge variant="signal">Safety Profile</Badge>
            <h2 className="font-display text-2xl font-bold text-[#1F1A17]">
              Emergency & Trust Verification
            </h2>
            <p className="text-xs sm:text-sm text-[#6E655F] max-w-md mx-auto">
              This information is strictly private and used only for passenger
              safety and emergency assistance. It is never displayed publicly.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Real Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="As on Government / Ticket ID"
              helperText="Strictly private. Co-passengers only ever see your handle."
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 26"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E655F]">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E0D2] bg-white px-3.5 py-2.5 text-sm text-[#1F1A17] focus:outline-none focus:border-[#7B1123]"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FDF8ED] border border-[#E8D5A3] flex items-center gap-3 text-xs text-[#9A731F]">
              <Lock className="h-4 w-4 text-[#C89B3C] shrink-0" />
              <span>
                100% private and protected. Never linked to your public chat
                posts or game history.
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep(1)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <Button
              type="button"
              size="md"
              variant="royal"
              onClick={() => setStep(3)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue to Interests
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Interests */}
      {step === 3 && (
        <Card className="p-8 sm:p-10 space-y-6 bg-white border-[#E8E0D2] shadow-sm animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <Badge variant="royal">Passenger Interests</Badge>
            <h2 className="font-display text-2xl font-bold text-[#1F1A17]">
              What brings you joy on trains?
            </h2>
            <p className="text-xs sm:text-sm text-[#6E655F] max-w-md mx-auto">
              Select up to 3 travel interests to find like-minded travelers on
              your coach.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {SAMPLE_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-[var(--rail-surface)] text-[var(--rail-text)] border-[#7B1123] shadow-sm"
                      : "bg-[#FAF7F2] border-[#E8E0D2] text-[#1F1A17] hover:bg-[#FDF2F4] hover:border-[#F5CAD1]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{interest}</span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-[var(--rail-text)]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep(2)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <Button
              type="button"
              size="md"
              variant="royal"
              disabled={saving}
              isLoading={saving}
              onClick={handleComplete}
              rightIcon={<CheckCircle2 className="h-4 w-4" />}
            >
              Enter Train Lounge
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
