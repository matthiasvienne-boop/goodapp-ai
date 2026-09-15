import { describe, expect, it } from "vitest";
import { schatKosten, STANDAARD_PRIJSTABEL } from "../../src/server/usage";

describe("schatKosten", () => {
  it("schat sonnet volgens de standaardtabel", () => {
    const kost = schatKosten({ model: "claude-sonnet-4-6", inputTokens: 1_000_000, outputTokens: 1_000_000 });
    expect(kost).toBe(3 + 15);
  });

  it("schat haiku volgens de standaardtabel", () => {
    const kost = schatKosten({
      model: "claude-haiku-4-5-20251001",
      inputTokens: 2_000_000,
      outputTokens: 0,
    });
    expect(kost).toBe(2);
  });

  it("schat opus volgens de standaardtabel", () => {
    const kost = schatKosten({ model: "claude-opus-5", inputTokens: 0, outputTokens: 1_000_000 });
    expect(kost).toBe(75);
  });

  it("geeft undefined zonder tokentelling", () => {
    expect(schatKosten({ model: "claude-sonnet-4-6" })).toBeUndefined();
  });

  it("geeft undefined voor een model buiten de tabel", () => {
    expect(schatKosten({ model: "claude-fable-5-1", inputTokens: 100, outputTokens: 100 })).toBeUndefined();
  });

  it("aanvaardt een eigen prijstabel in plaats van de standaard", () => {
    const eigenTabel = [{ patroon: /fable/i, inputUsd: 1, outputUsd: 2 }];
    const kost = schatKosten(
      { model: "claude-fable-5-1", inputTokens: 1_000_000, outputTokens: 1_000_000 },
      eigenTabel
    );
    expect(kost).toBe(3);
  });

  it("de standaardtabel dekt sonnet, haiku en opus, en niets anders", () => {
    expect(STANDAARD_PRIJSTABEL).toHaveLength(3);
  });
});
