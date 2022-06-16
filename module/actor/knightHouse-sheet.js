import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import FortyKBaseActorSheet from "./base-sheet.js";
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
        console.log(this)
        data.outposts=actor.itemTypes.outpost;
        data.cadetHouses=actor.itemTypes.cadetHouse;
        data.repairEntries=actor.itemTypes.repairEntry.sort(function(a,b){return a.data.sort-b.data.sort});
        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
        html.find('.addIncome').click(this._onAddIncome.bind(this));
        html.find('.passTime').click(this._onPassTime.bind(this));
    }
    /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
    async _onRoll(event) {
        event.preventDefault();
        const element=event.currentTarget;
        const dataset=element.dataset;
        let testType=dataset["rollType"];
        var testTarget=parseInt(dataset["target"]);
        var testLabel=dataset["label"];
        var testChar=dataset["char"];
        var item=null;


        FortykRollDialogs.callRollDialog(testChar, testType, testTarget, this.actor, testLabel, item, false);

        //autofocus the input after it is rendered.
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
        console.log(bays)
        for(let i=0;i<bays;i++){
            let repairJob={};
            if(repairs.length>0){
                console.log("hey")
                repairJob.entry=repairs.shift();
                repairJob.days=time;
                repairJob.done=false;
                repairBays.push(repairJob);
            }

        }
        console.log(repairBays)
        let repairsDone=false;
        let index=0;
        do{
            if(index+1>repairBays.length){
                index=0;
            }
            console.log(index)
            let job=repairBays[index];
            console.log(job)
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