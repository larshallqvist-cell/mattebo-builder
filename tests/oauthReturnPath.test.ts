import { describe, expect, test } from "bun:test";
import { consentReturnPath, oauthReturnPath } from "../src/lib/oauth-return-path";

describe("OAuth return path", () => {
  test("keeps the consent page with its authorization id", () => {
    expect(consentReturnPath("/.lovable/oauth/consent?authorization_id=abc")).toBe("/.lovable/oauth/consent?authorization_id=abc");
  });
  test("rejects external and odd paths", () => {
    expect(oauthReturnPath("//evil.example")).toBe("/");
    expect(oauthReturnPath("/\\evil.example")).toBe("/");
    expect(oauthReturnPath("https://evil.example")).toBe("/");
    expect(consentReturnPath("/admin")).toBeNull();
    expect(consentReturnPath("//evil.example/.lovable/oauth/consent?x=1")).toBeNull();
  });
});
