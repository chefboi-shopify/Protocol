"use client";

import { useState, useEffect } from "react";
import { Download, Users, MapPin, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Signup {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  createdAt: string;
}

interface CityCount {
  city: string;
  count: number;
}

export default function AdminPage() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [cities, setCities] = useState<CityCount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/waitlist");
      if (res.ok) {
        const data = await res.json();
        setSignups(data.signups || []);
        setCities(data.cities || []);
        setTotal(data.total || 0);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const exportCsv = () => {
    window.open("/api/admin/waitlist?format=csv", "_blank");
  };

  return (
    <div className="min-h-screen -mt-4 pt-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-mono text-lg tracking-[0.2em] text-neutral-200">ADMIN</h1>
          <p className="font-mono text-[10px] text-neutral-600 tracking-[0.15em] uppercase mt-1">Waitlist Dashboard</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="border border-neutral-800 hover:border-neutral-600 px-3 py-2 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={`text-neutral-500 ${loading ? "animate-spin" : ""}`} strokeWidth={1.5} />
          </button>
          <button
            onClick={exportCsv}
            className="border border-neutral-800 hover:border-neutral-600 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-2"
          >
            <Download size={12} strokeWidth={1.5} />
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-neutral-800 border border-neutral-800 mb-8">
        <div className="bg-neutral-950 p-5 text-center">
          <div className="font-mono text-3xl text-neutral-200 mb-1">{total}</div>
          <div className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase">Total Signups</div>
        </div>
        <div className="bg-neutral-950 p-5 text-center">
          <div className="font-mono text-3xl text-neutral-200 mb-1">{cities.length}</div>
          <div className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase">Cities</div>
        </div>
        <div className="bg-neutral-950 p-5 text-center">
          <div className="font-mono text-3xl text-neutral-200 mb-1">
            {cities.length > 0 ? cities[0].count : 0}
          </div>
          <div className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase truncate px-1">
            {cities.length > 0 ? cities[0].city : "—"}
          </div>
        </div>
      </div>

      {/* City Breakdown */}
      {cities.length > 0 && (
        <div className="border border-neutral-800 bg-neutral-950 mb-8">
          <div className="border-b border-neutral-800 px-5 py-3 flex items-center gap-2">
            <MapPin size={12} className="text-neutral-600" strokeWidth={1.5} />
            <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-400 uppercase">By City</span>
          </div>
          <div className="divide-y divide-neutral-800/50">
            {cities.map((c) => {
              const progress = Math.min(100, (c.count / 2000) * 100);
              return (
                <div key={c.city} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-neutral-300">{c.city}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-neutral-500">{c.count}</span>
                      {progress >= 100 && (
                        <span className="font-mono text-[9px] text-green-500 tracking-wider">READY</span>
                      )}
                    </div>
                  </div>
                  <div className="h-1 bg-neutral-900 w-full">
                    <div
                      className={`h-full transition-all ${progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-neutral-400" : "bg-neutral-700"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Signups Table */}
      <div className="border border-neutral-800 bg-neutral-950">
        <div className="border-b border-neutral-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={12} className="text-neutral-600" strokeWidth={1.5} />
            <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-400 uppercase">All Signups</span>
          </div>
          <span className="font-mono text-[10px] text-neutral-700">{total} entries</span>
        </div>

        {signups.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-mono text-xs text-neutral-600">No signups yet.</p>
            <p className="font-mono text-[10px] text-neutral-700 mt-2">Share your waitlist link to start collecting.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="px-4 py-2 text-left font-mono text-[9px] tracking-[0.15em] text-neutral-600 uppercase">#</th>
                  <th className="px-4 py-2 text-left font-mono text-[9px] tracking-[0.15em] text-neutral-600 uppercase">Name</th>
                  <th className="px-4 py-2 text-left font-mono text-[9px] tracking-[0.15em] text-neutral-600 uppercase">Email</th>
                  <th className="px-4 py-2 text-left font-mono text-[9px] tracking-[0.15em] text-neutral-600 uppercase">City</th>
                  <th className="px-4 py-2 text-left font-mono text-[9px] tracking-[0.15em] text-neutral-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/30">
                {signups.map((s, i) => (
                  <tr key={s.id} className="hover:bg-neutral-900/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[10px] text-neutral-700">{i + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-300">{s.firstName} {s.lastName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">{s.email}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">{s.city}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-neutral-700">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-8 border border-neutral-800 bg-neutral-950 divide-y divide-neutral-800/50">
        <Link
          href="/onboarding"
          className="flex items-center justify-between px-5 py-3 hover:bg-neutral-900/50 transition-colors"
        >
          <span className="font-mono text-xs text-neutral-400">Enter App (Onboarding)</span>
          <ArrowRight size={14} className="text-neutral-700" strokeWidth={1.5} />
        </Link>
        <Link
          href="/feed"
          className="flex items-center justify-between px-5 py-3 hover:bg-neutral-900/50 transition-colors"
        >
          <span className="font-mono text-xs text-neutral-400">Feed</span>
          <ArrowRight size={14} className="text-neutral-700" strokeWidth={1.5} />
        </Link>
        <Link
          href="/operator-config"
          className="flex items-center justify-between px-5 py-3 hover:bg-neutral-900/50 transition-colors"
        >
          <span className="font-mono text-xs text-neutral-400">Settings</span>
          <ArrowRight size={14} className="text-neutral-700" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}
