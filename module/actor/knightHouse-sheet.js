import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import FortyKBaseActorSheet from "./base-sheet.js";
import {FORTYK} from "../FortykConfig.js";
import {FortyKItem} from "../item/item.js";
import {CreateRepairEntryDialog} from "../dialog/createRepairEntry-dialog.js";
export class FortyKKnightHouseSheet extends FortyKBaseActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/knightHouse-sheet.html",
            width: 666,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "main" }],
            default:null,
            scrollY: [".main",
                      ".repairbay",
                      ".inventory"

                     ]

        });
    }
    /** @override */
    async getData() {
        const data = await super.getData();
        let actor=this.actor;
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        if(data.inventoryFilter===undefined){
            data.inventoryFilter="all";
        }
        data.outposts=actor.itemTypes.outpost;
        data.cadetHouses=actor.itemTypes.cadetHouse;
        data.weapons=actor.itemTypes.rangedWeapon.concat(actor.itemTypes.meleeWeapon,actor.itemTypes.ammunition);
        data.rangedWeapons=actor.itemTypes.rangedWeapon;
        data.meleeWeapons=actor.itemTypes.meleeWeapon;
        data.ammunition=actor.itemTypes.ammunition;
        data.knightComponents=actor.itemTypes.knightComponent;
        data.knightCores=actor.itemTypes.knightCore;
        data.knightArmors=actor.itemTypes.knightArmor;
        data.knightStructures=actor.itemTypes.knightStructure;
        data.forceFields=actor.itemTypes.forceField;
        data.components=data.weapons.concat(data.knightComponents,data.knightCores,data.knightArmors,data.knightStructures,data.forceFields)
        for(let i=0;i<data.components.length;i++){
            data.components[i].prepareData();
        }
        let currentRepairsObjects=[];
        let currentRepairs=actor.system.repairBays.current;
        currentRepairs.forEach(function(repair){
            currentRepairsObjects.push(actor.getEmbeddedDocument("Item",repair));
        });
        data.currentRepairs=currentRepairsObjects;
        let queueObjects=[];
        let queue=actor.system.repairBays.queue;
        queue.forEach(function(repair){
            queueObjects.push(actor.getEmbeddedDocument("Item",repair));
        });
        data.queue=queueObjects;
        data.knightComponentTypes=FORTYK.knightComponentTypes;

        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
        html.find('.addIncome').click(this._onAddIncome.bind(this));
        html.find('.passTime').click(this._onPassTime.bind(this));
        html.find('.knightComponent-create').click(this._onComponentCreate.bind(this));
        html.find('.delete-repair').click(this._onRepairDelete.bind(this));
        html.find('.component-select').change(this._onComponentCategoryChange.bind(this));
        html.find('.repairEntry-create').click(this._repairEntryCreate.bind(this));
    }
    async _onRepairDelete(event){
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        let queue = event.currentTarget.attributes["data-queue"].value;
        let index = parseInt(event.currentTarget.attributes["data-index"].value);
        let item=await this.actor.getEmbeddedDocument("Item",itemId);
        let house=this.actor;
        let knight=game.actors.get(item.system.knight.value);
        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/delete-item-dialog.html');
        renderedTemplate.then(content => {
            new Dialog({
                title: "Deletion Confirmation",
                content: content,
                buttons:{
                    submit:{
                        label:"Yes",
                        callback: async dlg => { 
                            if(queue==="queue"){
                                let queueArray=this.actor.system.repairBays.queue;
                                queueArray.splice(index,1);
                                this.actor.update({"system.repairBays.queue":queueArray});
                            }else{
                                
                                let current=house.system.repairBays.current;
                                let queueArray=this.actor.system.repairBays.queue;
                                current.splice(index,1);
                                if(queueArray.length>0){
                                    current.push(queueArray.pop());
                                    let newCurrentRepairId=current[current.length-1];
                                    let newCurrentRepair=this.actor.getEmbeddedDocument("Item",newCurrentRepairId);
                                    let time=newCurrentRepair.system.time.value;
                                    let calendar=SimpleCalendar.api.getCurrentCalendar();
                                    let currentTime=SimpleCalendar.api.timestamp(calendar.id);

                                    let noteTime=currentTime+time;

                                    let formattedTime=SimpleCalendar.api.timestampToDate(noteTime,calendar.id);

                                    let note=await SimpleCalendar.api.addNote(newCurrentRepair.name, newCurrentRepair.system.description.value, formattedTime, formattedTime, true, false, ["Repairs"], calendar.id, '', ["default"], [game.user.id]);
                                    await newCurrentRepair.update({"system.calendar.noteId":note.uuid});
                                }

                                await house.update({"system.repairBays.current":current,"system.repairBays.queue":queueArray});
                            }
                            console.log(item)
                            SimpleCalendar.api.removeNote(item.system.calendar.noteId);
                            
                            let money=item.system.cost.value;
                            //await this.actor.update({"system.wealth.value":this.actor.system.wealth.value+money});
                            
                            let chatMsg={user: game.user._id,
                                         speaker:{house,alias:house.name},
                                         content:item.system.description.value,
                                         classes:["fortyk"],
                                         flavor:`Deleted repair entry for ${knight.name}, ${money} Imperial bonds are refunded`,
                                         author:house.id};
                            await ChatMessage.create(chatMsg,{});
                            await this.actor.deleteEmbeddedDocuments("Item",[itemId]);

                            this.render(true,{focus:false});
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
    _repairEntryCreate(evet){
        event.preventDefault();
        let dialog=new CreateRepairEntryDialog({actor:this.actor,
                                               timeMod:this.actor.system.repairBays.time,
                                               costMod:this.actor.system.repairBays.cost});
        dialog.render(true,{title:"Create Repair Entry"});
    }
    _onComponentCategoryChange(event){
        let components=document.getElementsByName("component");
        let type=event.currentTarget.value;
        this.document.inventoryFilter=type;
        for(let i=0;i<components.length;i++){
            let component=components[i];
            let componentType=component.attributes["type"].value;
            if(type==="all"){
                component.style.display="";
            }else if(componentType===type){
                component.style.display="";
            }else if(componentType!==type){
                component.style.display="none";
            }
        }
    }
    async _onComponentCreate(event){
        event.preventDefault();
        let templateOptions={"type":[{"name":"knightComponent","label":"Component"},{"name":"rangedWeapon","label":"Ranged Weapon"},{"name":"meleeWeapon","label":"Melee Weapon"},{"name":"ammunition","label":"Ammunition"},{"name":"knightArmor","label":"Armor"},{"name":"knightStructure","label":"Structure"},{"name":"knightCore","label":"Core"},{"name":"forceField","label":"Force Field"}]};

        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/select-wargear-type-dialog.html', templateOptions);

        renderedTemplate.then(content => { 
            new Dialog({
                title: "New Component Type",
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
    _onAddIncome(event){
        let bonds=parseInt(this.actor.system.wealth.value);
        bonds+=parseInt(this.actor.system.wealth.income);
        this.actor.update({"system.wealth.value":bonds});
    }
    async _onPassTime(event){
        let time=parseInt(document.getElementById("daysToPass").value);
        if(isNaN(time)){
            document.getElementById("daysToPass").select()
            return
        }

        let bays=parseInt(this.actor.system.repairBays.value);
        let repairs=[...this.document.repairEntries];
        let repairBays=[];
        for(let i=0;i<bays;i++){
            let repairJob={};
            if(repairs.length>0){
                repairJob.entry=repairs.shift();
                repairJob.days=time;
                repairJob.done=false;
                repairBays.push(repairJob);
            }

        }
        let repairsDone=false;
        let index=0;
        do{
            if(index+1>repairBays.length){
                index=0;
            }
            let job=repairBays[index];
            let jobTime=job.days;
            if(jobTime&&!job.done){
                let entry=job.entry;
                let remainingTime=jobTime-parseInt(entry.system.time.value);
                if(remainingTime>=0){
                    await entry.delete();
                    if(remainingTime>0){
                        job.days=remainingTime;
                        if(repairs.length>0){
                            job.entry=repairs.shift();
                        }else{
                            job.done=true;
                        }
                    }
                }else{
                    job.done=true
                    await job.entry.update({"system.time.value":(parseInt(entry.system.time.value)-jobTime)})
                }
            }
            index++;
            let check=true;
            for(let i=0;i<repairBays.length;i++){
                check=check&&repairBays[i].done;
            }
            if(check){repairsDone=true}
        }while(!repairsDone)
    }
    }