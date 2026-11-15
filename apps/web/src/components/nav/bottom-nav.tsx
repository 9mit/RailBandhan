"use client";
import {
  Compass,
  Home,
  MessagesSquare,
  TrainFront,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive } from "./navigation";
const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/journeys", label: "Journeys", icon: TrainFront },
  { href: "/explore", label: "Discover", icon: Compass },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/profile", label: "Profile", icon: UserRound },
];
export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="rb-bottom-nav" aria-label="Mobile navigation">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(path, href) ? "page" : undefined}
          className={isActive(path, href) ? "is-active" : ""}
        >
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
