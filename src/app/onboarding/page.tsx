"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  AlertTriangle,
  Square,
  CheckSquare,
  Loader2,
} from "lucide-react";
import { LocationInput } from "@/lib/location-input";

const ARCHETYPES = [
  { value: "The Architect", desc: "Plans everything. Financially disciplined. Long-term thinker." },
  { value: "The Experientialist", desc: "Spends on moments, not things. Travel, food, concerts." },
  { value: "The Minimalist", desc: "Needs little. Values simplicity and freedom over accumulation." },
  { value: "The Builder", desc: "Invests in projects, businesses, growth. Always building something." },
] as const;

const ATTACHMENT_STYLES = [
  { value: "Secure", desc: "Comfortable with closeness and independence." },
  { value: "Anxious", desc: "Craves closeness. Needs reassurance. Deeply invested." },
  { value: "Avoidant", desc: "Values space. Takes time to open up. Independent." },
  { value: "Evolving", desc: "Actively working on patterns. Self-aware about growth areas." },
] as const;

const SOCIAL_BATTERY = [
  { value: "Introvert", desc: "Recharges alone. Prefers deep 1-on-1s over crowds." },
  { value: "Ambivert", desc: "Flexes both ways. Social when energized, solo when drained." },
  { value: "Extrovert", desc: "Energized by people. Loves hosting, events, group plans." },
] as const;

const LIFE_PACE = [
  { value: "Slow & Steady", desc: "Routine-oriented. Values stability and consistency." },
  { value: "Balanced", desc: "Mix of adventure and routine. Adaptable." },
  { value: "Fast & Driven", desc: "Career-focused. Always moving. High energy lifestyle." },
] as const;

const GENDERS = [
  { value: "M", label: "MAN" },
  { value: "F", label: "WOMAN" },
  { value: "NB", label: "NON-BINARY" },
] as const;

const INTERESTED_OPTIONS = [
  { value: "M", label: "MEN" },
  { value: "F", label: "WOMEN" },
  { value: "ALL", label: "EVERYONE" },
] as const;

const RELIGION_OPTIONS = [
  "Not Religious", "Spiritual", "Christian", "Catholic", "Jewish",
  "Muslim", "Hindu", "Buddhist", "Other",
] as const;

const POLITICAL_OPTIONS = [
  "Liberal", "Moderate", "Conservative", "Apolitical", "Other",
] as const;

const KIDS_OPTIONS = [
  "Wants Kids", "Doesn't Want Kids", "Has Kids", "Open to Kids", "Not Sure Yet",
] as const;

const TAG_OPTIONS = [
  "Smoking", "Non-Drinker", "Heavy Drinker", "No Pets", "Vegan",
  "Night Owl", "Early Riser", "Remote Worker",
] as const;

const SOFT_FILTER_OPTIONS = [
  "Smoking", "Non-Drinker", "Heavy Drinker", "No Pets", "Vegan",
] as const;

