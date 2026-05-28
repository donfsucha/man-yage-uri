"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const localIssue = getLocalStoryInputIssue(form);

    if (localIssue) {
      setError(localIssue.message);
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
        body: JSON.stringify(form)
      });
      const result = await response.json();

      if (!response.ok) {
        setError(
          result.issues
            ? formatStoryInputIssues(result.issues)
            : result.error ?? "1화 생성 중 문제가 발생했습니다."
        );
        return;
      }

      void trackEvent({
        eventName: "preview_generated",
        storyId: result.storyId,
        metadata: { desiredEnding: form.desiredEnding, emotion: form.emotion }
      });
      router.push(`/stories/${result.storyId}/preview`);
    } catch {
      setError("네트워크 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-6">
        <header className="grid gap-2 pt-3">
          <p className="text-sm font-bold text-[color:var(--accent)]">
            무료 1화로 시작
          </p>
          <h1 className="text-3xl font-black leading-tight">
            그날 하지 못한 말을 안전한 픽션으로 바꿔볼게요.
          </h1>
          <p className="leading-7 text-[color:var(--muted)]">
            실명 대신 별명이나 이니셜을 사용해 주세요. 전화번호, 주소, 직장명 같은
            개인정보는 입력하지 않는 것이 안전합니다.
          </p>
        </header>

        <form className="panel grid gap-5 p-5" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="breakupMoment">이별의 순간</label>
            <select
              id="breakupMoment"
              value={form.breakupMoment}
              onChange={(event) => update("breakupMoment", event.target.value)}
            >
              <option>마지막 통화</option>
              <option>마지막 만남</option>
              <option>읽씹으로 끝난 밤</option>
              <option>문자로 끝난 밤</option>
              <option>서로 아무 말도 못 한 순간</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="breakupReason">이별의 이유</label>
            <select
              id="breakupReason"
              value={form.breakupReason}
              onChange={(event) => update("breakupReason", event.target.value)}
            >
              <option>서로의 오해</option>
              <option>장거리</option>
              <option>권태기</option>
              <option>현실 문제</option>
              <option>타이밍이 맞지 않음</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="alternativeChoice">
              그때 다르게 하고 싶었던 말이나 행동
            </label>
            <textarea
              id="alternativeChoice"
              maxLength={600}
              minLength={5}
              placeholder="예: 화내지 않고 미안하다는 말을 먼저 꺼내고 싶었어."
              value={form.alternativeChoice}
              onChange={(event) => update("alternativeChoice", event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
            <p className="text-sm font-black text-[color:var(--accent)]">
              장면을 더 리얼하게 만드는 질문
            </p>

            <div className="field">
              <label htmlFor="lastScenePlace">마지막 장면의 장소</label>
              <input
                id="lastScenePlace"
                maxLength={80}
                minLength={2}
                placeholder="예: 비 오는 정류장, 동네 골목 입구, 마지막으로 앉았던 카페"
                value={form.lastScenePlace}
                onChange={(event) => update("lastScenePlace", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="rememberedDetail">아직 기억나는 작은 디테일</label>
              <textarea
                id="rememberedDetail"
                maxLength={160}
                minLength={2}
                placeholder="예: 젖은 운동화 끈, 식어버린 커피, 꺼지지 않던 휴대폰 화면"
                value={form.rememberedDetail}
                onChange={(event) => update("rememberedDetail", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="partnerBehavior">상대가 자주 보이던 말투나 행동</label>
              <input
                id="partnerBehavior"
                maxLength={160}
                minLength={2}
                placeholder="예: 화가 나면 대답보다 침묵이 먼저 길어지는 편"
                value={form.partnerBehavior}
                onChange={(event) => update("partnerBehavior", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="emotion">지금의 감정</label>
              <select
                id="emotion"
                value={form.emotion}
                onChange={(event) => update("emotion", event.target.value)}
              >
                <option value="regret">후회</option>
                <option value="longing">그리움</option>
                <option value="anger">분노</option>
                <option value="calm">담담함</option>
                <option value="gratitude">고마움</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="desiredEnding">원하는 결말 방향</label>
              <select
                id="desiredEnding"
                value={form.desiredEnding}
                onChange={(event) => update("desiredEnding", event.target.value)}
              >
                <option value="reunion">재회의 가능성</option>
                <option value="growth">각자의 성장</option>
                <option value="farewell">완전한 이별</option>
                <option value="parallel_world">평행세계</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="protagonistAlias">나의 별명</label>
              <input
                id="protagonistAlias"
                maxLength={24}
                placeholder="예: 나, A, 하린"
                value={form.protagonistAlias}
                onChange={(event) => update("protagonistAlias", event.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="partnerAlias">상대의 별명</label>
              <input
                id="partnerAlias"
                maxLength={24}
                placeholder="예: 그 사람, B"
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
            생성되는 내용은 실제 상대의 마음이나 미래를 예측하지 않는 픽션임을
            이해했습니다.
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
            실명, 연락처, 주소, 직장명 등 개인정보를 입력하지 않겠습니다.
          </label>

          {error ? (
            <div className="rounded-lg border border-[color:var(--danger)] bg-white p-3 text-sm leading-6 text-[color:var(--danger)]">
              {error}
            </div>
          ) : null}

          <button className="button-primary w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "1화 만드는 중" : "1화 무료 생성하기"}
          </button>
        </form>
      </section>
    </main>
  );
}
