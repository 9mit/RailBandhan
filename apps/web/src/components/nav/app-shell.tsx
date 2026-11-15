"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BottomNav } from "./bottom-nav";
import { LeftSidebar } from "./left-sidebar";
import { TopHeader } from "./top-header";
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (mobileMenuOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [mobileMenuOpen]);
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  return (
    <div className="rb-shell">
      <a className="rb-skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="rb-desktop-sidebar">
        <LeftSidebar />
      </div>
      <dialog
        ref={dialog}
        className="rb-nav-dialog"
        aria-label="Navigation"
        onCancel={() => setMobileMenuOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setMobileMenuOpen(false);
        }}
      >
        <LeftSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
      </dialog>
      <div className="rb-workspace">
        <TopHeader onOpenMobileNav={() => setMobileMenuOpen(true)} />
        <main id="main-content" tabIndex={-1} className="rb-main">
          {children}
        </main>
        <footer className="rb-page-footer">
          <span>Every stop has a story. Make yours a shared one.</span>
          <span>RailBandhan · Independent travel community</span>
        </footer>
      </div>
      <BottomNav />
    </div>
  );
}
