import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
export class FortyKOWRegimentSheet extends ActorSheet {
    
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/regimentOW-sheet.html",
            width: 666,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "main" }],
            default:null,
            scrollY: [
                ".main",
                ".skills",
                ".tnt",
                ".exp",
                ".combat",
                ".gear",
                ".psykana"
            ]

        });
    }
     /** @override */
    getData() {
        const data = super.getData();
        mergeObject(data.actor,this.actor.prepare());
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        
        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
         html.find('.rollable').click(this._onRoll.bind(this));
        html.find('.addguard').click(this._onCreateGuard.bind(this));
        html.find('.deleteguard').click(this._onDeleteGuard.bind(this));
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
        setTimeout(function() {document.getElementById('modifier').select();}, 50);
    }
   async _onCreateGuard(event){
        let newGuard={"name":"","status":"","cod":""}
        
        let squad=Object.values(this.actor.data.data.personnel.squad);
        squad.push(newGuard);
        let squadObj=Object.assign({},squad);
         await this.actor.update({"data.personnel.squad":squadObj});
        
    }
    async _onDeleteGuard(event){
         const element = event.currentTarget;
        const dataset = element.dataset;
        let index=parseInt(dataset["index"]);
        let squad=Object.values(this.actor.data.data.personnel.squad);
       
        squad.splice(index,1);
        
         
        
       await this.actor.update({"data.personnel.squad":squad});
        
    }
}