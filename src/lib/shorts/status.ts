import type { ShortsMakerInput } from "./schema";

export const unsafeLaunchClaims = [
  "정식 출시 완료",
  "다운로드 가능",
  "(주)씨엔에이 명의 등록 완료",
  "공식 승인 완료"
];

export function getAllowedStatusPhrase(input: ShortsMakerInput) {
  if (input.productStatus === "officially_launched") {
    return "플레이스토어 정식 출시 완료";
  }

  if (input.productStatus === "play_store_update_pending") {
    return "플레이스토어 정보 업데이트 신청 중";
  }

  return "공식 출시 준비 단계";
}
