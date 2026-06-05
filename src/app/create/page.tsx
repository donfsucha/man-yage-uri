"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { trackEvent } from "@/components/event-tracker";
import { formatStoryInputIssues, getLocalStoryInputIssue } from "./validation-errors";

type FormState = {
  breakupMoment: string;
  breakupReason: string;
  alternativeChoice: string;
  lastScenePlace: string;
  rememberedDetail: string;
  partnerBehavior: string;
  emotion: string;
  desiredEnding: string;
  protagonistAlias: string;
  partnerAlias: string;
  agreedToFictionNotice: boolean;
  agreedToPrivacyNotice: boolean;
};

type CreateLocale = "ko" | "en";

const CREATE_COPY = {
  ko: {
    otherLanguageHref: "/create?lang=en",
    otherLanguageLabel: "English",
    eyebrow: "무료 1화로 시작",
    title: "그날 하지 못한 말을 안전한 픽션으로 바꿔볼게요.",
    intro:
      "실명 대신 별명이나 이니셜을 사용해 주세요. 전화번호, 주소, 직장명 같은 개인정보는 입력하지 않는 것이 안전합니다.",
    breakupMoment: "이별의 순간",
    breakupReason: "이별의 이유",
    alternativeChoice: "그때 다르게 하고 싶었던 말이나 행동",
    alternativeChoicePlaceholder:
      "예: 화내지 않고 미안하다는 말을 먼저 꺼내고 싶었어.",
    realismSection: "장면을 더 리얼하게 만드는 질문",
    lastScenePlace: "마지막 장면의 장소",
    lastScenePlacePlaceholder:
      "예: 비 오는 정류장, 동네 골목 입구, 마지막으로 앉았던 카페",
    rememberedDetail: "아직 기억나는 작은 디테일",
    rememberedDetailPlaceholder:
      "예: 젖은 운동화 끈, 식어버린 커피, 꺼지지 않던 휴대폰 화면",
    partnerBehavior: "상대가 자주 보이던 말투나 행동",
    partnerBehaviorPlaceholder:
      "예: 화가 나면 대답보다 침묵이 먼저 길어지는 편",
    emotion: "지금의 감정",
    desiredEnding: "원하는 결말 방향",
    protagonistAlias: "나의 별명",
    protagonistAliasPlaceholder: "예: 나, A, 하린",
    partnerAlias: "상대의 별명",
    partnerAliasPlaceholder: "예: 그 사람, B",
    fictionNotice:
      "생성되는 내용은 실제 상대의 마음이나 미래를 예측하지 않는 픽션임을 이해했습니다.",
    privacyNotice:
      "실명, 연락처, 주소, 직장명 등 개인정보를 입력하지 않겠습니다.",
    submitIdle: "1화 무료 생성하기",
    submitLoading: "1화 만드는 중",
    networkError: "네트워크 상태를 확인하고 다시 시도해 주세요.",
    generationError: "1화 생성 중 문제가 발생했습니다."
  },
  en: {
    otherLanguageHref: "/create",
    otherLanguageLabel: "한국어",
    eyebrow: "Start with free chapter 1",
    title: "Turn the words you never said into safe fiction.",
    intro:
      "Use aliases or initials instead of real names. Please do not enter phone numbers, addresses, workplaces, or other personal information.",
    breakupMoment: "Breakup moment",
    breakupReason: "Reason for the breakup",
    alternativeChoice: "What you wish you had said or done",
    alternativeChoicePlaceholder:
      "Example: I wish I had apologized first instead of getting angry.",
    realismSection: "Questions that make the scene feel real",
    lastScenePlace: "Place of the last scene",
    lastScenePlacePlaceholder:
      "Example: a rainy bus stop, the cafe where we last sat, a quiet street corner",
    rememberedDetail: "Small detail you still remember",
    rememberedDetailPlaceholder:
      "Example: wet shoelaces, a cold cup of coffee, the phone screen that would not turn off",
    partnerBehavior: "Their familiar tone or behavior",
    partnerBehaviorPlaceholder:
      "Example: when upset, they went silent before answering",
    emotion: "Current emotion",
    desiredEnding: "Desired ending direction",
    protagonistAlias: "Your alias",
    protagonistAliasPlaceholder: "Example: me, A, Harin",
    partnerAlias: "Their alias",
    partnerAliasPlaceholder: "Example: that person, B, Yerim",
    fictionNotice:
      "I understand the generated story is fiction and does not predict a real person's heart or future.",
    privacyNotice:
      "I will not enter real names, contact details, addresses, workplaces, or other personal information.",
    submitIdle: "Generate free chapter 1",
    submitLoading: "Generating chapter 1",
    networkError: "Check your network connection and try again.",
    generationError: "Something went wrong while generating chapter 1."
  }
} satisfies Record<CreateLocale, Record<string, string>>;

