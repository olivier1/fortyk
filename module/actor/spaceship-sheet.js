import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import FortyKBaseActorSheet from "./base-sheet.js";
export class FortyKSpaceshipSheet extends FortyKBaseActorSheet {

    /** @override */
    static get defaultOptions() {
        
        return mergeObject(super.defaultOptions, {
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
    getData() {
        const data = super.getData();
       
        if(game.user.character===undefined){
            data.bs=this.actor.data.data.crew.rating;
        }else{
            let charBS=game.user.character.data.data.characteristics.bs.value;
            let shipBS=this.actor.data.data.crew.rating;
            if(charBS>shipBS){
                data.bs= charBS
            }else{
                data.bs= shipBS
            }
           
        }
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
            let roll = new Roll(dataset.formula, this.actor.data.data);
            let label = dataset.label ? `Rolling ${dataset.label}` : '';
            roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });
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
        
        let halfstr=fortykSquadron.data.data.halfstr.value;
        if(halfstr){
            await fortykSquadron.update({"data.halfstr.value":false});
        }else{
            await fortykSquadron.update({"data.halfstr.value":true});
        }
        
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
        update["data.torpedo.rating"]=rating;
        update["data.torpedo.id"]=torpId;
        update["data.damage.value"]=damage;
        await item.update(update);


    }

}