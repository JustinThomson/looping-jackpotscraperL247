import { describe, expect, it } from "vitest";
import { clientKey, rateLimit } from "@/lib/server/rate-limit";

const req = (headers: Record<string, string>) => new Request("http://x/api", { method: "POST", headers });

describe("rate limiter", () => {
  it("ignores spoofable left-most X-Forwarded-For entries", () => {
    expect(clientKey(req({ "x-forwarded-for": "9.9.9.9, 1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientKey(req({ "x-forwarded-for": "9.9.9.10, 1.2.3.4" }))).toBe("1.2.3.4");
    expect(clientKey(req({ "x-real-ip": "5.6.7.8", "x-forwarded-for": "9.9.9.9" }))).toBe("5.6.7.8");
  });

  it("limits after N requests per window", () => {
    const h = { "x-real-ip": "10.0.0.1" };
    for (let i = 0; i < 3; i++) expect(rateLimit(req(h), "t", 3)).toBeNull();
    expect(rateLimit(req(h), "t", 3)?.status).toBe(429);
  });
});
