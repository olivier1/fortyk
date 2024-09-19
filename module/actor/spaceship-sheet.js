import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import FortyKBaseActorSheet from "./base-sheet.js";
export class FortyKSpaceshipSheet extends FortyKBaseActorSheet {

    /** @override */
    static get defaultOptions() {

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/spaceship-sheet.html",
            width: 666,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs2", contentSelector: ".sheet-content", initial: "components" }],
            default:null,
            scrollY: [
                ".components",
                ".spaceship-weapons",
                ".cargo",
                ".hangar"
            ]



        });
    }
    /* -------------------------------------------- */
    /** @override */
    async getData() {
        const data = await super.getData();

        if(game.user.character===null){
            data.bs=this.actor.system.crew.rating;
            data.hangarAttack=this.actor.system.crew.rating;
        }else if(game.user.character.type.toLowerCase().includes("pc")){
            let character=game.user.character;
            let charBS=character.system.characteristics.bs.value;
            let crew=this.actor.system.crew.rating;

            data.bs=Math.max(charBS,crew); 
            let command=0;
            let tactics=0;
            let operate=0;
            if(character.skills===undefined){
                character.prepare();
            }
            let skills=character.skills;
            if(skills){
                skills.forEach((skill,id,items)=>{


                    if(skill.name.toLowerCase()==="command"){
                        command=skill.system.total.value;
                    }else if(skill.name.toLowerCase()==="voidship"){
                        operate=skill.system.total.value;
                    }else if(skill.name.toLowerCase()==="void combat"){
                        tactics=skill.system.total.value;
                    }

                });
            }

            data.hangarAttack=Math.max(command,operate,tactics,crew);


        }
        data.spaceshipComponentStatuses=game.fortyk.FORTYK.spaceshipComponentStatuses;
        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable

        //damage roll button
        html.find('.space-damage-roll').click(this._onSpaceDamageRoll.bind(this));
        //toggle half strength for squadrons
        html.find('.halfstr').click(this._onHalfStrClick.bind(this));
        //change cybernetic location
        html.find('.torpedo-ammo').change(this._onTorpedoAmmoEdit.bind(this));
        //change component status
        html.find('.component-status').change(this._onComponentStatusEdit.bind(this));
        //Add ship weapons of components to actor
        html.find('.shipComponent-create').click(this._onShipComponentCreate.bind(this));

    }
    /**
   * Handle clickable damage rolls.
   * @param {Event} event   The originating click event
   * @private
   */
    _onSpaceDamageRoll(event){
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.formula) {
            let formula=dataset.formula;
            let label = dataset.label ? `Rolling ${dataset.label} damage` : '';
            new Dialog({
                title: `Number of Hits & Bonus Damage`,
                content: `<div class="flexcol">
<div class="flexrow"><label>Number of Hits:</label> <input type="text" id="modifier" name="hits" value="1" data-dtype="Number" autofocus/></div>
<div class="flexrow"><label>Bonus Damage:</label> <input type="text" id="dmg" name="dmg" value="0" data-dtype="Number" /></div>
</div>`,
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: (el) => {
                            const hits = parseInt(Number($(el).find('input[name="hits"]').val()));
                            const dmg = parseInt(Number($(el).find('input[name="dmg"]').val()));
                            if(dmg>0){
                                formula.value+=`+${dmg}`
                            }
                            this._damageRoll(formula,label,hits);
                        }
                    }
                },
                default: "submit",
                width:100}
                      ).render(true);

        }
    }

    async _damageRoll(formula,label,hits){
        for(let i=0;i<hits;i++){
            let roll = new Roll(formula, this.actor.system);
            await roll.evaluate().then(value=>{roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });});

        }
    }
    async _onShipComponentCreate(event){
        event.preventDefault();
        let templateOptions={"type":[{"name":"spaceshipComponent","label":"Spaceship Component"},{"name":"spaceshipWeapon","label":"Spaceship Weapon"}]};

        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/select-wargear-type-dialog.html', templateOptions);

        renderedTemplate.then(content => { 
            new Dialog({
                title: "New Component Type",
                content: content,
                buttons:{
                    submit:{
                        label:"Yes",
                        callback: async html => {
                            const type = html.find('select[name="wargear-type"]').val();
                            const itemData = {
                                name: `new ${type}`,
                                type: type
                            };
                            let item=itemData;

                            let itemz=[];
                            itemz.push(item);

                            await this.actor.createEmbeddedDocuments("Item",itemz,{"renderSheet":true});




                        }
                    },
                    cancel:{
                        label: "No",
                        callback: null
                    }
                },
                default: "submit"
            }).render(true)
        });


    }
    async _onHalfStrClick(event){
        let dataset=event.currentTarget.dataset;
        let squadronID=dataset["itemId"];
        let fortykSquadron=this.actor.items.get(squadronID);

        let halfstr=fortykSquadron.system.halfstr.value;
        if(halfstr){
            await fortykSquadron.update({"system.halfstr.value":false});
        }else{
            await fortykSquadron.update({"system.halfstr.value":true});
        }
        await this.actor.prepare();

    }
    /**
    *Handle select change for torpedo selector
    * @param {Event} event   The originating click event
    * @private
    */
    async _onTorpedoAmmoEdit(event){
        event.preventDefault();

        let torpId=event.target.value;
        let dataItemId=event.target.attributes["data-weapon"].value;
        let selected=event.currentTarget.selectedOptions.item(0);
        let damage=selected.attributes.getNamedItem("data-damage").value;
        let rating=selected.attributes.getNamedItem("data-rating").value;
        let item= this.actor.getEmbeddedDocument("Item", dataItemId);
        let update={}

        update["system.torpedo.id"]=torpId;

        await item.update(update);
        await this.actor.prepare();


    }
    async _onComponentStatusEdit(event){
        event.preventDefault();

        let status=event.target.value;
        let dataItemId=event.target.attributes["data-id"].value;

        let item= this.actor.getEmbeddedDocument("Item", dataItemId);
        let update={}
        update["system.status.value"]=status;

        await item.update(update);
        await this.actor.prepare();


    }

}