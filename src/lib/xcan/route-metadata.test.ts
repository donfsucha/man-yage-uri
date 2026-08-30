import type { Metadata } from "next";
import { metadata as bibleMetadata } from "@/app/b/layout";
import { metadata as ccmMetadata } from "@/app/c/layout";
import { metadata as englishBibleMetadata } from "@/app/e/layout";
import { metadata as livingLifeMetadata } from "@/app/l/layout";
import { metadata as scheduleMetadata } from "@/app/schedule/layout";
import { metadata as startMetadata } from "@/app/start/layout";
import { xcanRouteCopy } from "./route-metadata";

const cases = [
  ["start", startMetadata, xcanRouteCopy.start],
  ["bible", bibleMetadata, xcanRouteCopy.bible],
  ["ccm", ccmMetadata, xcanRouteCopy.ccm],
  ["englishBible", englishBibleMetadata, xcanRouteCopy.englishBible],
  ["livingLife", livingLifeMetadata, xcanRouteCopy.livingLife],
  ["schedule", scheduleMetadata, xcanRouteCopy.schedule],
] as const;

function asUrl(value: string | URL | null | undefined) {
  return value ? value.toString() : "";
}

describe("XCAN route metadata", () => {
  it.each(cases)("uses XCAN metadata for %s", (_routeKey, metadata, route) => {
    expect(metadata).toMatchObject<Metadata>({
      title: { absolute: route.title },
      description: route.description,
      openGraph: {
        title: route.title,
        description: route.description,
        siteName: "XCAN 말씀루틴",
        locale: "ko_KR",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: route.title,
        description: route.description,
      },
    });

    expect(asUrl(metadata.alternates?.canonical)).toBe(
      `https://ifwe.cnanfc.com${route.path}`,
    );
    expect(asUrl(metadata.openGraph?.url)).toBe(
      `https://ifwe.cnanfc.com${route.path}`,
    );
  });

  it("uses the requested copy on the NFC entry route", () => {
    expect(startMetadata.title).toEqual({
      absolute: "XCAN 말씀루틴 | 성경통독 시작",
    });
    expect(startMetadata.description).toBe(
      "휴대폰을 거치하고 오늘의 말씀과 성경통독을 시작하세요.",
    );
  });
});
