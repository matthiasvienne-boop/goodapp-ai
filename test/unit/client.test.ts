import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { aiClient, vergeetAiClient, beoordeelAanroep, STANDAARD_TIMEOUT_MS, STANDAARD_MAX_RETRIES } from "../../src/server/client";

const ENV_VAR = "GOODAPP_AI_TEST_KEY";

describe("aiClient", () => {
  beforeEach(() => vergeetAiClient());
  afterEach(() => {
    delete process.env[ENV_VAR];
    vergeetAiClient();
  });

  it("geeft null zonder sleutel", () => {
    expect(aiClient(ENV_VAR)).toBeNull();
  });

  it("geeft null bij een lege sleutel", () => {
    process.env[ENV_VAR] = "   ";
    expect(aiClient(ENV_VAR)).toBeNull();
  });

  it("geeft dezelfde client terug bij een ongewijzigde sleutel", () => {
    process.env[ENV_VAR] = "sk-test-1";
    const eerste = aiClient(ENV_VAR);
    const tweede = aiClient(ENV_VAR);
    expect(eerste).not.toBeNull();
    expect(eerste).toBe(tweede);
  });

  it("bouwt een nieuwe client wanneer de sleutel wijzigt", () => {
    process.env[ENV_VAR] = "sk-test-1";
    const eerste = aiClient(ENV_VAR);
    process.env[ENV_VAR] = "sk-test-2";
    const tweede = aiClient(ENV_VAR);
    expect(eerste).not.toBe(tweede);
  });

  it("vergeetAiClient dwingt een nieuwe client af", () => {
    process.env[ENV_VAR] = "sk-test-1";
    const eerste = aiClient(ENV_VAR);
    vergeetAiClient();
    const tweede = aiClient(ENV_VAR);
    expect(eerste).not.toBe(tweede);
  });
});

describe("aiClient: timeout en retries (PLAT-207)", () => {
  beforeEach(() => vergeetAiClient());
  afterEach(() => {
    delete process.env[ENV_VAR];
    vergeetAiClient();
  });

  it("geeft standaard een expliciete, eindige timeout en retrygrens", () => {
    process.env[ENV_VAR] = "sk-test-1";
    const client = aiClient(ENV_VAR);
    expect(client?.timeout).toBe(STANDAARD_TIMEOUT_MS);
    expect(client?.maxRetries).toBe(STANDAARD_MAX_RETRIES);
    // De SDK-standaard is 10 minuten; een hangende provider mag een verzoek niet langer vasthouden dan dit.
    expect(STANDAARD_TIMEOUT_MS).toBeLessThan(10 * 60 * 1000);
  });

  it("laat de aanroeper een kortere timeout en eigen retries kiezen", () => {
    process.env[ENV_VAR] = "sk-test-1";
    const client = aiClient(ENV_VAR, { timeoutMs: 20_000, maxRetries: 0 });
    expect(client?.timeout).toBe(20_000);
    expect(client?.maxRetries).toBe(0);
  });

  it("geeft dezelfde client bij dezelfde opties en een andere bij andere opties", () => {
    process.env[ENV_VAR] = "sk-test-1";
    const a = aiClient(ENV_VAR, { timeoutMs: 20_000 });
    const b = aiClient(ENV_VAR, { timeoutMs: 20_000 });
    const c = aiClient(ENV_VAR, { timeoutMs: 40_000 });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(c?.timeout).toBe(40_000);
  });

  it("weigert een timeout of retrygrens die geen zin heeft", () => {
    process.env[ENV_VAR] = "sk-test-1";
    expect(() => aiClient(ENV_VAR, { timeoutMs: 0 })).toThrow(/timeoutMs/);
    expect(() => aiClient(ENV_VAR, { timeoutMs: -5 })).toThrow(/timeoutMs/);
    expect(() => aiClient(ENV_VAR, { maxRetries: -1 })).toThrow(/maxRetries/);
  });

  it("zonder sleutel blijft het null, ook met opties", () => {
    expect(aiClient(ENV_VAR, { timeoutMs: 20_000 })).toBeNull();
  });
});

describe("beoordeelAanroep", () => {
  beforeEach(() => vergeetAiClient());
  afterEach(() => {
    delete process.env[ENV_VAR];
    vergeetAiClient();
  });

  it("meldt niet_geconfigureerd zonder sleutel", () => {
    const uitkomst = beoordeelAanroep({ apiKeyEnvVar: ENV_VAR });
    expect(uitkomst).toEqual({
      reden: "niet_geconfigureerd",
      toelichting: `${ENV_VAR} ontbreekt op deze omgeving. Een beheerder moet die instellen.`,
    });
  });

  it("meldt te_groot vóór de configuratiecontrole", () => {
    const uitkomst = beoordeelAanroep({
      apiKeyEnvVar: ENV_VAR,
      payloadBytes: 11 * 1024 * 1024,
      maxPayloadBytes: 10 * 1024 * 1024,
    });
    expect(uitkomst).toEqual({
      reden: "te_groot",
      toelichting: "De payload is 11.0 MB; de grens ligt op 10.0 MB.",
      bytes: 11 * 1024 * 1024,
      maxBytes: 10 * 1024 * 1024,
    });
  });

  it("geeft null wanneer alles in orde is", () => {
    process.env[ENV_VAR] = "sk-test-1";
    const uitkomst = beoordeelAanroep({
      apiKeyEnvVar: ENV_VAR,
      payloadBytes: 1024,
      maxPayloadBytes: 10 * 1024 * 1024,
    });
    expect(uitkomst).toBeNull();
  });

  it("geeft null zonder groottegrens, met een geldige sleutel", () => {
    process.env[ENV_VAR] = "sk-test-1";
    expect(beoordeelAanroep({ apiKeyEnvVar: ENV_VAR })).toBeNull();
  });
});
