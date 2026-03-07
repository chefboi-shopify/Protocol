"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Send, MapPin, Loader2, Lock, AlertTriangle, Clock } from "lucide-react";
import { CountdownTimer } from "@/lib/components";
import { getPusherClient } from "@/lib/pusher";

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isSystem?: boolean;
  isScreened?: boolean;
}

interface MatchInfo {
  id: string;
  status: string;
  expiresAt: string;
  other: {
    id: string;
    name: string;
    fiscalArchetype: string;
    videoUrl: string | null;
  };
}

function getBlurPx(messageCount: number): number {
  if (messageCount >= 10) return 0;
  return Math.max(0, 40 - Math.floor(messageCount / 2) * 8);
}

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [protocolSet, setProtocolSet] = useState(false);
  const [triedToSchedule, setTriedToSchedule] = useState(false);
  const [extensionRequested, setExtensionRequested] = useState(false);
  const [extensionApplied, setExtensionApplied] = useState(false);
  const [extensionByMe, setExtensionByMe] = useState(false);
  const [hoursLeft, setHoursLeft] = useState(999);
  const [screeningWarning, setScreeningWarning] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserId = useRef<string>("");

  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?matchId=${matchId}`);
      if (res.status === 401) {
        window.location.href = "/onboarding";
        return;
      }
      const data = await res.json();
      setMatch(data.match);
      setMessages(data.messages);
      setProtocolSet(data.match.status === "PROTOCOL_SET");

      // Extension state
      setExtensionRequested(!!data.match.extensionRequestedBy);
      setExtensionApplied(!!data.match.extensionApplied);
      const hLeft = (new Date(data.match.expiresAt).getTime() - Date.now()) / 3_600_000;
      setHoursLeft(hLeft);

      const userRes = await fetch("/api/feed");
      if (userRes.ok) {
        // extract userId from cookie context
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchChat();

    // Try Pusher real-time, fall back to polling
    const pusher = getPusherClient();
    if (pusher) {
      const channel = pusher.subscribe(`chat-${matchId}`);
      channel.bind("new-message", (data: ChatMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      });
      return () => {
        channel.unbind_all();
        pusher.unsubscribe(`chat-${matchId}`);
      };
    }

    // Polling fallback when Pusher is not configured
    const poll = setInterval(fetchChat, 15000);
    return () => clearInterval(poll);
  }, [fetchChat, matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, content: input.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setInput("");
        if (data.warning) {
          setScreeningWarning(data.warning.message);
          setTimeout(() => setScreeningWarning(null), 8000);
        }
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleRequestExtension = async () => {
    const res = await fetch(`/api/matches/${matchId}/request-extension`, { method: "POST" });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else if (data.ok) { setExtensionRequested(true); setExtensionByMe(true); fetchChat(); }
  };

  const handleAcceptExtension = async () => {
    const res = await fetch(`/api/matches/${matchId}/accept-extension`, { method: "POST" });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    else if (data.ok) { setExtensionApplied(true); fetchChat(); }
  };

  const handleInitiateProtocol = () => {
    router.push(`/protocol/${matchId}`);
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

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="font-mono text-sm text-neutral-500">
          PROTOCOL NOT FOUND
        </span>
      </div>
    );
  }

  const blurPx = getBlurPx(messages.length);

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-950">
      {/* Background Image with Dynamic Blur */}
      {match.other.videoUrl && (
        <>
          <motion.img
            src={match.other.videoUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ filter: `blur(${blurPx}px)` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-neutral-950/85" />
        </>
      )}

      {/* Header */}
      <div className="relative z-10 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-sm px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <div className="font-mono text-base text-neutral-200">
              {match.other.name}
            </div>
            <div className="font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mt-0.5">
              {match.other.fiscalArchetype}
              {messages.length >= 10 && (
                <span className="text-slate-400 ml-2">· BLUR LIFTED</span>
              )}
            </div>
          </div>
          <div className="text-right">
            {protocolSet ? (
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-slate-400" strokeWidth={1.5} />
                <span className="font-mono text-xs text-slate-400 tracking-wider">
                  PROTOCOL SET
                </span>
              </div>
            ) : (
              <CountdownTimer expiresAt={match.expiresAt} />
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-lg mx-auto space-y-2">
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <span className="font-mono text-xs tracking-[0.2em] text-neutral-600 uppercase">
                Start the conversation
              </span>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center py-2">
                  <div className="max-w-[90%] px-4 py-3 border border-neutral-800 bg-neutral-900/80">
                    <span className="font-mono text-[11px] text-neutral-500 leading-relaxed">{msg.content}</span>
                  </div>
                </div>
              );
            }
            const isSelf = msg.senderId !== match.other.id;
            return (
              <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-3 ${isSelf ? "bg-slate-700" : "bg-neutral-900 border border-neutral-800"}`}>
                  <span className={`font-mono text-sm ${isSelf ? "text-neutral-200" : "text-neutral-300"}`}>
                    {msg.content}
                  </span>
                  {msg.isScreened && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle size={10} className="text-orange-500" />
                      <span className="font-mono text-[9px] text-orange-500">SCREENED</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Screening Warning */}
      {screeningWarning && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-4 pb-2">
          <div className="max-w-lg mx-auto flex items-start gap-3 border border-red-900/60 bg-red-950/40 px-4 py-3">
            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <span className="font-mono text-[11px] text-red-400 leading-relaxed">{screeningWarning}</span>
          </div>
        </motion.div>
      )}

      {/* Extension UI */}
      {!protocolSet && hoursLeft <= 24 && hoursLeft > 0 && !extensionApplied && (
        <div className="relative z-10 px-4 pb-2">
          <div className="max-w-lg mx-auto">
            {!extensionRequested ? (
              <button onClick={handleRequestExtension}
                className="w-full py-3 border border-orange-800/60 bg-orange-950/30 hover:bg-orange-950/50 transition-colors flex items-center justify-center gap-2">
                <Clock size={14} className="text-orange-400" strokeWidth={1.5} />
                <span className="font-mono text-xs tracking-[0.15em] text-orange-400 uppercase">
                  Request 72h Extension — $3.00
                </span>
              </button>
            ) : extensionByMe ? (
              <div className="text-center py-3 border border-neutral-800 bg-neutral-900/50">
                <span className="font-mono text-[10px] text-neutral-500 tracking-wider">
                  Extension requested. Waiting for your match to accept.
                </span>
              </div>
            ) : (
              <button onClick={handleAcceptExtension}
                className="w-full py-3 border border-green-800/60 bg-green-950/30 hover:bg-green-950/50 transition-colors flex items-center justify-center gap-2">
                <Clock size={14} className="text-green-400" strokeWidth={1.5} />
                <span className="font-mono text-xs tracking-[0.15em] text-green-400 uppercase">
                  Accept Extension — $3.00
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {extensionApplied && (
        <div className="relative z-10 px-4 pb-2">
          <div className="max-w-lg mx-auto text-center py-2 border border-green-900/40 bg-green-950/20">
            <span className="font-mono text-[10px] text-green-500 tracking-wider">72H EXTENSION ACTIVE</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!protocolSet && (
        <div className="relative z-10 px-4 pb-2">
          <div className="max-w-lg mx-auto space-y-2">
            <button
              onClick={handleInitiateProtocol}
              className="w-full py-3 bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
            >
              <MapPin size={16} className="text-neutral-200" strokeWidth={1.5} />
              <span className="font-mono text-xs tracking-[0.25em] text-neutral-200 uppercase">
                Schedule 20-Min Meeting
              </span>
            </button>
            {!triedToSchedule && (
              <button
                onClick={async () => {
                  await fetch(`/api/matches/${matchId}/schedule-attempt`, { method: "POST" });
                  setTriedToSchedule(true);
                }}
                className="w-full py-2 border border-neutral-800 hover:border-neutral-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="font-mono text-[10px] tracking-[0.15em] text-neutral-600 uppercase">
                  I tried to schedule (they didn&apos;t respond)
                </span>
              </button>
            )}
            {triedToSchedule && (
              <div className="text-center py-2">
                <span className="font-mono text-[10px] text-neutral-600 tracking-wider">
                  Noted — your reliability will be protected if this expires.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative z-10 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-sm px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Say something..."
            className="flex-1 bg-neutral-900 border border-neutral-800 px-4 py-3 font-mono text-sm text-neutral-200 rounded-none focus:border-neutral-600 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="bg-slate-700 hover:bg-slate-600 p-3 transition-colors disabled:opacity-50"
          >
            <Send
              size={18}
              className="text-neutral-200"
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
