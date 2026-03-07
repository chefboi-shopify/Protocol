"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Locate, Loader2 } from "lucide-react";

interface LocationSuggestion {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  lat: string;
  lon: string;
}

interface LocationInputProps {
  value: string;
  onChange: (city: string, lat?: number, lng?: number) => void;
  placeholder?: string;
}

export function LocationInput({ value, onChange, placeholder = "Start typing a city..." }: LocationInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchLocations = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&featuretype=city`,
        { headers: { "User-Agent": "PROTOCOL-App/1.0" } }
      );
      if (res.ok) {
        const data: LocationSuggestion[] = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(text), 350);
  };

  const handleSelect = (suggestion: LocationSuggestion) => {
    const addr = suggestion.address;
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
    const state = addr.state || "";
    const formatted = city + (state ? `, ${state}` : "");
    setQuery(formatted);
    onChange(formatted, parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    setShowDropdown(false);
    setSuggestions([]);
  };

  const autoDetect = useCallback(async () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "User-Agent": "PROTOCOL-App/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
            const state = addr.state || "";
            const formatted = city + (state ? `, ${state}` : "");
            setQuery(formatted);
            onChange(formatted, latitude, longitude);
          }
        } catch { /* silent */ }
        finally { setLocating(false); }
      },
      () => { setLocating(false); },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [onChange]);

  const formatSuggestion = (s: LocationSuggestion) => {
    const addr = s.address;
    const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
    const state = addr.state || "";
    const country = addr.country || "";
    const parts = [city, state, country].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 relative">
          <MapPin size={14} className="text-neutral-600 shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            placeholder={placeholder}
            className="w-full bg-neutral-950 border border-neutral-800 px-4 py-3 font-mono text-sm text-neutral-200 rounded-none focus:border-neutral-600 transition-colors"
            autoComplete="off"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 size={12} className="text-neutral-600 animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={autoDetect}
          disabled={locating}
          className="border border-neutral-800 hover:border-neutral-600 px-3 flex items-center transition-colors disabled:opacity-50"
          title="Auto-detect location"
        >
          {locating
            ? <Loader2 size={14} className="text-neutral-500 animate-spin" strokeWidth={1.5} />
            : <Locate size={14} className="text-neutral-500" strokeWidth={1.5} />
          }
        </button>
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 border border-neutral-800 bg-neutral-900 max-h-60 overflow-y-auto shadow-lg shadow-black/50">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.lat}-${s.lon}-${idx}`}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 font-mono text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors border-b border-neutral-800/50 last:border-b-0"
            >
              {formatSuggestion(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
