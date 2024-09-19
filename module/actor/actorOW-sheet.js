import {FortykRolls} from "../FortykRolls.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import FortyKDWActorSheet from "./actorDW-sheet.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class FortyKOWActorSheet extends FortyKDWActorSheet {

    
    /** @override */

    static get defaultOptions() {
       
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actorOW-sheet.html",
            width: 666,
            height: 765,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "main" }],
            default:null
        });
    }

}