"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

export default function DebriefPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const [showed, setShowed] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (showed === null) {
      setError("DID THEY SHOW UP?");
      return;
    }
    if (showed && rating === null) {
      setError("RATE THE INTERACTION");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/debrief/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showed,
          rating: showed ? rating : 0,
          note: note.trim() || null,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
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

  if (submitted) {
    return (
      <div className="pt-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[50vh] flex flex-col items-center justify-center text-center"
        >
          <div className="border-2 border-neutral-700 p-5 mb-6">
            <CheckCircle size={32} className="text-green-500" strokeWidth={1} />
          </div>
          <h2 className="font-mono text-lg tracking-[0.3em] text-neutral-200 mb-3">
            DEBRIEF LOGGED
          </h2>
          <p className="font-mono text-xs text-neutral-500 mb-8 max-w-xs">
            Your feedback has been recorded. Reliability scores updated.
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={() => router.push("/matches")}
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 font-mono text-xs tracking-[0.2em] text-neutral-200 uppercase transition-colors"
            >
              Back to Sprint
            </button>
            <button
              onClick={() => router.push("/feed")}
              className="w-full py-3 border border-neutral-800 hover:bg-neutral-900 font-mono text-xs tracking-[0.2em] text-neutral-500 uppercase transition-colors"
            >
              Continue Scouting
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-12">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-neutral-600 hover:text-neutral-400 transition-colors mb-6"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        BACK
      </button>

      <div className="mb-8">
        <h1 className="font-mono text-lg tracking-[0.3em] text-neutral-200 mb-1">
          POST-PROTOCOL DEBRIEF
        </h1>
        <p className="font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase">
          Honest data makes the system work. No sugarcoating.
        </p>
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

      {/* Step 1: Did they show? */}
      <div className="border border-neutral-800 bg-neutral-900 p-5 mb-5">
        <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-4">
          01 — Attendance
        </span>
        <p className="font-mono text-sm text-neutral-400 mb-4">
          Did the other person show up?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowed(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 border font-mono text-sm tracking-wider transition-colors ${
              showed === true
                ? "border-green-800 bg-green-950/40 text-green-400"
                : "border-neutral-800 text-neutral-600 hover:border-neutral-700"
            }`}
          >
            <CheckCircle size={16} strokeWidth={1.5} />
            YES
          </button>
          <button
            onClick={() => {
              setShowed(false);
              setRating(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 border font-mono text-sm tracking-wider transition-colors ${
              showed === false
                ? "border-red-800 bg-red-950/40 text-red-400"
                : "border-neutral-800 text-neutral-600 hover:border-neutral-700"
            }`}
          >
            <XCircle size={16} strokeWidth={1.5} />
            NO-SHOW
          </button>
        </div>
      </div>

      {/* Step 2: Rating (only if showed) */}
      <AnimatePresence>
        {showed === true && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-neutral-800 bg-neutral-900 p-5 mb-5">
              <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-4">
                02 — Interaction Quality
              </span>
              <p className="font-mono text-sm text-neutral-400 mb-4">
                Rate the 20-minute interaction. No feelings. Just signal.
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={`flex-1 py-4 border font-mono text-lg transition-colors ${
                      rating === n
                        ? "border-neutral-400 bg-neutral-800 text-neutral-200"
                        : "border-neutral-800 text-neutral-700 hover:border-neutral-700 hover:text-neutral-500"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-mono text-[9px] text-neutral-700">LOW SIGNAL</span>
                <span className="font-mono text-[9px] text-neutral-700">HIGH SIGNAL</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3: Note */}
      {showed !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="border border-neutral-800 bg-neutral-900 p-5 mb-6">
            <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-4">
              {showed ? "03" : "02"} — Field Notes (Optional)
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                showed
                  ? "Punctual. Good conversation. Would endorse again."
                  : "Waited 15 minutes. No communication."
              }
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 font-mono text-sm text-neutral-200 rounded-none focus:border-neutral-600 transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-sm tracking-[0.2em] uppercase py-4 transition-colors disabled:opacity-50"
          >
            {submitting ? "TRANSMITTING..." : "SUBMIT DEBRIEF"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
