import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Lock, Ticket } from "lucide-react";

export default function RestrictedJourneyPage() {
  return (
    <div className="max-w-md mx-auto py-12 text-center space-y-6">
      <Card className="p-8 space-y-5 border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-[var(--rail-surface)] to-[var(--rail-surface)] shadow-elevation-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f2e7d3] text-[#98512e] border border-amber-500/30">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="rb-screen-heading font-display text-2xl font-bold text-[var(--rail-text)]">
            Train Journey Restricted
          </h1>
          <p className="text-xs sm:text-sm text-[var(--rail-text-muted)] leading-relaxed">
            You do not currently have active membership to this train journey
            community. To protect passenger safety and privacy, members of this
            journey can view chat and games.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <ButtonLink
            href="/journeys/new/upload"
            size="md"
            leftIcon={<Ticket className="h-4 w-4" />}
            className={["w-full", "w-full"].join(" ")}
          >
            Scan Ticket to Join
          </ButtonLink>
          <ButtonLink
            href="/home"
            variant="ghost"
            size="md"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className={["w-full", "w-full"].join(" ")}
          >
            Return to Home
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
