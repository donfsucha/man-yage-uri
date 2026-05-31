import { describe, expect, it } from "vitest";
import { getInitialStoryChoices } from "./story-choices";

describe("story choices", () => {
  it("frames the first paid branches as curiosity hooks, not generic actions", () => {
    expect(getInitialStoryChoices().map((choice) => choice.label)).toEqual([
      "읽음으로 바뀐 문자의 진짜 이유를 확인한다",
      "마지막 하루에 숨은 다정함의 대가를 본다",
      "예림이 끝내 말하지 않은 한 문장을 읽는다"
    ]);
  });

  it("returns English curiosity hooks for the English flow", () => {
    expect(getInitialStoryChoices("en").map((choice) => choice.label)).toEqual([
      "Find the real reason behind the read message",
      "Spend the final day and uncover its cost",
      "Read the sentence left unsaid"
    ]);
  });
});
