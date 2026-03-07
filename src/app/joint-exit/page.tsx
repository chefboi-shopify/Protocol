"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, AlertTriangle, Check } from "lucide-react";
import QRCode from "qrcode";

type Phase = "generate" | "waiting" | "enter" | "success";

export default function JointExitPage() {
  const [phase, setPhase] = useState<Phase>("generate");
  const [myCode, setMyCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const generateCode = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/joint-exit", { method: "POST" });
      const data = await res.json();
      if (data.code) {
        setMyCode(data.code);
        const qr = await QRCode.toDataURL(data.code, {
          width: 256,
          margin: 2,
          color: { dark: "#e5e5e5", light: "#0a0a0a" },
        });
        setQrDataUrl(qr);
        setPhase("waiting");
      } else {
        setError(data.error || "Failed to generate code.");
      }
    } catch {
      setError("Connection failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmExit = async () => {
    if (!partnerCode.trim()) { setError("Enter your partner's code."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/joint-exit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: partnerCode.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setRefundAmount(data.refundPerPerson);
        setPhase("success");
      } else {
        setError(data.error || "Confirmation failed.");
      }
    } catch {
      setError("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phase === "success") {
      const timer = setTimeout(() => { window.location.href = "/onboarding"; }, 10000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Heart size={32} className="text-neutral-400 mx-auto mb-4" strokeWidth={1} />
          <h1 className="font-mono text-xl tracking-[0.3em] text-neutral-200 mb-2">JOINT EXIT</h1>
          <p className="font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase">
            You found your person. Time to leave.
          </p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-3 border border-red-900/50 bg-red-950/30 px-4 py-3 mb-6">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <span className="font-mono text-xs text-red-400 tracking-wider">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* STEP 1: Generate your code */}
          {phase === "generate" && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="border border-neutral-800 bg-neutral-900 p-6">
                <p className="font-mono text-xs text-neutral-400 leading-relaxed mb-4">
                  Both you and your partner must be together in person. You&apos;ll each generate a code and enter each other&apos;s code to confirm.
                </p>
                <p className="font-mono text-xs text-neutral-400 leading-relaxed">
                  Upon confirmation, both accounts will be deleted and each person receives a <span className="text-green-500">30% refund</span> of their Season Pass.
                </p>
              </div>
              <button onClick={generateCode} disabled={loading}
                className="w-full bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-sm tracking-[0.2em] uppercase py-4 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "GENERATING..." : "GENERATE MY CODE"}
              </button>
            </motion.div>
          )}

          {/* STEP 2: Show QR + code, option to enter partner's */}
          {phase === "waiting" && (
            <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="border border-neutral-800 bg-neutral-900 p-6 text-center">
                <p className="font-mono text-[10px] text-neutral-600 tracking-[0.2em] uppercase mb-4">
                  Show this to your partner
                </p>
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR Code" className="mx-auto mb-4 w-48 h-48" />
                )}
                <div className="bg-neutral-950 border border-neutral-800 px-6 py-4 inline-block">
                  <span className="font-mono text-2xl tracking-[0.5em] text-neutral-200">{myCode}</span>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-5">
                <p className="font-mono text-[10px] text-neutral-600 tracking-[0.2em] uppercase mb-3">
                  Enter your partner&apos;s code
                </p>
                <button onClick={() => setPhase("enter")}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-neutral-200 font-mono text-sm tracking-[0.2em] uppercase py-4 transition-colors">
                  I HAVE THEIR CODE
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Enter partner's code */}
          {phase === "enter" && (
            <motion.div key="enter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="border border-neutral-800 bg-neutral-900 p-6">
                <p className="font-mono text-[10px] text-neutral-600 tracking-[0.2em] uppercase mb-4">
                  Enter your partner&apos;s 8-character code
                </p>
                <input
                  type="text"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  className="w-full bg-neutral-950 border border-neutral-800 px-6 py-4 font-mono text-2xl text-center text-neutral-200 tracking-[0.5em] rounded-none focus:border-neutral-600 transition-colors uppercase"
                />
              </div>

              <div className="border border-orange-900/50 bg-orange-950/20 p-4">
                <p className="font-mono text-[10px] text-orange-400 leading-relaxed">
                  This action is permanent. Both accounts will be deleted. Both parties receive a 30% refund. There is no undo.
                </p>
              </div>

              <button onClick={confirmExit} disabled={loading || partnerCode.length < 8}
                className="w-full bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-sm tracking-[0.2em] uppercase py-4 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "PROCESSING..." : "CONFIRM JOINT EXIT"}
              </button>

              <button onClick={() => setPhase("waiting")}
                className="w-full py-3 border border-neutral-800 hover:bg-neutral-900 font-mono text-xs text-neutral-600 tracking-wider transition-colors">
                BACK
              </button>
            </motion.div>
          )}

          {/* SUCCESS */}
          {phase === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
              <div className="border-2 border-green-900 bg-green-950/20 p-8">
                <Check size={48} className="text-green-500 mx-auto mb-4" strokeWidth={1} />
                <h2 className="font-mono text-lg tracking-[0.3em] text-green-400 mb-3">
                  PROTOCOL COMPLETE
                </h2>
                <p className="font-mono text-xs text-neutral-400 leading-relaxed mb-4">
                  Both accounts have been deleted.
                </p>
                {refundAmount && (
                  <div className="bg-neutral-950 border border-green-900/50 px-6 py-3 inline-block">
                    <span className="font-mono text-sm text-green-400">{refundAmount} refunded to each person</span>
                  </div>
                )}
              </div>
              <p className="font-mono text-[10px] text-neutral-700">
                Go live your life. This page will redirect in 10 seconds.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
