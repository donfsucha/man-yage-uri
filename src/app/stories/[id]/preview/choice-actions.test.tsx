import { fireEvent, render, screen } from "@testing-library/react";
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

    fireEvent.click(screen.getByRole("button", { name: "AA route" }));

    await vi.advanceTimersByTimeAsync(8000);

    expect(push).toHaveBeenCalledWith("/checkout/story-1");
  });
});
