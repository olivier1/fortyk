import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import FortyKBaseActorSheet from "./base-sheet.js";
export class FortyKVehicleSheet extends FortyKBaseActorSheet {

    /** @override */
    static get defaultOptions() {

        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/vehicle-sheet.html",
            width: 666,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs2", contentSelector: ".sheet-content", initial: "components" }],
            default:null,
            scrollY: [
                ".vehicle-weapons",
                ".crew-armor",
                ".traits-upgrades"
            ]



        });
    }
    /* -------------------------------------------- */
    /** @override */
    getData() {
        const data = super.getData();

        
        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable

        

    }
    
    

}