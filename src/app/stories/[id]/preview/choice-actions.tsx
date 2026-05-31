"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getChoicePurchaseHint } from "@/lib/story/choice-hints";
import type { NextChoice } from "@/lib/story/schema";

type ChoiceLocale = "ko" | "en";

type ChoiceActionsProps = {
  storyId: string;
  choices: NextChoice[];
  locale?: ChoiceLocale;
};

const CHOICE_SAVE_FALLBACK_MS = 8000;
const CUSTOM_CHOICE_ID = "C";
const unsafeCustomChoicePattern =
  /(연락|전화|문자|카톡|주소|집\s*앞|직장|찾아가|몰래|기다리|협박|복수|죽|자해|\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4})/i;

const CHOICE_COPY = {
  ko: {
    title: "다른 결말 보기 - 7,900원",
    body:
      "방금 뜬 읽음 표시와 입력 중 문구는 선택한 방향에 따라 다른 진실로 풀립니다. 다음 화면은 단순한 이어 읽기가 아니라, 그날의 오해와 끝내 하지 못한 한 문장을 확인하는 결제 지점입니다.",
    saving: "선택 저장 중",
    customLabel: "기타: 내가 원하는 결말 직접 쓰기",
    customExample:
      "예: 마지막으로 붙잡기보다 서로의 오해를 확인하고 각자의 성장을 선택한다.",
    customPlaceholder: "원하는 결말 방향을 5자 이상 적어 주세요.",
    customTooShort: "직접 입력은 5자 이상으로 적어 주세요.",
    customUnsafe:
      "직접 입력 결말은 연락, 찾아가기, 개인정보, 협박, 자해 표현 없이 감정 변화나 장면 중심으로 적어 주세요.",
    customSaving: "직접 입력 저장 중",
    customSubmit: "이 결말로 완결 보기",
    networkError: "선택 저장에 실패했습니다. 다음 화면에서 다시 시도해 주세요."
  },
  en: {
    title: "Read the alternate ending - KRW 7,900",
    body:
      "The read receipt and typing indicator unlock a different truth depending on your branch. This is not just the next paragraph; it is the paid moment where the misunderstanding and the sentence left unsaid finally pay off.",
    saving: "Saving choice",
    customLabel: "Other: write my own ending direction",
    customExample:
      "Example: instead of chasing the final moment, they confirm the misunderstanding and choose separate growth.",
    customPlaceholder: "Write the ending direction in at least 5 characters.",
    customTooShort: "Please write at least 5 characters.",
    customUnsafe:
      "Keep your custom ending focused on emotional change or fictional scenes. Do not include contact attempts, visiting, private information, threats, or self-harm.",
    customSaving: "Saving custom direction",
    customSubmit: "Unlock this ending",
    networkError: "Could not save the choice. Please try again on the next screen."
  }
} satisfies Record<ChoiceLocale, Record<string, string>>;

export function ChoiceActions({
  storyId,
  choices,
  locale = "ko"
}: ChoiceActionsProps) {
  const router = useRouter();
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [customChoiceText, setCustomChoiceText] = useState("");
  const [error, setError] = useState("");

  async function selectChoice(choiceId: string, customText?: string) {
    setSelectedChoiceId(customText ? "CUSTOM" : choiceId);
    setError("");

    let fallbackTriggered = false;
    const fallbackTimer = window.setTimeout(() => {
      fallbackTriggered = true;
      router.push(locale === "en" ? `/checkout/${storyId}?lang=en` : `/checkout/${storyId}`);
    }, CHOICE_SAVE_FALLBACK_MS);

    try {
      const response = await fetch("/api/story/select-choice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          storyId,
          choiceId,
          ...(customText ? { customChoiceText: customText } : {})
        })
      });
      const result = await response.json();
      window.clearTimeout(fallbackTimer);

      if (fallbackTriggered) {
        return;
      }

      if (!response.ok) {
        setError(result.error ?? CHOICE_COPY[locale].networkError);
        setSelectedChoiceId(null);
        return;
      }

      router.push(locale === "en" ? `/checkout/${storyId}?lang=en` : `/checkout/${storyId}`);
    } catch {
      window.clearTimeout(fallbackTimer);

      if (fallbackTriggered) {
        return;
      }

      setError(CHOICE_COPY[locale].networkError);
      setSelectedChoiceId(null);
    }
  }

  function submitCustomChoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = customChoiceText.trim();

    if (text.length < 5) {
      setError(CHOICE_COPY[locale].customTooShort);
      return;
    }

    if (unsafeCustomChoicePattern.test(text)) {
      setError(CHOICE_COPY[locale].customUnsafe);
      return;
    }

    void selectChoice(CUSTOM_CHOICE_ID, text);
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-2">
        <h2 className="text-xl font-black">{CHOICE_COPY[locale].title}</h2>
        <p className="leading-7 text-[color:var(--muted)]">
          {CHOICE_COPY[locale].body}
        </p>
      </div>

      <div className="grid gap-3">
        {choices.map((choice) => {
          const hint = getChoicePurchaseHint(choice, locale);

          return (
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
              <span className="grid gap-1 text-left">
                <span>
                  {selectedChoiceId === choice.choice_id
                    ? CHOICE_COPY[locale].saving
                    : choice.label}
                </span>
                <span className="text-sm font-normal leading-6 text-[color:var(--muted)]">
                  {hint.teaser}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <form className="panel grid gap-3 p-4" onSubmit={submitCustomChoice}>
        <div className="grid gap-1">
          <label className="font-bold" htmlFor="custom-choice">
            {CHOICE_COPY[locale].customLabel}
          </label>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            {CHOICE_COPY[locale].customExample}
          </p>
        </div>
        <textarea
          className="min-h-24 w-full resize-y rounded-lg border border-[color:var(--border)] bg-white p-3 leading-7 outline-none focus:border-[color:var(--accent)]"
          disabled={selectedChoiceId !== null}
          id="custom-choice"
          maxLength={160}
          minLength={5}
          onChange={(event) => setCustomChoiceText(event.target.value)}
          placeholder={CHOICE_COPY[locale].customPlaceholder}
          value={customChoiceText}
        />
        <button
          className="button-primary w-full"
          disabled={selectedChoiceId !== null}
          type="submit"
        >
          {selectedChoiceId === "CUSTOM"
            ? CHOICE_COPY[locale].customSaving
            : CHOICE_COPY[locale].customSubmit}
        </button>
      </form>

      {error ? (
        <div className="rounded-lg border border-[color:var(--danger)] bg-white p-3 text-sm leading-6 text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}
    </section>
  );
}
