import { describe, expect, it } from "vitest";
import { cleanReaderText } from "./story-copy";

describe("cleanReaderText", () => {
  it("removes structural branch counter phrases from already generated stories", () => {
    const text =
      "유리창에 남은 빗물 너머로, 5번째 갈림길에서, 마음을 꺼냈다. 5번째로 돌아온 정적은 앞선 장면과 다른 결을 남겼다. 그래서 장면은 이어졌다.";

    expect(cleanReaderText(text)).toBe(
      "유리창에 남은 빗물 너머로, 마음을 꺼냈다. 그래서 장면은 이어졌다."
    );
  });
});
