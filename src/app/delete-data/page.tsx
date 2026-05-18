import Link from "next/link";
import { DeleteDataForm } from "./delete-data-form";

export default function DeleteDataPage() {
  return (
    <main className="page-shell">
      <section className="mobile-frame grid gap-6 pt-4">
        <header className="grid gap-2">
          <Link className="text-sm font-bold text-[color:var(--accent)]" href="/library">
            보관함으로 돌아가기
          </Link>
          <h1 className="text-3xl font-black leading-tight">데이터 삭제 요청</h1>
          <p className="leading-7 text-[color:var(--muted)]">
            V1 데모에서는 스토리 ID 기준으로 저장된 데이터를 삭제합니다. 실제 운영
            단계에서는 로그인 계정, 이메일 확인, 처리 이력을 함께 남기는 흐름으로
            확장합니다.
          </p>
        </header>
        <DeleteDataForm />
      </section>
    </main>
  );
}
