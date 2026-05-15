import Link from "next/link";

const sampleSteps = [
  "마지막 장면을 고릅니다",
  "그때 하지 못한 선택을 적습니다",
  "1화를 무료로 읽고 다음 전개를 선택합니다"
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-8 pt-6">
        <nav className="flex items-center justify-between text-sm">
          <span className="font-bold">만약에 우리</span>
          <span className="text-[color:var(--muted)]">AI 픽션 웹소설</span>
        </nav>

        <div className="grid gap-5">
          <div className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]">
            <div className="grid min-h-[210px] place-items-center bg-[linear-gradient(135deg,#2f6f68,#efe6dc_52%,#8f4f43)] px-8 text-center">
              <div className="grid gap-3 text-white">
                <p className="text-sm font-bold opacity-90">IF WE HAD CHOSEN DIFFERENTLY</p>
                <h1 className="text-4xl font-black leading-tight">만약에 우리</h1>
                <p className="text-base leading-7 opacity-95">
                  끝난 장면에서 다른 선택을 했다면, 이야기는 어디로 흘러갔을까요.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <h2 className="text-3xl font-black leading-tight">
              헤어진 순간을 감정 정리형 웹소설로 바꿉니다.
            </h2>
            <p className="text-base leading-7 text-[color:var(--muted)]">
              실제 상대의 마음을 예측하지 않습니다. 사용자의 입력을 바탕으로 만든
              개인화 픽션으로, 1화는 무료로 생성됩니다.
            </p>
          </div>

          <Link className="button-primary w-full" href="/create">
            나의 1화 무료로 만들기
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

        <section className="notice">
          생성 콘텐츠는 실제 인물의 마음이나 미래를 예측하지 않는 픽션입니다.
          전 연인에게 연락하거나 행동을 유도하기 위한 서비스가 아니며, 안전한
          감정 정리를 돕는 개인 콘텐츠로 제공됩니다.
        </section>
      </section>
    </main>
  );
}
