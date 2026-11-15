import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

export type CardVariant =
  | "default"
  | "elevated"
  | "glass"
  | "interactive"
  | "ticket"
  | "brass"
  | "royal";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rb-ui-card p-5 sm:p-6 text-[var(--rail-text)]",
          variant === "interactive" &&
            "hover:border-[#9cab8e] transition-colors cursor-pointer",
          variant === "ticket" && "border-dashed relative overflow-hidden",
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 pb-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-lg font-bold tracking-tight text-[var(--rail-text)] leading-snug",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-xs text-[var(--rail-text-muted)] leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center pt-3 border-t border-[var(--rail-border)]",
        className,
      )}
      {...props}
    />
  );
}
