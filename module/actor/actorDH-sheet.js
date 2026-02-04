import {FortykRolls} from "../FortykRolls.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import FortyKBaseActorSheet from "./base-sheet.js";
import {FortyKItem} from "../item/item.js";
import FortyKDWActorSheet from "./actorDW-sheet.js";
/**
 * Extend the deathwatch sheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class FortyKDHActorSheet extends FortyKDWActorSheet {

    
    /** @override */

    static get DEFAULT_OPTIONS() {
       
        return foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actorDH-sheet.html",
            width: 666,
            height: 850,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "main" }],
            default:null
        });
    }

}
