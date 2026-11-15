import { AppShell } from "@/components/nav/app-shell";
import type { Metadata } from "next";
import { headers } from "next/headers";
export async function generateMetadata(): Promise<Metadata> {
  const path = (await headers()).get("x-route-path") || "";
  return {
    robots: {
      index: ["/home", "/explore", "/help", "/games"].includes(path),
      follow: true,
    },
  };
}
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
