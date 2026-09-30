# Changelog

## 0.2.0 — 2026-09-29

### Changed

- `aiClient(apiKeyEnvVar?, opties?)` geeft de client nu een expliciete timeout (standaard vijf minuten, `STANDAARD_TIMEOUT_MS`) en een expliciete retrygrens (standaard twee, `STANDAARD_MAX_RETRIES`). Eerder werd de client zonder opties aangemaakt en gold de standaard van de SDK: tien minuten per aanroep. **Gedragswijziging:** een aanroep die langer dan vijf minuten duurt, wordt nu afgebroken. Een aanroeper met een kortere of langere grens kiest zelf `{ timeoutMs, maxRetries }`. (PLAT-207, audit 06 en 07.)
- De gememoriseerde client wisselt nu ook mee wanneer de opties veranderen, niet alleen bij een andere sleutel.

### Added

- `AiClientOpties`, `STANDAARD_TIMEOUT_MS`, `STANDAARD_MAX_RETRIES`.
- Een timeout kleiner dan of gelijk aan nul en een negatief aantal retries gooien een fout in plaats van stilletjes genegeerd te worden.

## 0.1.0 — 2026-09-15

### Added

- `modelConstant(envVarName, fallback)` — één modelconstante per gebruik, omgevingsvariabele eerst. Generaliseert Veynoris' `AI_MODEL`-patroon (VEY-429).
- `aiClient(apiKeyEnvVar?)` / `vergeetAiClient()` — gememoriseerde `Anthropic`-client, `null` zonder sleutel, herbouwt bij een gewijzigde sleutel. Geëxtraheerd uit TenderDesk's `aiClient()`.
- `beoordeelAanroep(opties)` — fail-closed voorwaardecontrole: `niet_geconfigureerd` of `te_groot`, nooit stilzwijgend. Gegeneraliseerd uit TenderDesk's `beoordeelAanroep`/`AiOnbeschikbaar` (de documentspecifieke `toestemming_ontbreekt`-reden blijft bewust in TenderDesk).
- `schatKosten(gebruik, tabel?)` en `STANDAARD_PRIJSTABEL` — kostenschatting per model, geëxtraheerd uit BeleggersApp's `priceFor()`-prijstabel.
- `AiGebruikGegevens` — de vorm van één gebruiksregel (model, tokens, geschatte kost, metadata), gegeneraliseerd uit Veynoris' `AIUsageParams`. De credit-boekhouding zelf (`consumeAiCredits`/`refundAiCredits`) blijft in het product.
- `metPromptCache(blok)` — markeert een blok voor prompt caching. Nieuwe capaciteit: geen van de drie bronproducten deed dit al.

### Niet meegenomen (bewust)

Promptbeheer als systeem, een eigen cachelaag, function calling als
raamwerk, een rechtenmodel, rate limiting — zie README. Deze komen terug
zodra een product er tegenaan loopt.
