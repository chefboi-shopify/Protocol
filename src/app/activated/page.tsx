"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, ChevronRight } from "lucide-react";

export default function ActivatedPage() {
  const router = useRouter();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 -mt-14">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-sm"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 inline-flex"
        >
          <div className="border-2 border-neutral-600 p-6">
            <Shield size={40} className="text-neutral-300" strokeWidth={1} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="font-mono text-2xl tracking-[0.4em] text-neutral-200 mb-6"
        >
          PROTOCOL
        </motion.h1>

        {/* Status lines — typewriter effect */}
        <div className="text-left border border-neutral-800 bg-neutral-900 p-5 space-y-3 mb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 1 ? 1 : 0 }}
            className="flex items-center gap-3"
          >
            <span className="text-green-500 font-mono text-xs">✓</span>
            <span className="font-mono text-xs text-neutral-400 tracking-wider">
              IDENTITY VERIFIED
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 1 : 0 }}
            className="flex items-center gap-3"
          >
            <span className="text-green-500 font-mono text-xs">✓</span>
            <span className="font-mono text-xs text-neutral-400 tracking-wider">
              ARCHETYPE CLASSIFIED
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 3 ? 1 : 0 }}
            className="flex items-center gap-3"
          >
            <span className="text-green-500 font-mono text-xs">✓</span>
            <span className="font-mono text-xs text-neutral-400 tracking-wider">
              CANDID INTAKE RECEIVED
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 3 ? 1 : 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="border-t border-neutral-800 pt-3 mt-3">
              <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-600 uppercase">
                Status
              </span>
              <div className="font-mono text-sm text-neutral-200 mt-1">
                OPERATIONAL — You are in the queue.
              </div>
            </div>
          </motion.div>
        </div>

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 3 ? 1 : 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <div className="border border-neutral-800 p-5">
            <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-4">
              Engagement Rules
            </span>
            <div className="space-y-3">
              {[
                "20 daily endorsements. No more.",
                "Mutual endorsement → 120-hour countdown starts.",
                "You must meet in person within the window.",
                "20 minutes. That's the protocol.",
                "Fail to meet → match deleted. Reliability drops.",
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-mono text-[10px] text-neutral-700 mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-xs text-neutral-400 leading-relaxed">
                    {rule}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 8 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={() => {
              window.location.href = "/feed";
            }}
            className="w-full bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-sm tracking-[0.2em] uppercase py-4 flex items-center justify-center gap-2 transition-colors"
          >
            ENTER PROTOCOL
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
