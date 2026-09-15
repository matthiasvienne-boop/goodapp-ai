"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelConstant = modelConstant;
/**
 * Bouwt één modelconstante voor één gebruik: omgevingsvariabele eerst, een
 * vaste terugval erna.
 *
 * Waarom dit een functie is en geen losse string per aanroepplek: bij
 * Veynoris (VEY-429) hadden dertien aanroepplekken elk hun eigen
 * hardgecodeerde terugval, en één daarvan — een auditregel — noemde een
 * ander, verouderd model dan de rest. Eén functie per gebruik maakt dat
 * verschil onmogelijk: wisselen van model is één regel, niet een zoektocht
 * door de hele codebase.
 *
 * Eén constante per écht gebruik, niet één voor het hele product. TenderDesk
 * kiest bewust één model per taak omdat de prompt op dat model is afgestemd,
 * niet op een familie — een tweede taak met een ander model krijgt zijn eigen
 * `modelConstant(...)`-aanroep.
 */
function modelConstant(envVarName, fallback) {
    const vanOmgeving = process.env[envVarName];
    return vanOmgeving !== undefined && vanOmgeving.trim() !== "" ? vanOmgeving : fallback;
}
