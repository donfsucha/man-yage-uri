import { beforeEach, describe, expect, it, vi } from "vitest";
import { notFound, redirect } from "next/navigation";
import QtEntryPage from "./page";

vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("not found"); }), redirect: vi.fn() }));

describe("numbered content entry", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each(["1", "2", "3", "4", "5"])("opens the recognized playback route for %s", async (content) => {
    await QtEntryPage({ params: Promise.resolve({ content }) });
    expect(redirect).toHaveBeenCalledWith(`/l/${content}`);
  });
  it("rejects invalid and inherited property names", async () => {
    await expect(QtEntryPage({ params: Promise.resolve({ content: "toString" }) })).rejects.toThrow("not found");
    expect(notFound).toHaveBeenCalled();
  });
});
