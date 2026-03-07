"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  XSquare,
  CheckSquare,
  Shield,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";

interface FeedProfile {
  id: string;
  name: string;
  age: number;
  fiscalArchetype: string;
  videoUrl: string | null;
  reliabilityScore: number;
  locationCity?: string;
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedProfile[]>([]);
  const [swipesLeft, setSwipesLeft] = useState(20);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [matchFlash, setMatchFlash] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [focusMode, setFocusMode] = useState<string | null>(null);
  const [activeMatchCount, setActiveMatchCount] = useState(0);
  const [needsSubscription, setNeedsSubscription] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feed");
      if (res.status === 403) {
        setError("PROTOCOL LIMIT REACHED");
        setSwipesLeft(0);
        return;
      }
      if (res.status === 401) {
        window.location.href = "/onboarding";
        return;
      }
      const data = await res.json();

      if (data.subscriptionActive === false) {
        setNeedsSubscription(true);
        setLoading(false);
        return;
      }

      if (data.error === "FOCUS_MODE") {
        setFocusMode(data.message);
        setActiveMatchCount(data.activeMatchCount);
        setSwipesLeft(data.swipesLeft);
        return;
      }

      setFeed(data.feed);
      setSwipesLeft(data.swipesLeft);
      setActiveMatchCount(data.activeMatchCount ?? 0);
      setCurrentIndex(0);
    } catch {
      setError("FEED UNAVAILABLE");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleAction = async (action: "PASS" | "ENDORSE") => {
    const profile = feed[currentIndex];
    if (!profile || actioning) return;

    setActioning(true);
    try {
      const res = await fetch("/api/endorse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile.id, action }),
      });

      const data = await res.json();
      setSwipesLeft((prev) => Math.max(0, prev - 1));

      if (data.result === "MATCHED") {
        setMatchFlash(profile.name);
        setTimeout(() => setMatchFlash(null), 2500);
      }

      setRevealed(false);
      setCurrentIndex((prev) => prev + 1);
    } catch {
      setError("ACTION FAILED");
    } finally {
      setActioning(false);
    }
  };

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

  if (needsSubscription) {
    return (
      <div className="pt-6">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="border-2 border-neutral-700 p-5 mb-6">
            <Shield size={32} className="text-neutral-400" strokeWidth={1} />
          </div>
          <h2 className="font-mono text-lg tracking-[0.3em] text-neutral-200 mb-4">
            SEASON PASS REQUIRED
          </h2>
          <div className="border border-neutral-800 bg-neutral-900 p-5 max-w-sm mb-6">
            <p className="font-mono text-xs text-neutral-400 leading-relaxed">
              To access the feed and messaging, you need a 90-Day Season Pass ($90). If you find your person, you get 30% back.
            </p>
          </div>
          <Link href="/subscribe"
            className="bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-sm tracking-[0.2em] uppercase px-8 py-3 transition-colors">
            ACTIVATE SEASON PASS
          </Link>
        </div>
      </div>
    );
  }

  if (focusMode) {
    return (
      <div className="pt-6">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="border-2 border-neutral-700 p-5 mb-6">
            <Lock size={32} className="text-neutral-400" strokeWidth={1} />
          </div>
          <h2 className="font-mono text-lg tracking-[0.3em] text-neutral-200 mb-4">
            FOCUS MODE
          </h2>
          <div className="border border-neutral-800 bg-neutral-900 p-5 max-w-sm mb-6">
            <p className="font-mono text-xs text-neutral-400 leading-relaxed">
              {focusMode}
            </p>
          </div>
          <Link
            href="/matches"
            className="bg-slate-700 hover:bg-slate-600 px-6 py-3 font-mono text-xs tracking-[0.2em] text-neutral-200 uppercase transition-colors"
          >
            GO TO SPRINT ({activeMatchCount} ACTIVE)
          </Link>
        </div>
      </div>
    );
  }

  const profile = feed[currentIndex];
  const depleted = !profile || currentIndex >= feed.length;

  return (
    <div className="pt-6">
      {/* Daily Limit */}
      <div className="flex items-center justify-between mb-6 px-1">
        <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-600 uppercase">
          Daily Limit
        </span>
        <span className="font-mono text-sm text-neutral-400">
          {swipesLeft}
          <span className="text-neutral-700">/20</span>
          <span className="font-mono text-[10px] text-neutral-600 ml-2 tracking-wider">
            REMAINING
          </span>
        </span>
      </div>

      {/* Match Flash */}
      <AnimatePresence>
        {matchFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-slate-600 bg-slate-900/80 px-4 py-3 mb-4 text-center"
          >
            <span className="font-mono text-xs tracking-[0.3em] text-slate-300 uppercase">
              MUTUAL ENDORSEMENT — {matchFlash}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 border border-red-900/50 bg-red-950/30 px-4 py-3 mb-4">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span className="font-mono text-xs text-red-400 tracking-wider">
            {error}
          </span>
        </div>
      )}

      {depleted ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Shield
            size={32}
            className="text-neutral-700 mb-4"
            strokeWidth={1.5}
          />
          <p className="font-mono text-sm text-neutral-500 tracking-widest uppercase">
            FEED DEPLETED
          </p>
          <p className="font-mono text-[10px] text-neutral-700 mt-2">
            No candidates in queue. Check back later.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={profile.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {/* Video / Image Area */}
            <div className="relative aspect-[3/4] w-full bg-neutral-900 overflow-hidden mb-0">
              {profile.videoUrl && (
                <motion.img
                  src={profile.videoUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  animate={{
                    filter: revealed ? "blur(0px)" : "blur(40px)",
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              )}
              <div className="absolute inset-0 bg-black/30" />

              {/* Candidate label */}
              <div className="absolute top-4 left-4 z-10">
                <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-500 uppercase">
                  Candidate
                </span>
                <div className="font-mono text-lg text-neutral-200 mt-0.5">
                  {profile.name}
                </div>
              </div>

              {/* Play button */}
              {!revealed && (
                <motion.button
                  onClick={() => setRevealed(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center z-10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="border-2 border-neutral-300 w-20 h-20 flex items-center justify-center">
                    <Play
                      size={36}
                      className="text-neutral-200"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="font-mono text-xs text-neutral-400 mt-3 tracking-[0.2em] uppercase">
                    15s Candid
                  </span>
                </motion.button>
              )}
            </div>

            {/* Data Table */}
            <div className="border border-neutral-800 border-t-0">
              <div className="flex border-b border-neutral-800">
                <div className="flex-1 px-4 py-3 border-r border-neutral-800">
                  <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">
                    Age
                  </span>
                  <span className="font-mono text-sm text-neutral-200">
                    {profile.age}
                  </span>
                </div>
                <div className="flex-1 px-4 py-3 border-r border-neutral-800">
                  <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">
                    Archetype
                  </span>
                  <span className="font-mono text-sm text-neutral-200">
                    {profile.fiscalArchetype}
                  </span>
                </div>
                <div className="flex-1 px-4 py-3">
                  <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">
                    Reliability
                  </span>
                  <span className="font-mono text-sm text-neutral-200">
                    {profile.reliabilityScore}%
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex border border-neutral-800 border-t-0">
              <button
                onClick={() => handleAction("PASS")}
                disabled={actioning}
                className="flex-1 flex items-center justify-center gap-3 py-5 border-r border-neutral-800 font-mono text-sm tracking-[0.3em] text-neutral-500 uppercase hover:bg-neutral-900 transition-colors disabled:opacity-50"
              >
                <XSquare size={18} strokeWidth={1.5} />
                PASS
              </button>
              <button
                onClick={() => handleAction("ENDORSE")}
                disabled={actioning}
                className="flex-1 flex items-center justify-center gap-3 py-5 bg-slate-700 hover:bg-slate-600 font-mono text-sm tracking-[0.3em] text-neutral-200 uppercase transition-colors disabled:opacity-50"
              >
                <CheckSquare size={18} strokeWidth={1.5} />
                ENDORSE
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
