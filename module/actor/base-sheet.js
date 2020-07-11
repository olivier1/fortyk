
/*abstract class that is not used, sets most of the functions that are common to all sheets of the system*/
import {FortykRolls} from "../FortykRolls.js";
import {FORTYK} from "../FortykConfig.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
export default class FortyKBaseActorSheet extends ActorSheet {

    static async create(data, options) {
        data.skillFilter="";
        super.create(data,options);
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
        data.skillChars=FORTYK.skillChars;
        data.skillTraining=FORTYK.skillTraining;
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
        //change item property via text input


        html.find('.item-text-input').focusout(this._itemTextInputEdit.bind(this));
        //get item description
        html.find('.item-descr').click(this._onItemDescrGet.bind(this));
        //handles maximal checkbox
        html.find('.maximal').click(this._onMaximalClick.bind(this));

        //Damage rolls
        html.find('.damage-roll').click(this._onDamageRoll.bind(this));
        //autofcus modifier input
        html.find('.rollable').click(this._onRoll.bind(this));
        //force damage roll
        html.find('.force-roll').click(this._onForceRoll.bind(this));
        // Autoselect entire text 
        $("input[type=text]").focusin(function() {
            $(this).select();
        });

    }
    //Handle the popup when user clicks item name to show item description
    async _onItemDescrGet(event){
        event.preventDefault();
        let descr = event.target.attributes["data-item-descr"].value;
        var options = {
            width: 300,
            height: 400
        };
        var name=event.currentTarget.dataset["name"];

        let dlg = new Dialog({
            title: `${name} Description`,
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

            await this.actor.updateEmbeddedEntity("OwnedItem",newData);
        }
        newItem.sheet.render(true);




    }
    //Edits the item that was clicked
    async _onItemEdit(event){
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        const item = this.actor.items.find(i => i.data._id == itemId);
        item.sheet.render(true);
    }
    //deletes the selected item from the actor
    async _onItemDelete(event){
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
    //handles editing text inputs that are linked to owned items 
   async _itemTextInputEdit(event){


        let actor= this.actor;
    
        let newAmt=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let target=event.target.attributes["data-target"].value;
    
        let item= duplicate(actor.getEmbeddedEntity("OwnedItem", dataItemId));
        
        let oldValue=objectByString(item,target);
        if(oldValue!=newAmt){

            let path=target.split(".");

            setNestedKey(item,path,newAmt);
        
           await this.actor.updateEmbeddedEntity("OwnedItem",item);

        }

    }
    //handles firing mode change for maximal weapons
    async _onMaximalClick(event){
        let dataset=event.currentTarget.dataset;
        let weaponID=dataset["itemId"];
        let weapon=duplicate(this.actor.getEmbeddedEntity("OwnedItem",weaponID));
        if(weapon.flags.specials.maximal.maximal){
            weapon.flags.specials.maximal.maximal=false;
            weapon.flags.specials.recharge.value=false;
            if(weapon.flags.specials.blast.value){
                weapon.flags.specials.blast.num=parseInt(weapon.flags.specials.blast.num)-2;

            }
        }else{
            weapon.flags.specials.maximal.maximal=true;
            weapon.flags.specials.recharge.value=true;
            if(weapon.flags.specials.blast.value){
                weapon.flags.specials.blast.num=parseInt(weapon.flags.specials.blast.num)+2;
            }
        }
        await this.actor.updateEmbeddedEntity("OwnedItem",weapon);

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

        //autofocus the input after it is rendered.
        setTimeout(function() {document.getElementById('modifier').select();}, 50);




    }
    async _onDamageRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        if(dataset.weapon){
            let weapon=this.actor.getEmbeddedEntity("OwnedItem",dataset.weapon);
            let actor=this.actor;
            let formula=weapon.data.damageFormula;

            new Dialog({
                title: `Number of Hits`,
                content: `<p><label>Number of Hits:</label> <input type="text" id="modifier" name="hits" value="1" data-dtype="Number" autofocus/></p>`,
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

            setTimeout(function() {document.getElementById('modifier').select();}, 50);

        }else if(dataset.formula){

            let roll = new Roll(dataset.formula, this.actor.data.data);
            let label = dataset.label ? `Rolling ${dataset.label} damage.` : '';
            roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });

        }
    }
    async _onForceRoll(event){
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        let actor=this.actor;

        new Dialog({
            title: `Force Attack`,
            content: `<p><label>Number of Dice:</label> <input type="text" id="modifier" name="hits" value="1" data-dtype="Number" autofocus/></p>`,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: async (el) =>  {
                        const hits = parseInt(Number($(el).find('input[name="hits"]').val()));
                        let flags= duplicate(FORTYK.itemFlags);
                        let forceData={name:"Force",type:"rangedWeapon"}
                        let force=await Item.create(forceData, {temporary: true});

                        force.data.flags.specials=flags;
                        force.data.flags.specials.ignoreSoak.value=true;
                        force.data.data.damageFormula.value=`${hits}d10`;
                        force.data.data.damageType.value="Energy";

                        FortykRolls.damageRoll(force.data.data.damageFormula,actor,force.data,1);
                    }
                }
            },
            default: "submit",


            width:100}
                  ).render(true);

        setTimeout(function() {document.getElementById('modifier').select();}, 50);
    }

}