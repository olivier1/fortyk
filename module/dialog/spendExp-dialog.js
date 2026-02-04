import {FortyKItem} from "../item/item.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export class SpendExpDialog extends HandlebarsApplicationMixin(ApplicationV2) {

    /** @override */
    #talents=null;
    #rawTalents=null;
    #eliteAdvances=null;
    #rawEliteAdvances=null;
    #psyPowers = null;
    #rawPowers = null;
    #cost = 0;
    #discipline = "";
    #chosenSkill = null;
    #chosenChar = null;
    #chosenTalent = null;
    #chosenPower = null;
    #chosenEliteAdvance = null;
    #charUpg = null;
    #mode = "Custom";
    static DEFAULT_OPTIONS= {

        tag: 'form',
        classes: ["fortyk"],
        template: "systems/fortyk/templates/actor/dialogs/spendExp-dialog.html",
        position:{
            width: 666,
            height: "auto"
        },

        mode:"Custom",
        default:null,
        heights:{"Custom":280,"Characteristic Upgrade":275,"Skill Upgrade":275,"New Skill":805,"Talent":795, "Signature Wargear":360,"Psy Rating":300,"Psychic Power":765, "Navigator Power":765, "Elite Advance":765}


    }
    static PARTS = {
        form:{
            template:"systems/fortyk/templates/actor/dialogs/spendExp-dialog.html",
            scrollable:['.tntgrid']
        }
    }
    async loadDocuments(actor, force=false) {


        const startTime=performance.now();
        if(actor.getFlag("fortyk","navigator")){
            if(force||!this.#psyPowers){
                this.#psyPowers= await this._loadNavPowers();
            }

        }else if(actor.system.psykana.pr.value>0){
            if((force||!this.#psyPowers)){
                this.#psyPowers= await this._loadPsyPowers();
            }else{
                this.#psyPowers= this.filterPsyPowers(this.#rawPowers, actor);
            }
        }

        if(force||!this.talents){
            this.#talents=await this._loadTalents();
        }else{
            this.#talents=this.filterTalents(this.#rawTalents, actor);
        }
        if(force||!this.#eliteAdvances){
            this.#eliteAdvances=await this._loadEliteAdvances();
        }else{
            this.#eliteAdvances=this.filterEliteAdvances(this.#rawEliteAdvances, actor);
        }
        const endTime=performance.now();
        console.log(`Loading documents took ${endTime-startTime} ms`);

    }

    async _prepareContext(options){

        let data=this;
        let actor=this.options.actor;
        await this.loadDocuments(actor);
        if(!this.#cost){this.#cost=0;}
        data.ineligibles=this.ineligibles;
        data.actorExp=actor.system.experience.value;
        data.cost=this.#cost;
        data.remainingExp=data.actorExp-data.cost;
        data.FORTYK=game.fortyk.FORTYK;
        data.advancementTypes=foundry.utils.duplicate(data.FORTYK.advancementTypes);
        if(actor.getFlag("fortyk","deathwatchmarine")){
            data.advancementTypes.push({value:"Signature Wargear"});
        }
        if(actor.getFlag("fortyk","navigator")){
            data.advancementTypes.push({value:"Navigator Power"});
            data.disciplines=data.FORTYK.psychicDisciplines;
            data.psyPowers=this.#psyPowers;
            if(!data.discipline||this.#discipline===undefined){
                data.discipline="All";
            }else{
                data.discipline=this.#discipline;
            }
        }else if(actor.system.psykana.pr.value>0){
            data.pr=actor.system.psykana.pr.value;
            data.pr1=actor.system.psykana.pr.value+1;
            data.advancementTypes.push({value:"Psy Rating"});
            data.advancementTypes.push({value:"Psychic Power"});
            data.disciplines=data.FORTYK.psychicDisciplines;

            data.psyPowers=this.#psyPowers;
            if(!data.discipline||this.#discipline===undefined){
                data.discipline="All";
            }else{
                data.discipline=this.#discipline;
            }
        }
        data.mode=this.#mode;
        data.skills=actor.skills;
        data.parentSkills=data.skills.filter(skill => skill.system.hasChildren.value);
        data.upgradeableSkills=data.skills.reduce(function(map,skill){


            if(!skill.system.hasChildren.value&&(skill.system.value<30)){
                let dupSkill=foundry.utils.duplicate(skill);
                let label=dupSkill.name;
                if(parseInt(dupSkill.system.value)===-20){
                    label+=" +0";  
                }else{
                    label+=" +"+(parseInt(dupSkill.system.value)+10);
                }
                dupSkill.name=label;
                map.push(dupSkill);  
            }

            return map;
        },[]);

        let actorChars=this.options.actor.system.characteristics;
        data.upgradeableChars=this._upgradeableChars(actorChars,data.FORTYK.characteristics);
        data.aptitudes=data.FORTYK.aptitudes;




        data.talents=this.#talents;


        data.eliteAdvances=this.#eliteAdvances;
        return data;
    }
    _onRender(context, options) {
        super._onRender(context, options);
        const html=$(this.element);
        //select dialog mode
        html.find('.mode').change(this._onModeChange.bind(this));
        //select new skill type
        html.find('.skill-type').change(this._onSkillTypeChange.bind(this));
        //select aptitude change
        html.find('.aptitude-select').change(this._onAptitudeChange.bind(this));
        //select item rarity change
        html.find('.rarity-select').change(this._onRarityChange.bind(this));
        //select item quality change
        html.find('.quality-select').change(this._onQualityChange.bind(this));
        //input custom cost
        html.find('.custom-cost').keyup(this._onCustomCost.bind(this));
        //input discount
        html.find('.discount').keyup(this._onDiscount.bind(this));
        //change skill upgrade
        html.find('.skillChoice').change(this._onSkillUpgrade.bind(this));
        //change char upgrade
        html.find('.charChoice').change(this._onCharUpgrade.bind(this));
        //change talent choice
        html.find('.tntcheckbox').click(this._onTalentChoice.bind(this));
        html.find('.talentfilter').keyup(this._onTntFilterChange.bind(this));
        html.find('.talentfilter').ready(this._onTalentLoad.bind(this));
        html.find('.tntdescr-button').click(this._onTntDescrClick.bind(this));
        //select discipline change
        html.find('.discipline-select').change(this._onDisciplineChange.bind(this));
        html.find('.powercheckbox').click(this._onPowerChoice.bind(this));
        //choose elite advance
        html.find('.elitecheckbox').click(this._onEliteAdvanceChoice.bind(this));
        //new skill children
        html.find('.children').click(this._onChildrenClick.bind(this));
        //filter inelligibles
        html.find('.show-ineligible-checkbox').click(this._onIneligiblesClick.bind(this));
        //create advance
        html.find('.submit').click(this._onSubmit.bind(this));
        // Autoselect entire text 
        $("input[type=text]").focusin(function() {
            $(this).select();
        });
        //stop the change event on all inputs because its jank
      $("input").change(function (event){
          event.stopImmediatePropagation();
          event.preventDefault();
      });
       $("select:not([class])").change(function (event){
          event.stopImmediatePropagation();
          event.preventDefault();
       });


    } 
    _upgradeableChars(actorChars,chars){
        let upgChars={};
        for(const char in chars){
            if(actorChars[char].advance<25){

                upgChars[char]=foundry.utils.duplicate(chars[char]);
                upgChars[char].label+=" +"+(actorChars[char].advance+5);
            }
        }
        return upgChars;
    }
    _onTalentLoad(event){
        if(this.#mode==="Custom"){
            let input=document.getElementById("custom-name").select();
        }else if(this.#mode==="New Skill"){
            let input=document.getElementById("name").select();
        }else if(this.#mode==="Talent"){

            let input=document.getElementById("talentfilter").select();
        }
        else if(this.#mode==="Signature Wargear"){
            let input=document.getElementById("name").select();
        }
        if(this.#mode==="Talent"||this.#mode==="Skill Upgrade"||this.#mode==="Characteristic Upgrade"||this.#mode==="Psychic Power"||this.#mode==="Navigator Power"){
            document.getElementById("submitButton").setAttribute("disabled",true);
        }



    }
    async _onSubmit(event){
        event.preventDefault();
        let actor=this.options.actor;
        if(this.remainingExp<0){
            new Dialog({
                title: `Insufficient Experience.`,
                classes:"fortky",
                content: "You have insufficient experience points to purchase this advance!",
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: (html) => {

                        }

                    }
                },
                default: "submit",


                width:200}
                      ).render(true);
            return;
        }
        const type = "advancement";
        if(this.#mode==="Custom"){

            const name = document.getElementById("custom-name").value;
            const itemData = {
                name: `${name}`,
                type: type,
                system:{
                    type:{value:"Custom"},
                    cost:{value:this.#cost}
                }
            };

            let item=await FortyKItem.create(itemData,{temporary:true});
            await actor.createEmbeddedDocuments("Item",[foundry.utils.duplicate(item)]);
            this.#cost=0;
        }else if(this.#mode==="Skill Upgrade"){
            let skill=this.#chosenSkill;
            let skillUpgrade=parseInt(skill.system.value);

            if(skillUpgrade===-20){skillUpgrade=0;}else{skillUpgrade+=10;}

            let name = skill.name+" +"+skillUpgrade;
            if(skill.system.parent.value){
                name=skill.system.parent.value+": "+name;
            }
            const itemData = {
                name: `${name}`,
                type: type,
                system:{
                    type:{value:"Skill Upgrade"},
                    cost:{value:this.#cost},
                    itemId:{value:skill.id}

                }
            };

            let item=await FortyKItem.create(itemData,{temporary:true});
            await actor.createEmbeddedDocuments("Item",[foundry.utils.duplicate(item)]);
            await actor.updateEmbeddedDocuments("Item",[{"_id":skill.id,"system.value":skillUpgrade}]);
            this.#cost=0;
        }else if(this.#mode==="New Skill"){
            let advanceName="";
            let skillName=document.getElementById("name").value;
            let parent=document.getElementById("skill-type").value;
            if(parent){advanceName=parent+": ";}
            advanceName+=skillName+" +0";
            let children=document.getElementById("children").checked;
            let aptitudes="";
            let apt1=document.getElementById("aptitude1").value;
            let apt2=document.getElementById("aptitude2").value;
            aptitudes=apt1+","+apt2;
            let skillUse=document.getElementById("skillUse").value;
            let skillDescr=document.getElementById("description").value;
            const skillData = {
                name: `${skillName}`,
                type: "skill",
                system:{
                    parent:{value:parent},
                    hasChildren:{value:children},
                    aptitudes:{value:aptitudes},
                    skillUse:{value:skillUse},
                    description:{value:skillDescr},
                    value:0

                }
            };
            let skill=await actor.createEmbeddedDocuments("Item",[skillData]);

            const advData = {
                name: `${advanceName}`,
                type: type,
                data:{
                    type:{value:"New Skill"},
                    cost:{value:this.#cost},
                    itemId:{value:skill[0].id}

                }
            };
            await actor.createEmbeddedDocuments("Item",[advData]);
            await this.loadDocuments(actor, true);
            this.baseSkillCost();
        }else if(this.#mode==="Characteristic Upgrade"){
            let char=this.#chosenChar;
            let training=this.#charUpg;
            let name = this.FORTYK.characteristics[char].label+" +"+training;

            const itemData = {
                name: `${name}`,
                type: type,
                system:{
                    type:{value:"Characteristic Upgrade"},
                    cost:{value:this.#cost},
                    characteristic:{value:char}

                }
            };

            let item=await new FortyKItem(itemData,{temporary:true});
            await actor.createEmbeddedDocuments("Item",[foundry.utils.duplicate(item)]);
            let update={};
            let path=`system.characteristics.${char}.advance`;
            update[path]=training;
            await actor.update(update);
            await this.loadDocuments(actor, true);
            this.#cost=0;
        }else if(this.#mode==="Talent"){

            let talent=this.#chosenTalent;
            let advanceName="Talent: "+talent.name;
            let itemData=foundry.utils.duplicate(talent);
            let tntData=talent.system;
            let spec=tntData.specialisation.value;
            let flag=tntData.flagId.value;



            var talentId="";
            var chosenSpec=true;
            if(spec!=="N/A"){
                chosenSpec=await Dialog.prompt({
                    title: "Choose specialisation",
                    content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${tntData.specialisation.value}" autofocus/></p>`,



                    callback: async(html) => {
                        const choosenSpec = $(html).find('input[name="spec"]').val();
                        advanceName+=" ("+choosenSpec+")";


                        return choosenSpec;
                    },
                    render: (html)=>{
                        document.getElementById('specInput').select();
                    },
                    width:100});

                itemData.system.specialisation.value=chosenSpec;



                let actorTalent=actor.itemTypes["talentntrait"].filter(function(tlnt){
                    if(tlnt.name===talent.name){
                        return true;
                    }
                    return false;
                });
                if(actorTalent.length>0){
                    let spec2=actorTalent[0].system.specialisation.value;
                    talentId=actorTalent[0].id;
                    spec2+=", "+chosenSpec;
                    await actorTalent[0].update({"system.specialisation.value":spec2}); 
                }else{
                    let actorTalent=await actor.createEmbeddedDocuments("Item",[itemData]);
                    talentId=actorTalent[0].id;
                }

            }else{
                let actorTalent=await actor.createEmbeddedDocuments("Item",[foundry.utils.duplicate(talent)]);
                talentId=actorTalent[0].id;

            }
            //await actor.setFlag("fortyk",flag,chosenSpec);
            const advData = {
                name: `${advanceName}`,
                type: type,
                system:{
                    type:{value:"Talent"},
                    cost:{value:this.#cost},
                    itemId:{value:talentId}

                }
            };
            await actor.createEmbeddedDocuments("Item",[advData]);
            this.#cost=0;
            await this.loadDocuments(actor, true);

            this.talents=this.talents;

        }else if(this.#mode==="Signature Wargear"){
            const wargearName = document.getElementById("name").value;
            const itemData = {
                name: `Signature Wargear: ${wargearName}`,
                type: type,
                system:{
                    type:{value:"Signature Wargear"},
                    cost:{value:this.#cost}
                }
            };

            let item=await new FortyKItem(itemData,{temporary:true});
            await actor.createEmbeddedDocuments("Item",[foundry.utils.duplicate(item)]);
            this.#cost=0;
        }else if(this.#mode==="Psy Rating"){
            let pr=actor.system.psykana.pr.value;
            let newPr=pr+1;
            const itemData = {
                name: `Psy Rating Upgrade: ${newPr}`,
                type: type,
                system:{
                    type:{value:"Psy Rating"},
                    cost:{value:this.#cost}
                }
            };

            let item=await new FortyKItem(itemData,{temporary:true});
            await actor.createEmbeddedDocuments("Item",[foundry.utils.duplicate(item)]);
            let tnts=actor.itemTypes.talentntrait;
            let prObject=tnts.find((tnt)=> (tnt.name.toLowerCase()==="psy rating"));

            await prObject.update({"system.specialisation.value":newPr});
            await this.loadDocuments(actor, true);
            this.calculatePRCost();
        }else if(this.#mode==="Psychic Power"){

            let power=this.#chosenPower;
            let flagId=power.id;
            let advanceName="Psychic Power: "+power.name;
            let itemData=foundry.utils.duplicate(power);
            let powerData=power.system;





            // await actor.setFlag("fortyk",flagId,true);
            let actorPower=await actor.createEmbeddedDocuments("Item",[itemData]);
            let powerId=actorPower[0].id;



            const advData = {
                name: advanceName,
                type: type,
                system:{
                    type:{value:"Psychic Power"},
                    cost:{value:this.#cost},
                    itemId:{value:powerId},
                    flagId:flagId

                }
            };
            await actor.createEmbeddedDocuments("Item",[advData]);
            await this.loadDocuments(actor, true);
            this.#cost=0;

        }else if(this.#mode==="Navigator Power"){

            let power=this.#chosenPower;
            let flagId=power.id;
            let advanceName="Psychic Power: "+power.name;
            let itemData=foundry.utils.duplicate(power);
            itemData["flags.fortyk.compendiumId"]=power.uuid;
            itemData.name=power._source.name;
            let powerData=power.system;
            const advData = {
                name: advanceName,
                type: type,
                system:{
                    type:{value:"Navigator Power"},
                    cost:{value:this.#cost},
                    flagId:flagId

                }
            };
            if(powerData.training.value!=="Novice"){
                let actorPowers=actor.itemTypes.psychicPower;
                let oldPower=actorPowers.find((tnt)=> (tnt._source.name.toLowerCase().split(":")[0]===power._source.name.toLowerCase().split(":")[0]));
                let oldSort=oldPower.sort;
                let oldAdvanceId=oldPower.getFlag("fortyk","linkedAdvance");
                advData["flags.fortyk.previousAdvanceId"]=oldAdvanceId;
                itemData.sort=oldSort;
                let oldCompendiumId=oldPower.getFlag("fortyk","compendiumId");
                advData["flags.fortyk.previousPowerCompendiumId"]=oldCompendiumId;
                await oldPower.delete();
            }





            // await actor.setFlag("fortyk",flagId,true);
            let actorPower=await actor.createEmbeddedDocuments("Item",[itemData]);
            let powerId=actorPower[0].id;
            advData["system.itemId.value"]=powerId;



            let advanceArray=await actor.createEmbeddedDocuments("Item",[advData]);
            let advance=advanceArray[0];
            actorPower[0].setFlag("fortyk","linkedAdvance",advance.id);
            await this.loadDocuments(actor, true);
            this.#cost=0;

        }else if(this.#mode==="Elite Advance"){
            let ea=this.#chosenEliteAdvance;
            let itemData=foundry.utils.duplicate(ea);
            let advanceName="Elite Advance: "+ea.name;
            let actorEA=await actor.createEmbeddedDocuments("Item",[itemData]);
            let eaId=actorEA[0].id;
            const advData = {
                name: advanceName,
                type: type,
                system:{
                    type:{value:"Psychic Power"},
                    cost:{value:this.#cost},
                    itemId:{value:eaId},
                    flagId:itemData.system.flagId.value
                }
            };
            await actor.createEmbeddedDocuments("Item",[advData]);
            this.#cost=0;
            await this.loadDocuments(actor, true);
        }
        await this.render();
    }

    calculatePRCost() {
        let actor=this.options.actor;
        let pr=actor.system.psykana.pr.value;
        if(actor.getFlag("fortyk","librariantraining")){
            this.#cost=(pr+1)*100;
        }else{
            this.#cost=(pr+1)*200;
        }

        try {
            let discount=parseInt(document.getElementById("discount").value);
            this.#cost-=discount;
            this._updateCost();
        } catch (e) {
            //Catch Statement
        }
    }
    async _onIneligiblesClick(event){
        let node=event.target;
        let value=node.checked;
        this.ineligibles=value;
        this.render();
    }

    async _onModeChange(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        let newMode=event.target.value;

        this.#mode=newMode;
        this.#cost=0;
        let mode=this.#mode;

        if(mode==="New Skill"){
            this.baseSkillCost();
        }else if(mode==="Signature Wargear"){
            this.#cost=200;
        }else if(mode==="Psy Rating"){
            this.calculatePRCost();
        }

        this.position.height=this.options.heights[newMode];
        this.#chosenSkill=undefined;
        this.#chosenChar=undefined;
        this.#chosenTalent=undefined;
        this.#chosenPower=undefined;
        this.#chosenEliteAdvance=undefined;
        this._updateCost();
        await this.render();

    }
    async _onSkillTypeChange(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        let newSkillType=event.target.value;
        if(newSkillType!==""){
            document.getElementById("children").setAttribute("disabled",true);
        }else{
            document.getElementById("children").removeAttribute("disabled");
        }
    }
    async _onChildrenClick(event){

        let children=event.target.checked;

        if(children){
            document.getElementById("skill-type").setAttribute("disabled",true);
        }else{
            document.getElementById("skill-type").removeAttribute("disabled");
        }
    }
    async _onAptitudeChange(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        this.newSkillCost();
    }
    async _onSkillUpgrade(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        let skillId=event.target.value;
        let skill=await this.options.actor.getEmbeddedDocument("Item",skillId);
        this.#chosenSkill=skill;
        this.calculateSkillCost(skill.system.aptitudes.value,skill.system.value);
        document.getElementById("submitButton").removeAttribute("disabled");

    }
    async _onCharUpgrade(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        let charKey=event.target.value;
        let charAdv=this.options.actor.system.characteristics[charKey].advance;
        let charAptitudes=this.FORTYK.characteristics[charKey].aptitudes;
        this.#chosenChar=charKey;
        this.calculateCharCost(charAptitudes,charAdv);
        document.getElementById("submitButton").removeAttribute("disabled");
    }
    async _onPowerChoice(event){
        let node=event.target;
        let pack=node.attributes["data-compendium"];
        let id=node.value;
        let power=this.psyPowers[id];
        if(!power.valid.valid){
            let reasonArray=power.valid.reasons;
            let reasonString="";
            for(let i=0;i<reasonArray.length;i++){
                reasonString+=reasonArray[i];
                if(i<reasonArray.length-1){
                    reasonString+="</br>";
                }

            }
            node.checked = false;
            return Dialog.prompt({title:"Failed requirements",
                                  content:reasonString});
        }
        this.#chosenPower=power;
        this.calculatePsyPowerCost();

        document.getElementById("submitButton").removeAttribute("disabled");
    }
    async _onEliteAdvanceChoice(event){
        let node=event.target;
        let pack=node.attributes["data-compendium"];
        let id=node.value;
        let ea=this.eliteAdvances[id];
        if(!ea.valid.valid){
            let reasonArray=ea.valid.reasons;
            let reasonString="";
            for(let i=0;i<reasonArray.length;i++){
                reasonString+=reasonArray[i];
                if(i<reasonArray.length-1){
                    reasonString+="</br>";
                }

            }
            node.checked = false;
            return Dialog.prompt({title:"Failed requirements",
                                  content:reasonString});
        }
        this.#chosenEliteAdvance=ea;
        this.calculateEliteAdvanceCost();


        document.getElementById("submitButton").removeAttribute("disabled");
    }
    async _onTalentChoice(event){
        let node=event.target;
        let pack=node.attributes["data-compendium"];
        let id=node.value;
        let talent=this.talents[id];
        if(!talent.valid.valid){
            let reasonArray=talent.valid.reasons;
            let reasonString="";
            for(let i=0;i<reasonArray.length;i++){
                reasonString+=reasonArray[i];
                if(i<reasonArray.length-1){
                    reasonString+="</br>";
                }

            }
            node.checked = false;
            return Dialog.prompt({title:"Failed requirements",
                                  content:reasonString});
        }
        this.#chosenTalent=talent;
        let aptitudes=talent.system.aptitudes.value;
        let tier=parseInt(talent.system.tier.value);
        if(isNaN(tier)){tier=3;}
        this.calculateTalentCost(aptitudes,tier);
        document.getElementById("submitButton").removeAttribute("disabled");
    }

    async calculateTalentCost(aptitudes,tier){
        let splitAptitudes=aptitudes.toLowerCase().replace(/\s/g, '').split(",");
        let actorAptitudes=this.options.actor.system.aptitudes;
        let matchingAptitudes=0;
        splitAptitudes.forEach(apt=> (apt==="general") ? matchingAptitudes+=1 :"");

        for(const apt in actorAptitudes){

            let apti=actorAptitudes[apt];

            splitAptitudes.forEach(function(aptStr){

                if(aptStr===apti){matchingAptitudes+=1;}
            });
        }
        if(matchingAptitudes>2){matchingAptitudes=2;}

        let cost=this.FORTYK.talentCosts[matchingAptitudes][tier-1];
        let discount=parseInt(document.getElementById("discount").value);
        cost=cost-discount;
        this.#cost=cost;
        this._updateCost();
    }
    async calculateCharCost(aptitudes,training){
        let splitAptitudes=aptitudes.toLowerCase().replace(/\s/g, '').split(",");
        let actorAptitudes=this.options.actor.system.aptitudes;
        let matchingAptitudes=0;
        for(const apt in actorAptitudes){

            let apti=actorAptitudes[apt];
            splitAptitudes.forEach(function(aptStr){
                if(aptStr===apti){matchingAptitudes+=1;}
            });
        }
        if(matchingAptitudes>2){matchingAptitudes=2;}
        training+=5;
        let cost=this.FORTYK.characteristicUpgradeCosts[matchingAptitudes][training];
        let discount=parseInt(document.getElementById("discount").value);
        cost=cost-discount;
        this.#cost=cost;
        this.#charUpg=training;
        this._updateCost();
    }
    async newSkillCost(){
        let aptitudes="";
        let apt1=document.getElementById("aptitude1").value;
        let apt2=document.getElementById("aptitude2").value;
        aptitudes=apt1+","+apt2;

        this.calculateSkillCost(aptitudes,-20);
    }
    async baseSkillCost(){
        let aptitudes="intelligence,knowledge";

        this.calculateSkillCost(aptitudes,-20);
    }
    async calculateSkillCost(aptitudes,training){
        training=parseInt(training);

        let splitAptitudes=aptitudes.toLowerCase().replace(/\s/g, '').split(",");
        let actorAptitudes=this.options.actor.system.aptitudes;
        let matchingAptitudes=0;
        splitAptitudes.forEach(apt=> (apt==="general") ? matchingAptitudes+=1 :"");

        for(const apt in actorAptitudes){
            let apti=actorAptitudes[apt];
            if(apti===splitAptitudes[0]||apti===splitAptitudes[1]){matchingAptitudes+=1;}
        }
        if(matchingAptitudes>2){matchingAptitudes=2;}
        if(training===-20){training=0;}else{training+=10;}
        let cost=this.FORTYK.skillUpgradeCosts[matchingAptitudes][training];
        let discount=0;
        try{discount=parseInt(document.getElementById("discount").value);}
        catch(err){}
        cost=cost-discount;
        this.#cost=cost;
        this._updateCost();
    }
    async _onRarityChange(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        this.calculateWargearCost();
    }
    async _onQualityChange(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        this.calculateWargearCost();
    }
    calculateWargearCost(){
        let quality=document.getElementById("quality").value;
        let rarity=parseFloat(document.getElementById("rarity").value);
        let cost=0;

        if(rarity>=-20){
            cost=200;  
        }else if(rarity>=-40){
            cost=300;
        }else{
            cost=400;
        }
        if(quality==="Good"){
            cost=cost*1.5;
        }else if(quality==="Best"){
            cost=cost*2;
        }
        try{discount=parseInt(document.getElementById("discount").value);}
        catch(err){}
        cost=cost-discount;
        this.#cost=cost;
        this._updateCost();
    }
    calculatePsyPowerCost(){
        let power=this.#chosenPower;
        let cost=parseInt(power.system.cost.value);
        let discount=0;
        try{discount=parseInt(document.getElementById("discount").value);}
        catch(err){}
        cost=cost-discount;
        this.#cost=cost;
        this._updateCost();
    }
    calculateEliteAdvanceCost(){
        let ea=this.#chosenEliteAdvance;
        let cost=ea.system.cost.value;
        let discount=0;
        try{discount=parseInt(document.getElementById("discount").value);}
        catch(err){}
        cost=cost-discount;
        this.#cost=cost;
        this._updateCost();
    }
    async _onDiscount(event){
        let mode=this.#mode;
        if(mode==="Skill Upgrade"){
            let skill=this.#chosenSkill;

            if(skill){
                this.calculateSkillCost(skill.system.aptitudes.value,skill.system.value);
            }
        }else if(mode==="Characteristic Upgrade"){
            let char=this.#chosenChar;
            if(char){
                let charAdv=this.options.actor.system.characteristics[char].advance;
                let charAptitudes=this.FORTYK.characteristics[char].aptitudes;
                this.calculateCharCost(charAptitudes,charAdv);
            }

        }else if(mode==="New Skill"){
            this.newSkillCost();
        }else if(mode==="Talent"){
            let talent=this.#chosenTalent;
            if(talent){
                let aptitudes=talent.system.aptitudes.value;
                let tier=parseInt(talent.system.tier.value);
                if(isNaN(tier)){tier=3;}
                this.calculateTalentCost(aptitudes,tier);
            }
        }else if(mode==="Signature Wargear"){
            this.calculateWargearCost();
        }else if(mode==="Psy Rating"){
            this.calculatePRCost();
        }else if(mode==="Psychic Power"){
            this.calculatePsyPowerCost();
        }else if(mode==="Elite Advance"){
            this.calculateEliteAdvanceCost();
        }

    }
    _onTntDescrClick(event){
        event.preventDefault();
        let descr = event.target.attributes["data-description"].value;
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
    _onTntFilterChange(event){

        let tnts=document.getElementsByName("tntEntry");

        let filterInput=document.getElementById("talentfilter");
        let filter=filterInput.value.toLowerCase();
        for(let i=0;i<tnts.length;i++){
            let tnt=tnts[i];

            let tntName=tnt.attributes["data-search"].value.toLowerCase();
            if(tntName.indexOf(filter)>-1){
                tnt.style.display="";
            }else{
                tnt.style.display="none";
            }
        }

    }
    _onDisciplineChange(event){
        event.preventDefault();
        event.stopImmediatePropagation();
        let powers=document.getElementsByName("tntEntry");
        let discipline=event.target.value;
        this.#discipline=discipline;
        for(let i=0;i<powers.length;i++){
            let power=powers[i];

            let disc=power.attributes["data-discipline"].value;
            if(discipline==="All"){
                power.style.display="";
            }else if(disc===discipline){
                power.style.display="";
            }else{
                power.style.display="none";
            }

        }
    }
    async _onCustomCost(event){
        let newcost=parseInt(event.target.value);

        if(isNaN(newcost)){newcost=0;}
        this.#cost=newcost;
        this._updateCost();
    }
    _updateCost(){
        document.getElementById("cost").textContent=`${this.#cost} EXP`;
        this.remainingExp=this.actorExp-this.#cost;
        document.getElementById("remainingExp").textContent=`${this.remainingExp} EXP`;


    }
    filterPsyPowers(powers, actor) {
        powers=powers.sort(function compare(a, b) {
            if (a.name<b.name) {
                return -1;
            }
            if (a.name>b.name) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });

        let sheet=this;

        let map=powers.reduce(function(map,power){
            power.valid=power.validateActor(actor);
            if((power.valid.valid||sheet.ineligibles)){

                map[power.id]=power;  
            }

            return map;
        },{});
        return map;
    }

    async _loadPsyPowers(){
        let actor=this.options.actor;
        const psyPowers=await game.packs.get("fortyk.psychic-powers");
        let powers=await psyPowers.getDocuments();
        this.#rawPowers=powers;

        let map = this.filterPsyPowers(powers, actor);
        return map;
    }
    async _loadNavPowers(){
        let actor=this.options.actor;
        const psyPowers=await game.packs.get("fortyk.navigator-powers");
        let powers=await psyPowers.getDocuments();
        this.#rawPowers=powers;

        let map = this.filterPsyPowers(powers, actor);
        return map;
    }
    filterTalents(tnts, actor) {
        tnts=tnts.sort(function compare(a, b) {
            if (a.name<b.name) {
                return -1;
            }
            if (a.name>b.name) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let sheet=this;
        let map=tnts.reduce(function(map,talent){
            let flagId=talent.system.flagId.value;
            talent.valid=talent.validateActor(actor);

            if((talent.valid.valid||sheet.ineligibles)){

                map[talent.id]=talent;  
            }

            return map;
        },{});
        return map;
    }

    async _loadTalents(){
        let actor=this.options.actor;
        const dh2Talents=await game.packs.get("fortyk.talent-core-dh2");
        let tnts=await dh2Talents.getDocuments();
        var dh2EnemyWithinTalents=await game.packs.get("fortyk.talents-enemies-within");
        tnts=tnts.concat(await dh2EnemyWithinTalents.getDocuments());
        var dh2EnemyWithoutTalents=await game.packs.get("fortyk.talents-enemies-without");
        tnts=tnts.concat(await dh2EnemyWithoutTalents.getDocuments());
        var dh2EnemyBeyondTalents=await game.packs.get("fortyk.talents-enemies-beyond");
        tnts=tnts.concat(await dh2EnemyBeyondTalents.getDocuments());
        var owCoreTalents=await game.packs.get("fortyk.talents-ow-core");
        tnts=tnts.concat(await owCoreTalents.getDocuments());
        var owHOTETalents=await game.packs.get("fortyk.talents-hammer-of-the-emperor");
        tnts=tnts.concat(await owHOTETalents.getDocuments());
        var owShieldOfHumanityTalents=await game.packs.get("fortyk.talents-shield-of-humanity");
        tnts=tnts.concat(await owShieldOfHumanityTalents.getDocuments());
        var customTalents=await game.packs.get("fortyk.custom-talents");
        tnts=tnts.concat(await customTalents.getDocuments());
        //load different packs depending on character type
        if(actor.getFlag("fortyk","deathwatchmarine")){
            var dwTalents=await game.packs.get("fortyk.deathwatch-talents");
            tnts=tnts.concat(await dwTalents.getDocuments());

        }
        this.#rawTalents=tnts;
        let map = this.filterTalents(tnts, actor);
        return map;
    }
    filterEliteAdvances(eliteAdvances, actor) {
        eliteAdvances=eliteAdvances.sort(function compare(a, b) {
            if (a.name<b.name) {
                return -1;
            }
            if (a.name>b.name) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let sheet=this;
        let map=eliteAdvances.reduce(function(map,ea){
            if(ea.system.type.value!=="ea")return map;
            let flagId=ea.system.flagId.value;
            ea.valid=ea.validateActor(actor);
            if((ea.valid.valid||sheet.ineligibles)){

                map[ea.id]=ea;  
            }

            return map;
        },{});
        return map;
    }

    async _loadEliteAdvances(){
        let actor=this.options.actor;
        const eliteAdvancePack=await game.packs.get("fortyk.elite-advances");
        let eliteAdvances=await eliteAdvancePack.getDocuments();
        this.#rawEliteAdvances=eliteAdvances;
        let map = this.filterEliteAdvances(eliteAdvances, actor);
        return map;
    }



}
