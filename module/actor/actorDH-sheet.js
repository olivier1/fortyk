import {FortykRolls} from "../FortykRolls.js";
import {FORTYK} from "../FortykConfig.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import FortyKDWActorSheet from "./actorDW-sheet.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class FortyKDHActorSheet extends FortyKDWActorSheet {

    static async create(data, options) {
        data.skillFilter="";
        super.create(data,options);
    }
    /** @override */

    static get defaultOptions() {
       
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actorDH-sheet.html",
            width: 666,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
            default:null
        });
    }

}