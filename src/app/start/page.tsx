"use client";

import { useEffect, useMemo, useState } from "react";
import {
  appLaunchFallbackDelayMs,
  buildXcanPlayerIntentUrl,
  webFallbackParam,
} from "@/lib/xcan/app-launch";
import {
  defaultSchedule,
  lastOpenedStorageKey,
  normalizeSchedule,
  pickCurrentScheduleSlot,
  scheduleStorageKey,
  type ScheduleSlot,
} from "@/lib/xcan/schedule";

function loadSchedule() {
  try {
    const saved = window.localStorage.getItem(scheduleStorageKey);
    return saved ? normalizeSchedule(JSON.parse(saved)) : defaultSchedule;
  } catch {
    return defaultSchedule;
  }
}

function isAndroidBrowser() {
  return /Android/i.test(window.navigator.userAgent);
}

function hasWebFallbackFlag() {
  return new URLSearchParams(window.location.search).get(webFallbackParam) === "1";
}

function rememberOpenedSlot(slot: ScheduleSlot) {
  window.localStorage.setItem(
    lastOpenedStorageKey,
    JSON.stringify({
      contentKey: slot.contentKey,
      targetPath: slot.targetPath,
      originalTargetPath: slot.targetPath,
      openedAt: new Date().toISOString(),
    }),
  );
}

export default function NfcStartPage() {
  const [message, setMessage] = useState("현재 시간대 콘텐츠를 확인하고 있습니다.");
  const fallbackSlot = useMemo(() => pickCurrentScheduleSlot(defaultSchedule), []);

  useEffect(() => {
    const schedule = loadSchedule();
    const slot = pickCurrentScheduleSlot(schedule);

    rememberOpenedSlot(slot);

    const updateMessage = (value: string) => {
      window.setTimeout(() => setMessage(value), 0);
    };

    const openWebFallback = () => {
      updateMessage(`${slot.label} 콘텐츠로 이동합니다.`);
      window.location.replace(slot.targetPath);
    };

    if (isAndroidBrowser() && !hasWebFallbackFlag()) {
      updateMessage("XCAN PLAYER 앱을 여는 중입니다.");

      let appOpened = false;
      const markAppOpened = () => {
        if (document.visibilityState === "hidden") {
          appOpened = true;
        }
      };

      const fallbackTimer = window.setTimeout(() => {
        if (!appOpened && document.visibilityState === "visible") {
          openWebFallback();
        }
      }, appLaunchFallbackDelayMs);

      document.addEventListener("visibilitychange", markAppOpened);
      window.addEventListener(
        "pagehide",
        () => {
          appOpened = true;
          window.clearTimeout(fallbackTimer);
        },
        { once: true },
      );

      window.location.href = buildXcanPlayerIntentUrl(window.location.origin);

      return () => {
        window.clearTimeout(fallbackTimer);
        document.removeEventListener("visibilitychange", markAppOpened);
      };
    }

    openWebFallback();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
      <section className="w-full max-w-sm">
        <p className="text-xs font-extrabold text-emerald-300">XC-220 성경통독 거치대</p>
        <h1 className="mt-3 text-2xl font-black">스케줄 확인 중</h1>
        <p className="mt-3 text-sm font-bold text-white/75">{message}</p>
        <div className="mt-8 flex justify-center gap-3">
          <a
            className="inline-flex rounded-lg bg-emerald-500 px-5 py-3 text-sm font-black text-white no-underline"
            href={buildXcanPlayerIntentUrl(typeof window === "undefined" ? "https://ifwe.cnanfc.com" : window.location.origin)}
          >
            앱 열기
          </a>
          <a
            className="inline-flex rounded-lg bg-white/15 px-5 py-3 text-sm font-black text-white no-underline"
            href={fallbackSlot.targetPath}
          >
            웹으로 보기
          </a>
        </div>
      </section>
    </main>
  );
}
