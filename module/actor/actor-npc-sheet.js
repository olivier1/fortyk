import {FortykRolls} from "../FortykRolls.js";
import {FORTYK} from "../FortykConfig.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import FortyKBaseActorSheet from "./base-sheet.js";
export class FortyKNPCSheet extends FortyKBaseActorSheet {

    static async create(data, options) {
        data.skillFilter="";
        super.create(data,options);
    }
    /** @override */

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actor-npc-sheet.html",
            width: 600,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
            default:null
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {



        const data = super.getData();
        mergeObject(data.actor,this.actor.prepare());
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.aptitudes=FORTYK.aptitudes;
        data.size=FORTYK.size;
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        html.find('.parse-tnt').click(this._onTntParse.bind(this));




    } 

    async _onTntParse(event){
      
        let actor=this.actor;
        let data=actor.data.data;
        let tnt=data.talentsntraits.value.toLowerCase();
        if(tnt.includes("true grit")){
            actor.setFlag("fortyk","truegrit",true);

        }else{
            actor.setFlag("fortyk","truegrit",false);
        }
        if(tnt.includes("overwhelming")){
            actor.setFlag("fortyk","overwhelming",true);

        }else{
            actor.setFlag("fortyk","overwhelming",false);
        }
        if(tnt.includes("regeneration")){
            let regex=/.*?regeneration\((\d+)\).*$/;
           
            let found=tnt.match(regex);
            
            
            actor.setFlag("fortyk","regeneration",found[1]);

        }else{
            actor.setFlag("fortyk","regeneration",false);
        }
       
    }



}