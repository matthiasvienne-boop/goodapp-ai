# Changelog

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
