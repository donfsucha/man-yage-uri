import Link from "next/link";
import { EventTracker } from "@/components/event-tracker";

const sampleSteps = [
  "이별의 마지막 장면을 짧게 고릅니다",
  "그때 하지 못한 말이나 선택을 적습니다",
  "1화를 무료로 읽고 다음 결말을 선택합니다"
];

const sampleStories = [
  "재회형: 서로가 놓친 마음을 조심스럽게 다시 마주하는 이야기",
  "성장형: 붙잡는 대신 나를 회복하는 방향으로 끝나는 이야기",
  "평행세계형: 그날 다른 선택을 했다면 펼쳐졌을 또 하나의 이야기"
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <EventTracker eventName="landing_view" metadata={{ page: "home" }} />
      <section className="mobile-frame grid gap-8 pt-6">
        <nav className="flex items-center justify-between text-sm">
          <span className="font-bold">만약의 우리</span>
          <Link className="text-[color:var(--muted)]" href="/library">
            보관함
          </Link>
        </nav>

        <div className="grid gap-5">
          <div className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]">
            <div className="grid min-h-[210px] place-items-center bg-[linear-gradient(135deg,#2f6f68,#efe6dc_52%,#8f4f43)] px-8 text-center">
              <div className="grid gap-3 text-white">
                <p className="text-sm font-bold opacity-90">
                  IF WE HAD CHOSEN DIFFERENTLY
                </p>
                <h1 className="text-4xl font-black leading-tight">만약의 우리</h1>
                <p className="text-base leading-7 opacity-95">
                  그날 내가 다르게 말했다면, 우리는 어떤 결말을 맞았을까요?
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <h2 className="text-3xl font-black leading-tight">
              전 연인에게 연락하기 전에, 우리의 다른 결말을 먼저 읽어보세요.
            </h2>
            <p className="text-base leading-7 text-[color:var(--muted)]">
              보내지 못한 마음을 안전한 5화짜리 픽션으로 정리합니다. 실제 상대의
              마음이나 미래를 예측하지 않고, 사용자가 입력한 장면을 바탕으로 1화를
              무료로 생성합니다.
            </p>
          </div>

          <Link className="button-primary w-full" href="/create">
            1화 무료로 만들기
          </Link>
        </div>

        <section className="grid gap-3">
          {sampleSteps.map((step, index) => (
            <div
              className="flex items-center gap-3 rounded-lg border border-[color:var(--border)] bg-white/80 p-4"
              key={step}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[color:var(--accent)] text-sm font-bold text-white">
                {index + 1}
              </span>
              <span className="font-semibold">{step}</span>
            </div>
          ))}
        </section>

        <section className="grid gap-3">
          <h2 className="text-xl font-black">테스트할 수 있는 결말 방향</h2>
          {sampleStories.map((sample) => (
            <div
              className="rounded-lg border border-[color:var(--border)] bg-white/80 p-4 font-semibold leading-7"
              key={sample}
            >
              {sample}
            </div>
          ))}
        </section>

        <section className="notice">
          생성되는 내용은 실제 인물의 마음이나 미래를 예측하지 않는 픽션입니다.
          연락, 감시, 집착, 행동을 유도하지 않으며 감정을 안전하게 정리하기 위한
          개인 콘텐츠로 제공합니다.
        </section>
      </section>
    </main>
  );
}
