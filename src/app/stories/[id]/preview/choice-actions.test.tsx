import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ChoiceActions } from "./choice-actions";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push })
}));

describe("ChoiceActions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    push.mockReset();
  });

  test("shows paid-story curiosity hints for each branch", () => {
    render(
      <ChoiceActions
        storyId="story-1"
        choices={[
          { choice_id: "A", label: "A route" },
          { choice_id: "B", label: "B route" },
          { choice_id: "C", label: "C route" }
        ]}
      />
    );

    expect(screen.getByText("읽음과 입력 중 표시 뒤에 숨은 그날의 진짜 이유")).toBeTruthy();
    expect(screen.getByText("마지막 하루가 다정할수록 더 잔인해지는 이유")).toBeTruthy();
    expect(screen.getByText("예림이 끝내 말하지 않은 한 문장의 정체")).toBeTruthy();
  });

  test("moves to checkout if saving a choice takes too long", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    render(
      <ChoiceActions
        storyId="story-1"
        choices={[
          { choice_id: "A", label: "A route" },
          { choice_id: "B", label: "B route" },
          { choice_id: "C", label: "C route" }
        ]}
      />
    );

    const routeText = screen.getByText("A route");
    const routeButton = routeText.closest("button");

    expect(routeButton).not.toBeNull();
    fireEvent.click(routeButton as HTMLButtonElement);

    await vi.advanceTimersByTimeAsync(8000);

    expect(push).toHaveBeenCalledWith("/checkout/story-1");
  });

  test("saves a custom ending direction through the C choice slot", async () => {
    vi.useRealTimers();
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        storyId: "story-1",
        selectedChoiceId: "C",
        status: "choice_selected"
      })
    });
    vi.stubGlobal("fetch", fetch);

    render(
      <ChoiceActions
        storyId="story-1"
        choices={[
          { choice_id: "A", label: "A route" },
          { choice_id: "B", label: "B route" },
          { choice_id: "C", label: "C route" }
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText("기타: 내가 원하는 결말 직접 쓰기"), {
      target: { value: "서로의 오해를 확인하고 각자의 성장을 선택한다" }
    });
    fireEvent.click(screen.getByRole("button", { name: "이 결말로 완결 보기" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/checkout/story-1"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/story/select-choice",
      expect.objectContaining({
        body: JSON.stringify({
          storyId: "story-1",
          choiceId: "C",
          customChoiceText: "서로의 오해를 확인하고 각자의 성장을 선택한다"
        })
      })
    );
  });
});
