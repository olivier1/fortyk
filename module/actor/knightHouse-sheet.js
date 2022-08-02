import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import FortyKBaseActorSheet from "./base-sheet.js";
import {FORTYK} from "../FortykConfig.js";
import {FortyKItem} from "../item/item.js";
export class FortyKKnightHouseSheet extends FortyKBaseActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
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
    getData() {
        const data = super.getData();
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
        data.repairEntries=actor.itemTypes.repairEntry.sort(function(a,b){return a.data.sort-b.data.sort});
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
        html.find('.component-select').change(this._onComponentCategoryChange.bind(this));
    }
    _onComponentCategoryChange(event){
        let components=document.getElementsByName("component");
        let type=event.currentTarget.value;
        this.document.data.inventoryFilter=type;
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
                            await this.actor.createEmbeddedDocuments("Item",[item.data],{"renderSheet":true});





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
        let bonds=parseInt(this.actor.data.data.wealth.value);
        bonds+=parseInt(this.actor.data.data.wealth.income);
        this.actor.update({"data.wealth.value":bonds});
    }
    async _onPassTime(event){
        let time=parseInt(document.getElementById("daysToPass").value);
        if(isNaN(time)){
            document.getElementById("daysToPass").select()
            return
        }

        let bays=parseInt(this.actor.data.data.repairBays.value);
        let repairs=[...this.document.data.repairEntries];
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
                let remainingTime=jobTime-parseInt(entry.data.data.time.value);
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
                    await job.entry.update({"data.time.value":(parseInt(entry.data.data.time.value)-jobTime)})
                }
            }
            index++;
            let check=true;
            for(let i=0;i<repairBays.length;i++){
                check=check&&repairBays[i].done;
            }
            if(check){repairsDone=true}
        }while(!repairsDone)
            console.log(repairs)
    }
}