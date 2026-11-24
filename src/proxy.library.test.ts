import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const admin = "Basic " + btoa("operator:test-password");
const get = (path: string, host = "ifwe.cnanfc.com", authorization?: string) =>
  proxy(new NextRequest(`https://${host}${path}`, {
    headers: { host, ...(authorization ? { authorization } : {}) },
  }));

afterEach(() => vi.unstubAllEnvs());

describe("private library route", () => {
  it("challenges anonymous and invalid credentials on both production hosts", () => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
    vi.stubEnv("ADMIN_USERNAME", "operator");
    for (const host of ["ifwe.cnanfc.com", "man-yage-uri.vercel.app"]) {
      for (const path of ["/library", "/library/", "/library/export", "/%6cibrary", "/library?_rsc=1"]) {
        for (const authorization of [undefined, "Basic broken", "Basic " + btoa("wrong:test-password")]) {
          const response = get(path, host, authorization);
          expect(response.status).toBe(401);
          expect(response.headers.get("www-authenticate")).toContain("IfWe Admin");
          expect(response.headers.get("cache-control")).toBe("private, no-store");
        }
      }
    }
  });
  it("allows only configured admins and marks successful responses private", () => {
    vi.stubEnv("ADMIN_PASSWORD", "test-password");
    vi.stubEnv("ADMIN_USERNAME", "operator");
    const response = get("/library", undefined, admin);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });
  it("fails closed without ADMIN_PASSWORD and leaves existing public routes alone", () => {
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(get("/library", undefined, admin).status).toBe(503);
    for (const path of ["/l/suwon", "/l/5", "/b", "/start", "/create", "/stories/example", "/libraryish"]) {
      const response = get(path);
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("www-authenticate")).toBeNull();
    }
  });
});
