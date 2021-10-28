import {FortykRolls} from "../FortykRolls.js";
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
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "weapons" }],
            default:null
        });
    }

    /* -------------------------------------------- */

    /** @override */
   /* getData() {



        const data = super.getData();
        mergeObject(data.actor,this.actor.prepare());
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.aptitudes=FORTYK.aptitudes;
        data.size=FORTYK.size;
        return data;
    }*/
    activateListeners(html) {
        super.activateListeners(html);
        //right click profile img
        html.find('.npc-img').contextmenu(this._onImgRightClick.bind(this));

        if (!this.options.editable) return;
        
        html.find('.parse-tnt').click(this._onTntParse.bind(this));
        html.find('.npc-armor-create').click(this._onArmorCreate.bind(this));
        html.find('.npc-armor-delete').click(this._onArmorDelete.bind(this));
         html.find('.npc-armor-edit').click(this._onArmorEdit.bind(this));


    } 
    
    _onImgRightClick(event){

        event = event || window.event;

        
        var options = {
            width: "auto",
            height: "auto"
        };
        let img=this.actor.img
        let dlg = new Dialog({
            title: `Profile Image`,
            content: `<img src="${img}"  width="auto" height="auto">`,
            buttons: {
                submit: {
                    label: "OK",
                    callback: null
                }
            },
            default: "submit",
        }, options);
        dlg.render(true);


    }
    async _onArmorCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset["type"];
        const itemData = {
            name: `new ${type}`,
            type: type
        };

        let armor=await this.actor.createEmbeddedDocuments("Item",[itemData],{"renderSheet":true});
        
        let armorID=armor[0].id;
        await this.actor.update({"data.secChar.wornGear.armor._id":armorID});
    }
    async _onArmorDelete(event){
        await this.actor.items.get(this.actor.data.data.secChar.wornGear.armor._id).delete();
        await this.actor.update({"data.secChar.wornGear.armor._id":""});
    }
    async _onArmorEdit(event){
        event.preventDefault();
        let itemId = this.actor.data.data.secChar.wornGear.armor._id;
        const item = this.actor.items.find(i => i.data._id == itemId);
        item.sheet.render(true);
    }
    async _onTntParse(event){

        let actor=this.actor;
        let data=actor.data.data;
        let tnt=data.talentsntraits.value.toLowerCase();
        let message="Trait changes on "+actor.name+":";
        if(tnt.includes("true grit")){
            await actor.setFlag("fortyk","truegrit",true);


        }else{
            await actor.setFlag("fortyk","truegrit",false);

        }
        if(tnt.includes("overwhelming")){
            await actor.setFlag("fortyk","overwhelming",true);

        }else{
            await actor.setFlag("fortyk","overwhelming",false);

        }
        if(tnt.includes("regeneration")){
            let regex=/.*?regeneration\((\d+)\).*$/;

            let found=tnt.match(regex);
            let amt=found[1];

            await actor.setFlag("fortyk","regeneration",found[1]);


        }else{
            await actor.setFlag("fortyk","regeneration",false);

        }
        if(tnt.includes("swarm")){
            await actor.setFlag("fortyk","swarm",true);

        }else{
            await actor.setFlag("fortyk","swarm",false);
        }
        message+=`</br>True Grit:${actor.getFlag("fortyk","truegrit")}`;
        message+=`</br>Overwhelming:${actor.getFlag("fortyk","overwhelming")}`;
        message+=`</br>Regeneration:${actor.getFlag("fortyk","regeneration")}`;
        message+=`</br>Swarm:${actor.getFlag("fortyk","swarm")}`;

        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: message,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        };
        ChatMessage.create(chatData);
    }



}