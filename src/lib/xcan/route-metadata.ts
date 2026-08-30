import type { Metadata } from "next";

const xcanSiteUrl = new URL("https://ifwe.cnanfc.com");

export const xcanRouteCopy = {
  start: {
    path: "/start",
    title: "XCAN 말씀루틴 | 성경통독 시작",
    description: "휴대폰을 거치하고 오늘의 말씀과 성경통독을 시작하세요.",
  },
  bible: {
    path: "/b",
    title: "XCAN 말씀루틴 | 한글 성경통독",
    description: "한글 성경통독 영상을 이어 보고 읽기표에서 원하는 위치를 선택하세요.",
  },
  ccm: {
    path: "/c",
    title: "XCAN 말씀루틴 | CCM·기도음악",
    description: "말씀 묵상과 기도를 위한 CCM·기도음악을 편리하게 재생하세요.",
  },
  englishBible: {
    path: "/e",
    title: "XCAN 말씀루틴 | 영어 성경통독",
    description: "영어 성경통독 영상을 이어 보고 읽기표에서 원하는 위치를 선택하세요.",
  },
  livingLife: {
    path: "/l",
    title: "XCAN 말씀루틴 | 생명의 삶",
    description: "오늘의 생명의 삶 영상을 XCAN 말씀루틴에서 편리하게 시청하세요.",
  },
  schedule: {
    path: "/schedule",
    title: "XCAN 말씀루틴 | 시간표 설정",
    description: "말씀·성경통독·찬양 콘텐츠가 열리는 시간을 설정하세요.",
  },
} as const;

export type XcanRouteKey = keyof typeof xcanRouteCopy;

export function createXcanRouteMetadata(routeKey: XcanRouteKey): Metadata {
  const route = xcanRouteCopy[routeKey];
  const canonicalUrl = new URL(route.path, xcanSiteUrl);

  return {
    metadataBase: xcanSiteUrl,
    title: { absolute: route.title },
    description: route.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: route.title,
      description: route.description,
      url: canonicalUrl,
      siteName: "XCAN 말씀루틴",
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: route.title,
      description: route.description,
    },
  };
}
