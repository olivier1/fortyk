import {FortykRolls} from "../FortykRolls.js";
import {FORTYK} from "../FortykConfig.js";

export class FortyKNPCSheet extends ActorSheet {

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

        html.find('.rollable').mouseup(this._onRoll.bind(this));
        html.find('.rollable').click(this._onModifierCall.bind(this));

        //Damage rolls
        html.find('.damage-roll').click(this._onDamageRoll.bind(this));
        //create item on actor
        html.find('.item-create').click(this._onItemCreate.bind(this));
        //edit item on actor
        html.find('.item-edit').click(this._onItemEdit.bind(this));
        //delete item on actor
        html.find('.item-delete').click(this._onItemDelete.bind(this));
        //handles ranged weapon clips
        html.find('.clip-current').keydown(this._onClipEdit.bind(this));
        html.find('.clip-current').focusout(this._onClipEdit.bind(this));

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
       
        if(dataset["itemId"]){

            item=this.actor.getEmbeddedEntity("OwnedItem",dataset["itemId"]);}
        if(testType!=="focuspower"&&testType!=="rangedAttack"&&testType!=="meleeAttack"){
            FortykRolls.callRollDialog(testChar, testType, testTarget, this.actor, testLabel, item, false);
        }else if(testType==="meleeAttack"){
            FortykRolls.callMeleeAttackDialog(testChar, testType, testTarget, this.actor, testLabel, item);
        }else if(testType==="rangedAttack"){
            FortykRolls.callRangedAttackDialog(testChar, testType, testTarget, this.actor, testLabel, item);
        }else if(testType==="focuspower"){
            FortykRolls.callFocusPowerDialog(testChar, testType, testTarget, this.actor, testLabel, item);
        }



    }
    _onDamageRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        if(dataset.weapon){
            let weapon=this.actor.getEmbeddedEntity("OwnedItem",dataset.weapon);
            let actor=this.actor;
            let formula=weapon.data.damageFormula;

            new Dialog({
                title: `Number of Hits`,
                content: `<p><label>Number of Hits:</label> <input type="text" name="hits" value="1" data-dtype="Number" autofocus/></p>`,
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: (el) => {
                            const hits = parseInt(Number($(el).find('input[name="hits"]').val()));


                            FortykRolls.damageRoll(formula,actor,weapon,hits);
                        }
                    }
                },
                default: "submit",


                width:100}
                      ).render(true);



        }else if(dataset.formula){
            let roll = new Roll(dataset.formula, this.actor.data.data);
            let label = dataset.label ? `Rolling ${dataset.label} damage.` : '';
            roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });
        }
    }
    //focuses the modifier input on rolls
    _onModifierCall(event){


        setTimeout(function() {document.getElementById('modifier').select();}, 50);

    }
    //handles when a ranged weapons clip is editted
    _onClipEdit(event){
        clearTimeout(event.currentTarget.timeout);
        event.currentTarget.timeout=setTimeout(async function(event, actor){


            let newClip=event.target.value;
            let dataItemId=event.target.attributes["data-item-id"].value;
            let item= duplicate(actor.actor.getEmbeddedEntity("OwnedItem", dataItemId));
            item.data.clip.value=newClip;
            await actor.actor.updateEmbeddedEntity("OwnedItem",item);},200, event, this);
    }
    //Handle creating a new item, will sort the item type before making the new item

    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset["type"];
        const itemData = {
            name: `new ${type}`,
            type: type
        };
        let item= await this.actor.createEmbeddedEntity("OwnedItem",itemData);


        const newItem = await this.actor.items.find(i => i.data._id == item._id);
        if (newItem.data.type==="meleeWeapon"||newItem.data.type==="rangedWeapon"||newItem.data.type==="psychicPower"||newItem.data.type==="ammunition"){
           
            let flags= duplicate(FORTYK.itemFlags);
            let newData=duplicate(newItem.data);
            newData.flags.specials=flags;

            this.actor.updateEmbeddedEntity("OwnedItem",newData);
        }
        newItem.sheet.render(true);




    }
    //Edits the item that was clicked
    _onItemEdit(event){
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        const item = this.actor.items.find(i => i.data._id == itemId);
        item.sheet.render(true);
    }
    //deletes the selected item from the actor
    _onItemDelete(event){
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/delete-item-dialog.html');
        renderedTemplate.then(content => {
            new Dialog({
                title: "Deletion Confirmation",
                content: content,
                buttons:{
                    submit:{
                        label:"Yes",
                        callback: dlg => { this.actor.deleteItem(itemId);}
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
}