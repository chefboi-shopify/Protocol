"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Clock,
  CheckSquare,
  ArrowLeft,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { CountdownTimer } from "@/lib/components";

interface MatchInfo {
  id: string;
  status: string;
  expiresAt: string;
  protocolDate: string | null;
  protocolTime: string | null;
  protocolLocation: string | null;
  other: {
    id: string;
    name: string;
    fiscalArchetype: string;
  };
}

export default function ProtocolPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/protocol/${matchId}`);
      if (!res.ok) {
        setError("PROTOCOL NOT FOUND");
        return;
      }
      const data = await res.json();
      setMatch(data.match);
      if (data.match.protocolDate) {
        setDate(data.match.protocolDate);
        setTime(data.match.protocolTime || "");
        setLocation(data.match.protocolLocation || "");
        setConfirmed(true);
      }
    } catch {
      setError("TRANSMISSION FAILED");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const handleSubmit = async () => {
    setError("");
    if (!date) {
      setError("DATE REQUIRED");
      return;
    }
    if (!time) {
      setError("TIME REQUIRED");
      return;
    }
    if (!location.trim()) {
      setError("LOCATION REQUIRED");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/protocol/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, location: location.trim(), note: note.trim() }),
      });
      if (res.ok) {
        setConfirmed(true);
      } else {
        const data = await res.json();
        setError(data.error || "SUBMISSION FAILED");
      }
    } catch {
      setError("TRANSMISSION FAILED");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-neutral-600" strokeWidth={1.5} />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="font-mono text-sm text-neutral-500">PROTOCOL NOT FOUND</span>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-12">
      {/* Back */}
      <button
        onClick={() => router.push(`/chat/${matchId}`)}
        className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-neutral-600 hover:text-neutral-400 transition-colors mb-6"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        BACK TO CHAT
      </button>

      {/* Header */}
      <div className="border border-neutral-800 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase">
            Protocol Setup
          </span>
          <CountdownTimer expiresAt={match.expiresAt} />
        </div>
        <div className="font-mono text-lg text-neutral-200">
          {match.other.name}
        </div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mt-1">
          {match.other.fiscalArchetype}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 border border-red-900/50 bg-red-950/30 px-4 py-3 mb-6"
          >
            <AlertTriangle size={16} className="text-red-500 shrink-0" />
            <span className="font-mono text-xs text-red-400 tracking-wider">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {confirmed ? (
        /* Confirmed State */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-neutral-800 bg-neutral-900"
        >
          <div className="border-b border-neutral-800 px-5 py-4">
            <div className="flex items-center gap-3 mb-1">
              <CheckSquare size={16} className="text-green-500" strokeWidth={1.5} />
              <span className="font-mono text-xs tracking-[0.3em] text-green-500 uppercase">
                Protocol Locked
              </span>
            </div>
            <span className="font-mono text-[10px] text-neutral-600">
              Both parties will be notified. Show up.
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar size={14} className="text-neutral-600 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">Date</span>
                <span className="font-mono text-sm text-neutral-200">{date}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={14} className="text-neutral-600 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">Time</span>
                <span className="font-mono text-sm text-neutral-200">{time}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={14} className="text-neutral-600 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">Location</span>
                <span className="font-mono text-sm text-neutral-200">{location}</span>
              </div>
            </div>

            {note && (
              <div className="border-t border-neutral-800 pt-4">
                <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">Note</span>
                <span className="font-mono text-xs text-neutral-400">{note}</span>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-800 p-5 space-y-3">
            <div className="font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-3">
              Post-Meeting
            </div>
            <button
              onClick={() => router.push(`/debrief/${matchId}`)}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 font-mono text-xs tracking-[0.2em] text-neutral-200 uppercase transition-colors"
            >
              Submit Debrief
            </button>
          </div>
        </motion.div>
      ) : (
        /* Scheduling Form */
        <div className="space-y-5">
          <div className="border border-neutral-800 bg-neutral-900 p-5">
            <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-4">
              20-Minute Meeting Parameters
            </span>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase mb-2">
                  <Calendar size={12} strokeWidth={1.5} />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 font-mono text-sm text-neutral-200 rounded-none focus:border-neutral-600 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase mb-2">
                  <Clock size={12} strokeWidth={1.5} />
                  Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 font-mono text-sm text-neutral-200 rounded-none focus:border-neutral-600 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase mb-2">
                  <MapPin size={12} strokeWidth={1.5} />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Coffee shop, bar, park..."
                  className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 font-mono text-sm text-neutral-200 rounded-none focus:border-neutral-600 transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="I'll be wearing a black jacket."
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 font-mono text-sm text-neutral-200 rounded-none focus:border-neutral-600 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          <div className="border border-neutral-800 bg-neutral-900/50 px-5 py-3">
            <span className="font-mono text-[10px] text-neutral-600 leading-relaxed">
              By confirming, both parties commit to a 20-minute in-person meeting.
              No-shows result in reliability score penalties.
            </span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-sm tracking-[0.2em] uppercase py-4 transition-colors disabled:opacity-50"
          >
            {submitting ? "TRANSMITTING..." : "LOCK PROTOCOL"}
          </button>
        </div>
      )}
    </div>
  );
}
