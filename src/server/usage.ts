/**
 * De vorm van één gebruiksregel. Dit is geen boekhouding — welke credits dat
 * kost en of een gebruiker daarvoor betaalt, blijft in het product (zie
 * Veynoris' consumeAiCredits/refundAiCredits in plan-service.ts). Wat hier
 * staat is de vorm die elk product al apart had uitgevonden: welk model,
 * hoeveel tokens, wat het schat te kosten.
 */
export interface AiGebruikGegevens {
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadInputTokens?: number;
  cacheCreationInputTokens?: number;
  /** Geschatte kost in USD. Alleen voor dashboards, geen boekhoudkundige waarheid. */
  geschatteKostenUsd?: number;
  metadata?: Record<string, unknown>;
}

/** Eén rij in een prijstabel: welk model, wat de dollarprijs per miljoen tokens is. */
export interface PrijsPerMiljoenTokens {
  patroon: RegExp;
  inputUsd: number;
  outputUsd: number;
}

/**
 * Een startpunt, geëxtraheerd uit BeleggersApp's priceFor()-tabel
 * (server/src/routes/internal.test.ts). Geen prijs voor `fable`, want geen
 * van de drie bronproducten had die al in gebruik — een consument die dat
 * model gebruikt geeft zijn eigen tabel mee.
 *
 * Prijzen veranderen buiten deze package om. Wie hierop bouwt, geeft zijn
 * eigen tabel door zodra Anthropic de prijzen wijzigt — deze standaardtabel
 * is een vertrekpunt, geen garantie.
 */
export const STANDAARD_PRIJSTABEL: PrijsPerMiljoenTokens[] = [
  { patroon: /opus/i, inputUsd: 15, outputUsd: 75 },
  { patroon: /sonnet/i, inputUsd: 3, outputUsd: 15 },
  { patroon: /haiku/i, inputUsd: 1, outputUsd: 5 },
];

/**
 * Schat de kost van één aanroep in USD, of undefined wanneer het model niet
 * in de tabel staat of de tokentelling ontbreekt. Geeft nooit een geraden
 * getal terug — een ontbrekende schatting moet zichtbaar ontbreken op een
 * dashboard, niet stilzwijgend op nul staan.
 */
export function schatKosten(
  gebruik: { model: string; inputTokens?: number; outputTokens?: number },
  tabel: PrijsPerMiljoenTokens[] = STANDAARD_PRIJSTABEL
): number | undefined {
  if (gebruik.inputTokens === undefined || gebruik.outputTokens === undefined) return undefined;
  const rij = tabel.find((r) => r.patroon.test(gebruik.model));
  if (rij === undefined) return undefined;
  return (gebruik.inputTokens / 1_000_000) * rij.inputUsd + (gebruik.outputTokens / 1_000_000) * rij.outputUsd;
}
