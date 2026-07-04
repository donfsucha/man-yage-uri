"use client";

import { useState } from "react";
import { defaultSchedule, normalizeSchedule, scheduleStorageKey, type ScheduleSlot } from "@/lib/xcan/schedule";

const copy = {
  livingLife: "\uC0DD\uBA85\uC758 \uC0B6",
  koreanBible: "\uD55C\uAE00\uC131\uACBD\uD1B5\uB3C5",
  englishBible: "\uC601\uC5B4\uC131\uACBD\uD1B5\uB3C5",
  storedOnPhone: "\uC774 \uD3F0\uC758 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC800\uC7A5\uB429\uB2C8\uB2E4.",
  saved: "\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4. NFC\uB97C \uB2E4\uC2DC \uD0DC\uAE45\uD558\uBA74 \uC774 \uC2DC\uAC04\uD45C\uAC00 \uC801\uC6A9\uB429\uB2C8\uB2E4.",
  reset: "\uAE30\uBCF8 \uC2DC\uAC04\uD45C\uB85C \uB418\uB3CC\uB838\uC2B5\uB2C8\uB2E4.",
};

const contentOptions = [
  { contentKey: "living_life", targetPath: "/l", label: copy.livingLife },
  { contentKey: "korean_bible_reading", targetPath: "/b", label: copy.koreanBible },
  { contentKey: "english_bible_reading", targetPath: "/e", label: copy.englishBible },
  { contentKey: "ccm", targetPath: "/c", label: "CCM" },
];

function createSlot(): ScheduleSlot {
  return {
    startTime: "20:00",
    contentKey: "english_bible_reading",
    targetPath: "/e",
    label: copy.englishBible,
  };
}

function sortSchedule(schedule: ScheduleSlot[]) {
  return [...schedule].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function loadSavedSchedule() {
  if (typeof window === "undefined") return defaultSchedule;

  try {
    const saved = window.localStorage.getItem(scheduleStorageKey);
    return saved ? normalizeSchedule(JSON.parse(saved)) : defaultSchedule;
  } catch {
    return defaultSchedule;
  }
}

export default function ScheduleSettingsPage() {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(loadSavedSchedule);
  const [message, setMessage] = useState(copy.storedOnPhone);

  const updateSlot = (index: number, patch: Partial<ScheduleSlot>) => {
    setSchedule((current) =>
      current.map((slot, slotIndex) => {
        if (slotIndex !== index) return slot;

        if (patch.contentKey) {
          const option = contentOptions.find((item) => item.contentKey === patch.contentKey);
          if (option) {
            return { ...slot, ...option, startTime: slot.startTime };
          }
        }

        return { ...slot, ...patch };
      }),
    );
  };

  const saveSchedule = () => {
    const normalized = sortSchedule(normalizeSchedule(schedule));
    window.localStorage.setItem(scheduleStorageKey, JSON.stringify(normalized));
    setSchedule(normalized);
    setMessage(copy.saved);
  };

  const resetSchedule = () => {
    window.localStorage.removeItem(scheduleStorageKey);
    setSchedule(defaultSchedule);
    setMessage(copy.reset);
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-5 text-white">
      <section className="mx-auto flex w-full max-w-xl flex-col gap-4">
        <header>
          <p className="text-xs font-extrabold text-emerald-300">XC-220 {"\uC131\uACBD\uD1B5\uB3C5 \uAC70\uCE58\uB300"}</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal">{"\uC6F9 \uC2A4\uCF00\uC904 \uC124\uC815"}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-white/70">{message}</p>
        </header>

        <div className="flex flex-col gap-3">
          {schedule.map((slot, index) => (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3" key={`${slot.startTime}-${index}`}>
              <div className="grid grid-cols-[112px_1fr] gap-2">
                <label className="flex flex-col gap-1 text-xs font-black text-white/70">
                  {"\uC2DC\uC791\uC2DC\uAC04"}
                  <input
                    className="h-11 rounded-md border border-white/15 bg-black px-3 text-base font-black text-white"
                    type="time"
                    value={slot.startTime}
                    onChange={(event) => updateSlot(index, { startTime: event.target.value })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-black text-white/70">
                  {"\uCF58\uD150\uCE20"}
                  <select
                    className="h-11 rounded-md border border-white/15 bg-black px-3 text-base font-black text-white"
                    value={slot.contentKey}
                    onChange={(event) => updateSlot(index, { contentKey: event.target.value })}
                  >
                    {contentOptions.map((option) => (
                      <option key={option.contentKey} value={option.contentKey}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                className="mt-3 h-10 w-full rounded-md bg-white/10 text-sm font-black text-white"
                type="button"
                onClick={() => setSchedule((current) => current.filter((_, slotIndex) => slotIndex !== index))}
              >
                {"\uC0AD\uC81C"}
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            className="h-12 rounded-lg bg-white/10 text-sm font-black text-white"
            type="button"
            onClick={() => setSchedule((current) => [...current, createSlot()])}
          >
            {"\uC2DC\uAC04 \uCD94\uAC00"}
          </button>
          <button className="h-12 rounded-lg bg-emerald-500 text-sm font-black text-white" type="button" onClick={saveSchedule}>
            {"\uC800\uC7A5"}
          </button>
          <button className="h-12 rounded-lg bg-white/10 text-sm font-black text-white" type="button" onClick={resetSchedule}>
            {"\uAE30\uBCF8\uAC12"}
          </button>
          <a className="flex h-12 items-center justify-center rounded-lg bg-sky-500 text-sm font-black text-white no-underline" href="/start?web=1">
            {"\uC9C0\uAE08 \uC2E4\uD589"}
          </a>
        </div>
      </section>
    </main>
  );
}