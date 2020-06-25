import {FortykRolls} from "../FortykRolls.js";
import {FORTYK} from "../FortykConfig.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class FortyKActorSheet extends ActorSheet {

    static async create(data, options) {
        data.skillFilter="";
        super.create(data,options);
    }
    /** @override */

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actor-sheet.html",
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
        //change cybernetic location
        html.find('.cyber-location-select').change(this._onCyberLocationEdit.bind(this));
        //create different types of wargear
        html.find('.wargear-create').click(this._onWargearCreate.bind(this));
        //change the amount of a piece of equipment
        html.find('.wargear-amount').keydown(this._onWargearAmountEdit.bind(this));
        html.find('.wargear-amount').focusout(this._onWargearAmountEdit.bind(this));
        //change active pr for psy power
        html.find('.psy-pr').keydown(this._onPRedit.bind(this));
        html.find('.psy-pr').focusout(this._onPRedit.bind(this));
        //handles combat tab resources
        html.find('.combat-resources').keydown(this._onCombatResourceEdit.bind(this));
        html.find('.combat-resources').focusout(this._onCombatResourceEdit.bind(this));
        //handles ranged weapon clips
        html.find('.clip-current').keydown(this._onClipEdit.bind(this));
        html.find('.clip-current').focusout(this._onClipEdit.bind(this));
        //handles swapping weapons
        html.find('.hand-weapon').change(this._onWeaponChange.bind(this));
        //get item description
        html.find('.item-descr').click(this._onItemDescrGet.bind(this));
        //filters
        html.find('.filter').keydown(this._onFilterChange.bind(this));
        // Rollable abilities.
        html.find('.rollable').click(this._onRoll.bind(this));
        //Damage rolls
        html.find('.damage-roll').click(this._onDamageRoll.bind(this));
    }

    /* -------------------------------------------- */


    //Handle the popup when user clicks item name to show item description
    _onItemDescrGet(event){
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
        newItem.sheet.render(true);




    }
    //handle creating a wargear item, these can be several types of different item types
    async _onWargearCreate(event){
        event.preventDefault();
        let templateOptions={"type":[{"name":"wargear","label":"Wargear"},{"name":"meleeWeapon","label":"Melee Weapon"},{"name":"rangedWeapon","label":"Ranged Weapon"},{"name":"ammunition","label":"Ammunition"},{"name":"armor","label":"Armor"},{"name":"forceField","label":"Forcefield"},{"name":"mod","label":"Mod"},{"name":"consummable","label":"Consummable"}]};

        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/select-wargear-type-dialog.html', templateOptions);

        renderedTemplate.then(content => { 
            new Dialog({
                title: "New Wargear Type",
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

                            let item=  await this.actor.createEmbeddedEntity("OwnedItem",itemData);
                            const newItem =  await this.actor.items.find(i => i.data._id == item._id);
                            newItem.sheet.render(true);
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
    //handles when a wargear amount is changed
    _onWargearAmountEdit(event){

        clearTimeout(event.currentTarget.timeout);
        event.currentTarget.timeout=setTimeout(async function(event, actor){


            let newAmt=event.target.value;
            let dataItemId=event.target.attributes["data-item-id"].value;
            let item= duplicate(actor.actor.getEmbeddedEntity("OwnedItem", dataItemId));
            item.data.amount.value=newAmt;
            await actor.actor.updateEmbeddedEntity("OwnedItem",item);},200, event, this);
    }
    /**
    *Handle select change for cybernetic location selector
    * @param {Event} event   The originating click event
    * @private
    */
    async _onCyberLocationEdit(event){
        event.preventDefault();

        let newLoc=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= duplicate(this.actor.getEmbeddedEntity("OwnedItem", dataItemId));
        item.data.location.value=newLoc;


        await this.actor.updateEmbeddedEntity("OwnedItem",item);


    }
    //handles when a psychic power changes its pr value
    async _onPRedit(event){
        clearTimeout(event.currentTarget.timeout);

        const newPR=event.currentTarget.value;


        event.currentTarget.timeout=setTimeout(async function(event, actor){
            const newPR=event.currentTarget.value;


            let dataItemId=event.target.attributes["data-item-id"].value;
            let item= duplicate(actor.actor.getEmbeddedEntity("OwnedItem", dataItemId));

            item.data.curPR.value=newPR;

            await actor.actor.updateEmbeddedEntity("OwnedItem",item);},200, event, this); 
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
    /**
    *Handle select change for skill characterteristic selector
    * @param {Event} event   The originating change event
    * @private
    */
    async _onSkillCharEdit(event){

        event.preventDefault();
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
        event.preventDefault();
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
            await actor.actor.updateEmbeddedEntity("OwnedItem",item);},200, event, this);



    }
    //handles the duplicate inputs for wounds fatigue fate points etc on the combat tab
    async _onCombatResourceEdit(event){
        clearTimeout(event.currentTarget.timeout);
        var actor=this.actor;
        event.currentTarget.timeout=setTimeout(async function(event, actor){


            let newValue=event.target.value;
            let target=event.target.attributes["data-target"].value;

            let options={};
            options[target]=newValue;
            actor.actor.update(options);},200, event, this);
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
    //handles when weapons are swapped and stuff
    _onWeaponChange(event){
        const data=this.actor.data.data;
        const weapon=this.actor.getEmbeddedEntity("OwnedItem",event.currentTarget.value);
        const weaponID=event.currentTarget.value;
        const hand=event.currentTarget.dataset["hand"];


        if(hand==="right"){
            let oppWeapon=this.actor.getEmbeddedEntity("OwnedItem",data.secChar.wornGear.leftHand._id);
            if(oppWeapon!==null&&weaponID===""&&(oppWeapon.data.twohanded.value)){

                this.actor.update({"data.secChar.wornGear.leftHand._id":""});
                return
            }
            if(weaponID===""||oppWeapon===null){return}
            if(!weapon.data.twohanded.value){
                if(oppWeapon.data.twohanded.value){

                    this.actor.update({"data.secChar.wornGear.leftHand._id":""});
                }
            }else{
                this.actor.update({"data.secChar.wornGear.leftHand._id":weaponID});
            }
        }else if(hand==="left"){
            let oppWeapon=this.actor.getEmbeddedEntity("OwnedItem",data.secChar.wornGear.rightHand._id);
            if(oppWeapon!==null&weaponID===""&&(oppWeapon.data.twohanded.value)){

                this.actor.update({"data.secChar.wornGear.rightHand._id":""});
                return
            }
            if(weaponID===""||oppWeapon===null){return}
            if(!weapon.data.twohanded.value){
                if(oppWeapon.data.twohanded.value){

                    this.actor.update({"data.secChar.wornGear.rightHand._id":""});
                }
            }else{
                this.actor.update({"data.secChar.wornGear.rightHand._id":weaponID});
            }
        }
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


        new Dialog({
            title: `${testLabel} Test`,
            content: `<p><label>Modifier:</label> <input type="text" name="modifier" value="0" data-dtype="Number" autofocus/></p>`,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (el) => {
                        const bonus = Number($(el).find('input[name="modifier"]').val());

                        testTarget+=parseInt(bonus);
                        FortykRolls.fortykTest(testChar, testType, testTarget, this.actor, testLabel);
                    }
                }
            },
            default: "submit",


            width:100}
                  ).render(true);



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
    _onFilterChange(event){


    }

}
