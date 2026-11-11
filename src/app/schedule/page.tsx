"use client";

import { useEffect, useRef, useState } from "react";
import { defaultSchedule, normalizeSchedule, scheduleContentOptions, scheduleStorageKey, type ScheduleSlot } from "@/lib/xcan/schedule";

const copy = {
  livingLife: "\uC0DD\uBA85\uC758 \uC0B6",
  koreanBible: "\uD55C\uAE00\uC131\uACBD\uD1B5\uB3C5",
  englishBible: "\uC601\uC5B4\uC131\uACBD\uD1B5\uB3C5",
  storedOnPhone: "\uC774 \uD3F0\uC758 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC800\uC7A5\uB429\uB2C8\uB2E4.",
  saved: "\uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4. /start\uB294 \uC2DC\uAC04\uD45C\uC640 \uAD00\uACC4\uC5C6\uC774 \uD55C\uAE00\uC131\uACBD\uD1B5\uB3C5\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.",
  reset: "\uAE30\uBCF8 \uC2DC\uAC04\uD45C\uB85C \uB418\uB3CC\uB838\uC2B5\uB2C8\uB2E4.",
  added: "\uC2DC\uAC04\uD45C\uB97C \uCD94\uAC00\uD588\uC2B5\uB2C8\uB2E4. \uC2DC\uAC04\uC744 \uACE0\uB974\uACE0 \uC800\uC7A5\uD574 \uC8FC\uC138\uC694.",
  loading: "저장된 시간표를 불러오고 있습니다.",
  unsaved: "변경한 시간표를 저장해 주세요. 이 기기의 이 브라우저에 적용됩니다.",
  saveError: "시간표를 저장하지 못했습니다. 브라우저의 저장 공간과 개인정보 보호 설정을 확인한 뒤 다시 시도해 주세요.",
  loadError: "저장된 시간표를 읽지 못했습니다. 기본 시간표가 표시됩니다.",
  empty: "시간표를 한 개 이상 추가해 주세요.",
};

const contentOptions = scheduleContentOptions;

const hours = Array.from({ length: 12 }, (_, index) => index + 1);
const minutes = Array.from({ length: 60 }, (_, index) => index);

type Period = "am" | "pm";

type ParsedTime = {
  period: Period;
  hour12: number;
  minute: number;
};

function createSlot(): ScheduleSlot {
  return {
    startTime: "20:00",
    contentKey: "korean_bible_reading",
    targetPath: "/b",
    label: copy.koreanBible,
  };
}

