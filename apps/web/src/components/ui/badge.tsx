import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

export type BadgeVariant =
  | "accent"
  | "royal"
  | "black"
  | "signal"
  | "delay"
  | "verified"
  | "coach"
  | "outline"
  | "muted"
  | "subtle"
  | "gold"
  | "brass"
  | "maroon";

const neutral = "bg-[#edf0e5] text-[#3b5545] border border-[#d8dfcd]";
const warm = "bg-[#f2e6d4] text-[#8b4829] border border-[#e2cfb4]";
const badgeVariants: Record<BadgeVariant, string> = {
  accent: warm,
  royal: neutral,
  black: neutral,
  signal: neutral,
  delay: warm,
  verified: neutral,
  coach: neutral,
  outline: neutral,
  muted: "bg-[#f0f0e9] text-[#687463] border border-[#dedfd6]",
  subtle: warm,
  gold: warm,
  brass: warm,
  maroon: neutral,
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  dotPulse?: boolean;
}

export function Badge({
  className,
  variant = "accent",
  dot = false,
  dotPulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide select-none shrink-0",
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "signal" || variant === "verified"
              ? "bg-emerald-500"
              : variant === "delay"
                ? "bg-amber-500"
                : variant === "accent" ||
                    variant === "royal" ||
                    variant === "coach" ||
                    variant === "brass"
                  ? "bg-[#3155E7]"
                  : "bg-[#111318]",
            dotPulse && "animate-ping",
          )}
        />
      )}
      {children}
    </span>
  );
}
