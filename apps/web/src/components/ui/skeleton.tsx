import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[var(--rail-surface-elevated)] border border-[var(--rail-border)]/40",
        className,
      )}
      {...props}
    />
  );
}

export function JourneyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--rail-border)] bg-[var(--rail-surface)] p-5 space-y-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--rail-surface-elevated)]" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--rail-border)] bg-[var(--rail-surface)] p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center gap-4 pt-1">
        <Skeleton className="h-6 w-14 rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-lg" />
      </div>
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 max-w-[80%]">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
      </div>
      <div className="flex items-start gap-2.5 max-w-[80%] ml-auto flex-row-reverse">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
