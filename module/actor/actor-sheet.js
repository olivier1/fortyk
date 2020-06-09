/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class FortyKActorSheet extends ActorSheet {


    /** @override */

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /* -------------------------------------------- */

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
        if (!this.options.editable) return;
        //Add item to actor
        html.find('.item-create').click(this._onItemCreate.bind(this));
        //edit item on actor
        html.find('.item-edit').click(this._onItemEdit.bind(this));
        //delete item on actor
        html.find('.item-delete').click(this._onItemDelete.bind(this));
        //change skill characteristic
        html.find('.skill-char').change(this._onSkillCharEdit.bind(this));
        //change skill advancement
        html.find('.skill-adv').change(this._onSkillAdvEdit.bind(this));
        //change modifier

        html.find('.skill-mod').keydown(this._onSkillModEdit.bind(this));
        html.find('.skill-mod').focusout(this._onSkillModEdit.bind(this));
        //get item description
        html.find('.item-descr').click(this._onSkillDescrGet.bind(this));

        // Rollable abilities.
        html.find('.rollable').click(this._onRoll.bind(this));
    }

    /* -------------------------------------------- */


    //Handle the popup when use clicks skill name to show item description
    _onSkillDescrGet(event){
        let descr = event.target.attributes["data-item-descr"].value;
        var options = {
            width: 300,
            height: 400
        };
        
        
        let dlg = new Dialog({
            title: "Skill Description",
            content: "<p>"+descr+"</p>",
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
    //Handle creating a new item, will sort the item type before making the new item

    _onItemCreate(event) {

        var templateData = {
            actor: this.actor,
            skills: this.getData().entity.skills
        };


        var type=event.currentTarget.attributes["data-type"].value;
        if(type==="skill"){
            let template = 'systems/fortyk/templates/actor/dialogs/actor-newskill-dialog.html';
            var options = {
                width: 300,
                height: 400
            };
            var renderedTemplate= renderTemplate(template, templateData);

            renderedTemplate.then(content => {

                let dlg = new Dialog({
                    title: "Create Skill",
                    content: content,
                    buttons: {
                        submit: {

                            label: "OK",
                            callback: html => this.actor.createSkill(html)
                        },
                        cancel: {

                            label: "Cancel",
                            callback: null
                        }
                    },
                    default: "submit"
                }, options);

                dlg.render(true);
            });

        }

    }
    //Edits the item that was clicked
    _onItemEdit(event){
        let itemId = event.currentTarget.attributes["data-item-id"].value;
    const item = this.actor.items.find(i => i.data._id == itemId)
    item.sheet.render(true);
    }
    //deletes the selected item from the actor
    _onItemDelete(event){
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/delete-item-dialog.html');
        renderedTemplate.then(content => {
            new Dialog({
                title: "Deletion Confirmation",
                content: content,
                buttons:{
                    submit:{
                        label:"Yes",
                        callback: dlg => { this.actor.deleteEmbeddedEntity("OwnedItem", itemId);}
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
    /**
    *Handle select change for skill characterteristic selector
    * @param {Event} event   The originating change event
    * @private
    */
    async _onSkillCharEdit(event){


        let newChar=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= duplicate(this.actor.getEmbeddedEntity("OwnedItem", dataItemId));
        item.data.characteristic.value=newChar;
        await this.actor.updateEmbeddedEntity("OwnedItem",item);

    }
    /**
    *Handle select change for skill advancement selector
    * @param {Event} event   The originating click event
    * @private
    */
    async _onSkillAdvEdit(event){

        let newAdv=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= duplicate(this.actor.getEmbeddedEntity("OwnedItem", dataItemId));
        item.data.value=newAdv;
        await this.actor.updateEmbeddedEntity("OwnedItem",item);


    }
    /**
    *Handle input edits for skill modifier input
    * @param {Event} event   The originating click event
    * @private
    */
    async _onSkillModEdit(event){

        clearTimeout(event.currentTarget.timeout);
        event.currentTarget.timeout=setTimeout(async function(event, actor){


            let newMod=event.target.value;
            let dataItemId=event.target.attributes["data-item-id"].value;
            let item= duplicate(actor.actor.getEmbeddedEntity("OwnedItem", dataItemId));
            item.data.mod.value=newMod;
            await actor.actor.updateEmbeddedEntity("OwnedItem",item);},1000, event, this);



    }

    /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            let roll = new Roll(dataset.roll, this.actor.data.data);
            let label = dataset.label ? `Rolling ${dataset.label}` : '';
            roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });
        }
    }

}
