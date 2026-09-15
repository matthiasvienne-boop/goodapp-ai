import Anthropic from "@anthropic-ai/sdk";
/**
 * Waarom een aanroep niet is doorgegaan. Nooit stilzwijgend leeg — een
 * consument die de client aanroept zonder sleutel krijgt een expliciete
 * reden terug, niet een vage fout die pas bij gebruik opduikt.
 *
 * Bewust klein gehouden: dit kent alleen infrastructurele redenen
 * (configuratie, grootte). Een productspecifieke reden — toestemming,
 * quotum, een abonnementsgrens — hoort bij de aanroeper, niet hier. Zie de
 * README.
 */
export type AiOnbeschikbaar = {
    reden: "niet_geconfigureerd";
    toelichting: string;
} | {
    reden: "te_groot";
    toelichting: string;
    bytes: number;
    maxBytes: number;
};
/**
 * De client, of null wanneer er geen sleutel is. Nooit een client die pas
 * bij gebruik faalt.
 *
 * Memoriseert op de sleutelwaarde, niet alleen op "bestaat er al een
 * client": in Veynoris' ai-insights.ts wisselt de client mee zodra
 * ANTHROPIC_API_KEY verandert (bijvoorbeeld in een testomgeving die de
 * sleutel tussen aanroepen herconfigureert), in plaats van de eerste,
 * inmiddels verouderde client te blijven hergebruiken.
 */
export declare function aiClient(apiKeyEnvVar?: string): Anthropic | null;
/** Alleen voor tests: de gedeelde client vergeten, zodat een gewijzigde sleutel doorwerkt. */
export declare function vergeetAiClient(): void;
/**
 * Controleert vooraf of een aanroep kan. Geeft null wanneer alles in orde
 * is — een aanroeper met een eigen productspecifieke voorwaarde (toestemming,
 * quotum) toetst die zelf eerst en roept dit pas daarna aan, zodat die
 * volgorde in het product blijft staan en niet hier verondersteld wordt.
 */
export declare function beoordeelAanroep(opties: {
    payloadBytes?: number;
    maxPayloadBytes?: number;
    apiKeyEnvVar?: string;
}): AiOnbeschikbaar | null;
