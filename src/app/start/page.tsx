"use client";

import { useEffect, useMemo, useState } from "react";
import {
  defaultSchedule,
  lastOpenedStorageKey,
  normalizeSchedule,
  pickCurrentScheduleSlot,
  scheduleStorageKey,
} from "@/lib/xcan/schedule";

function loadSchedule() {
  try {
    const saved = window.localStorage.getItem(scheduleStorageKey);
    return saved ? normalizeSchedule(JSON.parse(saved)) : defaultSchedule;
  } catch {
    return defaultSchedule;
  }
}

export default function NfcStartPage() {
  const [message, setMessage] = useState("현재 시간대 콘텐츠를 확인하고 있습니다.");
  const fallbackSlot = useMemo(() => pickCurrentScheduleSlot(defaultSchedule), []);

  useEffect(() => {
    const schedule = loadSchedule();
    const slot = pickCurrentScheduleSlot(schedule);

    window.localStorage.setItem(
      lastOpenedStorageKey,
      JSON.stringify({
        contentKey: slot.contentKey,
        targetPath: slot.targetPath,
        originalTargetPath: slot.targetPath,
        openedAt: new Date().toISOString(),
      }),
    );

    setMessage(`${slot.label} 콘텐츠로 이동합니다.`);
    window.location.replace(slot.targetPath);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
      <section className="w-full max-w-sm">
        <p className="text-xs font-extrabold text-emerald-300">XC-220 성경통독 거치대</p>
        <h1 className="mt-3 text-2xl font-black">스케줄 확인 중</h1>
        <p className="mt-3 text-sm font-bold text-white/75">{message}</p>
        <a
          className="mt-8 inline-flex rounded-lg bg-emerald-500 px-5 py-3 text-sm font-black text-white no-underline"
          href={fallbackSlot.targetPath}
        >
          바로 열기
        </a>
      </section>
    </main>
  );
}
