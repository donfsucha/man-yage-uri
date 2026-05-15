"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NextChoice } from "@/lib/story/schema";

type ChoiceActionsProps = {
  storyId: string;
  choices: NextChoice[];
};

const CHOICE_SAVE_FALLBACK_MS = 8000;

export function ChoiceActions({ storyId, choices }: ChoiceActionsProps) {
  const router = useRouter();
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function selectChoice(choiceId: string) {
    setSelectedChoiceId(choiceId);
    setError("");

    let fallbackTriggered = false;
    const fallbackTimer = window.setTimeout(() => {
      fallbackTriggered = true;
      router.push(`/checkout/${storyId}`);
    }, CHOICE_SAVE_FALLBACK_MS);

    try {
      const response = await fetch("/api/story/select-choice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storyId, choiceId })
      });
      const result = await response.json();
      window.clearTimeout(fallbackTimer);

      if (fallbackTriggered) {
        return;
      }

      if (!response.ok) {
        setError(result.error ?? "선택지를 저장하지 못했습니다.");
        setSelectedChoiceId(null);
        return;
      }

      router.push(`/checkout/${storyId}`);
    } catch {
      window.clearTimeout(fallbackTimer);

      if (fallbackTriggered) {
        return;
      }

      setError("네트워크 상태를 확인한 뒤 다시 시도해주세요.");
      setSelectedChoiceId(null);
    }
  }

  return (
    <section className="grid gap-3">
      <h2 className="text-xl font-black">다음 전개를 선택하세요</h2>
      {choices.map((choice) => (
        <button
          className="button-secondary w-full justify-start"
          disabled={selectedChoiceId !== null}
          key={choice.choice_id}
          onClick={() => selectChoice(choice.choice_id)}
          type="button"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--accent)] text-sm font-bold text-white">
            {choice.choice_id}
          </span>
          <span>
            {selectedChoiceId === choice.choice_id ? "선택 저장 중" : choice.label}
          </span>
        </button>
      ))}
      {error ? (
        <div className="rounded-lg border border-[color:var(--danger)] bg-white p-3 text-sm leading-6 text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}
    </section>
  );
}
