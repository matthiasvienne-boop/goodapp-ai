import { describe, expect, it } from "vitest";
import { metPromptCache } from "../../src/server/caching";

describe("metPromptCache", () => {
  it("voegt cache_control toe zonder het blok te wijzigen", () => {
    const blok = { type: "text", text: "een lange, stabiele systeemprompt" };
    const gecacht = metPromptCache(blok);
    expect(gecacht).toEqual({ ...blok, cache_control: { type: "ephemeral" } });
    expect(blok).not.toHaveProperty("cache_control");
  });
});
