"use client";

import { FormEvent, useState } from "react";

export function DeleteDataForm() {
  const [storyId, setStoryId] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/user/delete-data", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storyId })
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error ?? "삭제 요청을 처리하지 못했습니다.");
        return;
      }

      setStoryId("");
      setMessage("스토리 데이터가 삭제되었습니다.");
    } catch {
      setMessage("네트워크 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="panel grid gap-4 p-5" onSubmit={submit}>
      <div className="field">
        <label htmlFor="storyId">스토리 ID</label>
        <input
          id="storyId"
          placeholder="보관함 또는 URL의 ID를 입력하세요"
          value={storyId}
          onChange={(event) => setStoryId(event.target.value)}
          required
        />
      </div>
      {message ? <div className="notice">{message}</div> : null}
      <button className="button-primary w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "삭제 처리 중" : "데이터 삭제 요청"}
      </button>
    </form>
  );
}
