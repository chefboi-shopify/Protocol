"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Eye, EyeOff, Clock, AlertTriangle, Trash2,
  Loader2, Save, Lock,
} from "lucide-react";
import { LocationInput } from "@/lib/location-input";

const ARCHETYPES = ["The Architect", "The Experientialist", "The Minimalist", "The Builder"] as const;
const ATTACHMENT_STYLES = ["Secure", "Anxious", "Avoidant", "Evolving"] as const;
const SOCIAL_BATTERY = ["Introvert", "Ambivert", "Extrovert"] as const;
const LIFE_PACE = ["Slow & Steady", "Balanced", "Fast & Driven"] as const;
const DEALBREAKER_OPTIONS = ["Smoking", "Non-Drinker", "Heavy Drinker", "No Pets", "Vegan"] as const;
const RELIGION_OPTIONS = ["Not Religious", "Spiritual", "Christian", "Catholic", "Jewish", "Muslim", "Hindu", "Buddhist", "Other"] as const;
const POLITICAL_OPTIONS = ["Liberal", "Moderate", "Conservative", "Apolitical", "Other"] as const;
const KIDS_OPTIONS = ["Wants Kids", "Doesn't Want Kids", "Has Kids", "Open to Kids", "Not Sure Yet"] as const;

interface Config {
  name: string; age: number; gender: string; interestedIn: string;
  fiscalArchetype: string; archetypeChangedAt: string | null;
  attachmentStyle: string; socialBattery: string; lifePace: string;
  locationCity: string;
  religion: string; politicalLeaning: string; kidsPreference: string;
  targetReligion: string; targetPolitical: string; targetKids: string;
  targetMinAge: number; targetMaxAge: number; targetArchetypes: string;
  targetAttachment: string; targetSocialBattery: string; targetLifePace: string;
  dealbreakers: string; strongPreferences: string; tags: string;
  isGhostMode: boolean; reliabilityScore: number;
}