const RECORD_DURATION = 15;
const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Step 0: Identity
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [interestedIn, setInterestedIn] = useState("");

  // Step 1: Who You Are (multi-axis)
  const [archetype, setArchetype] = useState("");
  const [attachmentStyle, setAttachmentStyle] = useState("");
  const [socialBattery, setSocialBattery] = useState("");
  const [lifePace, setLifePace] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Step 2: Values
  const [religion, setReligion] = useState("");
  const [politicalLeaning, setPoliticalLeaning] = useState("");
  const [kidsPreference, setKidsPreference] = useState("");
  const [targetReligion, setTargetReligion] = useState<string[]>([]);
  const [targetPolitical, setTargetPolitical] = useState<string[]>([]);
  const [targetKids, setTargetKids] = useState<string[]>([]);

  // Step 3: Preferences
  const [locationCity, setLocationCity] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [targetMinAge, setTargetMinAge] = useState(28);
  const [targetMaxAge, setTargetMaxAge] = useState(40);
  const [targetArchetypes, setTargetArchetypes] = useState<string[]>(ARCHETYPES.map((a) => a.value));
  const [targetAttachment, setTargetAttachment] = useState<string[]>([]);
  const [targetSocialBattery, setTargetSocialBattery] = useState<string[]>([]);
  const [targetLifePace, setTargetLifePace] = useState<string[]>([]);
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);
  const [strongPreferences, setStrongPreferences] = useState<string[]>([]);
  const [ageWarning, setAgeWarning] = useState("");

  // Step 4: Video
  const [recordState, setRecordState] = useState<"idle" | "recording" | "done">("idle");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    const ageNum = parseInt(age, 10);
    if (!isNaN(ageNum) && ageNum >= 28 && ageNum - targetMinAge > 10 && targetMinAge <= 30) {
      setAgeWarning("High age gap detected. This significantly reduces your match pool.");
    } else {
      setAgeWarning("");
    }
  }, [age, targetMinAge]);

  const handleLocationChange = useCallback((city: string, lat?: number, lng?: number) => {
    setLocationCity(city);
    if (lat !== undefined) setLocationLat(lat);
    if (lng !== undefined) setLocationLng(lng);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 720, height: 1280 }, audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch { setCameraError("Camera access denied — grant permission to record."); }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9" : MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setVideoBlob(blob);
      setVideoPreviewUrl(URL.createObjectURL(blob));
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
    recorder.start(500);
    setRecordState("recording");
    setRecordSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordSeconds((prev) => {
        if (prev >= RECORD_DURATION - 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          mediaRecorderRef.current?.stop();
          setRecordState("done");
          return RECORD_DURATION;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recordSeconds >= 3) { mediaRecorderRef.current?.stop(); setRecordState("done"); }
    else { mediaRecorderRef.current?.stop(); setRecordState("idle"); setRecordSeconds(0); }
  }, [recordSeconds]);

  const retakeRecording = useCallback(async () => {
    setRecordState("idle"); setRecordSeconds(0); setVideoBlob(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    await startCamera();
  }, [videoPreviewUrl, startCamera]);

  const toggle = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const validateAndNext = () => {
    setError("");
    if (step === 0) {
      if (!name.trim()) { setError("Name is required."); return; }
      const n = parseInt(age, 10);
      if (isNaN(n) || n < 28) { setError("PROTOCOL is for adults 28+."); return; }
      if (!gender) { setError("Please select your gender."); return; }
      if (!interestedIn) { setError("Please select who you're interested in."); return; }
      setStep(1);
    } else if (step === 1) {
      if (!archetype) { setError("Select your financial style."); return; }
      if (!attachmentStyle) { setError("Select your attachment style."); return; }
      if (!socialBattery) { setError("Select your social energy."); return; }
      if (!lifePace) { setError("Select your life pace."); return; }
      setStep(2);
    } else if (step === 2) {
      if (!religion) { setError("Select your stance."); return; }
      if (!politicalLeaning) { setError("Select your stance."); return; }
      if (!kidsPreference) { setError("Select your stance."); return; }
      setStep(3);
    } else if (step === 3) {
      if (!locationCity.trim()) { setError("Location is required for the 20-minute meeting."); return; }
      if (targetArchetypes.length === 0) { setError("Select at least one preferred archetype."); return; }
      setStep(4);
      startCamera();
    } else if (step === 4) {
      if (recordState !== "done") { setError("Record your 15-second candid."); return; }
      setStep(5);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      let videoUrl: string | null = null;
      if (videoBlob) {
        const fd = new FormData();
        fd.append("video", videoBlob, "candid.webm");
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (up.ok) videoUrl = (await up.json()).url;
      }
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), age: parseInt(age, 10), gender, interestedIn,
          fiscalArchetype: archetype, attachmentStyle, socialBattery, lifePace,
          religion, politicalLeaning, kidsPreference,
          targetReligion: targetReligion.join(","), targetPolitical: targetPolitical.join(","),
          targetKids: targetKids.join(","),
          locationCity: locationCity.trim(), locationLat, locationLng,
          targetMinAge, targetMaxAge,
          targetArchetypes: targetArchetypes.join(","),
          targetAttachment: targetAttachment.join(","),
          targetSocialBattery: targetSocialBattery.join(","),
          targetLifePace: targetLifePace.join(","),
          dealbreakers: dealbreakers.join(","),
          strongPreferences: strongPreferences.join(","),
          tags: tags.join(","), videoUrl,
        }),
      });
      if (res.ok) { window.location.href = "/activated"; }
      else { const d = await res.json(); setError(d.error || "Something went wrong."); }
    } catch { setError("Connection failed."); }
    finally { setSubmitting(false); }
  };

  const sel = (active: boolean) =>
    `flex-1 py-3 border font-mono text-xs tracking-wider transition-colors ${active ? "border-neutral-400 bg-neutral-800 text-neutral-200" : "border-neutral-800 text-neutral-600 hover:border-neutral-700"}`;
  const chip = (active: boolean, alert = false) =>
    `px-3 py-2 border font-mono text-[10px] tracking-wider transition-colors ${active ? (alert ? "border-red-800 bg-red-950/40 text-red-400" : "border-neutral-400 bg-neutral-800 text-neutral-200") : "border-neutral-800 text-neutral-600 hover:border-neutral-700"}`;
  const softChip = (active: boolean) =>
    `px-3 py-2 border font-mono text-[10px] tracking-wider transition-colors ${active ? "border-amber-800 bg-amber-950/30 text-amber-400" : "border-neutral-800 text-neutral-600 hover:border-neutral-700"}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="font-mono text-2xl tracking-[0.4em] text-neutral-200 mb-2">PROTOCOL</h1>
          <p className="font-mono text-[10px] tracking-[0.3em] text-neutral-600 uppercase">
            Step {step + 1} of {TOTAL_STEPS}
          </p>
        </div>

        <div className="flex gap-1 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`h-[2px] flex-1 transition-colors duration-300 ${i <= step ? "bg-neutral-200" : "bg-neutral-800"}`} />
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 border border-red-900/50 bg-red-950/30 px-4 py-3 mb-6">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <span className="font-mono text-xs text-red-400 tracking-wider">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* STEP 0: IDENTITY */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <StepLabel>01 — About You</StepLabel>
              <Field label="Name">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input-field" />
              </Field>
              <Field label="Age">
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="28+" min={28} className="input-field" />
              </Field>
              <Field label="Gender">
                <div className="flex gap-2">
                  {GENDERS.map((g) => <button key={g.value} onClick={() => setGender(g.value)} className={sel(gender === g.value)}>{g.label}</button>)}
                </div>
              </Field>
              <Field label="Interested In">
                <div className="flex gap-2">
                  {INTERESTED_OPTIONS.map((o) => <button key={o.value} onClick={() => setInterestedIn(o.value)} className={sel(interestedIn === o.value)}>{o.label}</button>)}
                </div>
              </Field>
            </motion.div>
          )}

          {/* STEP 1: WHO YOU ARE (multi-axis) */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <StepLabel>02 — How You&apos;re Wired</StepLabel>
              <p className="font-mono text-[10px] text-neutral-600 leading-relaxed mb-2">
                People are more than one thing. Pick what fits closest — you can always change these later.
              </p>

              <Field label="Financial Style">
                <div className="space-y-2">
                  {ARCHETYPES.map((a) => (
                    <OptionCard key={a.value} selected={archetype === a.value} onClick={() => setArchetype(a.value)} title={a.value} desc={a.desc} />
                  ))}
                </div>
              </Field>

              <Field label="Attachment Style">
                <div className="space-y-2">
                  {ATTACHMENT_STYLES.map((a) => (
                    <OptionCard key={a.value} selected={attachmentStyle === a.value} onClick={() => setAttachmentStyle(a.value)} title={a.value} desc={a.desc} />
                  ))}
                </div>
              </Field>

              <Field label="Social Energy">
                <div className="space-y-2">
                  {SOCIAL_BATTERY.map((s) => (
                    <OptionCard key={s.value} selected={socialBattery === s.value} onClick={() => setSocialBattery(s.value)} title={s.value} desc={s.desc} />
                  ))}
                </div>
              </Field>

              <Field label="Life Pace">
                <div className="space-y-2">
                  {LIFE_PACE.map((l) => (
                    <OptionCard key={l.value} selected={lifePace === l.value} onClick={() => setLifePace(l.value)} title={l.value} desc={l.desc} />
                  ))}
                </div>
              </Field>

              <Field label="Lifestyle Tags">
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((t) => <button key={t} onClick={() => toggle(tags, t, setTags)} className={chip(tags.includes(t))}>{t}</button>)}
                </div>
              </Field>
            </motion.div>
          )}

          {/* STEP 2: VALUES */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <StepLabel>03 — What Matters to You</StepLabel>

              <Field label="Religion">
                <div className="flex flex-wrap gap-2">
                  {RELIGION_OPTIONS.map((r) => <button key={r} onClick={() => setReligion(r)} className={chip(religion === r)}>{r}</button>)}
                </div>
              </Field>
              <Field label="Open to (leave empty = everyone)">
                <div className="flex flex-wrap gap-2">
                  {RELIGION_OPTIONS.map((r) => <button key={r} onClick={() => toggle(targetReligion, r, setTargetReligion)} className={chip(targetReligion.includes(r))}>{r}</button>)}
                </div>
              </Field>

              <div className="border-t border-neutral-800 pt-4" />

              <Field label="Political Leaning">
                <div className="flex flex-wrap gap-2">
                  {POLITICAL_OPTIONS.map((p) => <button key={p} onClick={() => setPoliticalLeaning(p)} className={chip(politicalLeaning === p)}>{p}</button>)}
                </div>
              </Field>
              <Field label="Open to (leave empty = everyone)">
                <div className="flex flex-wrap gap-2">
                  {POLITICAL_OPTIONS.map((p) => <button key={p} onClick={() => toggle(targetPolitical, p, setTargetPolitical)} className={chip(targetPolitical.includes(p))}>{p}</button>)}
                </div>
              </Field>

              <div className="border-t border-neutral-800 pt-4" />

              <Field label="Kids">
                <div className="flex flex-wrap gap-2">
                  {KIDS_OPTIONS.map((k) => <button key={k} onClick={() => setKidsPreference(k)} className={chip(kidsPreference === k)}>{k}</button>)}
                </div>
              </Field>
              <Field label="Open to (leave empty = everyone)">
                <div className="flex flex-wrap gap-2">
                  {KIDS_OPTIONS.map((k) => <button key={k} onClick={() => toggle(targetKids, k, setTargetKids)} className={chip(targetKids.includes(k))}>{k}</button>)}
                </div>
              </Field>
            </motion.div>
          )}

          {/* STEP 3: PREFERENCES */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <StepLabel>04 — What You&apos;re Looking For</StepLabel>

              <Field label="Your City">
                <LocationInput
                  value={locationCity}
                  onChange={handleLocationChange}
                  placeholder="Start typing a city..."
                />
                {locationLat !== null && <span className="block font-mono text-[9px] text-neutral-700 mt-1">GPS: {locationLat.toFixed(4)}, {locationLng?.toFixed(4)}</span>}
              </Field>

              <Field label={`Age Preference: ${targetMinAge} — ${targetMaxAge}`}>
                <div className="space-y-3">
                  <Slider label="MIN" min={28} max={60} value={targetMinAge} onChange={(v) => setTargetMinAge(Math.min(v, targetMaxAge))} />
                  <Slider label="MAX" min={28} max={70} value={targetMaxAge} onChange={(v) => setTargetMaxAge(Math.max(v, targetMinAge))} />
                </div>
              </Field>

              <AnimatePresence>
                {ageWarning && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 border border-orange-900/50 bg-orange-950/20 px-4 py-3">
                    <AlertTriangle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    <span className="font-mono text-[10px] text-orange-400 leading-relaxed">{ageWarning}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Field label="Preferred Financial Styles">
                <div className="space-y-2">
                  {ARCHETYPES.map((a) => (
                    <button key={a.value} onClick={() => toggle(targetArchetypes, a.value, setTargetArchetypes)}
                      className={`w-full text-left px-4 py-3 border font-mono text-xs tracking-wider transition-colors ${targetArchetypes.includes(a.value) ? "border-neutral-400 bg-neutral-800 text-neutral-200" : "border-neutral-800 text-neutral-700 hover:border-neutral-700"}`}
                    >{a.value}</button>
                  ))}
                </div>
              </Field>

              <Field label="Preferred Attachment Styles (empty = all)">
                <div className="flex flex-wrap gap-2">
                  {ATTACHMENT_STYLES.map((a) => <button key={a.value} onClick={() => toggle(targetAttachment, a.value, setTargetAttachment)} className={chip(targetAttachment.includes(a.value))}>{a.value}</button>)}
                </div>
              </Field>

              <Field label="Preferred Social Energy (empty = all)">
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_BATTERY.map((s) => <button key={s.value} onClick={() => toggle(targetSocialBattery, s.value, setTargetSocialBattery)} className={chip(targetSocialBattery.includes(s.value))}>{s.value}</button>)}
                </div>
              </Field>

              <Field label="Preferred Life Pace (empty = all)">
                <div className="flex flex-wrap gap-2">
                  {LIFE_PACE.map((l) => <button key={l.value} onClick={() => toggle(targetLifePace, l.value, setTargetLifePace)} className={chip(targetLifePace.includes(l.value))}>{l.value}</button>)}
                </div>
              </Field>

              <div className="border-t border-neutral-800 pt-4" />

              <Field label="Dealbreakers (hard filter — hidden from your feed)">
                <div className="flex flex-wrap gap-2">
                  {SOFT_FILTER_OPTIONS.map((d) => <button key={d} onClick={() => { toggle(dealbreakers, d, setDealbreakers); setStrongPreferences((p) => p.filter((x) => x !== d)); }} className={chip(dealbreakers.includes(d), true)}>{d}</button>)}
                </div>
              </Field>

              <Field label="Strong preferences (shown lower in feed, not hidden)">
                <div className="flex flex-wrap gap-2">
                  {SOFT_FILTER_OPTIONS.filter((d) => !dealbreakers.includes(d)).map((d) => (
                    <button key={d} onClick={() => toggle(strongPreferences, d, setStrongPreferences)} className={softChip(strongPreferences.includes(d))}>{d}</button>
                  ))}
                </div>
                <span className="block font-mono text-[9px] text-neutral-700 mt-2">
                  Dealbreakers remove people entirely. Strong preferences just lower their ranking — because people are more nuanced than tags.
                </span>
              </Field>
            </motion.div>
          )}

          {/* STEP 4: VIDEO */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <StepLabel>05 — 15-Second Candid</StepLabel>
              <p className="font-mono text-[10px] text-neutral-600 leading-relaxed">
                Be yourself. This is how people will first experience you — blurred at first, clearer as they invest in the conversation.
              </p>
              {cameraError && (
                <div className="flex items-center gap-3 border border-orange-900/50 bg-orange-950/20 px-4 py-3">
                  <AlertTriangle size={14} className="text-orange-500 shrink-0" />
                  <span className="font-mono text-[10px] text-orange-400">{cameraError}</span>
                </div>
              )}
              {recordState === "idle" && (
                <div className="border-2 border-dashed border-neutral-800 bg-neutral-900 overflow-hidden">
                  <video ref={videoRef} className="w-full aspect-[9/16] object-cover bg-black" muted playsInline />
                  <button onClick={startRecording} className="w-full py-4 border-t border-neutral-800 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 group">
                    <div className="w-4 h-4 bg-red-600 rounded-full group-hover:scale-110 transition-transform" />
                    <span className="font-mono text-xs text-neutral-400 tracking-wider uppercase">Start Recording</span>
                  </button>
                </div>
              )}
              {recordState === "recording" && (
                <div className="border-2 border-red-800 bg-neutral-900 overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-1 bg-red-600 transition-all duration-1000 ease-linear z-10" style={{ width: `${(recordSeconds / RECORD_DURATION) * 100}%` }} />
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/60 px-2 py-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-mono text-[10px] text-red-400 tracking-wider">{String(recordSeconds).padStart(2, "0")}/{RECORD_DURATION}</span>
                  </div>
                  <video ref={videoRef} className="w-full aspect-[9/16] object-cover bg-black" muted playsInline />
                  <button onClick={stopRecording} className="w-full py-3 border-t border-red-900 bg-red-950/30 hover:bg-red-950/50 transition-colors flex items-center justify-center gap-2">
                    <Square size={12} className="text-red-400" fill="currentColor" />
                    <span className="font-mono text-[10px] text-red-300 tracking-wider uppercase">Stop</span>
                  </button>
                </div>
              )}
              {recordState === "done" && videoPreviewUrl && (
                <div className="border-2 border-green-900 bg-neutral-900 overflow-hidden">
                  <video src={videoPreviewUrl} className="w-full aspect-[9/16] object-cover bg-black" controls playsInline />
                  <div className="flex items-center justify-between px-4 py-3 border-t border-green-900/50">
                    <div className="flex items-center gap-2">
                      <CheckSquare size={14} className="text-green-500" strokeWidth={1.5} />
                      <span className="font-mono text-xs text-green-400 tracking-wider">{recordSeconds}s captured</span>
                    </div>
                    <button onClick={retakeRecording} className="font-mono text-[10px] text-neutral-600 hover:text-neutral-400 tracking-wider uppercase underline underline-offset-4 transition-colors">Retake</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 5: CONFIRMATION */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <StepLabel>06 — Review</StepLabel>
              <p className="font-mono text-[10px] text-neutral-600 leading-relaxed mb-2">
                Everything here shapes who you&apos;ll meet. You can change any of this later in Settings.
              </p>
              <div className="border border-neutral-800 bg-neutral-900">
                <SummaryRow label="NAME" value={`${name}, ${age}`} />
                <SummaryRow label="GENDER → SEEKING" value={`${gender} → ${interestedIn}`} />
                <SummaryRow label="FINANCIAL STYLE" value={archetype} />
                <SummaryRow label="ATTACHMENT" value={attachmentStyle} />
                <SummaryRow label="SOCIAL ENERGY" value={socialBattery} />
                <SummaryRow label="LIFE PACE" value={lifePace} />
                <SummaryRow label="RELIGION" value={religion} />
                <SummaryRow label="POLITICAL" value={politicalLeaning} />
                <SummaryRow label="KIDS" value={kidsPreference} />
                <SummaryRow label="LOCATION" value={locationCity} />
                <SummaryRow label="AGE PREFERENCE" value={`${targetMinAge}–${targetMaxAge}`} />
                {dealbreakers.length > 0 && <SummaryRow label="DEALBREAKERS" value={dealbreakers.join(", ")} isAlert />}
                {strongPreferences.length > 0 && <SummaryRow label="STRONG PREFS" value={strongPreferences.join(", ")} isAmber />}
                <SummaryRow label="VIDEO" value={`${recordSeconds}s candid`} isGreen />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          {step < TOTAL_STEPS - 1 ? (
            <button onClick={validateAndNext}
              className="w-full bg-slate-700 hover:bg-slate-600 text-neutral-200 font-mono text-sm tracking-[0.2em] uppercase py-4 flex items-center justify-center gap-2 transition-colors">
              CONTINUE <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-neutral-200 hover:bg-white text-neutral-950 font-mono text-sm tracking-[0.2em] uppercase py-4 transition-colors disabled:opacity-50">
              {submitting ? "CREATING PROFILE..." : "ENTER PROTOCOL"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepLabel({ children }: { children: React.ReactNode }) {
  return <span className="block font-mono text-[10px] tracking-[0.3em] text-neutral-500 uppercase mb-1">{children}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-mono text-[10px] tracking-[0.2em] text-neutral-600 uppercase mb-2">{label}</label>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, title, desc }: { selected: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3 border transition-colors ${selected ? "border-neutral-400 bg-neutral-800" : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"}`}>
      <span className={`block font-mono text-sm ${selected ? "text-neutral-200" : "text-neutral-500"}`}>{title}</span>
      <span className="block font-mono text-[10px] text-neutral-600 mt-1 leading-relaxed">{desc}</span>
    </button>
  );
}

function Slider({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] text-neutral-600 w-8">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="flex-1 accent-slate-600" />
      <span className="font-mono text-sm text-neutral-400 w-8">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value, isAlert, isGreen, isAmber }: { label: string; value: string; isAlert?: boolean; isGreen?: boolean; isAmber?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 last:border-b-0">
      <span className="font-mono text-[9px] tracking-[0.3em] text-neutral-600 uppercase">{label}</span>
      <span className={`font-mono text-xs text-right max-w-[60%] ${isAlert ? "text-red-400" : isGreen ? "text-green-500" : isAmber ? "text-amber-400" : "text-neutral-300"}`}>{value}</span>
    </div>
  );
}
