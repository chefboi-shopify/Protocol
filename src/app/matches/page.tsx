"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Shield, Loader2 } from "lucide-react";
import { CountdownTimer } from "@/lib/components";

interface MatchItem {
  id: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  messageCount: number;
  other: {
    id: string;
    name: string;
    fiscalArchetype: string;
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches");
      if (res.status === 401) {
        window.location.href = "/onboarding";
        return;
      }
      const data = await res.json();
      setMatches(data.matches);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2
          size={24}
          className="animate-spin text-neutral-600"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  const active = matches.filter(
    (m) => new Date(m.expiresAt).getTime() > Date.now() || m.status === "PROTOCOL_SET"
  );
  const expired = matches.filter(
    (m) => new Date(m.expiresAt).getTime() <= Date.now() && m.status !== "PROTOCOL_SET"
  );

  return (
    <div className="pt-6">
      {/* Header stats */}
      <div className="flex border border-neutral-800 mb-6">
        <div className="flex-1 px-4 py-3 border-r border-neutral-800">
          <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase">
            Active Protocols
          </span>
          <span className="font-mono text-xl text-neutral-200 mt-0.5">
            {active.length}
          </span>
        </div>
        <div className="flex-1 px-4 py-3">
          <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase">
            Expired
          </span>
          <span className="font-mono text-xl text-red-600 mt-0.5">
            {expired.length}
          </span>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <Shield
            size={32}
            className="text-neutral-700 mb-4"
            strokeWidth={1.5}
          />
          <p className="font-mono text-sm text-neutral-500 tracking-widest uppercase">
            No Active Sprints
          </p>
          <p className="font-mono text-[10px] text-neutral-700 mt-2">
            Endorse candidates to initiate protocols.
          </p>
        </div>
      ) : (
        <div className="border border-neutral-800">
          {matches.map((match, i) => {
            const isExpired =
              new Date(match.expiresAt).getTime() <= Date.now() &&
              match.status !== "PROTOCOL_SET";

            return (
              <Link
                key={match.id}
                href={isExpired ? "#" : `/chat/${match.id}`}
                className={`block px-4 py-4 transition-colors ${
                  i > 0 ? "border-t border-neutral-800" : ""
                } ${
                  isExpired
                    ? "opacity-35 cursor-not-allowed"
                    : "hover:bg-neutral-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-base text-neutral-200">
                      {match.other.name}
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mt-1">
                      {match.other.fiscalArchetype} · {match.messageCount} MSG
                      {match.messageCount !== 1 ? "S" : ""}
                      {match.status === "PROTOCOL_SET" && (
                        <span className="text-slate-400 ml-2">
                          · PROTOCOL SET
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {match.status === "PROTOCOL_SET" ? (
                      <span className="font-mono text-xs text-slate-400 tracking-wider">
                        LOCKED
                      </span>
                    ) : (
                      <CountdownTimer expiresAt={match.expiresAt} />
                    )}
                    {!isExpired && (
                      <ChevronRight
                        size={16}
                        className="text-neutral-700"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
