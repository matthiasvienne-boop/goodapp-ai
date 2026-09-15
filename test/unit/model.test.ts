import { describe, expect, it, afterEach } from "vitest";
import { modelConstant } from "../../src/server/model";

describe("modelConstant", () => {
  const envVar = "GOODAPP_AI_TEST_MODEL";

  afterEach(() => {
    delete process.env[envVar];
  });

  it("gebruikt de terugval wanneer de omgevingsvariabele ontbreekt", () => {
    expect(modelConstant(envVar, "claude-haiku-4-5-20251001")).toBe("claude-haiku-4-5-20251001");
  });

  it("gebruikt de terugval wanneer de omgevingsvariabele leeg is", () => {
    process.env[envVar] = "   ";
    expect(modelConstant(envVar, "claude-haiku-4-5-20251001")).toBe("claude-haiku-4-5-20251001");
  });

  it("geeft voorrang aan de omgevingsvariabele", () => {
    process.env[envVar] = "claude-opus-5";
    expect(modelConstant(envVar, "claude-haiku-4-5-20251001")).toBe("claude-opus-5");
  });
});
