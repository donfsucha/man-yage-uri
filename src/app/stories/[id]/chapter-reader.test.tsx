import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChapterReader } from "./chapter-reader";
import type { StoryChapter } from "@/lib/story/schema";

const chapters: StoryChapter[] = [
  {
    chapter_no: 1,
    chapter_title: "다시 열린 장면",
    body: "1화 본문입니다. ".repeat(20),
    ending_hook: "첫 번째 선택을 부르는 문장입니다.",
    next_choices: [
      { choice_id: "A", label: "오해를 하나씩 풀어본다" },
      { choice_id: "B", label: "마지막 하루를 함께 보낸다" },
      { choice_id: "C", label: "각자의 진심을 편지로 남긴다" }
    ]
  },
  {
    chapter_no: 2,
    chapter_title: "엇갈린 사실들",
    body: "2화 본문입니다. ".repeat(20),
    ending_hook: "두 번째 선택을 부르는 문장입니다.",
    next_choices: [
      { choice_id: "A", label: "못 들은 말을 다시 확인한다" },
      { choice_id: "B", label: "내가 오해한 장면부터 인정한다" },
      { choice_id: "C", label: "상대가 침묵한 이유는 단정하지 않는다" }
    ]
  },
  {
    chapter_no: 3,
    chapter_title: "그날의 빈칸",
    body: "3화 본문입니다. ".repeat(20),
    ending_hook: "세 번째 선택을 부르는 문장입니다.",
    next_choices: [
      { choice_id: "A", label: "마지막 통화의 빈칸을 꺼낸다" },
      { choice_id: "B", label: "정류장에서 놓친 표정을 떠올린다" },
      { choice_id: "C", label: "사과보다 사실을 먼저 정리한다" }
    ]
  }
];

describe("ChapterReader", () => {
  it("reveals the next paid chapter only after choosing a chapter direction", () => {
    render(
      <ChapterReader
        chapters={chapters}
        isCompleted
        selectedChoiceId="A"
      />
    );

    expect(screen.getByText("엇갈린 사실들")).toBeTruthy();
    expect(screen.queryByText("그날의 빈칸")).toBeNull();

    fireEvent.click(screen.getByText("내가 오해한 장면부터 인정한다"));

    expect(screen.getByText("그날의 빈칸")).toBeTruthy();
  });

  it("hides a chapter choice group after the reader chooses one", () => {
    render(
      <ChapterReader
        chapters={chapters}
        isCompleted
        selectedChoiceId="A"
      />
    );

    expect(screen.getByText("내가 오해한 장면부터 인정한다")).toBeTruthy();

    fireEvent.click(screen.getByText("내가 오해한 장면부터 인정한다"));

    expect(screen.queryByText("내가 오해한 장면부터 인정한다")).toBeNull();
    expect(screen.getByText("마지막 통화의 빈칸을 꺼낸다")).toBeTruthy();
  });
});
