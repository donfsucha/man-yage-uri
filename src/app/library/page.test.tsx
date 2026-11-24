import { afterEach, expect, it, vi } from "vitest";
const { getStories, getHeaders, notFound } = vi.hoisted(() => ({
  getStories: vi.fn(async () => []),
  getHeaders: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }),
}));
vi.mock("next/headers", () => ({ headers: getHeaders }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/story/persistence", () => ({ getStories }));
import LibraryPage from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("does not touch the store on a direct unauthorized render", async () => {
  vi.stubEnv("ADMIN_PASSWORD", "test-password");
  getHeaders.mockResolvedValue(new Headers());
  await expect(LibraryPage()).rejects.toThrow("NOT_FOUND");
  expect(getStories).not.toHaveBeenCalled();
});
it("uses the store once when the administrator is authenticated", async () => {
  vi.stubEnv("ADMIN_PASSWORD", "test-password");
  getHeaders.mockResolvedValue(new Headers({authorization: "Basic " + btoa("admin:test-password")}));
  await expect(LibraryPage()).resolves.toBeDefined();
  expect(getStories).toHaveBeenCalledOnce();
});
