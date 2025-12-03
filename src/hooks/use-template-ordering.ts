import { useState, useEffect, useMemo } from "react";

interface TemplateWithKey {
  key: string;
}

export function useTemplateOrderingAndStreak() {
  const [streak, setStreak] = useState<number>(0);
  const [timeSavedTotal, setTimeSavedTotal] = useState<number>(0);
  const [history, setHistory] = useState<
    Array<{
      at: string;
      type: string;
      minutes: number;
      meta?: Record<string, any>;
    }>
  >([]);

  useEffect(() => {
    const rawDates = localStorage.getItem("pikar.winDates");
    const dates: string[] = rawDates ? JSON.parse(rawDates) : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let s = 0;
    for (;;) {
      const d = new Date(today);
      d.setDate(today.getDate() - s);
      const key = d.toISOString().slice(0, 10);
      if (dates.includes(key)) s += 1;
      else break;
    }
    setStreak(s);

    const ts = Number(localStorage.getItem("pikar.timeSavedTotal") || "0");
    setTimeSavedTotal(ts);

    const rawHist = localStorage.getItem("pikar.winHistory");
    const hist = rawHist ? JSON.parse(rawHist) : [];
    setHistory(hist);
  }, []);

  const recordLocalWin = (
    minutes: number,
    type: string = "generic",
    meta?: Record<string, any>,
  ) => {
    const nowIso = new Date().toISOString();
    const todayKey = nowIso.slice(0, 10);
    const rawDates = localStorage.getItem("pikar.winDates");
    const dates: string[] = rawDates ? JSON.parse(rawDates) : [];
    if (!dates.includes(todayKey)) dates.push(todayKey);
    localStorage.setItem("pikar.winDates", JSON.stringify(dates));
    const ts =
      Number(localStorage.getItem("pikar.timeSavedTotal") || "0") + minutes;
    localStorage.setItem("pikar.timeSavedTotal", String(ts));
    setTimeSavedTotal(ts);

    const rawHist = localStorage.getItem("pikar.winHistory");
    const hist = rawHist ? JSON.parse(rawHist) : [];
    hist.unshift({ at: nowIso, type, minutes, meta });
    localStorage.setItem("pikar.winHistory", JSON.stringify(hist.slice(0, 100)));
    setHistory(hist.slice(0, 100));
  };

  const clearLocalWins = () => {
    localStorage.removeItem("pikar.winDates");
    localStorage.removeItem("pikar.timeSavedTotal");
    localStorage.removeItem("pikar.winHistory");
    setStreak(0);
    setTimeSavedTotal(0);
    setHistory([]);
  };

  const bumpTemplateUsage = (key: string) => {
    const raw = localStorage.getItem("pikar.templateUsageCounts");
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[key] = (map[key] || 0) + 1;
    localStorage.setItem("pikar.templateUsageCounts", JSON.stringify(map));
  };

  const orderTemplates = <T extends TemplateWithKey>(list: T[]): T[] => {
    const raw = localStorage.getItem("pikar.templateUsageCounts");
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    return [...list].sort((a, b) => (map[b.key] || 0) - (map[a.key] || 0));
  };

  return {
    streak,
    timeSavedTotal,
    history,
    recordLocalWin,
    clearLocalWins,
    bumpTemplateUsage,
    orderTemplates,
  };
}
