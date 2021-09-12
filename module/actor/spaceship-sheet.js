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
            tabs: [{ navSelector: ".sheet-tabs2", contentSelector: ".sheet-content", initial: "main" }],
            default:null,
            scrollY: [
            ]

        });
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
        html.find('.space-damage-roll').click(this._onSpaceDamageRoll.bind(this));
        //toggle half strength for squadrons
        html.find('.halfstr').click(this._onHalfStrClick.bind(this));

        //Add ship weapons of components to actor
        html.find('.shipComponent-create').click(this._onShipComponentCreate.bind(this));

    }
    /**
   * Handle clickable rolls.
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
        console.log(fortykSquadron);
        let halfstr=fortykSquadron.data.data.halfstr.value;
        if(halfstr){
            await fortykSquadron.update({"data.halfstr.value":false});
        }else{
            await fortykSquadron.update({"data.halfstr.value":true});
        }
        
    }

}