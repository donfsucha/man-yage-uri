"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MockPaymentActionProps = {
  storyId: string;
};

export function MockPaymentAction({ storyId }: MockPaymentActionProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function confirmPayment() {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payment/mock-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storyId })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "결제 승인 처리에 실패했습니다.");
        return;
      }

      router.push(`/stories/${storyId}`);
    } catch {
      setError("네트워크 상태를 확인한 뒤 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-3">
      <button
        className="button-primary w-full"
        disabled={isSubmitting}
        onClick={confirmPayment}
        type="button"
      >
        {isSubmitting ? "5화 완결 생성 중" : "모의 결제 승인하고 5화 생성하기"}
      </button>
      {error ? (
        <div className="rounded-lg border border-[color:var(--danger)] bg-white p-3 text-sm leading-6 text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}
