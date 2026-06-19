export type ScheduleSlot = {
  startTime: string;
  contentKey: string;
  targetPath: string;
  label: string;
};

export const scheduleStorageKey = "xcan:user-schedule";
export const lastOpenedStorageKey = "xcan:last-opened-content";

export const defaultSchedule: ScheduleSlot[] = [
  {
    startTime: "08:00",
    contentKey: "living_life",
    targetPath: "/l",
    label: "생명의 삶",
  },
  {
    startTime: "10:00",
    contentKey: "korean_bible_reading",
    targetPath: "/b",
    label: "한글성경통독",
  },
  {
    startTime: "20:00",
    contentKey: "english_bible_reading",
    targetPath: "/e",
    label: "영어성경통독",
  },
  {
    startTime: "21:00",
    contentKey: "ccm",
    targetPath: "/c",
    label: "CCM",
  },
];

function toMinutes(startTime: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(startTime);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}

export function normalizeSchedule(value: unknown): ScheduleSlot[] {
  if (!Array.isArray(value)) return defaultSchedule;

  const normalized = value
    .map((item): ScheduleSlot | null => {
      if (!item || typeof item !== "object") return null;

      const record = item as Partial<ScheduleSlot>;
      if (
        !record.startTime ||
        !record.targetPath ||
        !record.contentKey ||
        toMinutes(String(record.startTime)) === null
      ) {
        return null;
      }

      return {
        startTime: String(record.startTime),
        contentKey: String(record.contentKey),
        targetPath: String(record.targetPath),
        label: String(record.label || record.contentKey),
      };
    })
    .filter((item): item is ScheduleSlot => Boolean(item));

  return normalized.length > 0 ? normalized : defaultSchedule;
}

export function getCurrentKoreaTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).formatToParts(now);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${hour}:${minute}`;
}

export function pickCurrentScheduleSlot(
  schedule: ScheduleSlot[],
  currentTime = getCurrentKoreaTime(),
) {
  const currentMinutes = toMinutes(currentTime) ?? 0;
  const sorted = schedule
    .map((slot) => ({ slot, minutes: toMinutes(slot.startTime) }))
    .filter((item): item is { slot: ScheduleSlot; minutes: number } => item.minutes !== null)
    .sort((a, b) => a.minutes - b.minutes);

  if (sorted.length === 0) return defaultSchedule[0];

  return (
    [...sorted].reverse().find((item) => item.minutes <= currentMinutes)?.slot ??
    sorted[sorted.length - 1].slot
  );
}