export default function OperatorConfigPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [targetMinAge, setTargetMinAge] = useState(28);
  const [targetMaxAge, setTargetMaxAge] = useState(40);
  const [targetArchetypes, setTargetArchetypes] = useState<string[]>([]);
  const [targetAttachment, setTargetAttachment] = useState<string[]>([]);
  const [targetSocialBattery, setTargetSocialBattery] = useState<string[]>([]);
  const [targetLifePace, setTargetLifePace] = useState<string[]>([]);
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);
  const [strongPreferences, setStrongPreferences] = useState<string[]>([]);
  const [locationCity, setLocationCity] = useState("");
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [activeMatchCount, setActiveMatchCount] = useState(0);
  const [newArchetype, setNewArchetype] = useState("");
  const [archetypeLocked, setArchetypeLocked] = useState(false);
  const [archetypeCooldownDays, setArchetypeCooldownDays] = useState(0);

  const [attachmentStyle, setAttachmentStyle] = useState("");
  const [socialBattery, setSocialBattery] = useState("");
  const [lifePace, setLifePace] = useState("");
  const [religion, setReligion] = useState("");
  const [politicalLeaning, setPoliticalLeaning] = useState("");
  const [kidsPreference, setKidsPreference] = useState("");
  const [targetReligion, setTargetReligion] = useState<string[]>([]);
  const [targetPolitical, setTargetPolitical] = useState<string[]>([]);
  const [targetKids, setTargetKids] = useState<string[]>([]);

  const p = (csv: string | undefined) => csv ? csv.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/operator-config");
      if (res.status === 401) { router.push("/onboarding"); return; }
      const data = await res.json();
      const c = data.config as Config;
      setConfig(c);
      setTargetMinAge(c.targetMinAge); setTargetMaxAge(c.targetMaxAge);
      setTargetArchetypes(p(c.targetArchetypes));
      setTargetAttachment(p(c.targetAttachment));
      setTargetSocialBattery(p(c.targetSocialBattery));
      setTargetLifePace(p(c.targetLifePace));
      setDealbreakers(p(c.dealbreakers));
      setStrongPreferences(p(c.strongPreferences));
      setLocationCity(c.locationCity); setIsGhostMode(c.isGhostMode);
      setNewArchetype(c.fiscalArchetype);
      setAttachmentStyle(c.attachmentStyle || "");
      setSocialBattery(c.socialBattery || "");
      setLifePace(c.lifePace || "");
      setReligion(c.religion || ""); setPoliticalLeaning(c.politicalLeaning || ""); setKidsPreference(c.kidsPreference || "");
      setTargetReligion(p(c.targetReligion)); setTargetPolitical(p(c.targetPolitical)); setTargetKids(p(c.targetKids));
      if (c.archetypeChangedAt) {
        const days = (Date.now() - new Date(c.archetypeChangedAt).getTime()) / 86_400_000;
        if (days < 30) { setArchetypeLocked(true); setArchetypeCooldownDays(Math.ceil(30 - days)); }
      }
      // Fetch active match count for Ghost Mode guard
      try {
        const mRes = await fetch("/api/matches");
        if (mRes.ok) {
          const mData = await mRes.json();
          setActiveMatchCount(Array.isArray(mData.matches) ? mData.matches.filter((m: { status: string }) => m.status === "ACTIVE" || m.status === "PROTOCOL_SET").length : 0);
        }
      } catch { /* non-critical */ }
    } catch { setError("Failed to load settings."); } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleLocationChange = useCallback((city: string) => {
    setLocationCity(city);
  }, []);

  const toggle = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/operator-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetMinAge, targetMaxAge,
          targetArchetypes: targetArchetypes.join(","),
          targetAttachment: targetAttachment.join(","),
          targetSocialBattery: targetSocialBattery.join(","),
          targetLifePace: targetLifePace.join(","),
          dealbreakers: dealbreakers.join(","),
          strongPreferences: strongPreferences.join(","),
          locationCity, isGhostMode,
          attachmentStyle, socialBattery, lifePace,
          religion, politicalLeaning, kidsPreference,
          targetReligion: targetReligion.join(","),
          targetPolitical: targetPolitical.join(","),
          targetKids: targetKids.join(","),
          ...(newArchetype !== config?.fiscalArchetype && !archetypeLocked ? { fiscalArchetype: newArchetype } : {}),
        }),
      });
      if (res.ok) { setSuccess("Settings saved."); setTimeout(() => setSuccess(""), 3000); fetchConfig(); }
      else { const d = await res.json(); setError(d.error || "Update failed."); }
    } catch { setError("Connection failed."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await fetch("/api/operator-config", { method: "DELETE" }); window.location.href = "/onboarding"; }
    catch { setError("Deletion failed."); }
  };

  const chip = (active: boolean, alert = false) =>
    `px-3 py-2 border font-mono text-[10px] tracking-wider transition-colors ${active ? (alert ? "border-red-800 bg-red-950/40 text-red-400" : "border-neutral-400 bg-neutral-800 text-neutral-200") : "border-neutral-800 text-neutral-600 hover:border-neutral-700"}`;
  const softChip = (active: boolean) =>
    `px-3 py-2 border font-mono text-[10px] tracking-wider transition-colors ${active ? "border-amber-800 bg-amber-950/30 text-amber-400" : "border-neutral-800 text-neutral-600 hover:border-neutral-700"}`;

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={24} className="animate-spin text-neutral-600" strokeWidth={1.5} /></div>;
  if (!config) return null;

  return (
    <div className="pt-6 pb-16">
      <div className="flex items-center gap-2 mb-6">
        <Shield size={16} className="text-neutral-500" strokeWidth={1.5} />
        <h1 className="font-mono text-sm tracking-[0.3em] text-neutral-400 uppercase">Settings</h1>
      </div>

      <AnimatePresence>
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
      </AnimatePresence>

      <Section title="Identity">
        <div className="grid grid-cols-3 gap-px bg-neutral-800">
          <Cell label="Name" value={config.name} />
          <Cell label="Age" value={String(config.age)} />
          <Cell label="Reliability" value={`${config.reliabilityScore}%`} />
        </div>
      </Section>

      <Section title="Visibility">
        <button
          onClick={() => {
            if (!isGhostMode && activeMatchCount > 0) {
              setError(`Cannot pause while you have ${activeMatchCount} active match${activeMatchCount > 1 ? "es" : ""}. Complete or let them expire first.`);
              return;
            }
            setIsGhostMode(!isGhostMode);
          }}
          className={`w-full flex items-center justify-between px-4 py-4 border transition-colors ${isGhostMode ? "border-orange-900/50 bg-orange-950/20" : "border-neutral-800"} ${!isGhostMode && activeMatchCount > 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
          <div className="flex items-center gap-3">
            {isGhostMode ? <EyeOff size={16} className="text-orange-500" /> : <Eye size={16} className="text-neutral-500" />}
            <span className="font-mono text-xs tracking-wider text-neutral-300">{isGhostMode ? "Paused — not visible to anyone" : "Active — visible in feed"}</span>
          </div>
          <div className={`w-10 h-5 border transition-colors ${isGhostMode ? "bg-orange-900/50 border-orange-700" : "bg-neutral-800 border-neutral-700"}`}>
            <div className={`w-4 h-4 mt-[1px] transition-transform ${isGhostMode ? "translate-x-5 bg-orange-500" : "translate-x-0.5 bg-neutral-600"}`} />
          </div>
        </button>
        {!isGhostMode && activeMatchCount > 0 && (
          <div className="px-4 py-2 border-t border-neutral-800">
            <span className="font-mono text-[9px] text-neutral-600">{activeMatchCount} active match{activeMatchCount > 1 ? "es" : ""} — Ghost Mode pauses the feed only after all matches resolve.</span>
          </div>
        )}
      </Section>

      <Section title="Financial Style">
        {archetypeLocked ? (
          <div className="flex items-center gap-3 px-4 py-4">
            <Lock size={14} className="text-neutral-600" />
            <div>
              <span className="block font-mono text-xs text-neutral-300">{config.fiscalArchetype}</span>
              <span className="block font-mono text-[9px] text-neutral-600 mt-1"><Clock size={10} className="inline mr-1" />Locked — {archetypeCooldownDays} days remaining</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {ARCHETYPES.map((a) => <button key={a} onClick={() => setNewArchetype(a)} className={`w-full text-left px-4 py-3 border font-mono text-xs tracking-wider transition-colors ${newArchetype === a ? "border-neutral-400 bg-neutral-800 text-neutral-200" : "border-neutral-800 text-neutral-600 hover:border-neutral-700"}`}>{a}</button>)}
            {newArchetype !== config.fiscalArchetype && <p className="flex items-start gap-2 px-2 pt-1"><AlertTriangle size={12} className="text-orange-500 shrink-0 mt-0.5" /><span className="font-mono text-[10px] text-orange-400">Changing this locks it for 30 days.</span></p>}
          </div>
        )}
      </Section>

      <Section title="Personality">
        <div className="p-4 space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">Attachment Style</label>
            <div className="flex flex-wrap gap-2">
              {ATTACHMENT_STYLES.map((a) => <button key={a} onClick={() => setAttachmentStyle(a)} className={chip(attachmentStyle === a)}>{a}</button>)}
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">Social Energy</label>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_BATTERY.map((s) => <button key={s} onClick={() => setSocialBattery(s)} className={chip(socialBattery === s)}>{s}</button>)}
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">Life Pace</label>
            <div className="flex flex-wrap gap-2">
              {LIFE_PACE.map((l) => <button key={l} onClick={() => setLifePace(l)} className={chip(lifePace === l)}>{l}</button>)}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Values">
        <div className="p-4 space-y-4">
          <ChipGroup label="Religion" options={RELIGION_OPTIONS} selected={religion} onSelect={setReligion} chip={chip} />
          <ChipGroup label="Political" options={POLITICAL_OPTIONS} selected={politicalLeaning} onSelect={setPoliticalLeaning} chip={chip} />
          <ChipGroup label="Kids" options={KIDS_OPTIONS} selected={kidsPreference} onSelect={setKidsPreference} chip={chip} />
        </div>
      </Section>

      <Section title="Value Filters (who you're open to)">
        <div className="p-4 space-y-4">
          <MultiChipGroup label="Religion (empty = everyone)" options={RELIGION_OPTIONS} selected={targetReligion} toggle={(v) => toggle(targetReligion, v, setTargetReligion)} chip={chip} />
          <MultiChipGroup label="Political (empty = everyone)" options={POLITICAL_OPTIONS} selected={targetPolitical} toggle={(v) => toggle(targetPolitical, v, setTargetPolitical)} chip={chip} />
          <MultiChipGroup label="Kids (empty = everyone)" options={KIDS_OPTIONS} selected={targetKids} toggle={(v) => toggle(targetKids, v, setTargetKids)} chip={chip} />
        </div>
      </Section>

      <Section title="Preferences">
        <div className="space-y-5 p-4">
          <div>
            <label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">Location</label>
            <LocationInput value={locationCity} onChange={handleLocationChange} />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">Age Preference: {targetMinAge} — {targetMaxAge}</label>
            <div className="space-y-2">
              <div className="flex items-center gap-3"><span className="font-mono text-[10px] text-neutral-600 w-8">MIN</span><input type="range" min={28} max={60} value={targetMinAge} onChange={(e) => setTargetMinAge(Math.min(parseInt(e.target.value), targetMaxAge))} className="flex-1 accent-slate-600" /><span className="font-mono text-sm text-neutral-400 w-8">{targetMinAge}</span></div>
              <div className="flex items-center gap-3"><span className="font-mono text-[10px] text-neutral-600 w-8">MAX</span><input type="range" min={28} max={70} value={targetMaxAge} onChange={(e) => setTargetMaxAge(Math.max(parseInt(e.target.value), targetMinAge))} className="flex-1 accent-slate-600" /><span className="font-mono text-sm text-neutral-400 w-8">{targetMaxAge}</span></div>
            </div>
          </div>
          <MultiChipGroup label="Preferred Financial Styles" options={ARCHETYPES} selected={targetArchetypes} toggle={(v) => toggle(targetArchetypes, v, setTargetArchetypes)} chip={chip} fullWidth />
          <MultiChipGroup label="Preferred Attachment (empty = all)" options={ATTACHMENT_STYLES} selected={targetAttachment} toggle={(v) => toggle(targetAttachment, v, setTargetAttachment)} chip={chip} />
          <MultiChipGroup label="Preferred Social Energy (empty = all)" options={SOCIAL_BATTERY} selected={targetSocialBattery} toggle={(v) => toggle(targetSocialBattery, v, setTargetSocialBattery)} chip={chip} />
          <MultiChipGroup label="Preferred Life Pace (empty = all)" options={LIFE_PACE} selected={targetLifePace} toggle={(v) => toggle(targetLifePace, v, setTargetLifePace)} chip={chip} />

          <div className="border-t border-neutral-800 pt-4" />

          <div>
            <label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">Dealbreakers (hidden from feed)</label>
            <div className="flex flex-wrap gap-2">
              {DEALBREAKER_OPTIONS.map((d) => <button key={d} onClick={() => { toggle(dealbreakers, d, setDealbreakers); setStrongPreferences((pr) => pr.filter((x) => x !== d)); }} className={chip(dealbreakers.includes(d), true)}>{d}</button>)}
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">Strong Preferences (shown lower, not hidden)</label>
            <div className="flex flex-wrap gap-2">
              {DEALBREAKER_OPTIONS.filter((d) => !dealbreakers.includes(d)).map((d) => <button key={d} onClick={() => toggle(strongPreferences, d, setStrongPreferences)} className={softChip(strongPreferences.includes(d))}>{d}</button>)}
            </div>
            <span className="block font-mono text-[9px] text-neutral-700 mt-2">Dealbreakers remove people. Strong preferences just lower their ranking.</span>
          </div>
        </div>
      </Section>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-slate-700 hover:bg-slate-600 text-neutral-200 font-mono text-sm tracking-[0.2em] uppercase py-4 transition-colors disabled:opacity-50 mb-6 flex items-center justify-center gap-2">
        <Save size={16} strokeWidth={1.5} /> {saving ? "SAVING..." : "SAVE SETTINGS"}
      </button>

      <div className="border border-red-900/30 bg-red-950/10 p-5">
        <span className="block font-mono text-[9px] tracking-[0.3em] text-red-800 uppercase mb-3">Danger Zone</span>
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="w-full py-4 border-2 border-red-900 hover:bg-red-950/30 font-mono text-sm tracking-[0.2em] text-red-500 uppercase transition-colors flex items-center justify-center gap-2">
            <Trash2 size={16} strokeWidth={1.5} /> DELETE ACCOUNT
          </button>
        ) : (
          <div className="space-y-3">
            <p className="font-mono text-xs text-red-400">All your data will be permanently deleted. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 py-3 border border-neutral-800 font-mono text-xs tracking-wider text-neutral-500 hover:bg-neutral-900 transition-colors">CANCEL</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-900 hover:bg-red-800 font-mono text-xs tracking-wider text-red-200 transition-colors">CONFIRM</button>
            </div>
          </div>
        )}
      </div>

      {/* Joint Exit */}
      <div className="border border-green-900/40 bg-green-950/10 p-5">
        <h3 className="font-mono text-sm tracking-[0.2em] text-green-500 mb-3">JOINT EXIT</h3>
        <p className="font-mono text-xs text-neutral-500 leading-relaxed mb-4">
          Found your person? Meet up, scan each other&apos;s codes, and both accounts are deleted. You each get 30% of your Season Pass refunded.
        </p>
        <button
          onClick={() => router.push("/joint-exit")}
          className="w-full py-3 border border-green-800/50 hover:bg-green-950/30 font-mono text-xs tracking-wider text-green-400 transition-colors flex items-center justify-center gap-2"
        >
          INITIATE JOINT EXIT
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-5"><span className="block font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase mb-2 px-1">{title}</span><div className="border border-neutral-800 bg-neutral-900">{children}</div></div>;
}
function Cell({ label, value }: { label: string; value: string }) {
  return <div className="bg-neutral-950 px-4 py-3"><span className="block font-mono text-[9px] tracking-[0.2em] text-neutral-700 uppercase mb-1">{label}</span><span className="font-mono text-sm text-neutral-400">{value}</span></div>;
}
function Alert({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  const styles = type === "error" ? "border-red-900/50 bg-red-950/30 text-red-400" : "border-green-900/50 bg-green-950/30 text-green-400";
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`flex items-center gap-3 border px-4 py-3 mb-4 ${styles}`}>
    {type === "error" ? <AlertTriangle size={14} className="text-red-500 shrink-0" /> : <Save size={14} className="text-green-500 shrink-0" />}
    <span className="font-mono text-xs tracking-wider">{children}</span>
  </motion.div>;
}
function ChipGroup({ label, options, selected, onSelect, chip }: { label: string; options: readonly string[]; selected: string; onSelect: (v: string) => void; chip: (a: boolean, alert?: boolean) => string }) {
  return <div><label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">{label}</label><div className="flex flex-wrap gap-2">{options.map((o) => <button key={o} onClick={() => onSelect(o)} className={chip(selected === o)}>{o}</button>)}</div></div>;
}
function MultiChipGroup({ label, options, selected, toggle, chip, fullWidth }: { label: string; options: readonly string[]; selected: string[]; toggle: (v: string) => void; chip: (a: boolean, alert?: boolean) => string; fullWidth?: boolean }) {
  return <div><label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">{label}</label><div className={fullWidth ? "space-y-2" : "flex flex-wrap gap-2"}>{options.map((o) => <button key={o} onClick={() => toggle(o)} className={fullWidth ? `w-full text-left px-4 py-3 border font-mono text-xs tracking-wider transition-colors ${selected.includes(o) ? "border-neutral-400 bg-neutral-800 text-neutral-200" : "border-neutral-800 text-neutral-700 hover:border-neutral-700"}` : chip(selected.includes(o))}>{o}</button>)}</div></div>;
}