function sortSchedule(schedule: ScheduleSlot[]) {
  return [...schedule].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function parseTime(startTime: string): ParsedTime {
  const match = /^(\d{2}):(\d{2})$/.exec(startTime);
  const hour24 = match ? Math.min(23, Math.max(0, Number(match[1]))) : 0;
  const minute = match ? Math.min(59, Math.max(0, Number(match[2]))) : 0;
  const hour12 = hour24 % 12 || 12;

  return {
    period: hour24 >= 12 ? "pm" : "am",
    hour12,
    minute,
  };
}

function toStartTime(period: Period, hour12: number, minute: number) {
  const safeHour = Math.min(12, Math.max(1, hour12));
  const safeMinute = Math.min(59, Math.max(0, minute));
  const hour24 = period === "am" ? safeHour % 12 : safeHour === 12 ? 12 : safeHour + 12;

  return `${String(hour24).padStart(2, "0")}:${String(safeMinute).padStart(2, "0")}`;
}

function formatTime(startTime: string) {
  const parsed = parseTime(startTime);
  const periodLabel = parsed.period === "am" ? "\uC624\uC804" : "\uC624\uD6C4";

  return `${periodLabel} ${String(parsed.hour12).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`;
}

function TimePickerPanel({
  startTime,
  onChange,
}: {
  startTime: string;
  onChange: (startTime: string) => void;
}) {
  const selected = parseTime(startTime);

  const updateTime = (patch: Partial<ParsedTime>) => {
    onChange(
      toStartTime(
        patch.period ?? selected.period,
        patch.hour12 ?? selected.hour12,
        patch.minute ?? selected.minute,
      ),
    );
  };

  return (
    <div className="mt-2 grid grid-cols-[1fr_1fr_1fr] gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-2">
      <label className="flex flex-col gap-1 text-xs font-black text-emerald-100">
        오전/오후
        <select
          className="h-11 rounded-md border border-white/15 bg-black px-2 text-center text-base font-black text-white"
          value={selected.period}
          aria-label="오전/오후"
          onChange={(event) => updateTime({ period: event.target.value as Period })}
        >
          <option value="am">오전</option>
          <option value="pm">오후</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-black text-emerald-100">
        시
        <select
          className="h-11 rounded-md border border-white/15 bg-black px-2 text-center text-base font-black text-white"
          value={selected.hour12}
          aria-label="시"
          onChange={(event) => updateTime({ hour12: Number(event.target.value) })}
        >
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {hour}시
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-black text-emerald-100">
        분
        <select
          className="h-11 rounded-md border border-white/15 bg-black px-2 text-center text-base font-black text-white"
          value={selected.minute}
          aria-label="분"
          onChange={(event) => updateTime({ minute: Number(event.target.value) })}
        >
          {minutes.map((minute) => (
            <option key={minute} value={minute}>
              {String(minute).padStart(2, "0")}분
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default function ScheduleSettingsPage() {
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(defaultSchedule);
  const [message, setMessage] = useState(copy.loading);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [openTimeIndex, setOpenTimeIndex] = useState<number | null>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(scheduleStorageKey);
        setSchedule(saved ? normalizeSchedule(JSON.parse(saved)) : defaultSchedule);
        setMessage(copy.storedOnPhone);
      } catch {
        setHasError(true);
        setMessage(copy.loadError);
      }
      setIsLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (openTimeIndex === null) return;
    timePickerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [openTimeIndex, schedule.length]);

  const updateSlot = (index: number, patch: Partial<ScheduleSlot>) => {
    setHasError(false);
    setMessage(copy.unsaved);
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

  const addSchedule = () => {
    setHasError(false);
    setSchedule((current) => [...current, createSlot()]);
    setOpenTimeIndex(schedule.length);
    setMessage(copy.added);
  };

  const saveSchedule = () => {
    if (!isLoaded) return false;
    if (schedule.length === 0) {
      setHasError(true);
      setMessage(copy.empty);
      return false;
    }
    const normalized = sortSchedule(normalizeSchedule(schedule));
    try {
      const serialized = JSON.stringify(normalized);
      window.localStorage.setItem(scheduleStorageKey, serialized);
      if (window.localStorage.getItem(scheduleStorageKey) !== serialized) throw new Error("Schedule was not persisted");
    } catch {
      setHasError(true);
      setMessage(copy.saveError);
      return false;
    }
    setSchedule(normalized);
    setOpenTimeIndex(null);
    setHasError(false);
    setMessage(copy.saved);
    return true;
  };

  const resetSchedule = () => {
    try {
      window.localStorage.removeItem(scheduleStorageKey);
    } catch {
      setHasError(true);
      setMessage(copy.saveError);
      return;
    }
    setSchedule(defaultSchedule);
    setOpenTimeIndex(null);
    setHasError(false);
    setMessage(copy.reset);
  };

  return (
    <main className="min-h-dvh bg-zinc-950 px-4 py-5 text-white">
      <section className="mx-auto flex h-[calc(100dvh-2.5rem)] w-full max-w-xl flex-col gap-4 overflow-hidden">
        <header className="shrink-0">
          <p className="text-xs font-extrabold text-emerald-300">XC-220 {"\uC131\uACBD\uD1B5\uB3C5 \uAC70\uCE58\uB300"}</p>
          <h1 className="mt-2 text-2xl font-black tracking-normal">{"\uC6F9 \uC2A4\uCF00\uC904 \uC124\uC815"}</h1>
          <p role={hasError ? "alert" : "status"} aria-live="polite" className="mt-2 text-sm font-bold leading-6 text-white/70">{message}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-3 pb-2">
            {schedule.map((slot, index) => (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3" key={`schedule-${index}`}>
                <div className="grid grid-cols-[132px_1fr] gap-2 max-[420px]:grid-cols-1">
                  <div className="flex flex-col gap-1 text-xs font-black text-white/70">
                    {"\uC2DC\uC791\uC2DC\uAC04"}
                    <button
                      aria-expanded={openTimeIndex === index}
                      disabled={!isLoaded}
                      className="h-11 rounded-md border border-white/15 bg-black px-3 text-left text-base font-black text-white"
                      type="button"
                      onClick={() => setOpenTimeIndex((current) => (current === index ? null : index))}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  </div>
                  <label className="flex flex-col gap-1 text-xs font-black text-white/70">
                    {"\uCF58\uD150\uCE20"}
                    <select
                      className="h-11 rounded-md border border-white/15 bg-black px-3 text-base font-black text-white"
                      value={slot.contentKey}
                      aria-label="콘텐츠"
                      disabled={!isLoaded}
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

                {openTimeIndex === index ? (
                  <div ref={timePickerRef}>
                    <TimePickerPanel startTime={slot.startTime} onChange={(startTime) => updateSlot(index, { startTime })} />
                  </div>
                ) : null}

                <button
                  className="mt-3 h-10 w-full rounded-md bg-white/10 text-sm font-black text-white"
                  type="button"
                  disabled={!isLoaded}
                  onClick={() => {
                    setHasError(false);
                    setMessage(copy.unsaved);
                    setSchedule((current) => current.filter((_, slotIndex) => slotIndex !== index));
                    setOpenTimeIndex(null);
                  }}
                >
                  {"\uC0AD\uC81C"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2">
          <button className="h-12 rounded-lg bg-white/10 text-sm font-black text-white" type="button" disabled={!isLoaded} onClick={addSchedule}>
            {"\uC2DC\uAC04 \uCD94\uAC00"}
          </button>
          <button className="h-12 rounded-lg bg-emerald-500 text-sm font-black text-white" type="button" disabled={!isLoaded} onClick={saveSchedule}>
            {"\uC800\uC7A5"}
          </button>
          <button className="h-12 rounded-lg bg-white/10 text-sm font-black text-white" type="button" disabled={!isLoaded} onClick={resetSchedule}>
            {"\uAE30\uBCF8\uAC12"}
          </button>
          <a className="flex h-12 items-center justify-center rounded-lg bg-sky-500 text-sm font-black text-white no-underline" href="/start?web=1" aria-disabled={!isLoaded} onClick={(event) => { if (!saveSchedule()) event.preventDefault(); }}>
            {"\uC9C0\uAE08 \uC2E4\uD589"}
          </a>
        </div>
      </section>
    </main>
  );
}
