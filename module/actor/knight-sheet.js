import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import FortyKBaseActorSheet from "./base-sheet.js";
import {objectByString} from "../utilities.js";
export class FortyKKnightSheet extends FortyKBaseActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/knight-sheet.html",
            width: 666,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "mechbay" }],
            default:null,
            scrollY: [
                ".left-mechbay"
            ]

        });
    }
    /** @override */
    async getData() {
        const data = super.getData();
        const actor=this.actor;
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.houses=Array.from(game.actors.values()).filter(actor=>actor.isOwner&&actor.type==="knightHouse");
        if(data.data.knight.house){
            let house=game.actors.get(data.data.knight.house);
            data.meleeWeapons=house.itemTypes.meleeWeapon;
            data.rangedWeapons=house.itemTypes.rangedWeapon.filter(weapon=>weapon.data.data.class.value==="Titanic Ranged Weapon");
            data.artilleryWeapons=house.itemTypes.rangedWeapon.filter(weapon=>weapon.data.data.class.value==="Titanic Artillery Weapon");
            data.auxiliaryWeapons=house.itemTypes.rangedWeapon.filter(weapon=>weapon.data.data.class.value!=="Titanic Ranged Weapon"&&weapon.data.data.class.value!=="Titanic Artillery Weapon");
            data.ammunition=house.itemTypes.ammunition;
            data.components=house.itemTypes.knightComponent;
            data.armors=house.itemTypes.knightArmor;
            data.cores=house.itemTypes.knightCore;
            data.structures=house.itemTypes.knightStructure;
        }
        if(data.data.knight.chassis){
            data.carapaceHardPoints=duplicate(data.data.chassis.data.data.hardPoints.carapace);

            for (let [key, wpnType] of Object.entries(data.carapaceHardPoints)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        wpnType[i]=actor.getEmbeddedDocument("Item",wpnType[i]);
                    }
                }
            }
            data.leftArmHardPoints=data.data.chassis.data.data.hardPoints.leftArm;
            for (let [key, wpnType] of Object.entries(data.leftArmHardPoints)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        wpnType[i]=actor.getEmbeddedDocument("Item",wpnType[i]);
                    }
                }
            }
            data.torsoHardPoints=data.data.chassis.data.data.hardPoints.torso;
            for (let [key, wpnType] of Object.entries(data.torsoHardPoints)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        wpnType[i]=actor.getEmbeddedDocument("Item",wpnType[i]);
                    }
                }
            }
            data.rightArmHardPoints=data.data.chassis.data.data.hardPoints.rightArm;
            for (let [key, wpnType] of Object.entries(data.rightArmHardPoints)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        wpnType[i]=actor.getEmbeddedDocument("Item",wpnType[i]);
                    }
                }
            }
        }


        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
        html.find('.rollable').click(this._onRoll.bind(this));
        html.find('.mechBat').click(this._onMechbayTabClick.bind(this));
        html.find('.pick-chassis').click(this._onChassisPick.bind(this));
        html.find('.delete-chassis').click(this._onDeleteChassis.bind(this));
        html.find('.delete-weapon').click(this._onDeleteWeapon.bind(this));
        html.find('.mechbay-component').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", this._onDragComponent.bind(this), false);
            li.addEventListener("dragend", this._onStopDragComponent.bind(this), false);
            li.addEventListener("dragover", this._onDragOverSlot.bind(this), false);

        });
        html.find('.component-slot').each((i, li) => {


            li.addEventListener("drop", this._onDropComponent.bind(this), false);

        });
    }
    _onDragComponent(event){

        let type="."+event.target.attributes["name"].value;
        let targetId=event.target.dataset["id"];
        let actor=this.actor;
        let data=actor.data.data;
        let house=game.actors.get(data.knight.house);
        let component=house.getEmbeddedDocument("Item",targetId);
        let amtLeft=component.data.data.amount.left;
        if(amtLeft>0){
            console.log(component);
            console.log(type);
            let validSlots= document.querySelectorAll(type);
            validSlots.forEach(function(item) {
                item.classList.add("highlight-slot");
            });
            event.dataTransfer.setData("text", event.target.dataset["id"]);
            event.dataTransfer.effectAllowed="copy";
        }else{
            event.dataTransfer.effectAllowed="none";
            return false;
        }



    }
    _onStopDragComponent(event){
        let type="."+event.target.attributes["name"].value;
        console.log(type);
        let validSlots= document.querySelectorAll(type);
        validSlots.forEach(function(item) {
            item.classList.remove("highlight-slot");
        });
    }
    _onDragOverSlot(event){

        event.preventDefault();

    }

    async _onDropComponent(event){

        let draggedId=event.dataTransfer.getData("text");
        console.log(event)

        let index=parseInt(event.target.dataset["index"]);
        let path=event.target.dataset["path"];
        let actor=this.actor;
        let data=actor.data.data;
        let house=game.actors.get(data.knight.house);

        let component=house.getEmbeddedDocument("Item",draggedId);
        let chassis=actor.getEmbeddedDocument("Item",data.knight.chassis);

        let ok=this._authorizeComponent(component,event.target.className);
        if(ok){
            let amtTaken=component.data.data.amount.taken;
            let newAmt=amtTaken+1;


            let componentBase=component.data
            componentBase.data.originalId=component.id;
            console.log(componentBase)
            component.update({"data.amount.taken":newAmt});
            let newComponent=await actor.createEmbeddedDocuments("Item",[componentBase]);
            await newComponent[0].update({"data.originalId":component.id})
            let array=objectByString(chassis.data,path);
            array[index]=newComponent[0].id;
            console.log(newComponent)
            let chassisUpdate={};
            chassisUpdate[path]=array;

            chassis.update(chassisUpdate);
        }

    }

    _authorizeComponent(component,slotType){
        let componentType=component.type;
        if(componentType==="meleeWeapon"){
            if(slotType.indexOf("melee-slot")!==-1){
                return true;
            }
        }
        if(componentType==="rangedWeapon"){
            let weaponClass=component.data.data.class.value;
            if(weaponClass==="Titanic Ranged Weapon"){
                if(slotType.indexOf("ranged-slot")!==-1){
                    return true;
                }
            }else if(weaponClass==="Titanic Artillery Weapon"){
                if(slotType.indexOf("artillery-slot")!==-1){
                    return true;
                }
            }else{
                if(slotType.indexOf("auxiliary-slot")!==-1){
                    return true;
                }
            }
        }
        if(componentType==="knightCore"){
            if(slotType.indexOf("core-slot")!==-1){
                return true;
            }
        }
        if(componentType==="knightArmor"){
            if(slotType.indexOf("armor-slot")!==-1){
                return true;
            }
        }
        if(componentType==="knightStructure"){
            if(slotType.indexOf("structure-slot")!==-1){
                return true;
            }
        }
        if(componentType==="knightComponent"){
            let componentSubType=component.data.data.type.value;
            if(componentSubType==="Other"){
                if(slotType.indexOf("other-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="Core Mod"){
                if(slotType.indexOf("core-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="Throne Mod"){
                if(slotType.indexOf("throne-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="Plating"){
                if(slotType.indexOf("plating-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="sensor"){
                if(slotType.indexOf("sensor-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="Arm Actuator"){
                if(slotType.indexOf("arm-actuator-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="Leg Actuator"){
                if(slotType.indexOf("leg-actuator-slot")!==-1){
                    return true;
                }                

            }
        }
        if(componentType==="ammunition"){
            if(slotType.indexOf("other-slot")!==-1){
                return true;
            }   
        }
        return false;
    }
   

_onMechbayTabClick(event){
    let tab=event.currentTarget;
    let tabClasses=tab.classList;
    let tabs=document.getElementsByClassName("mechBat");

    if(!tabClasses.contains("active2")){
        for(let i=0;i<tabs.length;i++){
            if(tabs[i].classList.contains("active2")){
                tabs[i].classList.remove("active2");
            }

        }
        let category=tab.dataset["tab"];
        tabClasses.add("active2");
        let lists=document.getElementsByName("mechInventoryTab");
        for(let i=0;i<lists.length;i++){
            let list=lists[i];
            let cat=list.dataset["tab"];
            if(cat===category){
                list.style.display="";
            }else{
                list.style.display="none";
            }
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
    var item=null;


    FortykRollDialogs.callRollDialog(testChar, testType, testTarget, this.actor, testLabel, item, false);

    //autofocus the input after it is rendered.
}
async _onChassisPick(event){
    var chassisPack=await game.packs.get("fortyk.knight-chassis");
    let chassis=await chassisPack.getDocuments();
    let templateOptions={"chassis":chassis};
    let actor=this.actor;
    let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/knight-chassis-dialog.html', templateOptions);
    var options = {
        width: 666,
        height: 600,
        classes:["systems/fortyk/css/fortyk.css"]
    };

    renderedTemplate.then(content => { 
        new Dialog({
            title: "Pick a Chassis",
            content: content,
            buttons:{
                submit:{
                    label:"Add selected to Character",
                    callback: async html => {
                        let selectedId= $(html).find('input:checked').val();


                        console.log(selectedId);


                        let chassisDoc=await chassisPack.getDocument(selectedId);
                        console.log(chassisDoc)



                        let createdChassis=await actor.createEmbeddedDocuments("Item",[chassisDoc.data]);
                        console.log(createdChassis)
                        let id=createdChassis[0].id;
                        actor.update({"data.knight.chassis":id});
                        this.render(true);
                    }
                }
            },
            default: "submit"
        },options).render(true)
    });
}
async _onDeleteChassis(event){
    //deletes the selected item from the actor

    event.preventDefault();
    let itemId = event.currentTarget.attributes["data-item-id"].value;
    let item=await this.actor.getEmbeddedDocument("Item",itemId);

    let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/delete-item-dialog.html');
    renderedTemplate.then(content => {
        new Dialog({
            title: "Deletion Confirmation",
            content: content,
            buttons:{
                submit:{
                    label:"Yes",
                    callback: async dlg => { 

                        await this.actor.deleteEmbeddedDocuments("Item",[itemId]);
                        await this.actor.update({"data.knight.chassis":""});
                        this.render(true);
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
async _onDeleteWeapon(event){
    event.preventDefault();
    let itemId = event.currentTarget.attributes["data-item-id"].value;
    let item=await this.actor.getEmbeddedDocument("Item",itemId);

    let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/delete-item-dialog.html');
    renderedTemplate.then(content => {
        new Dialog({
            title: "Deletion Confirmation",
            content: content,
            buttons:{
                submit:{
                    label:"Yes",
                    callback: async dlg => { 
                        let index=parseInt(event.target.dataset["index"]);
                        let path=event.target.dataset["path"];
                        let actor=this.actor;
                        let data=actor.data.data;
                        let house=await game.actors.get(data.knight.house);

                        let component=await house.getEmbeddedDocument("Item",item.data.data.originalId);
                        let chassis=await actor.getEmbeddedDocument("Item",data.knight.chassis);
                        console.log(item,component,house,chassis)
                        let amtTaken=component.data.data.amount.taken;
                        let newAmt=amtTaken-1;






                        let array=objectByString(chassis.data,path);
                        array[index]="";

                        let chassisUpdate={};
                        chassisUpdate[path]=array;
                        component.update({"data.amount.taken":newAmt});
                        chassis.update(chassisUpdate);

                        await actor.deleteEmbeddedDocuments("Item",[itemId]);

                        this.render(true);
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
}