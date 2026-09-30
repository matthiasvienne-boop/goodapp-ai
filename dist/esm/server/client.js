import Anthropic from "@anthropic-ai/sdk";
/**
 * Hoe lang een aanroep hoogstens mag duren, en hoe vaak de SDK zelf opnieuw
 * probeert.
 *
 * WAAROM DIT BESTAAT (PLAT-207, audit 07 en 06)
 *
 * Deze client werd eerst zonder enige optie aangemaakt, dus met de standaard
 * van de SDK: tien minuten per aanroep. Een trage of hangende aanbieder hield
 * daarmee een verzoek — en bij een aanroeper die de aanroep binnen een
 * databanktransactie deed, een verbinding uit de pool — tien minuten vast.
 * Alle acht producten meldden externe aanroepen zonder eigen timeout; deze
 * client is de wortel voor de aanroepen naar Anthropic.
 *
 * De standaard is bewust ruim (vijf minuten): een lang antwoord met veel
 * uitvoertokens duurt echt minuten (een uitgebreide extractie met
 * max_tokens 8000 kan boven twee minuten komen). Een aanroeper met een
 * kortere, interactieve aanroep kiest zelf een kortere grens.
 * `maxRetries` staat expliciet op de waarde van de SDK (twee), zodat een
 * latere wijziging van de SDK-standaard hier niet stilletjes doorwerkt.
 */
export const STANDAARD_TIMEOUT_MS = 5 * 60 * 1000;
export const STANDAARD_MAX_RETRIES = 2;
let gedeeld = null;
let gedeeldeSleutel;
let gedeeldeOpties;
/**
 * De client, of null wanneer er geen sleutel is. Nooit een client die pas
 * bij gebruik faalt.
 *
 * Memoriseert op de sleutelwaarde en op de opties, niet alleen op "bestaat er
 * al een client": in Veynoris' ai-insights.ts wisselt de client mee zodra
 * ANTHROPIC_API_KEY verandert (bijvoorbeeld in een testomgeving die de
 * sleutel tussen aanroepen herconfigureert), in plaats van de eerste,
 * inmiddels verouderde client te blijven hergebruiken. Een andere timeout of
 * retrygrens geeft om dezelfde reden een andere client.
 *
 * Een timeout die niet groter is dan nul of een negatief aantal retries is
 * een programmeerfout en gooit; het is nooit iets om stilletjes te negeren.
 */
export function aiClient(apiKeyEnvVar = "ANTHROPIC_API_KEY", opties = {}) {
    const timeoutMs = opties.timeoutMs ?? STANDAARD_TIMEOUT_MS;
    const maxRetries = opties.maxRetries ?? STANDAARD_MAX_RETRIES;
    if (!(timeoutMs > 0))
        throw new Error(`aiClient: timeoutMs moet groter zijn dan 0 (kreeg ${timeoutMs}).`);
    if (!(maxRetries >= 0))
        throw new Error(`aiClient: maxRetries mag niet negatief zijn (kreeg ${maxRetries}).`);
    const sleutel = process.env[apiKeyEnvVar];
    if (sleutel === undefined || sleutel.trim() === "")
        return null;
    const zelfde = gedeeldeOpties?.timeoutMs === timeoutMs && gedeeldeOpties?.maxRetries === maxRetries;
    if (gedeeld === null || gedeeldeSleutel !== sleutel || !zelfde) {
        gedeeld = new Anthropic({ apiKey: sleutel, timeout: timeoutMs, maxRetries });
        gedeeldeSleutel = sleutel;
        gedeeldeOpties = { timeoutMs, maxRetries };
    }
    return gedeeld;
}
/** Alleen voor tests: de gedeelde client vergeten, zodat een gewijzigde sleutel doorwerkt. */
export function vergeetAiClient() {
    gedeeld = null;
    gedeeldeSleutel = undefined;
    gedeeldeOpties = undefined;
}
/**
 * Controleert vooraf of een aanroep kan. Geeft null wanneer alles in orde
 * is — een aanroeper met een eigen productspecifieke voorwaarde (toestemming,
 * quotum) toetst die zelf eerst en roept dit pas daarna aan, zodat die
 * volgorde in het product blijft staan en niet hier verondersteld wordt.
 */
export function beoordeelAanroep(opties) {
    if (opties.payloadBytes !== undefined && opties.maxPayloadBytes !== undefined) {
        if (opties.payloadBytes > opties.maxPayloadBytes) {
            const mb = (opties.payloadBytes / 1024 / 1024).toFixed(1);
            const maxMb = (opties.maxPayloadBytes / 1024 / 1024).toFixed(1);
            return {
                reden: "te_groot",
                toelichting: `De payload is ${mb} MB; de grens ligt op ${maxMb} MB.`,
                bytes: opties.payloadBytes,
                maxBytes: opties.maxPayloadBytes,
            };
        }
    }
    if (aiClient(opties.apiKeyEnvVar) === null) {
        const envVar = opties.apiKeyEnvVar ?? "ANTHROPIC_API_KEY";
        return {
            reden: "niet_geconfigureerd",
            toelichting: `${envVar} ontbreekt op deze omgeving. Een beheerder moet die instellen.`,
        };
    }
    return null;
}
