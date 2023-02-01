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
            width: 980,
            height: 700,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "mechbay" }],
            default:null,
            scrollY: [
                ".left-mechbay",
                ".info4",
                ".sheet-content",
                ".sheet-content-knight"
            ]

        });
    }
    /** @override */
    async getData() {
        const data = super.getData();
        const actor=this.actor;
        const system=actor.system;
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.houses=Array.from(game.actors.values()).filter(actor=>actor.isOwner&&actor.type==="knightHouse");
        data.pilots=Array.from(game.actors.values()).filter(actor=>actor.isOwner&&actor.type==="dhPC");
        data.itemStates=game.fortyk.FORTYK.itemStates;
        if(data.mechtab===undefined){
            data.mechtab="all";
        }
        if(data.meleeWeapons1===undefined){
            data.meleeWeapons1=true;
        }
        if(data.meleeWeapons2===undefined){
            data.meleeWeapons2=true;
        }
        if(data.rangedWeapons1===undefined){
            data.rangedWeapons1=true;
        }
        if(data.rangedWeapons2===undefined){
            data.rangedWeapons2=true;
        }
        if(data.auxiliaryWeapons1===undefined){
            data.auxiliaryWeapons1=true;
        }
        if(data.auxiliaryWeapons2===undefined){
            data.auxiliaryWeapons2=true;
        }
        if(data.artilleryWeapons1===undefined){
            data.artilleryWeapons1=true;
        }
        if(data.artilleryWeapons2===undefined){
            data.artilleryWeapons2=true;
        }
        if(data.ammunitions1===undefined){
            data.ammunitions1=true;
        }
        if(data.ammunitions2===undefined){
            data.ammunitions2=true;
        }
        if(data.legActuators2===undefined){
            data.legActuators2=true;
        }
        if(data.armActuators2===undefined){
            data.armActuators2=true;
        }
        if(data.components1===undefined){
            data.components1=true;
        }
        if(data.cores1===undefined){
            data.cores1=true;
        }
        if(data.cores2===undefined){
            data.cores2=true;
        }
        if(data.armors1===undefined){
            data.armors1=true;
        }
        if(data.armors2===undefined){
            data.armors2=true;
        }
        if(data.forceFields1===undefined){
            data.forceFields1=true;
        }
        if(data.forceFields2===undefined){
            data.forceFields2=true;
        }
        if(data.structures1===undefined){
            data.structures1=true;
        }
        if(data.structures2===undefined){
            data.structures2=true;
        }
        if(data.sensors2===undefined){
            data.sensors2=true;
        }
        if(data.coremods2===undefined){
            data.coremods2=true;
        }
        if(data.thronemods2===undefined){
            data.thronemods2=true;
        }
        if(data.platings2===undefined){
            data.platings2=true;
        }
        if(data.others2===undefined){
            data.others2=true;
        }

        if(system.knight.house){
            let house=game.actors.get(system.knight.house);
            data.meleeWeapons=house.itemTypes.meleeWeapon;
            data.rangedWeapons=house.itemTypes.rangedWeapon.filter(weapon=>weapon.system.class.value==="Titanic Ranged Weapon");
            data.artilleryWeapons=house.itemTypes.rangedWeapon.filter(weapon=>weapon.system.class.value==="Titanic Artillery Weapon");
            data.auxiliaryWeapons=house.itemTypes.rangedWeapon.filter(weapon=>weapon.system.class.value!=="Titanic Ranged Weapon"&&weapon.system.class.value!=="Titanic Artillery Weapon");
            data.ammunition=house.itemTypes.ammunition;
            data.components=house.itemTypes.knightComponent;
            data.armors=house.itemTypes.knightArmor;
            data.forceFields=house.itemTypes.forceField;
            data.cores=house.itemTypes.knightCore;
            data.structures=house.itemTypes.knightStructure;
            data.sensors=house.itemTypes.knightComponent.filter(component=>component.system.type.value==="sensor");
            data.coreMods=house.itemTypes.knightComponent.filter(component=>component.system.type.value==="core-mod");
            data.throneMods=house.itemTypes.knightComponent.filter(component=>component.system.type.value==="throne-mod");
            data.armActuators=house.itemTypes.knightComponent.filter(component=>component.system.type.value==="arm-actuator");
            data.legActuators=house.itemTypes.knightComponent.filter(component=>component.system.type.value==="leg-actuator");
            data.platings=house.itemTypes.knightComponent.filter(component=>component.system.type.value==="plating");
            data.others=house.itemTypes.knightComponent.filter(component=>component.system.type.value==="other");

        }

        if(system.knight.chassis){
            let thresholds=system.secChar.wounds.thresholds;
            let wounds=parseInt(system.secChar.wounds.value);
            if(wounds>thresholds["1"]){
                data.threshold="1st";
            }else if(wounds>thresholds["2"]){
                data.threshold="2nd";
            }else if(wounds>thresholds["3"]){
                data.threshold="3rd";
            }else if(wounds>thresholds["4"]){
                data.threshold="4th";
            }else{
                data.threshold="Crit";
            }
            data.carapaceHardPoints=duplicate(system.chassis.system.hardPoints.carapace);

            for (let [key, wpnType] of Object.entries(data.carapaceHardPoints)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        wpnType[i]=actor.getEmbeddedDocument("Item",wpnType[i]);
                        if(wpnType[i].type==="rangedWeapon"){
                            wpnType[i].validAmmo=this.getValidAmmo(wpnType[i]);
                        }
                    }
                }
            }
            data.leftArmHardPoints=duplicate(system.chassis.system.hardPoints.leftArm);
            for (let [key, wpnType] of Object.entries(data.leftArmHardPoints)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        wpnType[i]=actor.getEmbeddedDocument("Item",wpnType[i]);
                        if(wpnType[i].type==="rangedWeapon"){
                            wpnType[i].validAmmo=this.getValidAmmo(wpnType[i]);
                        }
                    }
                }
            }
            data.torsoHardPoints=duplicate(system.chassis.system.hardPoints.torso);
            for (let [key, wpnType] of Object.entries(data.torsoHardPoints)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        wpnType[i]=actor.getEmbeddedDocument("Item",wpnType[i]);
                        if(wpnType[i].type==="rangedWeapon"){
                            wpnType[i].validAmmo=this.getValidAmmo(wpnType[i]);
                        }
                    }
                }
            }
            data.rightArmHardPoints=duplicate(system.chassis.system.hardPoints.rightArm);
            for (let [key, wpnType] of Object.entries(data.rightArmHardPoints)){
                for(let i=0;i<wpnType.length;i++){
                    if(wpnType[i]){
                        wpnType[i]=actor.getEmbeddedDocument("Item",wpnType[i]);
                        if(wpnType[i].type==="rangedWeapon"){
                            wpnType[i].validAmmo=this.getValidAmmo(wpnType[i]);
                        }
                    }
                }
            }
        }
        let frontArmor=actor.system.facings.front.value;
        let size=parseInt(actor.system.secChar.size.value);

        let ratio=size/8;
        data.stomp=Math.ceil((frontArmor/2)*ratio);


        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
        //html.find('.rollable').click(this._onRoll.bind(this));
        html.find('.mechBat').click(this._onMechbayTabClick.bind(this));
        html.find('.pick-chassis').click(this._onChassisPick.bind(this));
        html.find('.pick-spirit').click(this._onSpiritPick.bind(this));
        html.find('.delete-chassis').click(this._onDeleteChassis.bind(this));
        html.find('.delete-weapon').click(this._onDeleteWeapon.bind(this));
        html.find('.delete-component').click(this._onDeleteComponent.bind(this));
        html.find('.delete-other-component').click(this._onDeleteOtherComponent.bind(this));
        html.find('.mechbay-grid-section').click(this._onToggleComponentLists.bind(this));
        html.find('.stomp').click(this._onStomp.bind(this));
        html.find('.houseSelect').change(this._onHouseChange.bind(this));
        html.find('.pilotSelect').change(this._onPilotChange.bind(this));
        html.find('.knight-overheat').click(this._onKnightOverheat.bind(this));
        html.find('.state').change(this._onComponentStateChange.bind(this));
        //handles changing ammo type
        html.find('.weapon-ammo').change(this._onAmmoChange.bind(this));
        //handles reloading a ranged weapon
        html.find('.weapon-reload').click(this._onWeaponReload.bind(this));
        $(document).on('click', '.minus-button', function (e) {
            e.stopImmediatePropagation();
        });

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
        let data=actor.system;
        let house=game.actors.get(data.knight.house);
        let component=house.getEmbeddedDocument("Item",targetId);
        let amtLeft=component.system.amount.left;
        if(amtLeft>0){
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


        let index=parseInt(event.target.dataset["index"]);
        let path=event.target.dataset["path"];
        let actor=this.actor;
        let data=actor.system;
        let house=game.actors.get(data.knight.house);

        let component=house.getEmbeddedDocument("Item",draggedId);
        let chassis=actor.getEmbeddedDocument("Item",data.knight.chassis);

        let ok=this._authorizeComponent(component,event.target.className);

        if(ok){
            let amtTaken=component.system.amount.taken;
            let newAmt=parseInt(amtTaken)+1;


            let componentBase=duplicate(component)
            componentBase.system.originalId=component.id;
            
            let newComponent=await actor.createEmbeddedDocuments("Item",[componentBase]);
            let comUpdate={};
            comUpdate["system.amount.taken"]=newAmt
            let loanedArray=componentBase.system.loaned;
         
            loanedArray.push({"knightId":actor.id,"itemId":newComponent[0]._id});
            console.log(loanedArray)
            comUpdate["system.loaned"]=loanedArray;
            component.update(comUpdate);
            let newComUpdate={};
            if(newComponent[0].type==="rangedWeapon"||newComponent[0].type==="meleeWeapon"){
                let facing=event.target.dataset["facing"];

                newComUpdate["system.facing.value"]=facing;
                if(path.indexOf("auxiliary")!==-1){
                    if(newComponent[0].system.class.value==="Heavy"){
                        newComUpdate["system.weight.value"]=2;
                        newComUpdate["system.space.value"]=2;
                    }else{
                        newComUpdate["system.weight.value"]=1;
                        newComUpdate["system.space.value"]=1;
                    }
                }
                if(path.indexOf("Arm")!==-1&&path.indexOf("auxiliary")!==-1){
                    newComUpdate["system.space.value"]=0;
                }



            }
            let componentType=newComponent[0].type;
            if(componentType!=="ammunition"){
                newComUpdate["system.isEquipped"]=true;
            }

            newComUpdate["system.originalId"]=component.id;
            await newComponent[0].update(newComUpdate)

            let chassisUpdate={};
            let knightUpdate={};
            if(componentType==="knightCore"){
                knightUpdate[path]=newComponent[0].id;
            }else if(componentType==="knightArmor"){
                knightUpdate[path]=newComponent[0].id;
            }else if(componentType==="forceField"){
                knightUpdate[path]=newComponent[0].id;
            }else if(componentType==="knightStructure"){
                knightUpdate[path]=newComponent[0].id;
            }else if(componentType==="knightComponent"){
                let componentSubType=newComponent[0].system.type.value;
                if(componentSubType==="other"){
                    let componentArray=objectByString(this.actor,path);
                    componentArray[index]=newComponent[0].id;
                    componentArray.push("");

                    knightUpdate[path]=componentArray;            

                }
                if(componentSubType==="core-mod"){
                    knightUpdate[path]=newComponent[0].id;
                }
                if(componentSubType==="throne-mod"){
                    knightUpdate[path]=newComponent[0].id;                

                }
                if(componentSubType==="plating"){
                    knightUpdate[path]=newComponent[0].id;                

                }
                if(componentSubType==="sensor"){
                    knightUpdate[path]=newComponent[0].id;              

                }
                if(componentSubType==="arm-actuator"){
                    knightUpdate[path]=newComponent[0].id;               

                }
                if(componentSubType==="leg-actuator"){
                    knightUpdate[path]=newComponent[0].id;                

                }
            }else if(componentType==="ammunition"){
                let componentArray=objectByString(this.actor,path);
                componentArray[index]=newComponent[0].id;
                componentArray.push("");

                knightUpdate[path]=componentArray;  
            }else{

                let array=objectByString(chassis,path);
                array[index]=newComponent[0].id;


                chassisUpdate[path]=array;
            }

            if(Object.keys(chassisUpdate).length>0){
                await chassis.update(chassisUpdate);
            }
            if(Object.keys(knightUpdate).length>0){
                await this.actor.update(knightUpdate);
            }

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
            let weaponClass=component.system.class.value;
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
        if(componentType==="forceField"){
            if(slotType.indexOf("forceField-slot")!==-1){
                return true;
            }
        }
        if(componentType==="knightComponent"){
            let componentSubType=component.system.type.value;
            if(componentSubType==="other"){
                if(slotType.indexOf("other-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="core-mod"){
                if(slotType.indexOf("core-mod-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="throne-mod"){
                if(slotType.indexOf("throne-mod-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="plating"){
                if(slotType.indexOf("plating-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="sensor"){
                if(slotType.indexOf("sensor-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="arm-actuator"){
                if(slotType.indexOf("arm-actuator-slot")!==-1){
                    return true;
                }                

            }
            if(componentSubType==="leg-actuator"){
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

    async _onComponentStateChange(event){
        event.preventDefault;
        const data=this.actor.system;
        let dataset=event.currentTarget.dataset;

        let actor=this.actor;
        let componentID=dataset["itemId"];
        let state=event.currentTarget.value;
        let component=actor.items.get(componentID);
        await component.update({"system.state.value":state});
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
            console.log(this)
            this.document.mechtab=category;
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
    _onToggleComponentLists(event){
        let header=event.target;

        let button=header.firstChild;
        if(!button){
            header=header.parentElement;
            button=header.firstChild;
        }
        let expand=false;
        if(button.classList.contains("minus-button")){
            button.classList.remove("minus-button");
            button.classList.add("plus-button");
            expand=false;
        }else{
            button.classList.add("minus-button");
            button.classList.remove("plus-button");
            expand=true;
        }

        let type=header.attributes["name"].value 
        this.document[type]=expand;
        let components=document.getElementsByClassName(type);
        for(let i=0;i<components.length;i++){
            let component=components[i];
            if(!expand){
                component.style.display="none"; 
            }else{
                component.style.display="";
            }

        }
    }

    async _onChassisPick(event){
        var chassisPack=await game.packs.get("fortyk.knight-chassis");
        var vehicletraitsPack=await game.packs.get("fortyk.vehicle-traits");
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




                            let chassisDoc=await chassisPack.getDocument(selectedId);
                            let enclosedDoc=await vehicletraitsPack.getDocument("cR1t6ioQMPr9QEe5");
                            let superHeavyDoc=await vehicletraitsPack.getDocument("AVUMiYtUvUQQAQrc");
                            let walkerDoc=await vehicletraitsPack.getDocument("3DbsJhqN8KbUXZLd");

                            let itemDatas=[];
                            itemDatas.push(duplicate(chassisDoc));
                            itemDatas.push(duplicate(enclosedDoc));
                            itemDatas.push(duplicate(superHeavyDoc));
                            itemDatas.push(duplicate(walkerDoc));
                            let createdChassis=await actor.createEmbeddedDocuments("Item",itemDatas);

                            let id=createdChassis[0].id;
                            let update={};
                            update["system.knight.chassis"]=id;
                            update["system.secChar.wounds.value"]=createdChassis[0].system.structuralIntegrity.value;
                            update["system.secChar.size.value"]=parseInt(createdChassis[0].system.size.value)-1;
                            update["system.manoeuvrability.value"]=createdChassis[0].system.manoeuvrability.value;
                            update["token.actorLink"]=true;
                            update["token.vision"]=true;
                            await actor.update(update);
                            await actor.setFlag("fortyk","superheavy",true);
                            await actor.setFlag("fortyk","enclosed",true);
                            await actor.setFlag("fortyk","walker",true);
                            this.render(true);
                        }
                    }
                },
                default: "submit"
            },options).render(true)
        });
    }
    async _onSpiritPick(event){
        var spiritPack=await game.packs.get("fortyk.knight-spirits");
        let spirit=await spiritPack.getDocuments();
        let templateOptions={"spirit":spirit};
        let actor=this.actor;
        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/knight-spirit-dialog.html', templateOptions);
        var options = {
            width: 666,
            height: 600,
            classes:["systems/fortyk/css/fortyk.css"]
        };

        renderedTemplate.then(content => { 
            new Dialog({
                title: "Pick a Machine Spirit",
                content: content,
                buttons:{
                    submit:{
                        label:"Add selected to Character",
                        callback: async html => {
                            let selectedId= $(html).find('input:checked').val();




                            let spiritDoc=await spiritPack.getDocument(selectedId);




                            let createdSpirit=await actor.createEmbeddedDocuments("Item",[duplicate(spiritDoc)]);

                            let id=createdSpirit[0].id;
                            let update={};
                            update["system.knight.spirit"]=id;
                            actor.update(update);
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
                            await this.actor.update({"system.knight.chassis":""});
                            await this.actor.deleteEmbeddedDocuments("Item",[itemId]);

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
                            let data=actor.system;
                            let house=await game.actors.get(data.knight.house);

                            let component=await house.getEmbeddedDocument("Item",item.system.originalId);
                            let chassis=await actor.getEmbeddedDocument("Item",data.knight.chassis);

                            let amtTaken=component.system.amount.taken;
                            let newAmt=amtTaken-1;





                            let componentUpdate={};
                            if(item.system.state.value==="X"||item.system.state.value===0){
                                let amt=parseInt(component.system.amount.value);
                                componentUpdate["system.amount.value"]=amt-1;
                            }
                            componentUpdate["system.amount.taken"]=newAmt;
                            let loans=component.system.loaned;
                            let newLoans=loans.filter(loan=>loan.knightId!==actor.id&&loan.itemId!==itemId);
                            componentUpdate["system.loaned"]=newLoans;
                            let array=objectByString(chassis,path);
                            array[index]="";

                            let chassisUpdate={};
                            chassisUpdate[path]=array;

                            component.update(componentUpdate);
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
    async _onDeleteComponent(event){
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
                            let data=actor.system;
                            let house=await game.actors.get(data.knight.house);

                            let component=await house.getEmbeddedDocument("Item",item.system.originalId);
                            if(component){
                                let amtTaken=component.system.amount.taken;
                                let newAmt=amtTaken-1;


                                var componentUpdate={};

                                if(item.system.state.value==="X"||item.system.state.value===0){
                                    let amt=parseInt(component.system.amount.value);
                                    componentUpdate["system.amount.value"]=amt-1;
                                }
                                componentUpdate["system.amount.taken"]=newAmt;
                                component.update(componentUpdate);
                            }
                            let loans=component.system.loaned;
                            let newLoans=loans.filter(loan=>loan.knightId!==actor.id&&loan.itemId!==itemId);
                            componentUpdate["system.loaned"]=newLoans;
                            

                            let update={};
                            update[path]="";

                            this.actor.update(update);

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
    async _onDeleteOtherComponent(event){
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
                            let data=actor.system;
                            let house=await game.actors.get(data.knight.house);

                            let component=await house.getEmbeddedDocument("Item",item.system.originalId);
                            let amtTaken=component.system.amount.taken;
                            let newAmt=amtTaken-1;

                            let array=objectByString(this.actor,path);
                            array.splice(index,1);
                            let componentUpdate={};

                            if(item.system.state.value==="X"||item.system.state.value===0){
                                let amt=parseInt(component.system.amount.value);
                                componentUpdate["system.amount.value"]=amt-1;
                            }
                            componentUpdate["system.amount.taken"]=newAmt;
                            let loans=component.system.loaned;
                            let newLoans=loans.filter(loan=>!(loan.knightId===actor.id&&loan.itemId===itemId));
                            componentUpdate["system.loaned"]=newLoans;
                            



                            let update={};
                            update[path]=array;
                            component.update(componentUpdate);
                            this.actor.update(update);

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
    async _onHouseChange(event){

        let newHouse=await game.actors.get(event.currentTarget.value);
        let oldHouse=await game.actors.get(this.actor.system.knight.house);


        if(newHouse){
            let newArray=newHouse.system.knights;
            newArray.push(this.actor.id);
            newHouse.update({"system.knights":newArray}); 
        }
        if(oldHouse){
            let oldArray=oldHouse.system.knights;
            oldArray=oldArray.filter((knight) =>{knight!==this.actor.id});
            oldHouse.update({"system.knights":oldArray});
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



            previousAmmo.update({"system.currentClip.value":weapon.system.clip.value,"system.isEquipped":false});
        }
        if(ammo!==undefined){
            let ammoUpdate={};
            if(ammo.system.isFresh){
                ammoUpdate["system.isFresh"]=false;
                ammoUpdate["system.currentClip.value"]=weapon.system.clip.max;
                weaponUpdate["system.clip.value"]=weapon.system.clip.max;
            }else{
                weaponUpdate["system.clip.value"]=ammo.system.currentClip.value;
            }
            ammoUpdate["system.isEquipped"]=weapon.id;

            ammo.update(ammoUpdate);
        }else{
            weaponUpdate["system.clip.value"]=0;
        }



        weapon.update(weaponUpdate);



    }
    //handles reloading a ranged weapon
    async _onWeaponReload(event){
        event.preventDefault;
        const dataset=event.currentTarget.dataset;
        let actor=this.actor;
        let data=actor.system;
        let weapon=this.actor.getEmbeddedDocument("Item",dataset.weapon);
        let house=await game.actors.get(data.knight.house);

        let ammo=actor.getEmbeddedDocument("Item",weapon.system.ammo._id);

        let update={};
        let weaponUpdate={};
        let ammoUpdate={};
        let houseUpdate={};
        weaponUpdate["system.ammo._id"]="";
        weapon.update(weaponUpdate);
        let components=actor.system.knight.components.filter(component=>component!==ammo.id);
        actor.update({"system.knight.components":components});
        let originalAmmo=house.getEmbeddedDocument("Item",ammo.system.originalId);
        originalAmmo.update({"system.amount.taken":originalAmmo.system.amount.taken-1,"system.amount.value":parseInt(originalAmmo.system.amount.value)-1});
        ammo.delete();



    }

    async _onPilotChange(event){

        let newPilot=await game.actors.get(event.currentTarget.value);
        let oldPilot=await game.actors.get(this.actor.system.crew.pilotID);


        if(newPilot){


            newPilot.update({"system.riding.id":this.actor.id}); 
        }
        if(oldPilot){

            oldPilot.update({"system.riding.id":""});
        }


    }
    async _onStomp(event){

        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;


        let actor=this.actor;

        let options={};
        let hits=1;
        if(!hits){hits=1};
        options.hits=hits;
        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/damage-dialog.html', options);
        let formula=dataset['formula'];
        renderedTemplate.then(content => {new Dialog({
            title: `Number of Hits & Bonus Damage`,
            content: content,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: async (el) => {
                        const hits = parseInt(Number($(el).find('input[name="hits"]').val()));
                        const dmg = parseInt(Number($(el).find('input[name="dmg"]').val()));
                        const pen = parseInt(Number($(el).find('input[name="pen"]').val()));
                        const magdmg = parseInt(Number($(el).find('input[name="dmg"]').val()));
                        if(dmg>0){
                            formula+=`+${dmg}`
                        }
                        let stompData={name:"Titanic Feet",type:"meleeWeapon"}
                        let stomp=await Item.create(stompData, {temporary: true});
                        stomp.flags.fortyk={"blast":3};
                        stomp.system.damageType.value="Impact";
                        stomp.system.pen.value=0;
                        stomp.system.damageFormula.value=formula;
                        await FortykRolls.damageRoll(stomp.system.damageFormula,actor,stomp,1);


                    }
                }
            },
            default: "submit",
            width:100}).render(true)
                                         });
    }
    async _onKnightOverheat(event){
        let actor=this.actor;
        let data=this.actor.system;
        let heatCap=parseInt(data.knight.heat.max);
        let heat=parseInt(data.knight.heat.value);
        let overheat=heat-heatCap;
        let roll=new Roll(`${overheat}d10kl`,{});
        await roll.evaluate();
        let result=roll.total;
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            flavor: "Rolling Overheat test"
        });
        let ones=0;
        try{
            for ( let r of roll.dice[0].results ) {


                if(r.result===1){
                    ones++;
                }

            } 
        }catch(err){
        }
        let core=data.knight.core;
        let coreIntegrity=parseInt(core.system.state.value)-1;
        await core.update({"system.state.value":coreIntegrity});
        let overheatResult="";
        let overheatFlavor=""
        if(coreIntegrity===0){
            overheatResult="The knight’s core goes critical, the knight suffers a core meltdown at the end of your next turn.";
            overheatFlavor="Irreversible Core Meltdown";
        }else if(ones>1){
            overheatResult="The knight’s core goes critical, the knight suffers a core meltdown at the end of your next turn.";
            overheatFlavor="Irreversible Core Meltdown";
        }else if(result>=7){
            overheatResult="The knight shuts down and is considered helpless until restarted. This is a +0 Operate: Titanic Walker test which takes a full action.";
            overheatFlavor="Emergency Shutdown";
        }else if(result>=2){
            overheatResult="The knight takes 4d10 damage ignoring armor each turn until the core overload is cleared. To clear the Core Overload the bondsman must either pass a +0 tech-use test as a full action or shut down the knight.";
            overheatFlavor="Core Overload";
        }else if(result===1){
            overheatResult="Roll a +0 tech-use test as a full action, on a success your knight is stunned for 1d5 rounds, on a failure the knight suffers a core meltdown in 1d5 rounds(rolled by the GM). You may retry the tech-use test each round.";
            overheatFlavor="Core Meltdown";
        }
        let chatOverheat={user: game.users.current,
                          speaker:{user: game.users.current},
                          content:overheatResult,
                          classes:["fortyk"],
                          flavor:overheatFlavor,
                          author:game.users.current
                         }

        await ChatMessage.create(chatOverheat,{});
        this.actor.update({"system.knight.heat.value":0});


    }
    async _updateHouse(){
        let data=this.actor.system;
        let house=await game.actors.get(data.knight.house);
        if(house){
            let actors=[];
            actors.push(data.knight.house);
            actors=actors.concat(house.system.knights);
            let socketOp={type:"renderSheets",package:{actors:actors}}
            await game.socket.emit("system.fortyk",socketOp);

        }
    }
    getValidAmmo(weapon){
        let ammos=this.actor.itemTypes.ammunition;
        let validAmmos=[];
        let wpnClass=weapon.system.class.value;
        let wpnType=weapon.system.type.value;
        for(let i=0;i<ammos.length;i++){
            let ammo=ammos[i];
            let ammoClass=ammo.system.class.value;
            let ammoType=ammo.system.type.value;

            if(ammoClass===wpnClass&&ammoType===wpnType){
                if(!ammo.system.isEquipped){
                    validAmmos.push(ammo);
                }else if(ammo.system.isEquipped===weapon.id){
                    validAmmos.push(ammo);
                }

            }
        }
        return validAmmos;
    }
    /* async _render(force, options){

        console.log(this)
        if(this.mechtab){




            let category=this.mechtab;

            let lists=document.getElementsByName("mechInventoryTab");
            console.log(lists)
            for(let i=0;i<lists.length;i++){
                let list=lists[i];
                let cat=list.dataset["tab"];
                if(cat===category){
                    list.style.display="";

                }else{

                    list.style.display="none";
                }
            }
            let tabs=document.getElementsByClassName("mechBat");
            for(let i=0;i<tabs.length;i++){
                let tab=tabs[i];
                let cat=tab.dataset["tab"];
                if(tab.classList.contains("active2")){
                    tab.classList.remove("active2");
                }
                if(cat===category){
                    tab.classList.add("active2");
                }
            }

        }
        super._render(force,options);
    }*/
}