import { describe, expect, it } from "vitest";
import { parseConfig } from "@/server/platform/config";

describe("parseConfig", () => {
  it("keeps ads off unless the environment is production and ADS_ENABLED is exactly 'true'", () => {
    expect(parseConfig({ APP_ENV: "production", ADS_ENABLED: "true" }).adsEnabled).toBe(true);
    expect(parseConfig({ APP_ENV: "production", ADS_ENABLED: "false" }).adsEnabled).toBe(false);
    expect(parseConfig({ APP_ENV: "production", ADS_ENABLED: "TRUE" }).adsEnabled).toBe(false);
    expect(parseConfig({ APP_ENV: "production" }).adsEnabled).toBe(false);
    expect(parseConfig({ APP_ENV: "preview", ADS_ENABLED: "true" }).adsEnabled).toBe(false);
    expect(parseConfig({ APP_ENV: "local", ADS_ENABLED: "true" }).adsEnabled).toBe(false);
    expect(parseConfig({ ADS_ENABLED: "true" }).adsEnabled).toBe(false);
  });

  it("treats an unknown environment name as local", () => {
    expect(parseConfig({ APP_ENV: "prod" }).appEnv).toBe("local");
    expect(parseConfig({}).appEnv).toBe("local");
  });

  it("accepts only absolute http(s) site URLs and drops the trailing slash", () => {
    expect(parseConfig({ PUBLIC_SITE_URL: "https://example.org/" }).publicSiteUrl).toBe("https://example.org");
    expect(parseConfig({ PUBLIC_SITE_URL: "http://localhost:5173" }).publicSiteUrl).toBe("http://localhost:5173");
    expect(parseConfig({ PUBLIC_SITE_URL: "" }).publicSiteUrl).toBeNull();
    expect(parseConfig({ PUBLIC_SITE_URL: "example.org" }).publicSiteUrl).toBeNull();
    expect(parseConfig({ PUBLIC_SITE_URL: "javascript:alert(1)" }).publicSiteUrl).toBeNull();
  });
});
