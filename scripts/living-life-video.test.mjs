import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findLatestLivingLifeVideo,
  replaceYoutubeVideoId,
} from "./living-life-video.mjs";

describe("Living Life video updater", () => {
  it("keeps the Living Life page copy free of replacement question marks", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "src", "app", "l", "page.tsx"),
      "utf8",
    );

    expect(pageSource).not.toMatch(/\{"[^"\n]*\?{2,}[^"\n]*"\}/);
  });

  it("selects the newest CGN Living Life QT video from the feed", () => {
    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title>[다른 영상] 오늘의 소식</title>
          <link href="https://www.youtube.com/watch?v=ignore12345" />
        </entry>
        <entry>
          <title>[생명의 삶 큐티] 심판의 메시지에 담긴 구원 메시지 |나훔 1:9~15| 문영재 목사 | 260626QT</title>
          <link href="https://www.youtube.com/watch?v=o7cnQoct6EM" />
        </entry>
        <entry>
          <title>[생명의 삶 큐티] 진노의 날에 피난처 되신 하나님 |나훔 1:1~8| 문영재 목사 | 260625QT</title>
          <link href="https://www.youtube.com/watch?v=MgqDC8iJDG4" />
        </entry>
      </feed>`;

    expect(findLatestLivingLifeVideo(feedXml)).toEqual({
      title:
        "[생명의 삶 큐티] 심판의 메시지에 담긴 구원 메시지 |나훔 1:9~15| 문영재 목사 | 260626QT",
      url: "https://www.youtube.com/watch?v=o7cnQoct6EM",
      videoId: "o7cnQoct6EM",
    });
  });

  it("replaces only the configured YouTube video ID", () => {
    const source = `const youtubeVideoId = "MgqDC8iJDG4";
const title = "생명의 삶 영상";
`;

    expect(replaceYoutubeVideoId(source, "o7cnQoct6EM")).toBe(
      `const youtubeVideoId = "o7cnQoct6EM";
const title = "생명의 삶 영상";
`,
    );
  });
});
