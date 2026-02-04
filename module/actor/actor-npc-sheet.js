import { FortykRolls } from "../FortykRolls.js";
import { objectByString } from "../utilities.js";
import { setNestedKey } from "../utilities.js";
import FortyKBaseActorSheet from "./base-sheet.js";
export class FortyKNPCSheet extends FortyKBaseActorSheet {

    static async create(data, options) {
        data.skillFilter = "";
        super.create(data, options);
    }

    /** @override */

    static DEFAULT_OPTIONS = {

        classes: ["fortyk", "sheet", "actor"],
        template: "systems/fortyk/templates/actor/actor-npc-sheet.html",
        window:{width: 600,
        height: "auto"}

    }
    static PARTS = {
        form: {
            template: 'systems/fortyk/templates/actor/actor-npc-sheet.html'
        },
        weapons: {
            template: 'systems/fortyk/templates/actor/npcParts/npc-weapons.html',
            scrollable: ['']
        },
        armor: {
            template: 'systems/fortyk/templates/actor/npcParts/npc-armor.html',
            scrollable: ['']
        },
        tnt: {
            template: 'systems/fortyk/templates/actor/npcParts/npc-tnt.html',
            scrollable: ['']
        },
        psy: {
            template: 'systems/fortyk/templates/actor/npcParts/npc-psykana.html',
            scrollable: ['']
        },
        description: {
            template: 'systems/fortyk/templates/actor/npcParts/npc-description.html',
            scrollable: ['']
        }
    }
    static TABS = {
        sheet:{
            tabs:[
                { id: 'weapons', group: 'sheet', label: 'Chars & Weapons' },
                { id: 'armor', group: 'sheet', label: 'Skills & Equipment' },
                { id: 'tnt', group: 'sheet', label: 'Talents & Traits' },
                { id: 'psy', group: 'sheet', label: 'Psykana' },
                { id: 'description', group: 'sheet', label: 'Description' }
            ],
            initial:"weapons"
        }
    }
    /* -------------------------------------------- */

    /** @override */
    /* getData() {



        const data = super.getData();
        foundry.utils.mergeObject(data.actor,this.actor.prepare());
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.aptitudes=FORTYK.aptitudes;
        data.size=FORTYK.size;
        return data;
    }*/
    async _prepareContext(options) {
        const context= await super._prepareContext(options);
        context.tabs=this._prepareTabs("sheet");
         context.enrichedDescription= await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description.value,
                                                                                               {
            // Only show secret blocks to owner
            secrets: this.document.isOwner,
            // For Actors and Items
            relativeTo: this.document
        });
        context.enrichedSkills= await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.skills.value,
                                                                                               {
            // Only show secret blocks to owner
            secrets: this.document.isOwner,
            // For Actors and Items
            relativeTo: this.document
        });
        context.enrichedEquipment= await foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.equipment.value,
                                                                                               {
            // Only show secret blocks to owner
            secrets: this.document.isOwner,
            // For Actors and Items
            relativeTo: this.document
        });
        return context;
    }
   _onRender(context, options) {
        super._onRender(context, options);
        const html=$(this.element);
        //right click profile img
        html.find(".npc-img").contextmenu(this._onImgRightClick.bind(this));

        if (!this.options.editable) return;

        html.find(".parse-tnt").click(this._onTntParse.bind(this));
    }

    _onImgRightClick(event) {
        event = event || window.event;

        var options = {
            width: "auto",
            height: "auto"
        };
        let img = this.actor.img;
        let dlg = new Dialog(
            {
                title: `Profile Image`,
                content: `<img src="${img}"  width="auto" height="auto">`,
                buttons: {
                    submit: {
                        label: "OK",
                        callback: null
                    }
                },
                default: "submit"
            },
            options
        );
        dlg.render(true);
    }

    async _onTntParse(event) {
        let actor = this.actor;
        let data = actor.system;
        let tnt = data.talentsntraits.value.toLowerCase();
        let message = "Trait changes on " + actor.name + ":";
        if (tnt.includes("true grit")) {
            await actor.setFlag("fortyk", "truegrit", true);
        } else {
            await actor.setFlag("fortyk", "truegrit", false);
        }
        if (tnt.includes("overwhelming")) {
            await actor.setFlag("fortyk", "overwhelming", true);
        } else {
            await actor.setFlag("fortyk", "overwhelming", false);
        }
        if (tnt.includes("regeneration")) {
            let regex = /.*?regeneration\((\d+)\).*$/;

            let found = tnt.match(regex);
            let amt = found[1];

            await actor.setFlag("fortyk", "regeneration", found[1]);
        } else {
            await actor.setFlag("fortyk", "regeneration", false);
        }
        if (tnt.includes("swarm")) {
            await actor.setFlag("fortyk", "swarm", true);
        } else {
            await actor.setFlag("fortyk", "swarm", false);
        }
        message += `</br>True Grit:${actor.getFlag("fortyk", "truegrit")}`;
        message += `</br>Overwhelming:${actor.getFlag("fortyk", "overwhelming")}`;
        message += `</br>Regeneration:${actor.getFlag("fortyk", "regeneration")}`;
        message += `</br>Swarm:${actor.getFlag("fortyk", "swarm")}`;

        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: message,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        };
        ChatMessage.create(chatData);
    }
}
