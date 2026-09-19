// Ontdekt via Veynoris (VEY-462): dist/esm/server/index.js miste .js-
// extensies op de relatieve imports. tsc met moduleResolution "bundler"
// compileert dat probleemloos — het is pure syntax — maar Node's eigen ESM-
// lader eist die extensie wél.
//
// WAAROM DIT VIA EEN KIND-PROCES MOET, NIET VIA VITEST'S EIGEN import()
// ------------------------------------------------------------------------
// Een eerste versie van deze test importeerde de gebouwde bestanden
// rechtstreeks vanuit de testrunner zelf, en bleef groen op de kapotte
// dist/ — Vitest draait op Vite's eigen resolver, en die is losser dan
// Node's native ESM-lader en accepteert een ontbrekende extensie stilzwijgend.
// Dat is precies waarom `npm test` in dit pakket het gat nooit zag, en ook
// waarom Veynoris het alleen zag op de configuratie die @goodapp/ai expliciet
// in `server.deps.inline` zette (net als bij @goodapp/observability) — zonder
// die regel had Veynoris' eigen suite hetzelfde valse groen gegeven.
//
// Een kaal `node --input-type=module` kind-proces omzeilt Vite volledig en
// reproduceert exact wat productie (gewoon Node, geen bundler) tegenkomt.

import { describe, expect, it, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

beforeAll(() => {
  // Bouwt altijd opnieuw: een test die op een toevallig aanwezige dist/ van
  // een vorige build leunt, bewijst niets over de huidige broncode.
  execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "pipe" });
}, 60_000);

describe("dist/cjs/server is bruikbaar via require()", () => {
  it("bestaat", () => {
    expect(existsSync(join(ROOT, "dist/cjs/server/index.js"))).toBe(true);
  });

  it("laadt in een kaal Node-proces en levert de verwachte exports", () => {
    const script = `
      const mod = require(${JSON.stringify(join(ROOT, "dist/cjs/server/index.js"))});
      const namen = ["modelConstant", "aiClient", "beoordeelAanroep", "schatKosten", "metPromptCache"];
      for (const naam of namen) {
        if (typeof mod[naam] !== "function") throw new Error(naam + " ontbreekt of is geen functie");
      }
      console.log("ok");
    `;
    const uit = execFileSync("node", ["-e", script], { encoding: "utf8" });
    expect(uit.trim()).toBe("ok");
  });
});

describe("dist/esm/server is bruikbaar via native ESM import() — het geval dat brak", () => {
  it("bestaat en draagt type: module", () => {
    expect(existsSync(join(ROOT, "dist/esm/server/index.js"))).toBe(true);
    expect(existsSync(join(ROOT, "dist/esm/package.json"))).toBe(true);
  });

  it("laadt in een kaal Node-proces zonder MODULE_NOT_FOUND", () => {
    // --input-type=module dwingt Node's eigen, strikte ESM-resolutie af —
    // geen Vite, geen bundler, exact het pad dat productie neemt.
    const script = `
      import(${JSON.stringify(join(ROOT, "dist/esm/server/index.js"))}).then((mod) => {
        const namen = ["modelConstant", "aiClient", "beoordeelAanroep", "schatKosten", "metPromptCache"];
        for (const naam of namen) {
          if (typeof mod[naam] !== "function") throw new Error(naam + " ontbreekt of is geen functie");
        }
        console.log("ok");
      });
    `;
    const uit = execFileSync("node", ["--input-type=module", "-e", script], { encoding: "utf8" });
    expect(uit.trim()).toBe("ok");
  });
});
