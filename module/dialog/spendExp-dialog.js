import {FortyKItem} from "../item/item.js";
export class SpendExpDialog extends Application {
    
    /** @override */

    static get defaultOptions() {
        
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk"],
            template: "systems/fortyk/templates/actor/dialogs/spendExp-dialog.html",
            width: 666,
            height: 190,
            mode:"Custom",
            default:null,
            heights:{"Custom":190,"Characteristic Upgrade":170,"Skill Upgrade":170,"New Skill":730,"Talent":720}
        });
    }
    
    async getData(){
        this.data=super.getData();
        let data=this.data;
        if(!this.options.cost){this.options.cost=0}
        data.cost=this.options.cost;
        data.FORTYK=game.fortyk.FORTYK;
        data.mode=this.options.mode;
        data.skills=this.options.actor.data.skills
        data.parentSkills=data.skills.filter(skill => skill.data.hasChildren.value)
        data.upgradeableSkills=data.skills.filter(skill => !skill.data.hasChildren.value&&(skill.data.value<30));
        let actorChars=this.options.actor.data.data.characteristics;
        data.upgradeableChars=this.upgradeableChars(actorChars,data.FORTYK.characteristics);
        data.aptitudes=data.FORTYK.aptitudes;
        
        if(!this.options.talents){
            this.options.talents=await this._loadTalents();
        }
        data.talents=this.options.talents;
        return this.data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        //select dialog mode
        html.find('.mode').change(this._onModeChange.bind(this));
        //select new skill type
        html.find('.skill-type').change(this._onSkillTypeChange.bind(this));
        //select aptitude change
        html.find('.aptitude-select').change(this._onAptitudeChange.bind(this));

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
        //new skill children
        html.find('.children').click(this._onChildrenClick.bind(this));
        //create advance
        html.find('.submit').click(this._onSubmit.bind(this));


    } 
    upgradeableChars(actorChars,chars){
        let upgChars={}
        for(const char in chars){
            if(actorChars[char].advance<25){
                upgChars[char]=chars[char]
            }
        }
        return upgChars;
    }
    _onTalentLoad(event){
        if(this.options.mode==="Custom"){
            let input=document.getElementById("custom-name").select();
        }else if(this.options.mode==="New Skill"){
            let input=document.getElementById("name").select();
        }else if(this.options.mode==="Talent"){
            let input=document.getElementById("talentfilter").select();
        }
        
        
        
    }
    async _onSubmit(event){
        let actor=this.options.actor;
        const type = "advancement";
        if(this.options.mode==="Custom"){

            const name = document.getElementById("custom-name").value;
            const itemData = {
                name: `${name}`,
                type: type,
                data:{
                    type:{value:"Custom"},
                    cost:{value:this.options.cost}
                }
            };

            let item=await FortyKItem.create(itemData,{temporary:true});
            await actor.createEmbeddedDocuments("Item",[item.data]);
            this.options.cost=0;
        }else if(this.options.mode==="Skill Upgrade"){
            let skill=this.options.chosenSkill;
            let skillUpgrade=skill.data.data.value;
            if(skillUpgrade===-20){skillUpgrade=0}else{skillUpgrade=+10}
            let name = skill.name+" +"+skillUpgrade;
            if(skill.data.data.parent.value){
                name=skill.data.data.parent.value+": "+name;
            }
            const itemData = {
                name: `${name}`,
                type: type,
                data:{
                    type:{value:"Skill Upgrade"},
                    cost:{value:this.options.cost},
                    itemId:{value:skill.id}

                }
            };

            let item=await FortyKItem.create(itemData,{temporary:true});
            await actor.createEmbeddedDocuments("Item",[item.data]);
            await skill.update({"data.value":skillUpgrade});
            this.options.cost=0;
        }else if(this.options.mode==="New Skill"){
            let advanceName=""
            let skillName=document.getElementById("name").value;
            let parent=document.getElementById("skill-type").value;
            if(parent){advanceName=parent+": "}
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
                data:{
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
                    cost:{value:this.options.cost},
                    itemId:{value:skill[0].id}

                }
            };
            await actor.createEmbeddedDocuments("Item",[advData]);
            this.baseSkillCost();
        }else if(this.options.mode==="Characteristic Upgrade"){
            let char=this.options.chosenChar;
            let training=this.options.charUpg;
            let name = this.data.FORTYK.characteristics[char].label+" +"+training;

            const itemData = {
                name: `${name}`,
                type: type,
                data:{
                    type:{value:"Characteristic Upgrade"},
                    cost:{value:this.options.cost},
                    characteristic:{value:char}

                }
            };

            let item=await FortyKItem.create(itemData,{temporary:true});
            await actor.createEmbeddedDocuments("Item",[item.data]);
            let update={};
            let path=`data.characteristics.${char}.advance`;
            update[path]=training;
            actor.update(update);
            this.options.cost=0;
        }else if(this.options.mode==="Talent"){

            let talent=this.options.chosenTalent;
            let advanceName=talent.name;
            let itemData=talent.data;
            let tntData=itemData.data;
            let spec=tntData.specialisation.value;
            let flag=tntData.flagId.value;


            if(spec==="N/A"){

                await actor.setFlag("fortyk",flag,true);
            }else{
                var chosenSpec=await Dialog.prompt({
                    title: "Choose specialisation",
                    content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${tntData.specialisation.value}" autofocus/></p>`,



                    callback: async(html) => {
                        const choosenSpec = $(html).find('input[name="spec"]').val();
                        advanceName+=" ("+choosenSpec+")";
                        

                        return choosenSpec;
                    },






                    width:100}
                                                  );
                setTimeout(function() {document.getElementById('specInput').select();}, 50);
                await itemData.update({"data.specialisation.value": chosenSpec});

            }
            let talentId=""
            if(chosenSpec&&actor.getFlag("fortyk",flag)){
               
                let actorTalent=actor.itemTypes["talentntrait"].filter(function(tlnt){
                    if(tlnt.name===talent.name){
                        return true;
                    }
                    return false;
                });
                if(actorTalent.length>0){
                    let spec2=actorTalent[0].data.data.specialisation.value;
                    talentId=actorTalent[0].id;
                    spec2+=", "+chosenSpec;
                    await actorTalent[0].update({"data.specialisation.value":spec2}); 
                }

            }else{
                let actorTalent=await actor.createEmbeddedDocuments("Item",[talent.data]);
                talentId=actorTalent[0].id;
            }
            await actor.setFlag("fortyk",flag,chosenSpec);
            const advData = {
                name: `${advanceName}`,
                type: type,
                data:{
                    type:{value:"Talent"},
                    cost:{value:this.options.cost},
                    itemId:{value:talentId}

                }
            };
            await actor.createEmbeddedDocuments("Item",[advData]);
            this.options.cost=0;
        }

        this.render(true);
    }

    async _onModeChange(event){
        event.preventDefault();
        let newMode=event.target.value;
        this.options.mode=newMode;
        this.options.cost=0;
        if(this.options.mode==="New Skill"){
            this.baseSkillCost();
        }
        console.log(this)
        this.position.height=this.options.heights[newMode];
        this.options.chosenSkill=undefined;
        this.options.chosenChar=undefined;
        this.options.chosenTalent=undefined;
        this._updateCost();
        await this.render(true);

    }
    async _onSkillTypeChange(event){
        event.preventDefault();
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
        this.newSkillCost();
    }
    async _onSkillUpgrade(event){
        event.preventDefault();
        let skillId=event.target.value;
        let skill=await this.options.actor.getEmbeddedDocument("Item",skillId);
        this.options.chosenSkill=skill;
        this.calculateSkillCost(skill.data.data.aptitudes.value,skill.data.data.value);

    }
    async _onCharUpgrade(event){
        event.preventDefault();
        let charKey=event.target.value;
        let charAdv=this.options.actor.data.data.characteristics[charKey].advance;
        let charAptitudes=this.data.FORTYK.characteristics[charKey].aptitudes;
        this.options.chosenChar=charKey;
        this.calculateCharCost(charAptitudes,charAdv);
    }
    async _onTalentChoice(event){
        let node=event.target;
        let pack=node.attributes["data-compendium"];
        let id=node.value;
        let talent=this.data.talents[id];
        this.options.chosenTalent=talent;
        let aptitudes=talent.data.data.aptitudes.value;
        let tier=parseInt(talent.data.data.tier.value);
        if(isNaN(tier)){tier=3};
        this.calculateTalentCost(aptitudes,tier);
    }
    async calculateTalentCost(aptitudes,tier){
        let splitAptitudes=aptitudes.toLowerCase().replace(/\s/g, '').split(",");
        let actorAptitudes=this.options.actor.data.data.aptitudes;
        let matchingAptitudes=0;
        for(const apt in actorAptitudes){

            let apti=actorAptitudes[apt];
            splitAptitudes.forEach(function(aptStr){
                if(aptStr===apti){matchingAptitudes+=1;}
            });
        }
        if(matchingAptitudes>2){matchingAptitudes=2};

        let cost=this.data.FORTYK.talentCosts[matchingAptitudes][tier-1];
        let discount=parseInt(document.getElementById("discount").value)
        cost=cost-discount;
        this.options.cost=cost;
        this._updateCost();
    }
    async calculateCharCost(aptitudes,training){
        let splitAptitudes=aptitudes.toLowerCase().replace(/\s/g, '').split(",");
        let actorAptitudes=this.options.actor.data.data.aptitudes;
        let matchingAptitudes=0;
        for(const apt in actorAptitudes){

            let apti=actorAptitudes[apt];
            splitAptitudes.forEach(function(aptStr){
                if(aptStr===apti){matchingAptitudes+=1;}
            });
        }
        if(matchingAptitudes>2){matchingAptitudes=2};
        training+=5;
        let cost=this.data.FORTYK.characteristicUpgradeCosts[matchingAptitudes][training];
        let discount=parseInt(document.getElementById("discount").value)
        cost=cost-discount;
        this.options.cost=cost;
        this.options.charUpg=training;
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
        let splitAptitudes=aptitudes.toLowerCase().replace(/\s/g, '').split(",");
        let actorAptitudes=this.options.actor.data.data.aptitudes;
        let matchingAptitudes=0;
        splitAptitudes.forEach(apt=> (apt==="general") ? matchingAptitudes+=1 :"");

        for(const apt in actorAptitudes){
            let apti=actorAptitudes[apt];
            if(apti===splitAptitudes[0]||apti===splitAptitudes[1]){matchingAptitudes+=1};
        }
        if(matchingAptitudes>2){matchingAptitudes=2};
        if(training===-20){training=0}else{training+=10};
        let cost=this.data.FORTYK.skillUpgradeCosts[matchingAptitudes][training];
        let discount=0
        try{discount=parseInt(document.getElementById("discount").value)}
        catch(err){}
        cost=cost-discount;
        this.options.cost=cost;
        this._updateCost();
    }
    async _onDiscount(event){
        let mode=this.options.mode;
        if(mode==="Skill Upgrade"){
            let skill=this.options.chosenSkill;

            if(skill){
                this.calculateSkillCost(skill.data.data.aptitudes.value,skill.data.data.value);
            }
        }else if(mode==="Characteristic Upgrade"){
            let char=this.options.chosenChar;
            if(char){
                let charAdv=this.options.actor.data.data.characteristics[char].advance;
                let charAptitudes=this.data.FORTYK.characteristics[char].aptitudes;
                this.calculateCharCost(charAptitudes,charAdv);
            }

        }else if(mode==="New Skill"){
            this.newSkillCost();
        }else if(mode==="Talent"){
            let talent=this.options.chosenTalent;
            if(talent){
                let aptitudes=talent.data.data.aptitudes.value;
                let tier=parseInt(talent.data.data.tier.value);
                if(isNaN(tier)){tier=3};
                this.calculateTalentCost(aptitudes,tier);
            }
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
    async _onCustomCost(event){
        let newcost=parseInt(event.target.value);

        if(isNaN(newcost)){newcost=0}
        this.options.cost=newcost;
        this._updateCost();
    }
    _updateCost(){
        document.getElementById("cost").textContent=this.options.cost;
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
        //load different packs depending on actor type
        if(actor.data.type==="dwPC"){
            var dwTalents=await game.packs.get("fortyk.deathwatch-talents");
            tnts=tnts.concat(await dwTalents.getDocuments());

        }
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
        let map=tnts.reduce(function(map,talent){
            map[talent.id]=talent;
            return map;
        },{});
        return map;
    }
    
}