const CREATE_OPTIONS = {
  ko: {
    breakupMoments: [
      "마지막 통화",
      "마지막 만남",
      "읽씹으로 끝난 밤",
      "문자로 끝난 밤",
      "서로 아무 말도 못 한 순간"
    ],
    breakupReasons: [
      "서로의 오해",
      "장거리",
      "권태기",
      "현실 문제",
      "타이밍이 맞지 않음"
    ],
    emotions: [
      ["regret", "후회"],
      ["longing", "그리움"],
      ["anger", "분노"],
      ["calm", "담담함"],
      ["gratitude", "고마움"]
    ],
    endings: [
      ["reunion", "재회의 가능성"],
      ["growth", "각자의 성장"],
      ["farewell", "완전한 이별"],
      ["parallel_world", "평행세계"]
    ]
  },
  en: {
    breakupMoments: [
      "the last phone call",
      "the final meeting",
      "the night the message was left on read",
      "the night it ended by text",
      "the moment neither of us could speak"
    ],
    breakupReasons: [
      "a misunderstanding between us",
      "long distance",
      "a relationship that had grown tired",
      "real-life pressure",
      "bad timing"
    ],
    emotions: [
      ["regret", "Regret"],
      ["longing", "Longing"],
      ["anger", "Anger"],
      ["calm", "Calm"],
      ["gratitude", "Gratitude"]
    ],
    endings: [
      ["reunion", "Possibility of reunion"],
      ["growth", "Separate growth"],
      ["farewell", "A complete farewell"],
      ["parallel_world", "A parallel-world day"]
    ]
  }
} satisfies Record<
  CreateLocale,
  {
    breakupMoments: string[];
    breakupReasons: string[];
    emotions: [string, string][];
    endings: [string, string][];
  }
>;

const initialState: FormState = {
  breakupMoment: "마지막 통화",
  breakupReason: "서로의 오해",
  alternativeChoice: "",
  lastScenePlace: "",
  rememberedDetail: "",
  partnerBehavior: "",
  emotion: "regret",
  desiredEnding: "growth",
  protagonistAlias: "",
  partnerAlias: "",
  agreedToFictionNotice: false,
  agreedToPrivacyNotice: false
};

function CreatePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const languageParam = searchParams.get("lang");
  const [browserLocale, setBrowserLocale] = useState<CreateLocale>("ko");
  const locale: CreateLocale =
    languageParam === "en"
      ? "en"
      : languageParam === "ko"
        ? "ko"
        : browserLocale;
  const copy = CREATE_COPY[locale];
  const options = CREATE_OPTIONS[locale];
  const languageHref = `${pathname || "/create"}?lang=${locale === "en" ? "ko" : "en"}`;
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (languageParam === "en" || languageParam === "ko") {
      return;
    }

    const language =
      window.navigator.languages?.[0] ?? window.navigator.language ?? "ko";

    setBrowserLocale(language.toLowerCase().startsWith("ko") ? "ko" : "en");
  }, [languageParam]);

  useEffect(() => {
    void trackEvent({ eventName: "create_page_view", metadata: { locale } });
  }, [locale]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      breakupMoment: options.breakupMoments.includes(current.breakupMoment)
        ? current.breakupMoment
        : options.breakupMoments[0],
      breakupReason: options.breakupReasons.includes(current.breakupReason)
        ? current.breakupReason
        : options.breakupReasons[0]
    }));
  }, [options.breakupMoments, options.breakupReasons]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const localIssue = getLocalStoryInputIssue(form, locale);

    if (localIssue) {
      setError(localIssue.message);
      void trackEvent({
        eventName: "story_validation_error",
        metadata: { fieldId: localIssue.fieldId, locale, source: "client" }
      });
      document.getElementById(localIssue.fieldId)?.focus();
      return;
    }

    setIsSubmitting(true);
    void trackEvent({ eventName: "story_start", metadata: { page: "create" } });

    try {
      const response = await fetch("/api/story/generate-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...form, outputLanguage: locale })
      });
      const result = await response.json();

      if (!response.ok) {
        void trackEvent({
          eventName: "preview_failed",
          metadata: {
            hasIssues: Boolean(result.issues),
            locale,
            status: response.status
          }
        });
        setError(
          result.issues
            ? formatStoryInputIssues(result.issues, locale)
            : result.error ?? copy.generationError
        );
        return;
      }

      void trackEvent({
        eventName: "preview_generated",
        storyId: result.storyId,
        metadata: { desiredEnding: form.desiredEnding, emotion: form.emotion }
      });
      router.push(
        locale === "en"
          ? `/stories/${result.storyId}/preview?lang=en`
          : `/stories/${result.storyId}/preview`
      );
    } catch {
      void trackEvent({
        eventName: "preview_failed",
        metadata: { locale, reason: "network" }
      });
      setError(copy.networkError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-6">
        <header className="grid gap-2 pt-3">
          <div className="flex justify-end">
            <Link
              className="text-sm font-bold text-[color:var(--accent)]"
              href={languageHref}
            >
              {copy.otherLanguageLabel}
            </Link>
          </div>
          <p className="text-sm font-bold text-[color:var(--accent)]">
            {copy.eyebrow}
          </p>
          <h1 className="text-3xl font-black leading-tight">
            {copy.title}
          </h1>
          <p className="leading-7 text-[color:var(--muted)]">
            {copy.intro}
          </p>
        </header>

        <form className="panel grid gap-5 p-5" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="breakupMoment">{copy.breakupMoment}</label>
            <select
              id="breakupMoment"
              value={form.breakupMoment}
              onChange={(event) => update("breakupMoment", event.target.value)}
            >
              {options.breakupMoments.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="breakupReason">{copy.breakupReason}</label>
            <select
              id="breakupReason"
              value={form.breakupReason}
              onChange={(event) => update("breakupReason", event.target.value)}
            >
              {options.breakupReasons.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="alternativeChoice">
              {copy.alternativeChoice}
            </label>
            <textarea
              id="alternativeChoice"
              maxLength={600}
              minLength={5}
              placeholder={copy.alternativeChoicePlaceholder}
              value={form.alternativeChoice}
              onChange={(event) => update("alternativeChoice", event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-sm font-black text-[color:var(--accent)]">
              {copy.realismSection}
            </p>

            <div className="field">
              <label htmlFor="lastScenePlace">{copy.lastScenePlace}</label>
              <input
                id="lastScenePlace"
                maxLength={80}
                minLength={2}
                placeholder={copy.lastScenePlacePlaceholder}
                value={form.lastScenePlace}
                onChange={(event) => update("lastScenePlace", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="rememberedDetail">{copy.rememberedDetail}</label>
              <textarea
                id="rememberedDetail"
                maxLength={160}
                minLength={2}
                placeholder={copy.rememberedDetailPlaceholder}
                value={form.rememberedDetail}
                onChange={(event) => update("rememberedDetail", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="partnerBehavior">{copy.partnerBehavior}</label>
              <input
                id="partnerBehavior"
                maxLength={160}
                minLength={2}
                placeholder={copy.partnerBehaviorPlaceholder}
                value={form.partnerBehavior}
                onChange={(event) => update("partnerBehavior", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="emotion">{copy.emotion}</label>
              <select
                id="emotion"
                value={form.emotion}
                onChange={(event) => update("emotion", event.target.value)}
              >
                {options.emotions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="desiredEnding">{copy.desiredEnding}</label>
              <select
                id="desiredEnding"
                value={form.desiredEnding}
                onChange={(event) => update("desiredEnding", event.target.value)}
              >
                {options.endings.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="protagonistAlias">{copy.protagonistAlias}</label>
              <input
                id="protagonistAlias"
                maxLength={24}
                placeholder={copy.protagonistAliasPlaceholder}
                value={form.protagonistAlias}
                onChange={(event) => update("protagonistAlias", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="partnerAlias">{copy.partnerAlias}</label>
              <input
                id="partnerAlias"
                maxLength={24}
                placeholder={copy.partnerAliasPlaceholder}
                value={form.partnerAlias}
                onChange={(event) => update("partnerAlias", event.target.value)}
                required
              />
            </div>
          </div>

          <label className="flex gap-3 text-sm leading-6 text-[color:var(--muted)]">
            <input
              className="mt-1 h-4 w-4"
              type="checkbox"
              checked={form.agreedToFictionNotice}
              onChange={(event) =>
                update("agreedToFictionNotice", event.target.checked)
              }
              required
            />
            {copy.fictionNotice}
          </label>

          <label className="flex gap-3 text-sm leading-6 text-[color:var(--muted)]">
            <input
              className="mt-1 h-4 w-4"
              type="checkbox"
              checked={form.agreedToPrivacyNotice}
              onChange={(event) =>
                update("agreedToPrivacyNotice", event.target.checked)
              }
              required
            />
            {copy.privacyNotice}
          </label>

          {error ? (
            <div className="rounded-lg border border-[color:var(--danger)] bg-white p-3 text-sm leading-6 text-[color:var(--danger)]">
              {error}
            </div>
          ) : null}

          <button className="button-primary w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? copy.submitLoading : copy.submitIdle}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreatePageContent />
    </Suspense>
  );
}
