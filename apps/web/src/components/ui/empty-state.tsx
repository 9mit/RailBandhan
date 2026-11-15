"use client";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  Bell,
  Compass,
  MessageSquare,
  TrainFront,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
const icons = {
  train: TrainFront,
  chat: MessageSquare,
  passengers: Users,
  bell: Bell,
  compass: Compass,
};
export function EmptyState({
  icon = "train",
  title,
  description,
  action,
  actionHref,
  actionLabel,
  onAction,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  const Icon =
    typeof icon === "string"
      ? icons[icon as keyof typeof icons] || TrainFront
      : null;
  return (
    <div className={cn("rb-empty-state", className)}>
      <span className="rb-empty-icon">
        {Icon ? <Icon size={27} strokeWidth={1.4} /> : icon}
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action ||
        (actionLabel &&
          (onAction ? (
            <button className="rb-button" onClick={onAction}>
              {actionLabel}
              <ArrowUpRight size={16} />
            </button>
          ) : actionHref ? (
            <Link className="rb-button" href={actionHref}>
              {actionLabel}
              <ArrowUpRight size={16} />
            </Link>
          ) : null))}
    </div>
  );
}
