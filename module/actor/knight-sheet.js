import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import FortyKBaseActorSheet from "./base-sheet.js";
export class FortyKKnightSheet extends FortyKBaseActorSheet {
    
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/knight-sheet.html",
            width: 666,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "mechbay" }],
            default:null,
            scrollY: [
                
            ]

        });
    }
     /** @override */
    getData() {
        const data = super.getData();
        const actor=this.actor;
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.meleeWeapons=actor.itemTypes.meleeWeapon;
        data.rangedWeapons=actor.itemTypes.rangedWeapon;
        data.ammunition=actor.itemTypes.ammunition;
        data.components=actor.itemTypes.knightComponent;
        data.armors=actor.itemTypes.knightArmor;
        data.cores=actor.itemTypes.knightCore;
        data.structures=actor.itemTypes.knightStructure;
        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
         html.find('.rollable').click(this._onRoll.bind(this));
        html.find('.mechBat').click(this._onMechbayTabClick.bind(this));
    }
    
    _onMechbayTabClick(event){
        let tab=event.currentTarget;
        let tabClasses=tab.classList;
        let tabs=document.getElementsByClassName("mechBat");
        
        if(!tabClasses.contains("active2")){
            for(let i=0;i<tabs.length;i++){
                if(tabs[i].classList.contains("active2")){
                     tabs[i].classList.remove("active2");
                }
               
            }
            let category=tab.dataset["tab"];
            tabClasses.add("active2");
            let lists=document.getElementsByName("mechInventoryTab");
            for(let i=0;i<lists.length;i++){
                let list=lists[i];
                let cat=list.dataset["tab"];
                if(cat===category){
                    list.style.display="";
                }else{
                    list.style.display="none";
                }
            }
        }
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