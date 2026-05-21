import { describe, expect, it } from "vitest";
import {
  assertNoUnsafeLaunchClaims,
  buildShortsPrompt,
  getAllowedStatusPhrase
} from "./shorts-generator";
import { generateMockShortsPackage } from "./mock-shorts-generator";
import {
  shortsMakerInputSchema,
  shortsPackageSchema,
  type ShortsMakerInput
} from "./schema";

const baseInput: ShortsMakerInput = {
  productStatus: "play_store_update_pending",
  audience: "seniors_parents",
  purpose: "launch_notice",
  length: "30s",
  tone: "warm",
  memo: "부모님이 앱 찾기를 어려워한다는 공감 포인트를 강조"
};

describe("shortsMakerInputSchema", () => {
  it("accepts a valid shorts maker request", () => {
    expect(shortsMakerInputSchema.parse(baseInput)).toEqual(baseInput);
  });

  it("rejects an unknown product status", () => {
    expect(() =>
      shortsMakerInputSchema.parse({
        ...baseInput,
        productStatus: "approved_on_play_store"
      })
    ).toThrow();
  });
});

describe("generateMockShortsPackage", () => {
  it("returns a complete package that matches the output schema", () => {
    const result = generateMockShortsPackage(baseInput);

    expect(shortsPackageSchema.parse(result)).toEqual(result);
    expect(result.hooks).toHaveLength(3);
    expect(result.reviewChecklist.join(" ")).toContain("플레이스토어");
  });
});

describe("launch status guardrails", () => {
  it("uses cautious wording for a Play Store update-pending status", () => {
    const result = generateMockShortsPackage(baseInput);
    const allText = assertNoUnsafeLaunchClaims(result, baseInput);

    expect(getAllowedStatusPhrase(baseInput)).toBe(
      "플레이스토어 정보 업데이트 신청 중"
    );
    expect(allText).not.toContain("정식 출시 완료");
    expect(allText).not.toContain("다운로드 가능");
    expect(allText).not.toContain("(주)씨엔에이 명의 등록 완료");
  });

  it("allows official launch wording only for officially launched status", () => {
    const input: ShortsMakerInput = {
      ...baseInput,
      productStatus: "officially_launched"
    };
    const result = generateMockShortsPackage(input);

    expect(getAllowedStatusPhrase(input)).toBe("플레이스토어 정식 출시 완료");
    expect(assertNoUnsafeLaunchClaims(result, input)).toContain(
      "플레이스토어 정식 출시 완료"
    );
  });

  it("keeps unsafe launch claims out of the non-launched prompt", () => {
    const prompt = buildShortsPrompt(baseInput);

    expect(prompt).toContain("플레이스토어 정보 업데이트 신청 중");
    expect(prompt).toContain("금지 표현");
    expect(prompt).not.toContain("플레이스토어 정식 출시 완료 상태로 홍보");
  });
});
