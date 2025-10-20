import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { config } from "~/lib/utils";
import { dictionaries, locales as discoveredLocales } from "./locales";

type Dict = Record<string, any>;
type Dictionaries = Record<string, Dict>;

const DICTS: Dictionaries = dictionaries as Dictionaries;

type I18nContextType = {
  locale: string;
  t: (key: string, fallback?: string) => string;
  setLocale: (l: string) => void;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function get(obj: any, path: string, fallback?: any) {
  return path.split(".").reduce((acc: any, k: string) => (acc && k in acc ? acc[k] : undefined), obj) ?? fallback ?? path;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Initialize with server-known default to ensure SSR and first client render match
  const serverDefault = (config.defaultLocale || config.locales[0] || 'fr') as string;
  const [locale, setLocaleState] = useState<string>(serverDefault);

  // After mount, sync with localStorage preference (if any) to avoid hydration mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem('locale');
      if (stored && stored !== locale) {
        const allowed = Array.from(new Set([...(config.locales || []), ...(discoveredLocales || [])]));
        if (allowed.length === 0 || allowed.includes(stored)) {
          setLocaleState(stored);
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem('locale', locale); } catch {}
  }, [locale]);

  function setLocale(l: string) {
    // Allow any locale present in env config OR discovered from JSON files
    const allowed = Array.from(new Set([...(config.locales || []), ...(discoveredLocales || [])]));
    if (allowed.length === 0) {
      setLocaleState(l); // fallback: accept any
      return;
    }
    if (allowed.includes(l)) setLocaleState(l);
  }

  const dict = useMemo(() => {
    const d = (DICTS as any)[locale] || (DICTS as any)[config.defaultLocale] || (DICTS as any).fr || {};
    return d as Dict;
  }, [locale]);

  const t = useMemo(() => {
    return (key: string, fallback?: string) => String(get(dict, key, fallback ?? key));
  }, [dict]);

  const value = useMemo(() => ({ locale, t, setLocale }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
