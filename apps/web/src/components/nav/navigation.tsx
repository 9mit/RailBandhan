import {
  Bell,
  Compass,
  Gamepad2,
  Home,
  LifeBuoy,
  MessagesSquare,
  TrainFront,
  UserRound,
  UsersRound,
} from "lucide-react";
export const navigation = [
  { href: "/home", label: "Overview", icon: Home },
  { href: "/journeys", label: "My journeys", icon: TrainFront },
  { href: "/explore", label: "Discover India", icon: Compass },
  { href: "/communities", label: "Communities", icon: UsersRound },
  { href: "/chat", label: "Conversations", icon: MessagesSquare },
  { href: "/games", label: "Play together", icon: Gamepad2 },
];
export const personalNavigation = [
  { href: "/profile", label: "My travel pass", icon: UserRound },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/help", label: "Help & safety", icon: LifeBuoy },
];
export function isActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/home" && pathname.startsWith(href + "/")) ||
    (href === "/chat" && pathname.startsWith("/dm"))
  );
}
