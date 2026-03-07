"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Check, ArrowRight, Loader2 } from "lucide-react";

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", { method: "POST" });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.ok) {
        window.location.href = "/feed?subscribed=true";
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Shield size={32} className="text-neutral-400 mx-auto mb-4" strokeWidth={1} />
          <h1 className="font-mono text-xl tracking-[0.3em] text-neutral-200 mb-2">SEASON PASS</h1>
          <p className="font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase">
            90-day access to the Protocol
          </p>
        </div>

        <div className="border border-neutral-800 bg-neutral-900 mb-6">
          <div className="px-6 py-5 border-b border-neutral-800 text-center">
            <span className="font-mono text-4xl text-neutral-200">$90</span>
            <span className="font-mono text-sm text-neutral-600 ml-2">/ 90 days</span>
          </div>

          <div className="px-6 py-5 space-y-4">
            {[
              "Unlimited messaging with matches",
              "20 daily endorsements",
              "Full access to scheduling & meetings",
              "Reliability score tracking",
              "30% refund when you find your person",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Check size={14} className="text-green-500 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="font-mono text-xs text-neutral-400">{item}</span>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/50">
            <p className="font-mono text-[10px] text-neutral-600 leading-relaxed">
              Tinder charges you until you die. We pay you to leave. When you and your match both exit together, you each get <span className="text-green-500">$27.00 back</span>.
            </p>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="border border-red-900/50 bg-red-950/30 px-4 py-3 mb-4">
            <span className="font-mono text-xs text-red-400">{error}</span>
          </motion.div>
        )}

        <button onClick={handleSubscribe} disabled={loading}
          className="w-full bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-sm tracking-[0.2em] uppercase py-4 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={1.5} />}
          {loading ? "PROCESSING..." : "ACTIVATE SEASON PASS"}
        </button>

        <p className="font-mono text-[9px] text-neutral-700 text-center mt-4">
          One-time payment. No auto-renewal. No recurring charges.
        </p>
      </div>
    </div>
  );
}
