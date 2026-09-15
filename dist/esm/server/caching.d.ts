/**
 * Markeert één blok voor prompt caching.
 *
 * Anthropic cachet alles tot en met een blok met `cache_control`, dus dit
 * hoort op het laatste blok van het deel dat tussen aanroepen niet
 * verandert — nooit op het variabele deel erna. Geen van de drie
 * bronproducten deed dit al (geen enkele trof `cache_control` in hun
 * broncode aan), dus dit is geen extractie maar de concreetste kostenwinst
 * die dit ticket noemt.
 *
 * Dit is bewust een kleine helper en geen raamwerk: welke blokken stabiel
 * genoeg zijn om te cachen, blijft een beslissing van de aanroeper. Na de
 * eerste aanroep hoort `usage.cache_read_input_tokens` in het antwoord niet
 * meer nul te zijn — dat is de meting die aantoont dat het werkt.
 */
export declare function metPromptCache<T extends Record<string, unknown>>(blok: T): T & {
    cache_control: {
        type: "ephemeral";
    };
};
