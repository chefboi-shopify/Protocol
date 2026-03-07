"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crosshair, Zap, User, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/feed", label: "FEED", icon: Crosshair },
  { href: "/matches", label: "SPRINT", icon: Zap },
  { href: "/profile", label: "STATUS", icon: User },
  { href: "/operator-config", label: "CONFIG", icon: Settings },
] as const;

export function NavBar() {
  const pathname = usePathname();

  if (pathname === "/onboarding" || pathname === "/" || pathname === "/activated" || pathname === "/subscribe" || pathname === "/joint-exit" || pathname === "/waitlist") return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
        <Link
          href="/feed"
          className="font-mono text-xs tracking-[0.3em] text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          PROTOCOL
        </Link>
        <div className="flex gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-[0.2em] transition-colors ${
                  active
                    ? "text-neutral-200 bg-neutral-800"
                    : "text-neutral-600 hover:text-neutral-400"
                }`}
              >
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function CountdownTimer({
  expiresAt,
  className = "",
}: {
  expiresAt: string;
  className?: string;
}) {
  return <LiveCountdown expiresAt={expiresAt} className={className} />;
}

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function LiveCountdown({
  expiresAt,
  className,
}: {
  expiresAt: string;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() =>
    new Date(expiresAt).getTime() - Date.now()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(new Date(expiresAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const expired = remaining <= 0;
  const hours = Math.max(0, Math.floor(remaining / 3_600_000));
  const mins = Math.max(
    0,
    Math.floor((remaining % 3_600_000) / 60_000)
  );
  const secs = Math.max(0, Math.floor((remaining % 60_000) / 1000));

  const formatted = `${String(hours).padStart(3, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  let colorClass = "text-neutral-200";
  if (expired) colorClass = "text-red-600";
  else if (remaining < 12 * 3_600_000) colorClass = "text-red-500";
  else if (remaining < 24 * 3_600_000) colorClass = "text-orange-500";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock size={14} className="text-neutral-600" strokeWidth={1.5} />
      <span className={`font-mono text-sm ${colorClass}`}>
        {expired ? "EXPIRED" : formatted}
      </span>
      <span className="font-mono text-[9px] tracking-[0.15em] text-neutral-600 uppercase">
        {expired ? "PROTOCOL VOID" : "REMAINING"}
      </span>
    </div>
  );
}
