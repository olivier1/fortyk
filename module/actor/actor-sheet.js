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
        //Add skill to actor
        html.find('.create-skill').click(this._onSkillCreate.bind(this));
        //change skill characteristic
        html.find('.skill-char').change(this._onSkillCharEdit.bind(this));
        //change skill advancement
        html.find('.skill-adv').change(this._onSkillAdvEdit.bind(this));
        //change modifier
        html.find('skill-mod').timeout=null;
        html.find('.skill-mod').keydown(this._onSkillModEdit.bind(this));
        html.find('.skill-mod').focusout(this._onSkillModEdit.bind(this));
        //add a timeout to the skillmods

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            this.actor.deleteOwnedItem(li.data("itemId"));
            li.slideUp(200, () => this.render(false));
        });

        // Rollable abilities.
        html.find('.rollable').click(this._onRoll.bind(this));
    }

    /* -------------------------------------------- */

    //Handle creating a new skill or skill group, ensures no duplicates

    _onSkillCreate(event) {

        var templateData = {
            actor: this.actor,
            skills: this.actor.data.data.skills
        }
        let template = 'systems/fortyk/templates/actor/actor-skill-create-dialog.html';
        var options = {
            width: 250,
            height: 180
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
                default: "submit",
            }, options);

            dlg.render(true);
        });
    }
    /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
    _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        // Finally, create the item!
        return this.actor.createOwnedItem(itemData);
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
        item.data.value.value=newAdv;
        await this.actor.updateEmbeddedEntity("OwnedItem",item);


    }
    /**
    *Handle input edits for skill modifier input
    * @param {Event} event   The originating click event
    * @private
    */
    async _onSkillModEdit(event){


        this.delay(async function(event, actor){


            let newMod=event.target.value;
            let dataItemId=event.target.attributes["data-item-id"].value;
            let item= duplicate(actor.actor.getEmbeddedEntity("OwnedItem", dataItemId));
            item.data.mod.value=newMod;
            await actor.actor.updateEmbeddedEntity("OwnedItem",item);},1000, event, this);



    }
    async delay(callback, ms) {

        var timer = 0;
        console.log(timer);
        return function() {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                callback.apply(context, args);
            }, ms || 0);
        };
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
