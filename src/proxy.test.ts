import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { proxy } from "./proxy";

const originalAdminPassword = process.env.ADMIN_PASSWORD;
const originalAdminUsername = process.env.ADMIN_USERNAME;

function makeRequest(path: string, authorization?: string) {
  return new NextRequest(`https://ifwe.cnanfc.com${path}`, {
    headers: authorization ? { authorization } : {}
  });
}

function basicAuth(username: string, password: string) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

afterEach(() => {
  process.env.ADMIN_PASSWORD = originalAdminPassword;
  process.env.ADMIN_USERNAME = originalAdminUsername;
});

describe("proxy admin protection", () => {
  it("blocks admin when ADMIN_PASSWORD is not configured", () => {
    delete process.env.ADMIN_PASSWORD;

    const response = proxy(makeRequest("/admin"));

    expect(response.status).toBe(503);
  });

  it("requires basic auth for admin paths", () => {
    process.env.ADMIN_PASSWORD = "secret-password";

    const response = proxy(makeRequest("/admin"));

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain("IfWe Admin");
  });

  it("allows admin with matching credentials", () => {
    process.env.ADMIN_USERNAME = "owner";
    process.env.ADMIN_PASSWORD = "secret-password";

    const response = proxy(
      makeRequest("/admin", basicAuth("owner", "secret-password"))
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps the default admin username available even if ADMIN_USERNAME differs", () => {
    process.env.ADMIN_USERNAME = "owner";
    process.env.ADMIN_PASSWORD = "secret-password";

    const response = proxy(
      makeRequest("/admin", basicAuth("admin", "secret-password"))
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
