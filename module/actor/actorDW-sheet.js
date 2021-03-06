import {FortykRolls} from "../FortykRolls.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import FortyKBaseActorSheet from "./base-sheet.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export default class FortyKDWActorSheet extends FortyKBaseActorSheet {


    /** @override */

    static get defaultOptions() {

        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actor-sheet.html",
            width: 666,
            height: 660,
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

        //change cybernetic location
        html.find('.cyber-location-select').change(this._onCyberLocationEdit.bind(this));
        //create different types of wargear
        html.find('.wargear-create').click(this._onWargearCreate.bind(this));


        //handles combat tab resources

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

        //filters
        html.find('.skillfilter').keyup(this._onFilterChange.bind(this));

    }

    /* -------------------------------------------- */




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

    /**
    *Handle select change for cybernetic location selector
    * @param {Event} event   The originating click event
    * @private
    */
    async _onCyberLocationEdit(event){
        event.preventDefault();

        let newLoc=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= duplicate(this.actor.getEmbeddedDocument("Item", dataItemId));
        item.data.location.value=newLoc;
        item.update({"data.location.value":newLoc});


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
        let item= duplicate(this.actor.getEmbeddedDocument("Item", dataItemId));
        item.update({"data.characteristic.value":newChar});

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
        item.update({"data.value":newAdv});



    }



    //handles the duplicate inputs for wounds fatigue fate points etc on the combat tab

    async _combatResourceEdit(event){

        event.preventDefault();
        let actor=this.actor;

        let target=event.target.attributes["data-target"].value;
        let newAmt=event.target.value;

        let oldValue=objectByString(actor.data,target);
        if(oldValue!=newAmt){
            let options={};
            options[target]=newAmt;
            await actor.update(options);
        }

    }
    //handles adding extra worn weapon slots
    async _onAddExtraWeapon(event){
        let actor=this.actor;
        let data=duplicate(actor.data);

        let weapons=Object.values(data.data.secChar.wornGear.weapons);
        weapons.push("");
        let weaponsObj=Object.assign({},weapons);
        await actor.update({"data.secChar.wornGear.weapons":weaponsObj});

    }
    //handles removing extra weapon slots
    async _onRemoveExtraWeapon(event){
        let actor=this.actor;
        let data=duplicate(actor.data.data);
        let weapons=Object.values(data.secChar.wornGear.weapons);

        if(weapons.length>2){

            weapons.pop();

            await actor.update({"data.secChar.wornGear.weapons":weapons});
        }

    }

    //handles when swapping ammo type in a ranged weapon
    async _onAmmoChange(event){

        event.preventDefault;
        const dataset=event.currentTarget.dataset;
        const weapon=this.actor.getEmbeddedDocument("Item",dataset["weapon"]);
        
        const previousAmmo=this.actor.getEmbeddedDocument("Item",dataset["previous"]);
        const ammoID=event.currentTarget.value;
        const ammo=this.actor.getEmbeddedDocument("Item",ammoID);
        
        let weaponUpdate={}
        weaponUpdate["data.ammo._id"]=ammoID;
        
        


        if(previousAmmo!==undefined&&previousAmmo.data.data!==undefined){

            
            
            previousAmmo.update({"data.currentClip.value":weaponData.data.clip.value});
        }
        if(ammo!==undefined){
            weaponUpdate["data.clip.value"]=ammo.data.data.currentClip.value;
        }else{
            weaponUpdate["data.clip.value"]=0;
        }
        

        weapon.update(weaponUpdate);



    }
    //handles reloading a ranged weapon
    async _onWeaponReload(event){
        event.preventDefault;
        const dataset=event.currentTarget.dataset;
        let weapon=null;

        let actor=this.actor;
        let update=[];
        for(let w of actor.data.wornGear.weapons){

            if(w._id===dataset.weapon){
                weapon=w.document;
            }
        }
        let weaponUpdate={};
        let ammoUpdate={};

        let ooa=false;
        //different logic for throwing weapons
        if(weapon.data.data.class.value!=="Thrown"){
            const ammo=this.actor.getEmbeddedDocument("Item",weapon.data.data.ammo._id);

            if(ammo!==null){
                let ammoAmt=parseInt(ammo.data.data.amount.value);

                if(ammoAmt>0){
                    weaponUpdate["data.clip.value"]=weapon.data.data.clip.max;
                    ammoUpdate["data.amount.value"]=ammoAmt-1
                    weapon.update(weaponUpdate);
                    ammo.update(ammoUpdate);
                    

                }else{
                    ooa=true;
                } 
            }else{
                return;
            }

        }else{
            if(weapon.data.data.amount.value>0){
                
                 weaponUpdate["data.clip.value"]=weapon.data.data.clip.max;
                 weaponUpdate["data.amount.value"]=parseInt(weapon.data.data.amount.value)-1;
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
    _onWeaponChange(event){

        const data=this.actor.data.data;


        let actor=this.actor;

        let weapon=actor.items.get(event.currentTarget.value);
        if(weapon){
            weapon=weapon.data;
        }
        const weaponID=event.currentTarget.value;
        const hand=event.currentTarget.dataset["hand"];
        const leftHand=document.getElementById("left");
        const rightHand=document.getElementById("right");
        var update={};
        if(hand==="right"){
            if(weaponID===data.secChar.wornGear.weapons[1]){return}
            rightHand.value=weaponID;

            update["data.secChar.wornGear.weapons.1"]=weaponID;
            let oppWeapon=this.actor.getEmbeddedDocument("Item",data.secChar.wornGear.weapons[0]);
            if(weaponID===""&&data.secChar.wornGear.weapons[1]==="2hand"){
                update["data.secChar.wornGear.weapons.0"]="";



            }

            if(weaponID===""){}
            else if(!weapon.data.twohanded.value){

                if(data.secChar.wornGear.weapons[1]==="2hand"){

                    update["data.secChar.wornGear.weapons.0"]="";


                }
            }else{
                update["data.secChar.wornGear.weapons.0"]="2hand";


            }

        }else if(hand==="left"){
            if(weaponID===data.secChar.wornGear.weapons[0]){return}
            leftHand.value=weaponID;
            update["data.secChar.wornGear.weapons.0"]=weaponID;
            let oppWeapon=this.actor.getEmbeddedDocument("Item",data.secChar.wornGear.weapons[1]);
            if(weaponID===""&&data.secChar.wornGear.weapons[1]==="2hand"){

                update["data.secChar.wornGear.weapons.1"]="";


            }

            if(weaponID===""){}
            else if(!weapon.data.twohanded.value){

                if(data.secChar.wornGear.weapons[1]==="2hand"){


                    update["data.secChar.wornGear.weapons.1"]="";

                }
            }else{

                update["data.secChar.wornGear.weapons.1"]="2hand";


            }

        }
        this.actor.update(update);
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
