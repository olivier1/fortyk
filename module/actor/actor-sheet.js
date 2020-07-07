import {FortykRolls} from "../FortykRolls.js";
import {FORTYK} from "../FortykConfig.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
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
        //change item property via text input

        html.find('.item-text-input').keydown(this._onItemTextInputEdit.bind(this));
        html.find('.item-text-input').focusout(this._itemTextInputEdit.bind(this));
        //change cybernetic location
        html.find('.cyber-location-select').change(this._onCyberLocationEdit.bind(this));
        //create different types of wargear
        html.find('.wargear-create').click(this._onWargearCreate.bind(this));
       
       
        //handles combat tab resources
        html.find('.combat-resources').keydown(this._onCombatResourceEdit.bind(this));
        html.find('.combat-resources').focusout(this._combatResourceEdit.bind(this));
        //handles adding or removing worn weapon slots
        html.find('.worn-item-plus').click(this._onAddExtraWeapon.bind(this));
        html.find('.worn-item-minus').click(this._onRemoveExtraWeapon.bind(this));
      
        //handles changing ammo type
        html.find('.weapon-ammo').change(this._onAmmoChange.bind(this));
        //handles reloading a ranged weapon
        html.find('.weapon-reload').click(this._onWeaponReload.bind(this));
        //handles swapping weapons
        html.find('.hand-weapon').change(this._onWeaponChange.bind(this));
        //handles maximal checkbox
        html.find('.maximal').click(this._onMaximalClick.bind(this));
        //get item description
        html.find('.item-descr').click(this._onItemDescrGet.bind(this));
        //filters
        html.find('.filter').keydown(this._onFilterChange.bind(this));
        // Rollable abilities.
        html.find('.rollable').mouseup(this._onRoll.bind(this));
        //Damage rolls
        html.find('.damage-roll').click(this._onDamageRoll.bind(this));
        //autofcus modifier input
        html.find('.rollable').click(this._onModifierCall.bind(this));
        // Autoselect entire text 
        $("input[type=text]").focusin(function() {
            $(this).select();
        });
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
        if (newItem.data.type==="meleeWeapon"||newItem.data.type==="rangedWeapon"||newItem.data.type==="psychicPower"||newItem.data.type==="ammunition"){

            let flags= duplicate(FORTYK.itemFlags);
            let newData=duplicate(newItem.data);
            newData.flags.specials=flags;

            this.actor.updateEmbeddedEntity("OwnedItem",newData);
        }
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
                            if (newItem.data.type==="meleeWeapon"||newItem.data.type==="rangedWeapon"||newItem.data.type==="psychicPower"||newItem.data.type==="ammunition"){

                                let flags= duplicate(FORTYK.itemFlags);
                                let newData=duplicate(newItem.data);
                                newData.flags.specials=flags;

                                this.actor.updateEmbeddedEntity("OwnedItem",newData);
                            }
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
    async _onWargearAmountEdit(event){

        clearTimeout(event.currentTarget.timeout);
        event.currentTarget.timeout=setTimeout(this._wargearAmountEdit,500, event, this.actor);
    }
    async _wargearAmountEdit(event,actor=null){
       
        if(actor===null){actor=this.actor}
        clearTimeout(event.currentTarget.timeout);
        let newAmt=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= duplicate(actor.getEmbeddedEntity("OwnedItem", dataItemId));
        if(item.data.amount.value!=newAmt){
            item.data.amount.value=newAmt;
            actor.updateEmbeddedEntity("OwnedItem",item);
        }

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

   
   //handles editing text inputs that are linked to owned items 
    async _onItemTextInputEdit(event){
        clearTimeout(event.currentTarget.timeout);
        
        event.currentTarget.timeout=setTimeout(this._itemTextInputEdit,500, event, this.actor);
    }
    async _itemTextInputEdit(event,actor=null){
       
        clearTimeout(event.currentTarget.timeout);
        if(actor===null){actor=this.actor}
        
        let newAmt=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let target=event.target.attributes["data-target"].value;
        let item= duplicate(actor.getEmbeddedEntity("OwnedItem", dataItemId));
        let oldValue=objectByString(item,target);
        if(oldValue!=newAmt){
          
            let path=target.split(".");
            
            setNestedKey(item,path,newAmt);
           
            actor.updateEmbeddedEntity("OwnedItem",item);
        }

    }
    //handles the duplicate inputs for wounds fatigue fate points etc on the combat tab
    async _onCombatResourceEdit(event){
        clearTimeout(event.currentTarget.timeout);
        
        event.currentTarget.timeout=setTimeout(this._combatResourceEdit,500, event, this.actor);
            
            
    }
    async _combatResourceEdit(event,actor=null){
        clearTimeout(event.currentTarget.timeout);
        
        if(actor===null){actor=this.actor}
        clearTimeout(event.currentTarget.timeout);
        let target=event.target.attributes["data-target"].value;
        let newAmt=event.target.value;
       
        let oldValue=objectByString(actor.data,target);
        if(oldValue!=newAmt){
            let options={};
            options[target]=newAmt;
           actor.update(options);
        }

    }
    //handles adding extra worn weapon slots
    _onAddExtraWeapon(event){
        let actor=this.actor;
        let data=duplicate(actor.data.data);
        
        let weapons=Object.values(data.secChar.wornGear.weapons);
        weapons.push("");
        actor.update({"data.secChar.wornGear.weapons":weapons});
    }
    //handles removing extra weapon slots
    _onRemoveExtraWeapon(event){
        let actor=this.actor;
        let data=duplicate(actor.data.data);
        let weapons=Object.values(data.secChar.wornGear.weapons);
        if(weapons.length>2){

            weapons.pop();
            actor.update({"data.secChar.wornGear.weapons":weapons});
        }

    }
   
    //handles when swapping ammo type in a ranged weapon
    _onAmmoChange(event){

        event.preventDefault;
        const dataset=event.currentTarget.dataset;
        const weapon=duplicate(this.actor.getEmbeddedEntity("OwnedItem",dataset["weapon"]));
        const previousAmmo=duplicate(this.actor.getEmbeddedEntity("OwnedItem",dataset["previous"]));
        const ammoID=event.currentTarget.value;
        const ammo=this.actor.getEmbeddedEntity("OwnedItem",ammoID);
        weapon.data.ammo._id=ammoID;


        if(previousAmmo!==null&&previousAmmo.data!==undefined){
            previousAmmo.data.currentClip.value=weapon.data.clip.value;
            this.actor.updateEmbeddedEntity("OwnedItem",previousAmmo);
        }
        if(ammo!==null){
            weapon.data.clip.value=ammo.data.currentClip.value;
        }else{
            weapon.data.clip.value=0;
        }

        this.actor.updateEmbeddedEntity("OwnedItem",weapon);



    }
    //handles reloading a ranged weapon
    async _onWeaponReload(event){
        event.preventDefault;
        const dataset=event.currentTarget.dataset;

        const weapon=duplicate(this.actor.getEmbeddedEntity("OwnedItem",dataset["weapon"]));

        let ooa=false;
        //different logic for throwing weapons
        if(weapon.data.class.value!=="Thrown"){
            const ammo=duplicate(this.actor.getEmbeddedEntity("OwnedItem",weapon.data.ammo._id));

            if(ammo!==null){
                let ammoAmt=parseInt(ammo.data.amount.value);

                if(ammoAmt>0){
                    weapon.data.clip.value=weapon.data.clip.max;
                    ammo.data.amount.value=ammoAmt-1;

                    await this.actor.updateEmbeddedEntity("OwnedItem",weapon);
                    await this.actor.updateEmbeddedEntity("OwnedItem",ammo);

                }else{
                    ooa=true;
                } 
            }else{
                return;
            }

        }else{
            if(weapon.data.amount.value>0){
                weapon.data.amount.value=parseInt(weapon.data.amount.value)-1;
                weapon.data.clip.value=weapon.data.clip.max;
                this.actor.updateEmbeddedEntity("OwnedItem",weapon);
            }else{
                ooa=true;
            }

        }
        //check if out of ammo to reload
        if(ooa){
            new Dialog({
                title: `Out of Ammunition!`,
                content: `You are out of ammunition and cannot reload.`,
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: null
                    }
                },
                default: "submit",


                width:100}
                      ).render(true);
        }



    }
    //handles when weapons are swapped and stuff
    _onWeaponChange(event){

        const data=this.actor.data.data;
        const weapon=this.actor.getEmbeddedEntity("OwnedItem",event.currentTarget.value);
        const weaponID=event.currentTarget.value;
        const hand=event.currentTarget.dataset["hand"];
        const leftHand=document.getElementById("left");
        const rightHand=document.getElementById("right");

        if(hand==="right"){
            rightHand.value=weaponID;
            let oppWeapon=this.actor.getEmbeddedEntity("OwnedItem",data.secChar.wornGear.weapons[0]);
            if(weaponID===""&&data.secChar.wornGear.weapons[1]==="2hand"){

                this.actor.update({"data.secChar.wornGear.weapons.0":''});
                leftHand.value='';
                return
            }

            if(weaponID===""){return};
            if(!weapon.data.twohanded.value){

                if(data.secChar.wornGear.weapons[1]==="2hand"){

                    this.actor.update({"data.secChar.wornGear.weapons.0":""});
                    leftHand.value='';
                }
            }else{

                this.actor.update({"data.secChar.wornGear.weapons.0":"2hand"});
                leftHand.value='2hand';
            }

        }else if(hand==="left"){
            leftHand.value=weaponID;
            let oppWeapon=this.actor.getEmbeddedEntity("OwnedItem",data.secChar.wornGear.weapons[1]);
            if(weaponID===""&&data.secChar.wornGear.weapons[1]==="2hand"){

                this.actor.update({"data.secChar.wornGear.weapons.1":''});
                rightHand.value='';
                return
            }

            if(weaponID===""){return};
            if(!weapon.data.twohanded.value){

                if(data.secChar.wornGear.weapons[1]==="2hand"){


                    this.actor.update({"data.secChar.wornGear.weapons.1":""});
                    rightHand.value='';
                }
            }else{

                this.actor.update({"data.secChar.wornGear.weapons.1":"2hand"});
                rightHand.value='2hand';

            }

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
        this.actor.updateEmbeddedEntity("OwnedItem",weapon);

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
    //autofocuses the modifier input on a roll
    _onModifierCall(event){


        setTimeout(function() {document.getElementById('modifier').select();}, 50);

    }
    _onFilterChange(event){


    }

}
