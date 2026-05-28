import { describe, expect, it } from "vitest";
import { getInitialStoryChoices } from "./story-choices";

describe("story choices", () => {
  it("frames the first paid branch as a regret direction, not a generic action", () => {
    expect(getInitialStoryChoices().map((choice) => choice.label)).toEqual([
      "내가 오해했던 장면을 다시 본다",
      "끝까지 말하지 못한 진심을 꺼낸다",
      "그 사람이 남긴 침묵의 의미를 다시 읽는다"
    ]);
  });
});
