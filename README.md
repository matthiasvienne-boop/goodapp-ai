# @goodapp/ai

Eén gedeelde Anthropic-client: een gepinde SDK, per-gebruik modelconstanten,
een fail-closed voorwaardecontrole, verbruiksregistratie en prompt caching —
voor GoodApp-producten.

## Waarom dit bestaat

BeleggersApp, Veynoris en TenderDesk riepen Anthropic elk apart aan, elk op
een andere SDK-versie (0.90.0, 0.100.1, 0.117.1), met modelnamen die op
sommige plekken uiteenliepen — bij Veynoris noemde één auditregel een model
dat nergens anders meer voorkwam (VEY-429). Dit pakket zet de SDK-versie, de
modelkeuze, de foutvorm en de verbruiksregistratie op één plek.

Zie PLAT-125.

## Wat er bewust NIET in zit

- **Promptbeheer als systeem.** Elk product beheert zijn eigen prompts.
- **Een eigen cachelaag.** Alleen een helper om `cache_control` op een blok te
  zetten (zie hieronder) — geen opslag, geen TTL-beleid.
- **Function calling als raamwerk.**
- **Een rechtenmodel of rate limiting.**
- **Credit- of boekhouding.** Welke credits een aanroep kost en of een
  gebruiker daarvoor betaalt, blijft in het product (zie Veynoris'
  `consumeAiCredits`/`refundAiCredits`). Dit pakket levert alleen de vorm van
  een gebruiksregel en een kostenschatting voor dashboards.
- **Toestemmingscontroles.** Of een aanroep mag (bijvoorbeeld: heeft de
  aanroeper toestemming om een document te versturen) is een productbeslissing
  — zie TenderDesk's `toestemming_ontbreekt`, die bewust buiten dit pakket
  blijft. Toets je eigen voorwaarde eerst, roep `beoordeelAanroep` daarna aan.

Deze onderwerpen komen terug zodra een product er echt tegenaan loopt, niet
ervoor — zie Hoofdstuk 1 van PACKAGE-STANDARD.md ("extract, don't redesign").

## Installatie

```json
{
  "dependencies": {
    "@goodapp/ai": "git+https://github.com/matthiasvienne-boop/goodapp-ai.git#<commit-sha>"
  }
}
```

Pin op de resolved commit-SHA, niet op een tag of branch — zie
PACKAGE-STANDARD.md Hoofdstuk 4.

## Snelstart

```ts
import {
  modelConstant,
  aiClient,
  beoordeelAanroep,
  schatKosten,
  metPromptCache,
} from "@goodapp/ai/server";

// Eén constante per gebruik. Omgevingsvariabele eerst, vaste terugval erna.
const RESEARCH_MODEL = modelConstant("RESEARCH_AI_MODEL", "claude-sonnet-4-6");

// Vóór de aanroep: kan dit doorgaan?
const onbeschikbaar = beoordeelAanroep({
  payloadBytes: document.byteLength,
  maxPayloadBytes: 10 * 1024 * 1024,
});
if (onbeschikbaar !== null) {
  // onbeschikbaar.reden is "niet_geconfigureerd" of "te_groot", met een
  // toelichting die aan een gebruiker of in een log getoond kan worden.
  return onbeschikbaar;
}

const client = aiClient()!; // niet-null: beoordeelAanroep gaf hierboven al null terug

const antwoord = await client.messages.create({
  model: RESEARCH_MODEL,
  max_tokens: 1024,
  system: [metPromptCache({ type: "text", text: stabieleSysteemPrompt })],
  messages: [{ role: "user", content: vraag }],
});

const geschatteKostenUsd = schatKosten({
  model: RESEARCH_MODEL,
  inputTokens: antwoord.usage.input_tokens,
  outputTokens: antwoord.usage.output_tokens,
});

// De vorm doorgeven aan de eigen verbruiksregistratie van het product:
await trackAIUsage({
  organizationId,
  userId,
  action: "research_copilot",
  feature: "research_copilot",
  model: RESEARCH_MODEL,
  inputTokens: antwoord.usage.input_tokens,
  outputTokens: antwoord.usage.output_tokens,
  cacheReadInputTokens: antwoord.usage.cache_read_input_tokens,
  estimatedCostUsd: geschatteKostenUsd,
});
```

## Opties-referentie

### `modelConstant(envVarName, fallback): string`

Leest `envVarName` uit `process.env`; valt terug op `fallback` wanneer die
ontbreekt of leeg is (alleen witruimte telt als leeg).

### `aiClient(apiKeyEnvVar = "ANTHROPIC_API_KEY"): Anthropic | null`

Geeft een gememoriseerde `Anthropic`-client terug, of `null` wanneer de
sleutel ontbreekt. Bouwt een nieuwe client zodra de sleutel wijzigt — nooit
een oude client die een verouderde sleutel vasthoudt.

### `vergeetAiClient(): void`

Alleen voor tests: vergeet de gememoriseerde client.

### `beoordeelAanroep(opties): AiOnbeschikbaar | null`

| optie | type | betekenis |
|---|---|---|
| `payloadBytes` | `number?` | grootte van wat er verstuurd wordt |
| `maxPayloadBytes` | `number?` | de grens; zonder deze optie wordt er niet op grootte getoetst |
| `apiKeyEnvVar` | `string?` | standaard `"ANTHROPIC_API_KEY"` |

Geeft `null` terug wanneer de aanroep mag doorgaan. Anders een
`AiOnbeschikbaar` met `reden: "te_groot"` (inclusief `bytes` en `maxBytes`) of
`reden: "niet_geconfigureerd"`, allebei met een `toelichting: string`.

Groottecontrole gaat vóór configuratiecontrole: als de payload sowieso te
groot is, doet het er niet toe of er een sleutel is.

### `schatKosten(gebruik, tabel = STANDAARD_PRIJSTABEL): number | undefined`

Schat de kost in USD op basis van `inputTokens` en `outputTokens`. Geeft
`undefined` terug — nooit een geraden getal — wanneer de tokentelling
ontbreekt of het model in geen enkele rij van de tabel past.

`STANDAARD_PRIJSTABEL` dekt drie patronen (`/opus/i`, `/sonnet/i`, `/haiku/i`),
geëxtraheerd uit BeleggersApp's prijstabel. Prijzen veranderen buiten dit
pakket om; geef een eigen tabel door zodra Anthropic ze wijzigt.

### `metPromptCache(blok): blok & { cache_control: { type: "ephemeral" } }`

Zet `cache_control` op het laatste blok van een stabiel, herbruikbaar deel
van een prompt (bijvoorbeeld het systeemprompt-blok). Na de eerste aanroep
hoort `usage.cache_read_input_tokens` in het antwoord niet meer nul te zijn —
dat is de meting die aantoont dat het werkt.

## Omgevingsvariabelen

| Naam | Verplicht | Betekenis |
|---|---|---|
| `ANTHROPIC_API_KEY` (of een andere naam via `apiKeyEnvVar`) | Nee — zonder deze geeft `aiClient` `null` terug | De Anthropic API-sleutel |
| Elke naam die aan `modelConstant` wordt doorgegeven | Nee | Overschrijft de vaste terugval voor dat ene gebruik |

## Status

**Draft.** Nog niet geïnstalleerd door een product. Zie
PACKAGE-STANDARD.md Hoofdstuk 3 voor wat elke fase betekent.
