const ADMIN_REALM = "IfWe Admin";

export const privateLibraryHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

/** Reuse the existing IfWe administrator credentials; fail closed when absent. */
export function getAdminAccess(authorization: string | null): "allowed" | "unauthorized" | "unconfigured" {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) return "unconfigured";
  if (!authorization?.startsWith("Basic ")) return "unauthorized";

  const configuredAdminUsername = process.env.ADMIN_USERNAME?.trim();
  try {
    const decoded = atob(authorization.slice("Basic ".length));
    const separator = decoded.indexOf(":");
    if (separator < 0) return "unauthorized";
    const username = decoded.slice(0, separator).trim();
    const password = decoded.slice(separator + 1).trim();
    return (username === "admin" || username === configuredAdminUsername) && password === adminPassword
      ? "allowed"
      : "unauthorized";
  } catch {
    return "unauthorized";
  }
}

export function libraryAuthHeaders(challenge: boolean): Record<string, string> {
  return challenge
    ? { ...privateLibraryHeaders, "WWW-Authenticate": 'Basic realm="' + ADMIN_REALM + '", charset="UTF-8"' }
    : privateLibraryHeaders;
}
