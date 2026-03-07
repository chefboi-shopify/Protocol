"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, MapPin, ArrowRight, CheckCircle, AlertTriangle, Shield, Zap, CalendarClock } from "lucide-react";
import { LocationInput } from "@/lib/location-input";

interface CityCount {
  city: string;
  count: number;
}

export default function WaitlistPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [phase, setPhase] = useState<"form" | "submitting" | "success">("form");
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [cities, setCities] = useState<CityCount[]>([]);
  const [resultCity, setResultCity] = useState("");
  const [resultCityCount, setResultCityCount] = useState(0);

  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((data) => {
        setTotalCount(data.total || 0);
        setCities(data.cities || []);
      })
      .catch(() => {});
  }, []);

  const handleLocationChange = useCallback((c: string) => {
    setCity(c);
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !city.trim()) {
      setError("All fields are required.");
      return;
    }
    setPhase("submitting");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), city: city.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Something went wrong.");
        setPhase("form");
        return;
      }

      setTotalCount(data.totalCount);
      setResultCity(data.city);
      setResultCityCount(data.cityCount);
      setPhase("success");
    } catch {
      setError("Network error. Try again.");
      setPhase("form");
    }
  };

  return (
    <div className="min-h-screen -mt-4">
      {/* Hero */}
      <section className="pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-block border border-neutral-800 px-4 py-1.5 mb-8">
            <span className="font-mono text-[10px] tracking-[0.4em] text-neutral-500 uppercase">
              Launching 2026
            </span>
          </div>

          <h1 className="font-mono text-4xl sm:text-5xl tracking-tight text-neutral-100 mb-2 font-bold">
            PROTOCOL
          </h1>

          <div className="w-12 h-px bg-neutral-700 mx-auto my-6" />

          <p className="font-mono text-sm text-neutral-400 leading-relaxed max-w-md mx-auto mb-2">
            The dating app that wants you to leave.
          </p>
          <p className="font-mono text-xs text-neutral-600 leading-relaxed max-w-sm mx-auto">
            120 hours. Real money. Real meetings. No infinite swiping.
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="pb-10"
      >
        <div className="grid grid-cols-1 gap-px bg-neutral-800 border border-neutral-800">
          {[
            {
              icon: Shield,
              title: "$90 SEASON PASS",
              desc: "Pay once. 90 days of real intent. No free riders, no bots, no games.",
            },
            {
              icon: CalendarClock,
              title: "120-HOUR COUNTDOWN",
              desc: "Every match has a deadline. Meet in person or the match dies. No endless texting.",
            },
            {
              icon: Zap,
              title: "ACCOUNTABILITY ENGINE",
              desc: "Your reliability score tracks follow-through. Flake and your future matches suffer.",
            },
            {
              icon: Users,
              title: "JOINT EXIT",
              desc: "Found your person? Delete both accounts together. We refund 30% of your pass.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-neutral-950 p-5 flex gap-4 items-start">
              <div className="border border-neutral-800 p-2 shrink-0">
                <Icon size={16} className="text-neutral-500" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-mono text-xs tracking-[0.2em] text-neutral-300 mb-1.5">{title}</h3>
                <p className="font-mono text-[11px] text-neutral-600 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Signup Form */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="pb-10"
      >
        <AnimatePresence mode="wait">
          {phase === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="border border-neutral-800 bg-neutral-950"
            >
              <div className="border-b border-neutral-800 px-5 py-3">
                <span className="font-mono text-[10px] tracking-[0.3em] text-green-500 uppercase">
                  Position Secured
                </span>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500 shrink-0" strokeWidth={1.5} />
                  <p className="font-mono text-sm text-neutral-300">
                    You&apos;re on the list, {firstName}.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-px bg-neutral-800">
                  <div className="bg-neutral-900 p-4 text-center">
                    <div className="font-mono text-2xl text-neutral-200 mb-1">{totalCount.toLocaleString()}</div>
                    <div className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase">Total Waitlist</div>
                  </div>
                  <div className="bg-neutral-900 p-4 text-center">
                    <div className="font-mono text-2xl text-neutral-200 mb-1">{resultCityCount.toLocaleString()}</div>
                    <div className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase">In {resultCity}</div>
                  </div>
                </div>

                <p className="font-mono text-[10px] text-neutral-600 leading-relaxed">
                  We launch city by city once 2,000 people sign up in a metro. The more people from your city, the sooner it opens. Tell your friends.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border border-neutral-800 bg-neutral-950"
            >
              <div className="border-b border-neutral-800 px-5 py-3 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-400 uppercase">
                  Join the Waitlist
                </span>
                {totalCount > 0 && (
                  <span className="font-mono text-[10px] text-neutral-600 flex items-center gap-1.5">
                    <Users size={10} strokeWidth={1.5} />
                    {totalCount.toLocaleString()} waiting
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase block mb-1.5">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="input-field"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase block mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Protocol"
                      className="input-field"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@protocol.dating"
                    className="input-field"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase block mb-1.5">Your City</label>
                  <LocationInput
                    value={city}
                    onChange={handleLocationChange}
                    placeholder="San Francisco, New York, Austin..."
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 py-2">
                    <AlertTriangle size={12} className="text-red-500 shrink-0" strokeWidth={1.5} />
                    <span className="font-mono text-[11px] text-red-400">{error}</span>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={phase === "submitting"}
                  className="w-full bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-xs tracking-[0.25em] uppercase py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {phase === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <Clock size={14} className="animate-spin" strokeWidth={1.5} />
                      SECURING POSITION...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      CLAIM YOUR SPOT
                      <ArrowRight size={14} strokeWidth={1.5} />
                    </span>
                  )}
                </button>

                <p className="font-mono text-[9px] text-neutral-700 text-center leading-relaxed">
                  28+ only. $90 Season Pass at launch. No spam. No selling your data.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* City Leaderboard */}
      {cities.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="pb-10"
        >
          <div className="border border-neutral-800 bg-neutral-950">
            <div className="border-b border-neutral-800 px-5 py-3 flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-400 uppercase">
                City Demand
              </span>
              <span className="font-mono text-[9px] text-neutral-700">
                2,000 to unlock
              </span>
            </div>
            <div className="divide-y divide-neutral-800/50">
              {cities.map((c, i) => {
                const progress = Math.min(100, (c.count / 2000) * 100);
                return (
                  <div key={c.city} className="px-5 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-neutral-700 w-5 text-right">{i + 1}.</span>
                        <MapPin size={10} className="text-neutral-700" strokeWidth={1.5} />
                        <span className="font-mono text-xs text-neutral-400">{c.city}</span>
                      </div>
                      <span className="font-mono text-xs text-neutral-500">{c.count.toLocaleString()}</span>
                    </div>
                    <div className="ml-7">
                      <div className="h-1 bg-neutral-900 w-full">
                        <div
                          className={`h-full transition-all duration-700 ${
                            progress >= 100
                              ? "bg-green-500"
                              : progress >= 50
                                ? "bg-neutral-400"
                                : "bg-neutral-700"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* Philosophy */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="pb-10"
      >
        <div className="border border-neutral-800 bg-neutral-950 p-6">
          <h2 className="font-mono text-[10px] tracking-[0.3em] text-neutral-500 uppercase mb-5">Why This Exists</h2>
          <div className="space-y-4">
            <p className="font-mono text-xs text-neutral-400 leading-relaxed">
              Every dating app is optimized to keep you swiping. Their revenue goes up when you stay single. Their incentive is the opposite of yours.
            </p>
            <p className="font-mono text-xs text-neutral-400 leading-relaxed">
              PROTOCOL is different. We charge upfront, give you a deadline, and pay you to leave when it works. Our business model only succeeds if you do.
            </p>
            <p className="font-mono text-xs text-neutral-500 leading-relaxed">
              No infinite scroll. No dopamine loops. No algorithmic manipulation. Just a countdown, a real person, and a reason to show up.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="pb-16 text-center space-y-3">
        <div className="w-8 h-px bg-neutral-800 mx-auto" />
        <p className="font-mono text-[9px] tracking-[0.2em] text-neutral-700 uppercase">
          Protocol. 2026.
        </p>
        <p className="font-mono text-[9px] text-neutral-800">
          Designed to be deleted.
        </p>
      </footer>
    </div>
  );
}
