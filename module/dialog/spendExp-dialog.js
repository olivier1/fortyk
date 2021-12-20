import {FortyKItem} from "../item/item.js";
export class SpendExpDialog extends Application {
    /** @override */

    static get defaultOptions() {

        return mergeObject(super.defaultOptions, {
            classes: ["fortyk"],
            template: "systems/fortyk/templates/actor/dialogs/spendExp-dialog.html",
            width: 666,
            height: 810,
            mode:"Custom",
            default:null
        });
    }
    getData(){
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
        data.upgradeableChars=this.upgradeableChars(actorChars,data.FORTYK.characteristics)
        return this.data;
    }
    activateListeners(html) {
        console.log("hey")
        super.activateListeners(html);
        //select dialog mode
        html.find('.mode').change(this._onModeChange.bind(this));
        //input custom cost
        html.find('.custom-cost').keyup(this._onCustomCost.bind(this));
        //input discount
        html.find('.discount').keyup(this._onDiscount.bind(this));
        //change skill upgrade
        html.find('.skillChoice').change(this._onSkillUpgrade.bind(this));
        //change char upgrade
        html.find('.charChoice').change(this._onCharUpgrade.bind(this));
        //create advance
        html.find('.submit').click(this._onSubmit.bind(this));
        // html.find('.ae').click(this._onAeClick.bind(this));


    } 
    upgradeableChars(actorChars,chars){
        let upgChars={}
        console.log(actorChars,chars)
        for(const char in chars){
            console.log(char)
            if(actorChars[char].advance<25){
                upgChars[char]=chars[char]
            }
        }
        return upgChars;
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
        }else if(this.options.mode==="Characteristic Upgrade"){
            let char=this.options.chosenChar;
            let training=this.options.charUpg;
            let name = this.data.FORTYK.characteristics[char].label+" +"+training;
            
            const itemData = {
                name: `${name}`,
                type: type,
                data:{
                    type:{value:"Skill Upgrade"},
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
        }
        this.close();
    }
    async _onModeChange(event){
        event.preventDefault();
        let newMode=event.target.value;
        this.options.mode=newMode;
        this.options.cost=0;
        this.options.chosenSkill=undefined;
        this.options.chosenChar=undefined;
        this.options.chosenTalent=undefined;
        this._updateCost();
        this.render(true);
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
    async calculateCharCost(aptitudes,training){
        let splitAptitudes=aptitudes.toLowerCase().replace(/\s/g, '').split(",");
        let actorAptitudes=this.options.actor.data.data.aptitudes;
        let matchingAptitudes=0;
        for(const apt in actorAptitudes){

            let apti=actorAptitudes[apt].toLowerCase().replace(/\s/g, '');
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
    async calculateSkillCost(aptitudes,training){
        let splitAptitudes=aptitudes.toLowerCase().replace(/\s/g, '').split(",");
        let actorAptitudes=this.options.actor.data.data.aptitudes;
        let matchingAptitudes=0;
        splitAptitudes.forEach(apt=> (apt==="general") ? matchingAptitudes+=1 :"");

        for(const apt in actorAptitudes){
            console.log(apt);
            let apti=actorAptitudes[apt].toLowerCase().replace(/\s/g, '');
            if(apti===splitAptitudes[0]||apti===splitAptitudes[1]){matchingAptitudes+=1};
        }
        if(matchingAptitudes>2){matchingAptitudes=2};
        if(training===-20){training=0}else{training+=10};
        let cost=this.data.FORTYK.skillUpgradeCosts[matchingAptitudes][training];
        let discount=parseInt(document.getElementById("discount").value)
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

        }

    }
    async _onCustomCost(event){
        let newcost=parseInt(event.target.value);

        if(isNaN(newcost)){newcost=0}
        this.options.cost=newcost;
        this._updateCost();
        console.log(document);
    }
    _updateCost(){
        document.getElementById("cost").textContent=this.options.cost;
    }

}