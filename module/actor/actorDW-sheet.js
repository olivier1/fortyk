import {FortykRolls} from "../FortykRolls.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import FortyKBaseActorSheet from "./base-sheet.js";
import {FortyKItem} from "../item/item.js";
import {SpendExpDialog} from "../dialog/spendExp-dialog.js";
/**
 * 
 * @extends {ActorSheet}
 */
export default class FortyKDWActorSheet extends FortyKBaseActorSheet {


    /** @override */

    static get defaultOptions() {

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actor-sheet.html",
            width: 666,
            height: 825,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "main" }],
            default:null
        });
    }



    /** @override */
    activateListeners(html) {
        super.activateListeners(html);




        //change skill characteristic
        html.find('.skill-char').change(this._onSkillCharEdit.bind(this));
        //change skill advancement
        html.find('.skill-adv').change(this._onSkillAdvEdit.bind(this));
        //favorite psychic power
        html.find('.favorite').click(this._onFavoriteClick.bind(this));
        //change cybernetic location
        html.find('.cyber-location-select').change(this._onCyberLocationEdit.bind(this));
        //change navigator power training
        html.find('.power-training').change(this._onPowerTrainingEdit.bind(this));
        //create different types of wargear
        html.find('.wargear-create').click(this._onWargearCreate.bind(this));

        //focus skill search
        
        html.find('.sheet-tabs').click(this._onSkillsTab.bind(this));
        //spend exp button
        html.find('.spend-exp').click(this._onSpendExp.bind(this));
        //handles adding or removing worn weapon slots
        html.find('.worn-item-plus').click(this._onAddExtraWeapon.bind(this));
        html.find('.worn-item-minus').click(this._onRemoveExtraWeapon.bind(this));
        html.find('.extra-weapon').change(this._onExtraWeaponChange.bind(this));
        //handles changing ammo type
        html.find('.weapon-ammo').change(this._onAmmoChange.bind(this));
        //handles reloading a ranged weapon
        html.find('.weapon-reload').click(this._onWeaponReload.bind(this));
        //handles swapping weapons
        html.find('.hand-weapon').change(this._onWeaponChange.bind(this));

        //filters
        html.find('.skillfilter').keyup(this._onFilterChange.bind(this));

    }

    /* -------------------------------------------- */

    _onSkillsTab(event){
        const tab = $(event.target.closest("[data-tab]")).html();
        
        if(tab==="SKILLS"){
          document.getElementById("skillfilter").select();  
        }
        

    }
    async _onSpendExp(event){
        event.preventDefault();
        let dialog=new SpendExpDialog({actor:this.actor});
        dialog.render(true,{title:"Add Advancements"});

    }

    //handle creating a wargear item, these can be several types of different item types
    async _onWargearCreate(event){
        event.preventDefault();
        let templateOptions={"type":[{"name":"wargear","label":"Wargear"},{"name":"meleeWeapon","label":"Melee Weapon"},{"name":"rangedWeapon","label":"Ranged Weapon"},{"name":"ammunition","label":"Ammunition"},{"name":"armor","label":"Armor"},{"name":"forceField","label":"Forcefield"}/*,{"name":"consummable","label":"Consummable"}*/]};

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

                            let item=await FortyKItem.create(itemData,{temporary:true});
                            await this.actor.createEmbeddedDocuments("Item",[foundry.utils.duplicate(item)],{"renderSheet":true});





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

    /**
    *Handle select change for cybernetic location selector
    * @param {Event} event   The originating click event
    * @private
    */
    async _onCyberLocationEdit(event){

        event.preventDefault();

        let newLoc=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= this.actor.getEmbeddedDocument("Item", dataItemId);

        item.update({"system.location.value":newLoc});


    }

    async _onPowerTrainingEdit(event){
        event.preventDefault();

        let newTraining=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= this.actor.getEmbeddedDocument("Item", dataItemId);

        item.update({"system.training.value":newTraining});


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
        let item= this.actor.getEmbeddedDocument("Item", dataItemId);
        item.update({"system.characteristic.value":newChar});

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
        let item= this.actor.getEmbeddedDocument("Item", dataItemId);
        item.update({"system.value":newAdv});



    }




    //handles adding extra worn weapon slots
    async _onAddExtraWeapon(event){
        let actor=this.actor;
        let data=foundry.utils.duplicate(actor);

        let weapons=Object.values(data.system.secChar.wornGear.extraWeapons);
        weapons.push({});
        let weaponsObj=Object.assign({},weapons);
        await actor.update({"system.secChar.wornGear.extraWeapons":weaponsObj});

    }
    //handles removing extra weapon slots
    async _onRemoveExtraWeapon(event){
        let actor=this.actor;
        let data=foundry.utils.duplicate(actor.system);
        let weapons=Object.values(data.secChar.wornGear.extraWeapons);

        if(weapons.length>0){

            weapons.pop();

            await actor.update({"system.secChar.wornGear.extraWeapons":weapons});
        }

    }
    async _onExtraWeaponChange(event){
        let actor=this.actor;
        const weaponId=event.currentTarget.value;
        const index=parseInt(event.currentTarget.dataset["index"]);
        const previousWeaponId=this.actor.system.secChar.wornGear.extraWeapons[index].id;
        let str="extra"+index;
        let updates=[];
        if(weaponId!==""){
            updates.push({"_id":weaponId,"system.isEquipped":str});
        }
        if(previousWeaponId!==undefined){
            updates.push({"_id":previousWeaponId,"system.isEquipped":false});
        }
        if(updates.length>0){
            await actor.updateEmbeddedDocuments("Item",updates);
        }

    }
    //handles when swapping ammo type in a ranged weapon
    async _onAmmoChange(event){

        event.preventDefault;
        const dataset=event.currentTarget.dataset;
        const weapon=this.actor.getEmbeddedDocument("Item",dataset["weapon"]);
        if(!weapon){return};

        let weaponData=weapon;
        const previousAmmo=this.actor.getEmbeddedDocument("Item",dataset["previous"]);
        const ammoID=event.currentTarget.value;
        const ammo=this.actor.getEmbeddedDocument("Item",ammoID);
        let weaponUpdate={}
        weaponUpdate["system.ammo._id"]=ammoID;




        if(previousAmmo!==undefined&&previousAmmo.system!==undefined){



            previousAmmo.update({"system.currentClip.value":weapon.system.clip.value});
        }
        if(ammo!==undefined){
            weaponUpdate["system.clip.value"]=ammo.system.currentClip.value;
        }else{
            weaponUpdate["system.clip.value"]=0;
        }


        weapon.update(weaponUpdate);



    }
    //handles reloading a ranged weapon
    async _onWeaponReload(event){
        event.preventDefault;
        const dataset=event.currentTarget.dataset;

        let weapon=this.actor.getEmbeddedDocument("Item",dataset.weapon);

        let actor=this.actor;
        let update=[];
        let weaponUpdate={};
        let ammoUpdate={};

        let ooa=false;
        //different logic for throwing weapons
        if(weapon.system.class.value!=="Thrown"){
            const ammo=this.actor.getEmbeddedDocument("Item",weapon.system.ammo._id);

            if(ammo!==null){
                let ammoAmt=parseInt(ammo.system.amount.value);

                if(ammoAmt>0){
                    weaponUpdate["system.clip.value"]=weapon.system.clip.max;
                    ammoUpdate["system.amount.value"]=ammoAmt-1
                    weapon.update(weaponUpdate);
                    ammo.update(ammoUpdate);


                }else{
                    ooa=true;
                } 
            }else{
                return;
            }

        }else{
            if(weapon.system.amount.value>0){

                weaponUpdate["system.clip.value"]=weapon.system.clip.max;
                weaponUpdate["system.amount.value"]=parseInt(weapon.system.amount.value)-1;
                weapon.update(weaponUpdate);
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
    async _onWeaponChange(event){
        event.preventDefault;
        const data=this.actor.system;

        let actor=this.actor;
        let weapon=actor.items.get(event.currentTarget.value);

       
        const weaponID=event.currentTarget.value;
        const hand=event.currentTarget.dataset["hand"];
        const leftHand=document.getElementById("left");
        const rightHand=document.getElementById("right");
        var update=[];
        var previousWeaponID="";
        if(hand==="right"){
            previousWeaponID=data.secChar.wornGear.weapons[1].id;
            if(previousWeaponID){
                update.push({"_id":previousWeaponID,"system.isEquipped":false});
            }
            if(weaponID!==""){
                if(weapon.system.twohanded.value){
                    update.push({"_id":weaponID,"system.isEquipped":"rightleft"});
                    let offHandWeaponId=data.secChar.wornGear.weapons[0].id;
                    if(offHandWeaponId){
                        update.push({"_id":offHandWeaponId,"system.isEquipped":false});
                    }
                }else{
                    update.push({"_id":weaponID,"system.isEquipped":"right"});
                }

            }

        }else if(hand==="left"){

            previousWeaponID=data.secChar.wornGear.weapons[0].id;
            if(previousWeaponID){
                update.push({"_id":previousWeaponID,"system.isEquipped":false});
            }
            if(weaponID!==""){
                if(weapon.system.twohanded.value){
                    update.push({"_id":weaponID,"system.isEquipped":"rightleft"});
                    let offHandWeaponId=data.secChar.wornGear.weapons[1].id;
                    if(offHandWeaponId){
                        update.push({"_id":offHandWeaponId,"system.isEquipped":false});
                    }
                }else{
                    update.push({"_id":weaponID,"system.isEquipped":"left"});
                }
            }

        }


        if(update.length>0){
            await this.actor.updateEmbeddedDocuments("Item",update);
        }


    }
    async _onFavoriteClick(event){
        let dataset=event.currentTarget.dataset;
        let powerID=dataset["itemId"];
        let power=this.actor.items.get(powerID);

        let favorite=power.system.favorite;
        if(favorite){
            await power.update({"system.favorite":false});
        }else{
            await power.update({"system.favorite":true});
        }
        await this.actor.prepare();
    }

    _onFilterChange(event){

        let skills=document.getElementsByName("skill");
        let skillHeads=document.getElementsByName("skillheads");

        let filterInput=document.getElementById("skillfilter");
        let filter=filterInput.value.toLowerCase();
        for(let i=0;i<skills.length;i++){
            let skill=skills[i];
            let elements=skill.getElementsByTagName("a");
            let nameElement=elements[0];
            let skillName=nameElement.attributes["data-name"].value.toLowerCase();
            if(skillName.indexOf(filter)>-1){
                skill.style.display="";
            }else{
                skill.style.display="none";
            }
        }
        for(let index=0;index<skillHeads.length;index++){
            if(filter===""){
                skillHeads[index].style.display="";
            }else{
                skillHeads[index].style.display="none";
            }
        }
    }

}
