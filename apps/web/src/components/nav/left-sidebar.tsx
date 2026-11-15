"use client";
import { ArrowUpRight, TrainFront, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, navigation, personalNavigation } from "./navigation";
export function LeftSidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="rb-sidebar">
      <Link
        href="/home"
        className="rb-brand"
        onClick={onCloseMobile}
        aria-label="RailBandhan home"
      >
        <span className="rb-brand-mark">
          <TrainFront size={23} strokeWidth={1.7} />
        </span>
        <span>
          rail<span className="rb-brand-em">bandhan</span>
          <small>सफ़र से रिश्तों तक</small>
        </span>
      </Link>
      {onCloseMobile && (
        <button
          className="rb-drawer-close rb-icon-button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
        >
          <X size={20} />
        </button>
      )}
      <div className="rb-nav-label">YOUR WINDOW TO INDIA</div>
      <nav aria-label="Main navigation">
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(pathname, href) ? "page" : undefined}
            onClick={onCloseMobile}
            className={`rb-nav-link ${isActive(pathname, href) ? "is-active" : ""}`}
          >
            <Icon size={19} strokeWidth={1.7} />
            <span>{label}</span>
            {isActive(pathname, href) && <span className="rb-nav-dot" />}
          </Link>
        ))}
      </nav>
      <div className="rb-nav-label rb-nav-label-second">A LITTLE MORE YOU</div>
      <nav aria-label="Personal navigation">
        {personalNavigation.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(pathname, href) ? "page" : undefined}
            onClick={onCloseMobile}
            className={`rb-nav-link ${isActive(pathname, href) ? "is-active" : ""}`}
          >
            <Icon size={18} strokeWidth={1.7} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="rb-sidebar-note">
        <span className="rb-sun" aria-hidden="true">
          ✳
        </span>
        <p>
          Different languages.
          <br />
          One shared journey.
        </p>
        <Link href="/journeys/new" onClick={onCloseMobile}>
          Find your bandhan <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="rb-sidebar-footer">
        <span>MADE FOR THE JOURNEY</span>
        <span className="rb-tricolour" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
    </aside>
  );
}
