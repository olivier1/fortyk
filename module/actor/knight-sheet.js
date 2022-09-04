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
                ".sheet-content"
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

        if(data.data.knight.house){
            let house=game.actors.get(data.data.knight.house);
            data.meleeWeapons=house.itemTypes.meleeWeapon;
            data.rangedWeapons=house.itemTypes.rangedWeapon.filter(weapon=>weapon.data.data.class.value==="Titanic Ranged Weapon");
            data.artilleryWeapons=house.itemTypes.rangedWeapon.filter(weapon=>weapon.data.data.class.value==="Titanic Artillery Weapon");
            data.auxiliaryWeapons=house.itemTypes.rangedWeapon.filter(weapon=>weapon.data.data.class.value!=="Titanic Ranged Weapon"&&weapon.data.data.class.value!=="Titanic Artillery Weapon");
            data.ammunition=house.itemTypes.ammunition;
            data.components=house.itemTypes.knightComponent;
            data.armors=house.itemTypes.knightArmor;
            data.forceFields=house.itemTypes.forceField;
            data.cores=house.itemTypes.knightCore;
            data.structures=house.itemTypes.knightStructure;
            data.sensors=house.itemTypes.knightComponent.filter(component=>component.data.data.type.value==="sensor");
            data.coreMods=house.itemTypes.knightComponent.filter(component=>component.data.data.type.value==="core-mod");
            data.throneMods=house.itemTypes.knightComponent.filter(component=>component.data.data.type.value==="throne-mod");
            data.armActuators=house.itemTypes.knightComponent.filter(component=>component.data.data.type.value==="arm-actuator");
            data.legActuators=house.itemTypes.knightComponent.filter(component=>component.data.data.type.value==="leg-actuator");
            data.platings=house.itemTypes.knightComponent.filter(component=>component.data.data.type.value==="plating");
            data.others=house.itemTypes.knightComponent.filter(component=>component.data.data.type.value==="other");

        }

        if(data.data.knight.chassis){
            let thresholds=data.data.secChar.wounds.thresholds;
            let wounds=parseInt(data.data.secChar.wounds.value);
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
            data.carapaceHardPoints=duplicate(data.data.chassis.data.data.hardPoints.carapace);

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
            data.leftArmHardPoints=duplicate(data.data.chassis.data.data.hardPoints.leftArm);
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
            data.torsoHardPoints=duplicate(data.data.chassis.data.data.hardPoints.torso);
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
            data.rightArmHardPoints=duplicate(data.data.chassis.data.data.hardPoints.rightArm);
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
        let frontArmor=actor.data.data.facings.front.value;
        data.stomp=Math.ceil(frontArmor/2);


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
        let data=actor.data.data;
        let house=game.actors.get(data.knight.house);
        let component=house.getEmbeddedDocument("Item",targetId);
        let amtLeft=component.data.data.amount.left;
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
        let data=actor.data.data;
        let house=game.actors.get(data.knight.house);

        let component=house.getEmbeddedDocument("Item",draggedId);
        let chassis=actor.getEmbeddedDocument("Item",data.knight.chassis);

        let ok=this._authorizeComponent(component,event.target.className);

        if(ok){
            let amtTaken=component.data.data.amount.taken;
            let newAmt=parseInt(amtTaken)+1;


            let componentBase=component.data
            componentBase.data.originalId=component.id;

            component.update({"data.amount.taken":newAmt});
            let newComponent=await actor.createEmbeddedDocuments("Item",[componentBase]);
            let newComUpdate={};
            if(newComponent[0].type==="rangedWeapon"||newComponent[0].type==="meleeWeapon"){
                let facing=event.target.dataset["facing"];
                console.log(facing);
                newComUpdate["data.facing.value"]=facing;
                if(path.indexOf("Arm")!==-1&&path.indexOf("auxiliary")!==-1){
                    newComUpdate["data.space.value"]=0;
                }


            }
            newComUpdate["data.originalId"]=component.id;
            await newComponent[0].update(newComUpdate)
            let componentType=newComponent[0].type;
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
                let componentSubType=newComponent[0].data.data.type.value;
                if(componentSubType==="other"){
                    let componentArray=objectByString(this.actor.data,path);
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
                let componentArray=objectByString(this.actor.data,path);
                componentArray[index]=newComponent[0].id;
                componentArray.push("");

                knightUpdate[path]=componentArray;  
            }else{

                let array=objectByString(chassis.data,path);
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
        if(componentType==="forceField"){
            if(slotType.indexOf("forceField-slot")!==-1){
                return true;
            }
        }
        if(componentType==="knightComponent"){
            let componentSubType=component.data.data.type.value;
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
        const data=this.actor.data.data;
        let dataset=event.currentTarget.dataset;

        let actor=this.actor;
        let componentID=dataset["itemId"];
        let state=event.currentTarget.value;
        let component=actor.items.get(componentID);
        console.log(component);
        await component.update({"data.state.value":state});
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
            this.document.data.mechtab=category;
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
        this.document.data[type]=expand;
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
                            itemDatas.push(chassisDoc.data);
                            itemDatas.push(enclosedDoc.data);
                            itemDatas.push(superHeavyDoc.data);
                            itemDatas.push(walkerDoc.data);
                            let createdChassis=await actor.createEmbeddedDocuments("Item",itemDatas);

                            let id=createdChassis[0].id;
                            let update={};
                            update["data.knight.chassis"]=id;
                            update["data.secChar.wounds.value"]=createdChassis[0].data.data.structuralIntegrity.value;
                            update["data.secChar.size.value"]=parseInt(createdChassis[0].data.data.size.value)-1;
                            update["data.manoeuvrability.value"]=createdChassis[0].data.data.manoeuvrability.value;
                            update["token.actorLink"]=true;
                            update["token.vision"]=true;
                            actor.update(update);
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




                            let createdSpirit=await actor.createEmbeddedDocuments("Item",[spiritDoc.data]);

                            let id=createdSpirit[0].id;
                            let update={};
                            update["data.knight.spirit"]=id;
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
                            await this.actor.update({"data.knight.chassis":""});
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
                            let data=actor.data.data;
                            let house=await game.actors.get(data.knight.house);

                            let component=await house.getEmbeddedDocument("Item",item.data.data.originalId);
                            let chassis=await actor.getEmbeddedDocument("Item",data.knight.chassis);

                            let amtTaken=component.data.data.amount.taken;
                            let newAmt=amtTaken-1;





                            let componentUpdate={};
                            console.log(item)
                            if(item.data.data.state.value==="X"||item.data.data.state.value===0){
                                let amt=parseInt(component.data.data.amount.value);
                                console.log(amt)
                                componentUpdate["data.amount.value"]=amt-1;
                            }
                            componentUpdate["data.amount.taken"]=newAmt;

                            let array=objectByString(chassis.data,path);
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
                            let data=actor.data.data;
                            let house=await game.actors.get(data.knight.house);

                            let component=await house.getEmbeddedDocument("Item",item.data.data.originalId);

                            let amtTaken=component.data.data.amount.taken;
                            let newAmt=amtTaken-1;


                            let componentUpdate={};

                            if(item.data.data.state.value==="X"||item.data.data.state.value===0){
                                let amt=parseInt(component.data.data.amount.value);
                                componentUpdate["data.amount.value"]=amt-1;
                            }
                            componentUpdate["data.amount.taken"]=newAmt;



                            let update={};
                            update[path]="";
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
                            let data=actor.data.data;
                            let house=await game.actors.get(data.knight.house);

                            let component=await house.getEmbeddedDocument("Item",item.data.data.originalId);

                            let amtTaken=component.data.data.amount.taken;
                            let newAmt=amtTaken-1;

                            let array=objectByString(this.actor.data,path);
                            array.splice(index,1);
                            let componentUpdate={};

                            if(item.data.data.state.value==="X"||item.data.data.state.value===0){
                                let amt=parseInt(component.data.data.amount.value);
                                componentUpdate["data.amount.value"]=amt-1;
                            }
                            componentUpdate["data.amount.taken"]=newAmt;





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
        let oldHouse=await game.actors.get(this.actor.data.data.knight.house);


        if(newHouse){
            let newArray=newHouse.data.data.knights;
            newArray.push(this.actor.id);
            newHouse.update({"data.knights":newArray}); 
        }
        if(oldHouse){
            let oldArray=oldHouse.data.data.knights;
            oldArray=oldArray.filter((knight) =>{knight!==this.actor.id});
            oldHouse.update({"data.knights":oldArray});
        }


    }
    //handles when swapping ammo type in a ranged weapon
    async _onAmmoChange(event){

        event.preventDefault;
        const dataset=event.currentTarget.dataset;
        const weapon=this.actor.getEmbeddedDocument("Item",dataset["weapon"]);
        if(!weapon){return};

        let weaponData=weapon.data;
        const previousAmmo=this.actor.getEmbeddedDocument("Item",dataset["previous"]);
        const ammoID=event.currentTarget.value;
        const ammo=this.actor.getEmbeddedDocument("Item",ammoID);
        let weaponUpdate={}
        weaponUpdate["data.ammo._id"]=ammoID;




        if(previousAmmo!==undefined&&previousAmmo.data.data!==undefined){



            previousAmmo.update({"data.currentClip.value":weaponData.data.clip.value,"data.isEquipped":false});
        }
        if(ammo!==undefined){
            let ammoUpdate={};
            if(ammo.data.data.isFresh){
                ammoUpdate["data.isFresh"]=false;
                ammoUpdate["data.currentClip.value"]=weapon.data.data.clip.max;
                weaponUpdate["data.clip.value"]=weapon.data.data.clip.max;
            }else{
                weaponUpdate["data.clip.value"]=ammo.data.data.currentClip.value;
            }
            ammoUpdate["data.isEquipped"]=weapon.id;

            ammo.update(ammoUpdate);
        }else{
            weaponUpdate["data.clip.value"]=0;
        }



        weapon.update(weaponUpdate);



    }
    //handles reloading a ranged weapon
    async _onWeaponReload(event){
        event.preventDefault;
        const dataset=event.currentTarget.dataset;
        let actor=this.actor;
        let data=actor.data.data;
        let weapon=this.actor.getEmbeddedDocument("Item",dataset.weapon);
        let house=await game.actors.get(data.knight.house);

        let ammo=actor.getEmbeddedDocument("Item",weapon.data.data.ammo._id);

        let update={};
        let weaponUpdate={};
        let ammoUpdate={};
        let houseUpdate={};
        weaponUpdate["data.ammo._id"]="";
        weapon.update(weaponUpdate);
        let components=actor.data.data.knight.components.filter(component=>component!==ammo.id);
        actor.update({"data.knight.components":components});
        let originalAmmo=house.getEmbeddedDocument("Item",ammo.data.data.originalId);
        originalAmmo.update({"data.amount.taken":originalAmmo.data.data.amount.taken-1,"data.amount.value":parseInt(originalAmmo.data.data.amount.value)-1});
        ammo.delete();



    }

    async _onPilotChange(event){

        let newPilot=await game.actors.get(event.currentTarget.value);
        let oldPilot=await game.actors.get(this.actor.data.data.crew.pilotID);


        if(newPilot){


            newPilot.update({"data.riding.id":this.actor.id}); 
        }
        if(oldPilot){

            oldPilot.update({"data.riding.id":""});
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
                        stomp.data.flags.fortyk={"blast":3};
                        stomp.data.data.damageType.value="Impact";
                        stomp.data.data.pen.value=0;
                        stomp.data.data.damageFormula.value=formula;
                        await FortykRolls.damageRoll(stomp.data.data.damageFormula,actor,stomp,1);

                    }
                }
            },
            default: "submit",
            width:100}).render(true)
                                         });
    }
    async _onKnightOverheat(event){
        let actor=this.actor;
        let data=this.actor.data.data;
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

                if(r.active){
                    if(r.result===1){
                        ones++;
                    }
                }
            } 
        }catch(err){
        }
        let core=data.knight.core;
        let coreIntegrity=parseInt(core.data.data.state.value)-1;
        await core.update({"data.state.value":coreIntegrity});
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
            overheatResult="The knight takes 4d10 damage until the core overload is cleared.";
            overheatFlavor="Core Overload";
        }else if(result===1){
            overheatResult="Roll a +0 tech-use test, on a success your knight is stunned for 1d5 rounds, on a failure the knight suffers a core meltdown in 1d5 rounds(rolled by the GM). You may retry the tech-use test each round.";
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
        this.actor.update({"data.knight.heat.value":0});


    }
    async _updateHouse(){
        let data=this.actor.data.data;
        let house=await game.actors.get(data.knight.house);
        if(house){
            let actors=[];
            actors.push(data.knight.house);
            actors=actors.concat(house.data.data.knights);
            let socketOp={type:"renderSheets",package:{actors:actors}}
            await game.socket.emit("system.fortyk",socketOp);

        }
    }
    getValidAmmo(weapon){
        let ammos=this.actor.itemTypes.ammunition;
        let validAmmos=[];
        let wpnClass=weapon.data.data.class.value;
        let wpnType=weapon.data.data.type.value;
        for(let i=0;i<ammos.length;i++){
            let ammo=ammos[i];
            let ammoClass=ammo.data.data.class.value;
            let ammoType=ammo.data.data.type.value;

            if(ammoClass===wpnClass&&ammoType===wpnType){
                if(!ammo.data.data.isEquipped){
                    validAmmos.push(ammo);
                }else if(ammo.data.data.isEquipped===weapon.id){
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