"use client";
import { ErrorBanner } from "@/components/ui/error-banner";
import { apiFetch } from "@/lib/api";
import { ArrowUpRight, Bell, LogOut, Menu, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navigation, personalNavigation } from "./navigation";
export function TopHeader({
  onOpenMobileNav,
}: {
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  const [handle, setHandle] = useState("Traveler");
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ authenticated: boolean }>("/auth/session", {
      signal: controller.signal,
    })
      .then(async (s) => {
        setSignedIn(s.authenticated);
        if (s.authenticated) {
          const me = await apiFetch<{ anonymous?: { public_handle?: string } }>(
            "/auth/me",
            { signal: controller.signal },
          );
          setHandle(me.anonymous?.public_handle || "Traveler");
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [pathname]);
  const current = [...navigation, ...personalNavigation].find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  );
  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      await apiFetch("/auth/logout", { method: "POST" });
      window.location.assign("/login");
    } catch {
      setError("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }
  return (
    <header className="rb-topbar">
      <div className="rb-topbar-left">
        <button
          onClick={onOpenMobileNav}
          className="rb-icon-button rb-menu-button"
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>
        <span className="rb-breadcrumb">
          Your travel companion <span>/</span>{" "}
          <strong>{current?.label || "Your journey"}</strong>
        </span>
      </div>
      <div className="rb-topbar-actions">
        {error && (
          <span role="alert" className="text-xs text-red-700">
            {error}
          </span>
        )}
        <span className="rb-time-label">INDIA, IN GOOD COMPANY</span>
        <Link
          href="/notifications"
          aria-label="View notifications"
          className="rb-icon-button"
        >
          <Bell size={19} />
        </Link>
        {signedIn ? (
          <>
            <Link href="/profile" className="rb-account">
              <span className="rb-account-avatar">
                <UserRound size={17} />
              </span>
              <span>{handle}</span>
            </Link>
            <button
              className="rb-icon-button"
              onClick={signOut}
              disabled={signingOut}
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </>
        ) : (
          <Link className="rb-header-signin" href="/login">
            Come aboard <ArrowUpRight size={17} />
          </Link>
        )}
      </div>
      {error && (
        <div className="absolute top-full right-4 mt-2 max-w-xs shadow-md z-50">
          <ErrorBanner
            message={error}
            variant="subtle"
            onDismiss={() => setError("")}
          />
        </div>
      )}
    </header>
  );
}
