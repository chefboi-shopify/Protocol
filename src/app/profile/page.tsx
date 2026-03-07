"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Shield,
  Activity,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  Loader2,
  LogOut,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  age: number;
  fiscalArchetype: string;
  reliabilityScore: number;
  dailySwipesLeft: number;
  createdAt: string;
  stats: {
    totalMatches: number;
    activeMatches: number;
    protocolsSet: number;
    debriefsFiled: number;
    expiredMatches: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/onboarding");
        return;
      }
      const data = await res.json();
      setProfile(data.profile);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={24} className="animate-spin text-neutral-600" strokeWidth={1.5} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="font-mono text-sm text-neutral-500">PROFILE NOT FOUND</span>
      </div>
    );
  }

  const reliabilityColor =
    profile.reliabilityScore >= 90
      ? "text-green-500"
      : profile.reliabilityScore >= 70
        ? "text-orange-500"
        : "text-red-500";

  return (
    <div className="pt-6 pb-12">
      {/* Identity Block */}
      <div className="border border-neutral-800 mb-6">
        <div className="border-b border-neutral-800 px-5 py-4">
          <span className="font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase">
            Operator Profile
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-mono text-xl text-neutral-200">{profile.name}</h1>
              <div className="font-mono text-xs text-neutral-500 mt-1">
                {profile.age} · {profile.fiscalArchetype}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">
                Reliability
              </div>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`font-mono text-3xl ${reliabilityColor}`}
              >
                {profile.reliabilityScore}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-neutral-800 border border-neutral-800 mb-6">
        <StatCell
          icon={Target}
          label="Total Matches"
          value={profile.stats.totalMatches}
        />
        <StatCell
          icon={Activity}
          label="Active"
          value={profile.stats.activeMatches}
          valueColor="text-neutral-200"
        />
        <StatCell
          icon={TrendingUp}
          label="Protocols Set"
          value={profile.stats.protocolsSet}
          valueColor="text-green-500"
        />
        <StatCell
          icon={TrendingDown}
          label="Expired"
          value={profile.stats.expiredMatches}
          valueColor="text-red-500"
        />
      </div>

      {/* Debriefs Filed */}
      <div className="border border-neutral-800 mb-6">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">
              Debriefs Filed
            </span>
            <span className="font-mono text-lg text-neutral-200">
              {profile.stats.debriefsFiled}
            </span>
          </div>
          <div>
            <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">
              Daily Swipes Left
            </span>
            <span className="font-mono text-lg text-neutral-200">
              {profile.dailySwipesLeft}
              <span className="text-neutral-700">/20</span>
            </span>
          </div>
          <div>
            <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-1">
              Member Since
            </span>
            <span className="font-mono text-sm text-neutral-400">
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Reliability Breakdown */}
      <div className="border border-neutral-800 bg-neutral-900 p-5 mb-6">
        <span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-4">
          Reliability Factors
        </span>
        <div className="space-y-3">
          <ReliabilityBar label="Show Rate" value={95} />
          <ReliabilityBar label="Response Time" value={88} />
          <ReliabilityBar label="Protocol Completion" value={100} />
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={async () => {
          await fetch("/api/profile", { method: "DELETE" });
          router.push("/onboarding");
        }}
        className="w-full py-3 border border-neutral-800 hover:bg-neutral-900 font-mono text-xs tracking-[0.2em] text-neutral-600 hover:text-neutral-400 uppercase transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={14} strokeWidth={1.5} />
        END SESSION
      </button>
    </div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  valueColor = "text-neutral-200",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  valueColor?: string;
}) {
  return (
    <div className="bg-neutral-950 px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} className="text-neutral-600" strokeWidth={1.5} />
        <span className="font-mono text-[9px] tracking-[0.2em] text-neutral-600 uppercase">
          {label}
        </span>
      </div>
      <span className={`font-mono text-xl ${valueColor}`}>{value}</span>
    </div>
  );
}

function ReliabilityBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-mono text-[10px] text-neutral-500">{label}</span>
        <span className="font-mono text-[10px] text-neutral-400">{value}%</span>
      </div>
      <div className="h-1 bg-neutral-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${
            value >= 90 ? "bg-green-600" : value >= 70 ? "bg-orange-600" : "bg-red-600"
          }`}
        />
      </div>
    </div>
  );
}
