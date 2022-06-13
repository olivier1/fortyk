import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
export class FortyKKnightSheet extends ActorSheet {
    
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/knight-sheet.html",
            width: 666,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "main" }],
            default:null,
            scrollY: [
                
            ]

        });
    }
     /** @override */
    getData() {
        const data = super.getData();
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        
        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
         html.find('.rollable').click(this._onRoll.bind(this));
    }
    /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        let testType=dataset["rollType"];
        var testTarget=parseInt(dataset["target"]);
        var testLabel=dataset["label"];
        var testChar=dataset["char"];
        var item=null;
        
        
            FortykRollDialogs.callRollDialog(testChar, testType, testTarget, this.actor, testLabel, item, false);
       
        //autofocus the input after it is rendered.
    }
   
}