import { cn } from "@/lib/utils";
import { Compass, Navigation, Shield, Train, User } from "lucide-react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  handle?: string | null;
  size?: AvatarSize;
  isOnline?: boolean;
  showReputationRing?: boolean;
  reputation?: number;
  className?: string;
  src?: string | null;
  imageUrl?: string | null;
}

// Generate deterministic palette based on handle string
function getPalette(str: string = "Passenger") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    { bg: "bg-[#FDF2F4] text-[#7B1123] border border-[#F5CAD1]" },
    { bg: "bg-[#FDF8ED] text-[#9A731F] border border-[#E8D5A3]" },
    { bg: "bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]" },
    { bg: "bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]" },
    { bg: "bg-[#FAF7F2] text-[#1F1A17] border border-[#E8E0D2]" },
    { bg: "bg-[#0B1324] text-[#FDF8ED] border border-[#0B1324]" },
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getIcon(str: string = "Passenger") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 3) + str.charCodeAt(i);
  }
  const icons = [Train, Compass, Navigation, Shield, User];
  return icons[Math.abs(hash) % icons.length];
}

const sizeClasses: Record<
  AvatarSize,
  { container: string; icon: string; badge: string; ring: string }
> = {
  xs: {
    container: "h-6 w-6 text-[10px]",
    icon: "h-3.5 w-3.5",
    badge: "h-1.5 w-1.5 ring-1",
    ring: "p-0.5",
  },
  sm: {
    container: "h-8 w-8 text-xs",
    icon: "h-4 w-4",
    badge: "h-2 w-2 ring-1",
    ring: "p-0.5",
  },
  md: {
    container: "h-10 w-10 text-sm",
    icon: "h-5 w-5",
    badge: "h-2.5 w-2.5 ring-2",
    ring: "p-0.5",
  },
  lg: {
    container: "h-14 w-14 text-base",
    icon: "h-7 w-7",
    badge: "h-3.5 w-3.5 ring-2",
    ring: "p-1",
  },
  xl: {
    container: "h-20 w-20 text-xl",
    icon: "h-10 w-10",
    badge: "h-4 w-4 ring-2",
    ring: "p-1.5",
  },
};

export function Avatar({
  handle = "Passenger",
  size = "md",
  isOnline,
  showReputationRing = false,
  reputation = 0,
  className,
  src,
  imageUrl,
}: AvatarProps) {
  const effectiveHandle = handle || "Passenger";
  const palette = getPalette(effectiveHandle);
  const IconComponent = getIcon(effectiveHandle);
  const s = sizeClasses[size];
  const imageSrc = src || imageUrl;

  // If handle contains number (e.g. Passenger_4821), extract digits or initial
  const match = effectiveHandle.match(/\d+/);
  const shortNum = match ? match[0].slice(-2) : "";

  return (
    <div className={cn("relative inline-flex shrink-0 select-none", className)}>
      {showReputationRing && (
        <div
          className={cn(
            "absolute inset-0 -m-0.5 rounded-full",
            reputation > 50
              ? "bg-[#C89B3C] animate-pulse"
              : reputation > 20
                ? "bg-[#C89B3C]/70"
                : "bg-[#E8E0D2]",
          )}
        />
      )}

      <div
        className={cn(
          "relative flex items-center justify-center rounded-full font-bold uppercase overflow-hidden",
          palette.bg,
          s.container,
          showReputationRing && "ring-2 ring-white",
        )}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={effectiveHandle}
            className="h-full w-full object-cover"
          />
        ) : shortNum ? (
          <span>{shortNum}</span>
        ) : (
          <IconComponent className={s.icon} />
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
            s.badge,
            isOnline ? "bg-emerald-500" : "bg-slate-400",
          )}
          title={isOnline ? "Online on this train" : "Offline"}
        />
      )}
    </div>
  );
}
