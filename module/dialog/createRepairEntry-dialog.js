import {FortyKItem} from "../item/item.js";
export class CreateRepairEntryDialog extends Application {

    /** @override */

    static get defaultOptions() {

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk"],
            template: "systems/fortyk/templates/actor/dialogs/createRepairEntry-dialog.html",
            width: 666,
            height: 605,
            mode:"repair",
            timeMod:100,
            costMod:100,
            components:0,
            weapons:0,
            armorpoints:0,
            dos:0,
            default:null,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "repair" }]
        });
    }

    async getData(){
        const data=super.getData();

        let house=this.options.actor;
        let knightIds=house.system.knights;
        let knights=[];
        knightIds.forEach(function(id){
            knights.push(game.actors.get(id));
        });
        data.timeMod=this.options.timeMod;
        data.costMod=this.options.costMod;
        data.baseCost=0;
        data.baseTime=0;
        data.modifiedCost=0;
        data.modifiedTime=0;
        data.difficulty=0;
        data.dos=0;
        data.knights=knights;
        let knight=this.options.knight;
        if(knight){
            data.knight=knight;
            data.repairs=this.prepareRepairs(knight.getRepairs());
            this.options.repairs=data.repairs;
        }
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.knight-select').change(this._onKnightSelect.bind(this));

        html.find('.repair-amount').keyup(this._onRepairAmountChange.bind(this));
        html.find('.time-modifier').keyup(this._onTimeModChange.bind(this));
        html.find('.cost-modifier').keyup(this._onCostModChange.bind(this));
        html.find('.refit-input').keyup(this._onRefitChoiceChange.bind(this));
        html.find('.repaircheckbox').click(this._onRepairEntryChosen.bind(this));
        html.find('.repair-type-select').change(this._onRepairTypeChange.bind(this));
        html.find('.repair-test').click(this._onRepairTestClick.bind(this));
        html.find('.create-entry').click(this._onCreateEntry.bind(this));
        html.find('.navtab').click(this._onModeChange.bind(this));
        // Autoselect entire text 
        $("input[type=text]").focusin(function() {
            $(this).select();
        });
        // Autoselect entire text 
        $("input[type=number]").focusin(function() {
            $(this).select();
        });
    }


    prepareRepairs(repairs) {
        let actor=game.user.character;
        var sheet=this;
        if(!actor||actor.type!=="dhPC"){
            return [];
        }
        repairs.forEach(function(repairEntry){
            repairEntry.selectedAmount=repairEntry.amount;
            var ret = sheet.prepareRepair(repairEntry);
            let repairType=repairEntry.type;
            const repairTypeConfig=game.fortyk.FORTYK.vehicleRepairCostTimeDiff[repairType];

            //process difficulty from actor skills, also check if actor has required skills to make repair
            let actorSkills=actor.system.skillsTraining;
            let repairHardReq=repairTypeConfig.hardReq;
            //check hard requirements first
            let qualified=false;
            repairHardReq.forEach(function(skill){

                if(skill.constructor === Array){
                    let testAnd;
                    //all skills are required
                    skill.forEach(function(skillAnd){
                        let testedSkill=actorSkills[skillAnd];
                        if(testAnd!==false){
                            testAnd=testedSkill;
                        }
                    })
                    if(testAnd){
                        qualified=true;  
                    }
                }else{


                    qualified=actorSkills[skill];

                }
            });
            if(repairHardReq.length===0){
                qualified=true;
            }
            if(!repairEntry.disabled){
                repairEntry.disabled=!qualified; 
            }
            //then check skills for difficulty
            let tech=actorSkills["commonlore:tech"];
            let admech=actorSkills["commonlore:adeptusmechanicus"];

            if(admech&&tech){
                repairEntry.difficulty=repairTypeConfig.hasTechnAdmech;
            }else if(admech){
                repairEntry.difficulty=repairTypeConfig.hasAdmech;
            }else if(tech){
                repairEntry.difficulty=repairTypeConfig.hasTech;
            }else{
                repairEntry.difficulty=repairTypeConfig.diff;
            }
        });
        return repairs;
    }
    timeString(time, timeLabel) {
        let calendar=SimpleCalendar.api.getCurrentCalendar().id;
        let timeInterval=SimpleCalendar.api.secondsToInterval(time,calendar);
        //Returns {year: 0, month: 0, day: 0, hour: 1, minute: 0, seconds: 0}
        if(timeInterval.year){
            timeLabel+=`${timeInterval.year} year`;
            if(timeInterval.year>1){
                timeLabel+="s ";
            }else{
                timeLabel+=" ";
            }
        }
        if(timeInterval.month){
            timeLabel+=`${timeInterval.month} month`;
            if(timeInterval.month>1){
                timeLabel+="s ";
            }else{
                timeLabel+=" ";
            }

        }
        if(timeInterval.day){
            timeLabel+=`${timeInterval.day} day`;
            if(timeInterval.day>1){
                timeLabel+="s ";
            }else{
                timeLabel+=" ";
            }
        }
        if(timeInterval.hour){
            timeLabel+=`${timeInterval.hour} hour`;
            if(timeInterval.hour>1){
                timeLabel+="s ";
            }else{
                timeLabel+=" ";
            }
        }
        if(timeInterval.minute){
            timeLabel+=`${timeInterval.minute} minute`;
            if(timeInterval.minute>1){
                timeLabel+="s ";
            }else{
                timeLabel+=" ";
            }
        }
        if(timeInterval.second){
            timeLabel+=`${timeInterval.second} second`;
            if(timeInterval.second>1){
                timeLabel+="s ";
            }else{
                timeLabel+=" ";
            }
        }
        return timeLabel;
    }

    prepareRepair(repairEntry,amount=false) {

        let repairType=repairEntry.type;
        const repairTypeConfig=game.fortyk.FORTYK.vehicleRepairCostTimeDiff[repairType];

        if(amount===false){
            amount=parseInt(repairEntry.amount);
        }
        console.log(repairEntry);
        const configAmount=repairTypeConfig.amount;
        
        let ratio=amount/configAmount;
        const configTime=repairTypeConfig.time;
        const configCost=repairTypeConfig.cost;
        repairEntry.time=Math.ceil(configTime*ratio);
        repairEntry.cost=Math.ceil(configCost*ratio);
        //damaged components take more time/cost to repair above scarce rarity
        if(repairType==="damagedcomponent"){
            let rarity=parseInt(repairEntry.rarity);
            if(rarity<-10){
                let rarityAboveScarce=Math.abs(rarity+10)/10;
                console.log(rarityAboveScarce,rarity);
                repairEntry.time+=repairTypeConfig.timePerRarityAboveScarce*rarityAboveScarce;
                repairEntry.cost+=repairTypeConfig.costPerRarityAboveScarce*rarityAboveScarce;
                console.log(repairEntry)
            }
        }

        //parse the time into day/hours/years etc

        let timeLabel="";
        timeLabel = this.timeString(repairEntry.time, timeLabel);
        repairEntry.timeLabel=timeLabel;

    }
    validateThresholds(){
        let firstThresholdCheckBox=document.getElementsByName("firstthresholddmg")[0];
        let firstrepair=this.options.repairs[0];
        let secondThresholdCheckBox=document.getElementsByName("secondthresholddmg")[0];
        let secondrepair=this.options.repairs[1];
        let thirdThresholdCheckBox=document.getElementsByName("thirdthresholddmg")[0];
        let thirdrepair=this.options.repairs[2];
        let fourthThresholdCheckBox=document.getElementsByName("fourththresholddmg")[0];
        let fourthrepair=this.options.repairs[3];
        let criticalCheckBox=document.getElementsByName("criticaldmg")[0];
        let criticalrepair=this.options.repairs[4];


        if(criticalCheckBox){
            let criticalMax=criticalrepair.amount;
            let criticalInput=document.getElementById("4input");
            let criticalAmt=criticalInput.valueAsNumber;

            if(criticalCheckBox.checked&&criticalAmt===criticalMax){
                fourthThresholdCheckBox.removeAttribute("disabled");
            }else{
                fourthThresholdCheckBox.checked=false;
                fourthThresholdCheckBox.setAttribute("disabled",true); 
            }
        }
        if(fourthThresholdCheckBox){

            let fourthMax=fourthrepair.amount;
            let fourthInput=document.getElementById("3input");
            let fourthAmt=fourthInput.valueAsNumber;

            if(fourthThresholdCheckBox.checked&&fourthAmt===fourthMax){
                thirdThresholdCheckBox.removeAttribute("disabled"); 
            }else{
                thirdThresholdCheckBox.setAttribute("disabled",true);
                thirdThresholdCheckBox.checked=false;
            }

        }
        if(thirdThresholdCheckBox){
            let thirdMax=thirdrepair.amount;
            let thirdInput=document.getElementById("2input");
            let thirdAmt=thirdInput.valueAsNumber;

            if(thirdThresholdCheckBox.checked&&thirdAmt===thirdMax){

                secondThresholdCheckBox.removeAttribute("disabled");
            }else{
                secondThresholdCheckBox.setAttribute("disabled",true);
                secondThresholdCheckBox.checked=false;
            }
        }


        if(secondThresholdCheckBox){
            let secondMax=secondrepair.amount;
            let secondInput=document.getElementById("1input");
            let secondAmt=secondInput.valueAsNumber;

            if(secondThresholdCheckBox.checked&&secondAmt===secondMax){
                firstThresholdCheckBox.removeAttribute("disabled");
            }else{
                firstThresholdCheckBox.checked=false;
                firstThresholdCheckBox.setAttribute("disabled",true);
            }
        }







    }
    updateCosts(){

        let chosenRepairs=[];
        let repairs=this.options.repairs;
        let totalCost=0;
        let totalTime=0;
        let wounds=0;
        let difficulty=50;
        let actor=game.user.character;
        let chatString="<div class='flexcol'>";

        if(this.options.mode==="repair"){
            $('.repair input:checkbox:checked').each(function(){

                let repair=repairs[parseInt($(this)[0].dataset.index)];
                let diff=repair.difficulty;
                if(diff<difficulty){
                    difficulty=diff;
                }
                totalCost+=repair.cost;
                totalTime+=repair.time;
                chatString+=`<span class="chat-line">${repair.label}: ${repair.selectedAmount}</span>`;
                if(repair.type==="armordmg"){
                    chosenRepairs.push(repair);  
                }else if(repair.type.indexOf("dmg")!==-1){
                    wounds+=repair.selectedAmount;
                }else{
                    chosenRepairs.push(repair);  
                }

            });
        }else{
            let tech=actor.system.skillsTraining["commorelore:tech"];
            let admech=actor.system.skillsTraining["commonlore:adeptusmechanicus"];



            //code skill validation
            let componentRefits=this.options.components;
            let weaponRefits=this.options.weapons;
            let armorPointRefits=this.options.armorpoints;
            let armorChange=document.getElementById('armor').checked;
            let structureChange=document.getElementById('structure').checked;
            let coreChange=document.getElementById('core').checked;
            const repairTypeConfig=game.fortyk.FORTYK.vehicleRepairCostTimeDiff;
            let armorPointsConfig=repairTypeConfig.armordmg;
            let difficulty=[];
            if(armorPointRefits>0){
                if(admech&&tech){
                    difficulty.push(armorPointsConfig.hasTechnAdmech);
                }else if(admech){
                    difficulty.push(armorPointsConfig.hasAdmech);
                }else if(tech){
                    difficulty.push(armorPointsConfig.hasTech);
                }else{
                    difficulty.push(armorPointsConfig.diff);
                }
                chatString+=`<span class="chat-line">Armor Points Changed: ${armorPointRefits}</span>`;
            }
            let armorratio=armorPointRefits/armorPointsConfig.amount;
            totalCost+=armorratio*armorPointsConfig.cost;
            totalTime+=armorratio*armorPointsConfig.time;
            let weaponsRefitsConfig=repairTypeConfig.refittitanicweapon;
            if(weaponRefits>0){

                if(admech&&tech){
                    difficulty.push(weaponsRefitsConfig.hasTechnAdmech);
                }else if(admech){
                    difficulty.push(weaponsRefitsConfig.hasAdmech);
                }else if(tech){
                    difficulty.push(weaponsRefitsConfig.hasTech);
                }else{
                    difficulty.push(weaponsRefitsConfig.diff);
                }
                chatString+=`<span class="chat-line">Titanic Weapons Refitted: ${weaponRefits}</span>`;
            }
            totalCost+=weaponRefits*weaponsRefitsConfig.cost;
            totalTime+=weaponRefits*weaponsRefitsConfig.time;
            let componentRefitsConfig=repairTypeConfig["install/removecomponent"];
            if(componentRefits>0){
                if(admech&&tech){
                    difficulty.push(componentRefitsConfig.hasTechnAdmech);
                }else if(admech){
                    difficulty.push(componentRefitsConfig.hasAdmech);
                }else if(tech){
                    difficulty.push(componentRefitsConfig.hasTech);
                }else{
                    difficulty.push(componentRefitsConfig.diff);
                }
                chatString+=`<span class="chat-line">Space of Components Refitted: ${componentRefits}</span>`;
            }
            totalCost+=componentRefits*componentRefitsConfig.cost;
            totalTime+=componentRefits*componentRefitsConfig.time;

            if(armorChange){
                chatString+=`<span class="chat-line">Armor changed</span>`;
                let armorChangeConfig=repairTypeConfig.changearmor;
                if(admech&&tech){
                    difficulty.push(armorChangeConfig.hasTechnAdmech);
                }else if(admech){
                    difficulty.push(armorChangeConfig.hasAdmech);
                }else if(tech){
                    difficulty.push(armorChangeConfig.hasTech);
                }else{
                    difficulty.push(armorChangeConfig.diff);
                }
                totalCost+=armorChangeConfig.cost;
                totalTime+=armorChangeConfig.time;
            }
            if(coreChange){
                chatString+=`<span class="chat-line">Core changed</span>`;
                let coreChangeConfig=repairTypeConfig.changecore;
                if(admech&&tech){
                    difficulty.push(coreChangeConfig.hasTechnAdmech);
                }else if(admech){
                    difficulty.push(coreChangeConfig.hasAdmech);
                }else if(tech){
                    difficulty.push(coreChangeConfig.hasTech);
                }else{
                    difficulty.push(coreChangeConfig.diff);
                }
                totalCost+=coreChangeConfig.cost;
                totalTime+=coreChangeConfig.time;
            }
            if(structureChange){
                chatString+=`<span class="chat-line">Structure changed</span>`;
                let structureChangeConfig=repairTypeConfig.changestructure;
                if(admech&&tech){
                    difficulty.push(structureChangeConfig.hasTechnAdmech);
                }else if(admech){
                    difficulty.push(structureChangeConfig.hasAdmech);
                }else if(tech){
                    difficulty.push(structureChangeConfig.hasTech);
                }else{
                    difficulty.push(structureChangeConfig.diff);
                }
                totalCost+=structureChangeConfig.cost;
                totalTime+=structureChangeConfig.time;
            }
            difficulty=Math.min(...difficulty);

        }
        chatString+="</div>"
        this.options.description=chatString;
        this.options.woundsRepair=wounds;
        this.options.selectedRepairs=chosenRepairs;
        let baseCostNode=document.getElementById("basecost");
        baseCostNode.innerHTML=totalCost;
        let baseTimeNode=document.getElementById("basetime");
        baseTimeNode.innerHTML=this.timeString(totalTime,"");
        let repairType=document.getElementById("repair-type").value;
        const FORTYK=game.fortyk.FORTYK;
        let typeTime=FORTYK.vehicleRepairTypes[repairType].time;
        let typeCost=FORTYK.vehicleRepairTypes[repairType].cost;
        let typeDiff=FORTYK.vehicleRepairTypes[repairType].difficulty;
        difficulty+=typeDiff;

        let actorTech=actor.system.skills["tech-use"];
        difficulty+=actorTech;
        difficulty=Math.max(1,difficulty);
        document.getElementById("difficulty").innerHTML=difficulty;
        this.options.difficulty=difficulty;
        let miscTime=this.options.timeMod/100;
        let miscCost=this.options.costMod/100;
        miscCost*=typeCost;
        miscTime*=typeTime;
        let knight=this.options.knight;
        if(knight&&knight.getFlag("fortyk","rugged")){
            miscCost*=0.75;
            miscTime*=0.75;

        }
        document.getElementById("time-input").value=(miscTime*100).toFixed(2);
        document.getElementById("cost-input").value=(miscCost*100).toFixed(2);
        let dos=this.options.dos;
        let dosTime=null;
        var i=0;
        do{
            console.log(totalTime)
            let repairAdjust=FORTYK.repairTimeAdjustment[i]
            if(totalTime<repairAdjust.upperRange){
                dosTime=repairAdjust.adjustment;
            }
            i++;
        }while(dosTime===null);
        let moddedTime=totalTime-dos*dosTime;
        moddedTime*=miscTime;
        moddedTime=Math.ceil(moddedTime);
        this.options.totalModdedTime=moddedTime;
        let timeString=this.timeString(moddedTime,"");
        document.getElementById("modtime").innerHTML=timeString;
        let moddedCost=Math.ceil(totalCost*Math.max(0.2,(miscCost*(1-dos*0.05))));
        document.getElementById("modcost").innerHTML=moddedCost;
        this.options.totalModdedCost=moddedCost;

    }
    _onRefitChoiceChange(event){
        let value=parseInt(event.currentTarget.value);
        let type=event.currentTarget.dataset.type;
        this.options[type]=value;
        this.updateCosts();
    }
    _onModeChange(event){
        let mode=event.currentTarget.dataset.tab;
        this.options.mode=mode;
        this.updateCosts();
        console.log(mode)
    }
    async _onCreateEntry(event){
        if(!this.options.ready){return}
        let cost=this.options.totalModdedCost;
        let time=this.options.totalModdedTime;
        let repairs=this.options.selectedRepairs;
        let description=this.options.description;
        let woundRepairs=this.options.woundsRepair;
        let knight=this.options.knight;
        let house=this.options.actor;
        let calendar=SimpleCalendar.api.getCurrentCalendar();
        let entries=house.itemTypes.repairEntry;
        let entry=entries.filter(entry=>entry.system.knight.value===knight._id)
        if(entry.length>0){
            let update={};
            let updateEntry=entry[0];
            let entryData=updateEntry.system;
            update["system.time.value"]=time+entryData.time.value;
            update["system.cost.value"]=cost+entryData.cost.value;
            update["system.description.value"]=entryData.description.value+description;
            update["system.repairs.entries"]=entryData.repairs.entries.concat(repairs);
            update["system.repairs.wounds"]=entryData.repairs.wounds+woundRepairs;
            SimpleCalendar.api.removeNote(entryData.calendar.noteId);
            let currentTime=SimpleCalendar.api.timestamp(calendar.id);

            let noteTime=currentTime+time+entryData.time.value;

            let formattedTime=SimpleCalendar.api.timestampToDate(noteTime,calendar.id);

            let note=await SimpleCalendar.api.addNote(`${knight.name} repairs`, description, formattedTime, formattedTime, true, false, ["Repairs"], calendar.id, '', ["default"], [game.user.id]);
            update["system.calendar.noteId"]=note.id;
            updateEntry.update(update);
            let chatMsg={user: game.user._id,
                         speaker:{house,alias:game.user.character.name},
                         content:description,
                         classes:["fortyk"],
                         flavor:`Added repairs for ${knight.name}, Total Cost:${cost}`,
                         author:game.user.character.id};
            await ChatMessage.create(chatMsg,{});

        }else{
            let entryData={
                name:`${knight.name} repairs`,
                type:"repairEntry",
                system:{
                    "time":{
                        "value":time,
                        "type":"Number"
                    },
                    "cost":{
                        "value":cost,
                        "type":"Number"
                    },
                    "calendar":{
                        "calendarId":calendar.id,
                        "noteId":""
                    },
                    "knight":{
                        "value":knight._id,
                        "type":"String"
                    },
                    "repairs":{
                        "entries":repairs,
                        "wounds":woundRepairs
                    },
                    "description":{
                        "value":description
                    }
                }
            }
            let entryItem=await house.createEmbeddedDocuments("Item",[entryData]);
            entryItem=entryItem[0];
            let activeRepairs=house.system.repairBays.current;
            let repairNumber=house.system.repairBays.value;
            let repairQueue=house.system.repairBays.queue;
            let houseUpdates={};
            let houseMoney=parseInt(house.system.wealth.value);
            houseMoney-=cost;
            houseUpdates["system.wealth.value"]=houseMoney;
            if(activeRepairs.length>=repairNumber){
                repairQueue.push(entryItem.id);
                houseUpdates["system.repairBays.queue"]=repairQueue;
            }else{
                activeRepairs.push(entryItem.id);
                houseUpdates["system.repairBays.current"]=activeRepairs;
                let currentTime=SimpleCalendar.api.timestamp(calendar.id);

                let noteTime=currentTime+time;

                let formattedTime=SimpleCalendar.api.timestampToDate(noteTime,calendar.id);

                let note=await SimpleCalendar.api.addNote(entryItem.name, description, formattedTime, formattedTime, true, false, ["Repairs"], calendar.id, '', ["default"], [game.user.id]);
                await entryItem.update({"system.calendar.noteId":note.id});
            }
            await house.update(houseUpdates);
            let chatMsg={user: game.user._id,
                         speaker:{house,alias:game.user.character.name},
                         content:description,
                         classes:["fortyk"],
                         flavor:`Created repair entry for ${knight.name}, Total Cost:${cost}`,
                         author:game.user.character.id};
            await ChatMessage.create(chatMsg,{});
        }

        this.close();
    }
    async _onRepairTestClick(event){

        if(this.options.rerolled){
            return
        }
        let testTarget=this.options.difficulty;
        let actor=game.user.character;
        let knight=this.options.knight;
        let repairTest=await Dialog.prompt({
            title: `Additional modifier`,
            content: `<p><label>Modifier:</label> <input id="modifier" type="text" name="mod" value="0" autofocus/></p>`,



            callback: async(html) => {
                const modifier = $(html).find('input[name="mod"]').val();
                let test=await game.fortyk.FortykRolls.fortykTest("int", "Repair Test", testTarget+parseInt(modifier), actor, `Repair of the ${knight.name}`);
                $('.createRepairEntry-dialog input[type=checkbox]').attr('disabled','true');
                $('.createRepairEntry-dialog input[type=number]').attr('disabled','true');
                $('.createRepairEntry-dialog select').attr('disabled','true');
                return test;
            },






            width:100});
        let dosNode=document.getElementById("dos");
        dosNode.innerHTML=repairTest.dos;
        if(this.options.reroll){
            this.options.rerolled=true;
            document.getElementById("testButton").innerHTML="Tests Finished";
        }else{
            this.options.reroll=true; 
            document.getElementById("testButton").innerHTML="Reroll Test";
        }


        if(repairTest.value){
            this.options.dos=repairTest.dos;
            dosNode.style["background-color"]="green";

        }else{
            dosNode.style["background-color"]="red";
            this.options.dos=-repairTest.dos;

        }
        this.updateCosts();
        this.options.ready=true;
    }
    _onRepairTypeChange(event){
        this.updateCosts();
    }
    _onTimeModChange(event){
        let value=parseInt(event.currentTarget.value);
        this.options.timeMod=value;
        this.updateCosts();
    }
    _onCostModChange(event){
        let value=parseInt(event.currentTarget.value);
        this.options.costMod=value;
        this.updateCosts(); 
    }
    _onRepairEntryChosen(event){
        if(this.options.mode==="repair"){
            this.validateThresholds();
        }

        this.updateCosts();
    }
    _onRepairAmountChange(event) {

        let key=parseInt(event.key);

        let amount=event.currentTarget.valueAsNumber;
        let max=parseInt(event.currentTarget.max);
        if(amount>max){
            amount=max;
            event.currentTarget.value=max;
        }
        let index=parseInt(event.currentTarget.dataset.index);
        let repairs=this.options.repairs;
        let repair=repairs[index];
        let timeNode=document.getElementById(index+"time");
        let costNode=document.getElementById(index+"cost");
        this.prepareRepair(repair,amount);
        repair.selectedAmount=amount;
        timeNode.innerHTML=repair.timeLabel;
        costNode.innerHTML=repair.cost;
        this.validateThresholds();
        this.updateCosts();


    }
    async _onKnightSelect(event) {
        event.preventDefault();
        let knightId=event.target.value;
        let knight=game.actors.get(knightId);
        this.options.knight=knight;
        await this._render();
        this.updateCosts();
    }
}