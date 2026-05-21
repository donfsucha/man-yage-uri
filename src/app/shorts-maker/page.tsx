"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ShortsMakerInput, ShortsPackage } from "@/lib/shorts/schema";

type GenerateResponse = {
  package?: ShortsPackage;
  warning?: string;
  error?: string;
};

const statusOptions = [
  {
    value: "play_store_update_pending",
    label: "플레이스토어 정보 업데이트 신청 중"
  },
  { value: "launch_preparing", label: "공식 출시 준비 단계" },
  { value: "officially_launched", label: "플레이스토어 정식 출시 완료" }
] as const;

const audienceOptions = [
  { value: "seniors_parents", label: "부모님/시니어" },
  { value: "church_teams", label: "교회 담당자" },
  { value: "ordinary_believers", label: "일반 성도" },
  { value: "gift_buyers", label: "선물 구매자" }
] as const;

const purposeOptions = [
  { value: "launch_notice", label: "출시 알림" },
  { value: "product_explainer", label: "제품 설명" },
  { value: "usage_guide", label: "사용법 안내" },
  { value: "church_adoption", label: "교회 도입 문의" },
  { value: "parent_empathy", label: "부모님 공감" }
] as const;

const lengthOptions = [
  { value: "15s", label: "15초" },
  { value: "30s", label: "30초" },
  { value: "45s", label: "45초" }
] as const;

const toneOptions = [
  { value: "warm", label: "따뜻하게" },
  { value: "trustworthy", label: "신뢰감 있게" },
  { value: "simple_friendly", label: "쉽고 친근하게" },
  { value: "church_proposal", label: "교회 제안서 톤" }
] as const;

const initialInput: ShortsMakerInput = {
  productStatus: "play_store_update_pending",
  audience: "seniors_parents",
  purpose: "launch_notice",
  length: "30s",
  tone: "warm",
  memo: ""
};

function listText(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function storyboardText(storyboard: ShortsPackage["storyboard"]) {
  return storyboard
    .map(
      (scene) =>
        `${scene.scene}. ${scene.visual}\n내레이션: ${scene.narration}\n자막: ${scene.onScreenText}`
    )
    .join("\n\n");
}

function fullPackageText(pkg: ShortsPackage) {
  return [
    "[후킹 문장]",
    listText(pkg.hooks),
    "",
    "[대본]",
    pkg.script,
    "",
    "[자막]",
    listText(pkg.subtitles),
    "",
    "[콘티]",
    storyboardText(pkg.storyboard),
    "",
    "[촬영 체크리스트]",
    listText(pkg.shotList),
    "",
    "[제목]",
    listText(pkg.titleOptions),
    "",
    "[홍보글]",
    pkg.caption,
    "",
    "[해시태그]",
    pkg.hashtags.join(" "),
    "",
    "[CTA]",
    listText(pkg.ctaOptions),
    "",
    "[썸네일 문구]",
    listText(pkg.thumbnailTextOptions),
    "",
    "[게시 전 검수]",
    listText(pkg.reviewChecklist)
  ].join("\n");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      className="button-secondary min-h-10 px-3 text-sm"
      onClick={copy}
      type="button"
    >
      {copied ? "복사됨" : "복사"}
    </button>
  );
}

function OutputSection({
  title,
  children,
  copyText
}: {
  title: string;
  children: React.ReactNode;
  copyText: string;
}) {
  return (
    <section className="panel grid gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        <CopyButton text={copyText} />
      </div>
      {children}
    </section>
  );
}

function OptionSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange
}: {
  id: string;
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ShortsMakerPage() {
  const [input, setInput] = useState<ShortsMakerInput>(initialInput);
  const [result, setResult] = useState<ShortsPackage | null>(null);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fullText = useMemo(() => {
    if (!result) {
      return "";
    }

    return fullPackageText(result);
  }, [result]);

  function updateInput<Key extends keyof ShortsMakerInput>(
    key: Key,
    value: ShortsMakerInput[Key]
  ) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setWarning("");

    try {
      const response = await fetch("/api/shorts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok || !payload.package) {
        throw new Error(payload.error ?? "숏폼 문안을 생성하지 못했습니다.");
      }

      setResult(payload.package);
      setWarning(payload.warning ?? "");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "숏폼 문안을 생성하지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="grid gap-6 pt-4">
        <header className="grid gap-2">
          <p className="text-sm font-bold text-[color:var(--accent)]">
            CNA 내부 제작 도구
          </p>
          <h1 className="text-3xl font-black leading-tight">
            성경통독 거치대야 숏폼 메이커
          </h1>
          <p className="max-w-3xl leading-7 text-[color:var(--muted)]">
            타깃과 목적만 고르면 대본, 자막, 홍보글, 해시태그, 콘티를
            검수 가능한 형태로 자동완성합니다.
          </p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <form className="panel grid gap-4 self-start p-4" onSubmit={generate}>
            <OptionSelect
              id="productStatus"
              label="제품 상태"
              onChange={(value) => updateInput("productStatus", value)}
              options={statusOptions}
              value={input.productStatus}
            />
            <OptionSelect
              id="audience"
              label="타깃"
              onChange={(value) => updateInput("audience", value)}
              options={audienceOptions}
              value={input.audience}
            />
            <OptionSelect
              id="purpose"
              label="목적"
              onChange={(value) => updateInput("purpose", value)}
              options={purposeOptions}
              value={input.purpose}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <OptionSelect
                id="length"
                label="길이"
                onChange={(value) => updateInput("length", value)}
                options={lengthOptions}
                value={input.length}
              />
              <OptionSelect
                id="tone"
                label="톤"
                onChange={(value) => updateInput("tone", value)}
                options={toneOptions}
                value={input.tone}
              />
            </div>
            <div className="field">
              <label htmlFor="memo">추가 메모</label>
              <textarea
                id="memo"
                maxLength={600}
                onChange={(event) => updateInput("memo", event.target.value)}
                placeholder="오늘 꼭 넣고 싶은 문구, 촬영 상황, 강조할 타깃을 적어주세요."
                value={input.memo ?? ""}
              />
            </div>
            <button className="button-primary w-full" disabled={loading}>
              {loading ? "생성 중" : "숏폼 문안 생성"}
            </button>
            <p className="notice">
              현재 기본 상태는 플레이스토어 정보 업데이트 신청 중입니다.
              개발자명과 승인 상태가 바뀐 뒤에만 정식 출시 표현을 선택하세요.
            </p>
          </form>

          <section className="grid gap-4">
            {error ? (
              <div className="panel border-[color:var(--danger)] p-4 font-bold text-[color:var(--danger)]">
                {error}
              </div>
            ) : null}

            {warning ? <div className="notice">{warning}</div> : null}

            {!result ? (
              <div className="panel grid min-h-[420px] place-items-center p-6 text-center">
                <div className="grid max-w-md gap-3">
                  <h2 className="text-2xl font-black">
                    오늘 올릴 숏폼을 바로 뽑아보세요
                  </h2>
                  <p className="leading-7 text-[color:var(--muted)]">
                    첫 결과는 검수용 초안입니다. 실제 게시 전에는
                    플레이스토어 상태, 화면 개인정보, 음악과 이미지 권리를
                    확인하세요.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <section className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-bold text-[color:var(--muted)]">
                      생성 완료
                    </p>
                    <p className="font-black">
                      전체 패키지를 복사해서 편집자나 게시 담당자에게 넘길 수
                      있습니다.
                    </p>
                  </div>
                  <CopyButton text={fullText} />
                </section>

                <OutputSection
                  copyText={listText(result.hooks)}
                  title="후킹 문장"
                >
                  <ul className="grid gap-2">
                    {result.hooks.map((hook) => (
                      <li className="rounded-lg bg-[color:var(--surface-strong)] p-3 font-bold" key={hook}>
                        {hook}
                      </li>
                    ))}
                  </ul>
                </OutputSection>

                <OutputSection copyText={result.script} title="대본">
                  <pre className="whitespace-pre-wrap rounded-lg bg-[#191817] p-4 leading-7 text-white">
                    {result.script}
                  </pre>
                </OutputSection>

                <OutputSection
                  copyText={listText(result.subtitles)}
                  title="화면 자막"
                >
                  <ol className="grid gap-2">
                    {result.subtitles.map((subtitle, index) => (
                      <li className="flex gap-3" key={`${subtitle}-${index}`}>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[color:var(--accent)] text-sm font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="pt-1 font-semibold">{subtitle}</span>
                      </li>
                    ))}
                  </ol>
                </OutputSection>

                <OutputSection
                  copyText={storyboardText(result.storyboard)}
                  title="장면별 콘티"
                >
                  <div className="grid gap-3">
                    {result.storyboard.map((scene) => (
                      <article className="rounded-lg border border-[color:var(--border)] bg-white p-4" key={scene.scene}>
                        <p className="text-sm font-black text-[color:var(--accent)]">
                          Scene {scene.scene}
                        </p>
                        <p className="mt-2 font-bold">{scene.visual}</p>
                        <p className="mt-2 leading-7 text-[color:var(--muted)]">
                          {scene.narration}
                        </p>
                        <p className="mt-3 rounded-lg bg-[color:var(--surface-strong)] p-3 font-bold">
                          {scene.onScreenText}
                        </p>
                      </article>
                    ))}
                  </div>
                </OutputSection>

                <OutputSection copyText={result.caption} title="홍보글">
                  <p className="whitespace-pre-wrap leading-7">{result.caption}</p>
                </OutputSection>

                <OutputSection
                  copyText={result.hashtags.join(" ")}
                  title="해시태그"
                >
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags.map((hashtag) => (
                      <span className="rounded-lg bg-[color:var(--surface-strong)] px-3 py-2 text-sm font-bold" key={hashtag}>
                        {hashtag}
                      </span>
                    ))}
                  </div>
                </OutputSection>

                <div className="grid gap-4 md:grid-cols-2">
                  <OutputSection
                    copyText={listText(result.titleOptions)}
                    title="제목 후보"
                  >
                    <ul className="grid gap-2 font-semibold">
                      {result.titleOptions.map((title) => (
                        <li key={title}>{title}</li>
                      ))}
                    </ul>
                  </OutputSection>
                  <OutputSection
                    copyText={listText(result.thumbnailTextOptions)}
                    title="썸네일 문구"
                  >
                    <ul className="grid gap-2 font-semibold">
                      {result.thumbnailTextOptions.map((text) => (
                        <li key={text}>{text}</li>
                      ))}
                    </ul>
                  </OutputSection>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <OutputSection
                    copyText={listText(result.shotList)}
                    title="촬영 체크리스트"
                  >
                    <ul className="grid gap-2">
                      {result.shotList.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </OutputSection>
                  <OutputSection
                    copyText={listText(result.reviewChecklist)}
                    title="게시 전 검수"
                  >
                    <ul className="grid gap-2">
                      {result.reviewChecklist.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </OutputSection>
                </div>

                <OutputSection
                  copyText={listText(result.ctaOptions)}
                  title="CTA 문구"
                >
                  <ul className="grid gap-2 font-semibold">
                    {result.ctaOptions.map((cta) => (
                      <li key={cta}>{cta}</li>
                    ))}
                  </ul>
                </OutputSection>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
