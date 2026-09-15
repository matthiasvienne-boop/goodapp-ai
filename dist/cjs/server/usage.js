"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDAARD_PRIJSTABEL = void 0;
exports.schatKosten = schatKosten;
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
exports.STANDAARD_PRIJSTABEL = [
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
function schatKosten(gebruik, tabel = exports.STANDAARD_PRIJSTABEL) {
    if (gebruik.inputTokens === undefined || gebruik.outputTokens === undefined)
        return undefined;
    const rij = tabel.find((r) => r.patroon.test(gebruik.model));
    if (rij === undefined)
        return undefined;
    return (gebruik.inputTokens / 1_000_000) * rij.inputUsd + (gebruik.outputTokens / 1_000_000) * rij.outputUsd;
}
