import {FortykRolls} from "../FortykRolls.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import FortyKBaseActorSheet from "./base-sheet.js";
import {FortyKItem} from "../item/item.js";
import {SpendExpDialog} from "../dialog/spendExp-dialog.js";
import {sleep} from "../utilities.js";
/**
 * 
 * @extends {ActorSheet}
 */
export default class FortyKDWActorSheet extends FortyKBaseActorSheet {


    /** @override */

    static get defaultOptions() {

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actor-sheet.html",
            width: 666,
            height:"auto",
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-content", initial: "main" }],
            default:null,
            scrollY: [
                ".main",
                ".skills",
                ".tnt",
                ".exp",
                ".combat",
                ".gear",
                ".psykana",
                ".sheet-skills",
                ".sheet-content"
            ]
        });
    }
    /** @override **/
    async getData(){
        let nameSort=function compare(a, b) {
            let valueA=a.name;
            let valueB=b.name;
            if (valueA>valueB) {
                return 1;
            }
            if (valueA<valueB) {
                return -1;
            }
            // a must be equal to b
            return 0;
        };
        let data=await super.getData();
        let actor = this.actor;
        let characterCreation=actor.getFlag("fortyk","charactercreation");
        data.characterCreation=characterCreation;
        data.hasInfluence=actor.getFlag("fortyk","hasinfluence");
        const FORTYK=game.fortyk.FORTYK;
        data.FORTYK=FORTYK;
        let characterType=actor.characterType;
        data.featureLabels=FORTYK.characterTypeFeatureLabels[characterType?.system?.flagId?.value];
        data.actorAptitudes=this.prepareActorAptitudes(actor.system.aptitudes); 

        if(characterCreation){
            if(!this.skillDescriptions){
                this.skillDescriptions=this.getSkillDescriptions();
            }
            data.creationStage=actor.getFlag("fortyk","creationstage");

            data.characterType=characterType;
            if(!this.eaDocs){
                let eas=await game.packs.get("fortyk.elite-advances");
                this.eaDocs= await eas.getDocuments();
            }

            if(!characterType){


                data.characterTypes=this.eaDocs.filter((ea)=>ea.system.type.value==="charactertype");
                data.characterTypes.sort(nameSort);
            }else{
                data.skillRanks=this.getSkillRanks();

            }
            switch(data.creationStage){
                case 1:
                    let planets=this.eaDocs.filter((ea)=>{
                        return ea.system.type.value==="planet"&&ea.validateActor(actor).valid;
                    });
                    planets.sort(nameSort);
                    data.planets=planets;
                    data.feature=this.feature;
                    if(data.feature){
                        data.alternateWounds=game.settings.get("fortyk","alternateWounds");
                        if(data.alternateWounds){
                            data.featureAlternateWoundLabel=FORTYK.alternateWoundMultiplierModifierLabels[data.feature.system.wounds.alternate];
                        }else{
                            data.wounds=data.feature.system.wounds;
                        }
                        data.hideEmpBless=this.hideEmpBless;
                        data.featurePlus1=FORTYK.charLabels[data.feature.system.characteristics.plus1]?.label;
                        data.featurePlus2=FORTYK.charLabels[data.feature.system.characteristics.plus2]?.label;
                        data.featureMinus=FORTYK.charLabels[data.feature.system.characteristics.minus]?.label;
                        data.featureBoni=this.featureBoni;
                        data.featureTalents=this.featureTalents;
                        data.featureAptitude=this.featureAptitude;
                        data.featureSkill=this.featureSkill;

                        data.rolledWounds=this.rolledWounds;
                        data.rolledInsanity=this.rolledInsanity;
                        data.rolledCorruption=this.rolledCorruption;

                    }

                    break;
                case 2:
                    if(!this.pointBuy){
                        this.pointBuy=this.preparePointBuy();
                        this.updateSpentChar();
                    }
                    data.pointBuy=this.pointBuy;

                    break;
                case 3:
                    data.stageLabel=data.featureLabels.background;
                    let backgrounds=this.eaDocs.filter((ea)=>{
                        return ea.system.type.value==="background"&&ea.validateActor(actor).valid;
                    });
                    backgrounds.sort(nameSort);
                    data.features=backgrounds;
                    data.feature=this.feature;
                    if(data.feature){
                        data.featureCost=this.featureCost;
                        data.rolledInsanity=this.rolledInsanity;
                        data.rolledCorruption=this.rolledCorruption;
                        data.featureBoni=this.featureBoni;
                        data.featureTalents=this.featureTalents;
                        data.featureTraits=this.featureTraits;
                        data.featureGear=this.featureGear;
                        data.featureSkill=this.featureSkill;
                        data.featureAptitude=this.featureAptitude;

                    }
                    break;
                case 4:
                    data.stageLabel=data.featureLabels.role;
                    let roles=this.eaDocs.filter((ea)=>{
                        return ea.system.type.value==="role"&&ea.validateActor(actor).valid;
                    });
                    roles.sort(nameSort);
                    data.features=roles;
                    data.feature=this.feature;
                    if(data.feature){
                        data.featureCost=this.featureCost;
                        data.rolledInsanity=this.rolledInsanity;
                        data.rolledCorruption=this.rolledCorruption;
                        data.featureBoni=this.featureBoni;
                        data.featureTalents=this.featureTalents;
                        data.featureTraits=this.featureTraits;
                        data.featureGear=this.featureGear;
                        data.featureSkill=this.featureSkill;
                        data.featureAptitude=this.featureAptitude;
                        data.featureEAs=this.featureEAs;
                    }
                    break;
                case 5:


                    let filterAptitudes=function (apti) {

                        let notDuplicate=true;
                        let actorAptitudes = actor.system.aptitudes;
                        for(const index in actorAptitudes){
                            let aptitude=actorAptitudes[index]
                            if(apti.key===aptitude){
                                notDuplicate=false;
                            }
                        }
                        return notDuplicate;

                    };

                    data.aptitudes=FORTYK.aptitudes.filter(filterAptitudes);
                    data.charAptitudes=data.FORTYK.charAptitudes.filter(filterAptitudes);


                    break;
            }
        }
        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        let characterCreation=this.actor.getFlag("fortyk","charactercreation");
        if(characterCreation){
            //confirm character type choice
            html.find('.confirm-character-type').click(this._onConfirmCharacterType.bind(this));
            html.find('.feature-select').change(this._onFeatureChange.bind(this));
            html.find('.roll-fate').click(this._onRollFate.bind(this));
            html.find('.roll-wounds').click(this._onRollWounds.bind(this));
            html.find('.roll-insanity').click(this._onRollInsanity.bind(this));
            html.find('.roll-corruption').click(this._onRollCorruption.bind(this));
            html.find('.confirm-planet-choice').click(this._onConfirmPlanetClick.bind(this));
            html.find('.aptitude-radio').click(this._onAptitudeClicked.bind(this));
            html.find('.skill-radio').click(this._onSkillClicked.bind(this));
            html.find('.talent-radio').click(this._onTalentClicked.bind(this));
            html.find('.trait-radio').click(this._onTraitClicked.bind(this));
            html.find('.gear-radio').click(this._onGearClicked.bind(this));
            html.find('.feature-plus-minus').change(this._onFeaturePlusMinusChange.bind(this));
            html.find('.aptitude-any').change(this._onAptitudeAnyChange.bind(this));
            html.find('.char-spent').focusout(this._onCharSpentInput.bind(this));
            html.find('.any-skill-icon').click(this._onConfirmAnySkillChoice.bind(this));
            html.find('.any-spec-icon').click(this._onConfirmAnySpecChoice.bind(this));
            html.find('.duplicate-aptitude-icon').click(this._onConfirmAptitudeChoice.bind(this));
            html.find('.confirm-char-spent').click(this._onConfirmCharSpent.bind(this));
            html.find('.confirm-feature-choice').click(this._onConfirmFeature.bind(this));
            html.find('.finish-character-creation').click(this._onFinishCharacterCreation.bind(this));
            html.find('.previous-stage').click(this._onGoToPreviousStage.bind(this));
        }else{
            //change skill characteristic
            html.find('.skill-char').change(this._onSkillCharEdit.bind(this));
            //change skill advancement
            html.find('.skill-adv').change(this._onSkillAdvEdit.bind(this));
            //favorite psychic power
            html.find('.favorite').click(this._onFavoriteClick.bind(this));
            //change cybernetic location
            html.find('.cyber-location-select').change(this._onCyberLocationEdit.bind(this));
            //change navigator power training
            html.find('.power-training').change(this._onPowerTrainingEdit.bind(this));
            //create different types of wargear
            html.find('.wargear-create').click(this._onWargearCreate.bind(this));

            //focus skill search

            html.find('.sheet-tabs').click(this._onSkillsTab.bind(this));

            //handles adding or removing worn weapon slots
            html.find('.worn-item-plus').click(this._onAddExtraWeapon.bind(this));
            html.find('.worn-item-minus').click(this._onRemoveExtraWeapon.bind(this));
            html.find('.extra-weapon').change(this._onExtraWeaponChange.bind(this));
            //handles changing ammo type
            html.find('.weapon-ammo').change(this._onAmmoChange.bind(this));
            //handles reloading a ranged weapon
            html.find('.weapon-reload').click(this._onWeaponReload.bind(this));
            //handles swapping weapons
            html.find('.hand-weapon').change(this._onWeaponChange.bind(this));

            //filters
            html.find('.skillfilter').keyup(this._onFilterChange.bind(this));
        }
        //shared listeners
        //spend exp button
        html.find('.spend-exp').click(this._onSpendExp.bind(this));
    }

    /*character creation functions*/
    prepareActorAptitudes(aptitudes){
        let FORTYKaptitudes=game.fortyk.FORTYK.aptitudes;
        let aptitudeArray=[];
        let charAptitudes=["weaponskill","ballisticskill","strength","toughness","agility","intelligence","perception","willpower","fellowship"];
        for(const index in aptitudes){
            let aptitude=aptitudes[index];
            if(aptitude){
                let aptitudeObj={};
                aptitudeObj.aptitude=aptitude;
                let duplicate=aptitudeArray.find((apt)=>apt.aptitude===aptitude);
                if(duplicate){
                    if(charAptitudes.includes(aptitude)){
                        aptitudeObj.isCharDuplicate=true;
                    }else{
                        aptitudeObj.isWildcardDuplicate=true;
                    }
                }
                let FORTYKaptitude=FORTYKaptitudes.find((apt)=>apt.key===aptitude);
                aptitudeObj.label=FORTYKaptitude.label;
                aptitudeObj.description=FORTYKaptitude.description;
                aptitudeArray.push(aptitudeObj);
            }
        }
        return aptitudeArray;
    }
    preparePointBuy(){
        let actor=this.actor;
        let characterType=actor.characterType;
        let pointBuy=characterType.system.pointBuy;
        let base=characterType.system.characteristics.all;
        let characteristics={
            ws:{
                label:"WS",
                base:base,
                spent:0,
                total:0
            },
            bs:{
                label:"BS",
                base:base,
                spent:0,
                total:0
            },
            s:{
                label:"S",
                base:base,
                spent:0,
                total:0
            },
            t:{
                label:"T",
                base:base,
                spent:0,
                total:0
            },
            agi:{
                label:"AGI",
                base:base,
                spent:0,
                total:0
            },
            int:{
                label:"INT",
                base:base,
                spent:0,
                total:0
            },
            per:{
                label:"PER",
                base:base,
                spent:0,
                total:0
            },
            wp:{
                label:"WP",
                base:base,
                spent:0,
                total:0
            },
            fel:{
                label:"FEL",
                base:base,
                spent:0,
                total:0
            }
        };
        if(actor.getFlag("fortyk","hasinfluence")){
            characteristics.inf={
                label:"INF",
                base:base,
                spent:0,
                total:0
            };
        }
        pointBuy.characteristics=characteristics;
        let planet=actor.planet;
        pointBuy.characteristics[planet.system.characteristics.plus1].base+=5;
        pointBuy.characteristics[planet.system.characteristics.plus2].base+=5;
        pointBuy.characteristics[planet.system.characteristics.minus].base-=5;
        return pointBuy;
    }
    parseAptitudes(aptitudes){
        aptitudes=aptitudes.trim();
        const FORTYK=game.fortyk.FORTYK;
        const APTITUDES=FORTYK.aptitudes;
        let splitAptitudes=aptitudes.split(",");
        let aptitudesArray=[];
        for(let apt of splitAptitudes){
            apt=apt.trim();
            let aptObject={};
            aptObject.key=apt;
            let tempApt=APTITUDES.find((apti)=>apti.key===apt);
            aptObject.label=tempApt?.label;
            aptObject.description=tempApt?.description;
            let choices=[];
            let splitChoices=apt.split("|");
            for(let choice of splitChoices){
                choice=choice.trim();
                let choiceObj={};
                choiceObj.key=choice;
                let tempApt=APTITUDES.find((apti)=>apti.key===choice);
                choiceObj.label=tempApt?.label;
                choiceObj.description=tempApt?.description;
                choices.push(choiceObj);
            }
            if(choices.length>1){
                aptObject.choices=choices;
            }
            aptitudesArray.push(aptObject);
        }
        return aptitudesArray;

    }
    parseSkills(skills){
        if(!skills)return undefined;
        let skillDescriptions=this.skillDescriptions;
        skills=skills.trim();
        let splitSkills=skills.split(",");
        let skillsArray=[];
        for(let skill of splitSkills){
            skill=skill.trim();
            let skillObject={};
            skillObject.key=skill;


            let choices=[];
            let splitChoices=skill.split("|");
            for(let choice of splitChoices){
                choice=choice.trim();
                let choiceObj={};
                choiceObj.key=choice;
                let parentArray2=choice.split(":");
                if(parentArray2.length>1){
                    choiceObj.label=`${parentArray2[0]} (${parentArray2[1]})`;
                    choiceObj.description=skillDescriptions[parentArray2[0]];
                }else{
                    choiceObj.label=choice;
                    choiceObj.description=skillDescriptions[choice];
                }
                if(choice.indexOf("anyxenos")!==-1){
                    choiceObj.xenos=true; 
                }else if(choice==="Operate:any"){
                    choiceObj.operate=true;
                }else if(choice==="Navigate:any"){
                    choiceObj.navigate=true;
                }else if(choice.indexOf("any")!==-1){
                    choiceObj.any=true;
                }
                choices.push(choiceObj);
            }
            if(choices.length>1){
                skillObject.choices=choices;

            }else{
                let parentArray=skill.split(":");
                if(parentArray.length>1){
                    skillObject.label=`${parentArray[0]} (${parentArray[1]})`;
                    skillObject.description=skillDescriptions[parentArray[0]];
                }else{
                    skillObject.label=skill;
                    skillObject.description=skillDescriptions[skill];
                }
                if(skill.indexOf("anyxenos")!==-1){
                    skillObject.xenos=true; 
                }else if(skill==="Operate:any"){
                    skillObject.operate=true;
                }else if(skill==="Navigate:any"){
                    skillObject.navigate=true;
                }else if(skill.indexOf("any")!==-1){
                    skillObject.any=true;
                }
            }
            skillsArray.push(skillObject);
        }
        return skillsArray;
    }
    parseChoices(originArray){
        let choiceArray=[];
        //parse anys
        for(let item of originArray){
            if(item.spec&&item.spec.indexOf("any")!==-1){
                item.any=true;
            }
        }
        //parse ORs and ANDs
        for(let i=0;i<originArray.length;i++){
            let currentItem=originArray[i];

            if(currentItem.isOR){


                let ORArray=[];
                ORArray.push(currentItem);
                let j=i+1;
                let nextItem=originArray[j];
                let loop=true;
                while(loop&&nextItem){

                    if(nextItem.isAND){
                        let ANDArray=[];
                        ANDArray.push(nextItem);
                        let ANDContinue=true;
                        while(ANDContinue){
                            j++;
                            let ANDItem=originArray[j];
                            if(!ANDItem.isAND){
                                ANDContinue=false;
                                loop=false;

                            }

                            ANDArray.push(ANDItem);

                        }
                        ORArray.push(ANDArray);
                    }else if(nextItem.isOR){
                        ORArray.push(nextItem);
                        j++;
                    }else{
                        ORArray.push(nextItem);
                        loop=false; 
                    }

                    nextItem=originArray[j];
                }
                i=j;
                choiceArray.push(ORArray);
            }else{

                choiceArray.push(currentItem);
            }



        }

        console.log(choiceArray)
        return choiceArray;
    }
    getSkillRanks(){
        let skills=this.actor.itemTypes.skill;
        let skillRanks=[];
        let skillTraining=Object.values(game.fortyk.FORTYK.skillTraining);
        for(const skill of skills){
            let training=skill.system.value;

            if(training>=0){
                let label="";
                let parent = skill.system.parent.value;
                if(parent){
                    label=`${parent} (${skill.name})`;
                }else{
                    label=skill.name;
                }
                let skillRank=skillTraining.find((rank)=>rank.value===training);
                label+=`: ${skillRank.name}`;
                skillRanks.push({label:label, description:skill.system.description.value});
            }
        }
        return skillRanks;
    }
    updateSpentChar(){
        let pointBuy=this.pointBuy;
        let amount=pointBuy.amount;
        let spent=0;
        var chars = pointBuy.characteristics;
        for(const char in chars){
            spent+=chars[char].spent;
            chars[char].total=chars[char].base+chars[char].spent;
        }
        amount-=spent;
        pointBuy.remaining=amount;
        let remainInput=document.getElementById("remaining-points-input");
        if(remainInput){
            remainInput.value=pointBuy.remaining;
        }


    }
    _onConfirmAnySkillChoice(event){
        let button=event.currentTarget;
        let dataset=button.dataset;
        let input=document.getElementById(dataset.id);
        let value=input.value;
        let index=parseInt(dataset.index);
        let parentIndex=parseInt(dataset.parentIndex);
        let skills=this.featureSkill;
        let node;
        if(Number.isInteger(parentIndex)){
            node=skills[parentIndex].choices[index];
            let parentNode=skills[parentIndex];
            parentNode.key=parentNode.key.replaceAll("anyxenos",value);
            parentNode.key=parentNode.key.replaceAll("any",value);
        }else{
            node=skills[index];
        }
        node.any=false;
        node.operate=false;
        node.navigate=false;
        node.xenos=false;
        node.key=node.key.replaceAll("anyxenos",value);
        node.label=node.label.replaceAll("anyxenos",value);
        node.key=node.key.replaceAll("any",value);
        node.label=node.label.replaceAll("any",value);
        this.render();

    }
    _onConfirmAnySpecChoice(event){
        console.log(event)
        let button=event.currentTarget;
        let dataset=button.dataset;
        let input=document.getElementById(dataset.id);
        let value=input.value;
        let index=parseInt(dataset.index);
        let parentIndex=parseInt(dataset.parentIndex);
        let talents=this.featureTalents;
        let node;
        if(Number.isInteger(parentIndex)){
            node=talents[parentIndex][index];

        }else{
            node=talents[index];
        }
        node.any=false;
        node.xenos=false;
        node.spec=node.spec.replaceAll("anyxenos",value);
        node.name=node.name.replaceAll("anyxenos",value);
        node.spec=node.spec.replaceAll("any",value);
        node.name=node.name.replaceAll("any",value);
        this.render();
    }
    _onConfirmAptitudeChoice(event){
        let button=event.currentTarget;
        let id=button.dataset.id;
        let select=document.getElementById(id);
        let aptitude=select.value;
        let actor=this.actor;
        let update={};
        update[id]=aptitude;
        actor.update(update);
        this.render();
    }
    _onCharSpentInput(event){
        var element = event.target;
        let newAmt=parseInt(element.value);
        let key= element.dataset.key;
        let pointBuy=this.pointBuy;
        let limitPerChar=pointBuy.limitPerChar;
        newAmt=Math.min(newAmt,limitPerChar);
        let chars=pointBuy.characteristics;
        let char=chars[key];
        let newTotal=char.base+newAmt;
        if(newTotal>pointBuy.charLimit){
            let substract=newTotal-pointBuy.charLimit;
            newAmt-=substract;
        }
        if(newAmt>pointBuy.remaining){
            newAmt=pointBuy.remaining;
        }
        char.spent=newAmt;
        char.total=char.base+char.spent;
        this.updateSpentChar();
        let totalInput=document.getElementById(`${key}total`);
        totalInput.value=char.total;
        element.value=newAmt;

    }
    _onFeaturePlusMinusChange(event){
        let featurePlusMinusSelect=event.currentTarget;
        let choice=featurePlusMinusSelect.value;
        let id=featurePlusMinusSelect.id;
        switch(id){
            case "select-plus1":
                this.feature.system.characteristics.plus1=choice;
                break;
            case "select-plus2":
                this.feature.system.characteristics.plus2=choice;
                break;
            case "select-minus":
                this.feature.system.characteristics.minus=choice;
                break;
        }
        this.render();
    }
    _onAptitudeAnyChange(event){
        let aptitudeAnySelect=event.currentTarget;
        let aptitudes=game.fortyk.FORTYK.aptitudes;

        let choice=aptitudeAnySelect.value;
        let aptChoice=aptitudes.find((apti)=>apti.key===choice);
        let index=parseInt(aptitudeAnySelect.dataset.index);
        this.featureAptitude[index]=aptChoice;
        this.render();
    }
    async _onAptitudeClicked(event){
        let radioButton=event.currentTarget;
        let dataset=radioButton.dataset;
        let index=parseInt(dataset.index);
        let parentIndex=parseInt(dataset.parentIndex);
        let featureAptitude=this.featureAptitude;
        for(let i=0; i<featureAptitude[parentIndex].choices.length;i++){
            if(i===index){
                featureAptitude[parentIndex].choices[i].checked=true;
            }else{
                featureAptitude[parentIndex].choices[i].checked=false;
            }
        }
    }
    async _onSkillClicked(event){
        let radioButton=event.currentTarget;
        let dataset=radioButton.dataset;
        let index=parseInt(dataset.index);
        let parentIndex=parseInt(dataset.parentIndex);
        let featureSkill=this.featureSkill;
        for(let i=0; i<featureSkill[parentIndex].choices.length;i++){
            if(i===index){
                featureSkill[parentIndex].choices[i].checked=true;
            }else{
                featureSkill[parentIndex].choices[i].checked=false;
            }
        }
    }
    async _onTalentClicked(event){
        let radioButton=event.currentTarget;
        let dataset=radioButton.dataset;
        let index=parseInt(dataset.index);
        let parentIndex=parseInt(dataset.parentIndex);
        let featureTalents=this.featureTalents;

        for(let i=0; i<featureTalents[parentIndex].length;i++){
            if(i===index){

                featureTalents[parentIndex][i].checked=true;
            }else{
                featureTalents[parentIndex][i].checked=false;
            }
        }
    }
    async _onGearClicked(event){
        let radioButton=event.currentTarget;
        let dataset=radioButton.dataset;
        let index=parseInt(dataset.index);
        let parentIndex=parseInt(dataset.parentIndex);
        let featureGear=this.featureGear;

        for(let i=0; i<featureGear[parentIndex].length;i++){
            if(i===index){

                featureGear[parentIndex][i].checked=true;
            }else{
                featureGear[parentIndex][i].checked=false;
            }
        }
    }
    async _onTraitClicked(event){
        let radioButton=event.currentTarget;
        let dataset=radioButton.dataset;
        let index=parseInt(dataset.index);
        let parentIndex=parseInt(dataset.parentIndex);
        let featureTraits=this.featureTraits;

        for(let i=0; i<featureTraits[parentIndex].length;i++){
            if(i===index){

                featureTraits[parentIndex][i].checked=true;
            }else{
                featureTraits[parentIndex][i].checked=false;
            }
        }
    }
    async _onRollFate(event){
        let rollFateButton=event.currentTarget;
        let dataset=rollFateButton.dataset;
        let rolltarget=parseInt(dataset.target);
        let roll=new Roll(`1d10cs>=${rolltarget}`);
        await roll.evaluate();
        roll.toMessage({flavor:`Rolling Emperor's Blessing on ${rolltarget}+`});
        let result=roll.total;
        if(result){
            this.feature.system.fate.threshold++; 
        }
        this.hideEmpBless=true;
        this.render();
    }
    async _onRollWounds(event){
        let rollWoundsButton=event.currentTarget;
        let dataset=rollWoundsButton.dataset;
        let formula=dataset.roll;
        let roll=new Roll(formula);
        await roll.evaluate();
        roll.toMessage({flavor:`Rolling for wounds!`});
        let result=roll.total;

        this.rolledWounds=result;


        this.render();
    }
    async _onRollInsanity(event){
        let rollInsanityButton=event.currentTarget;
        let dataset=rollInsanityButton.dataset;
        let formula=dataset.roll;
        let roll=new Roll(formula);
        await roll.evaluate();
        roll.toMessage({flavor:`Rolling for insanity!`});
        let result=roll.total;

        this.rolledInsanity=result;


        this.render();
    }
    async _onRollCorruption(event){
        let rollCorruptionButton=event.currentTarget;
        let dataset=rollCorruptionButton.dataset;
        let formula=dataset.roll;
        let roll=new Roll(formula);
        await roll.evaluate();
        roll.toMessage({flavor:`Rolling for corruption!`});
        let result=roll.total;

        this.rolledCorruption=result;


        this.render();
    }
    async _onConfirmCharacterType(event){
        let characterTypeSelect=document.getElementById("charater-type-select");
        let itemId=characterTypeSelect.value;
        let item= await fromUuid(itemId);
        let itemData= item.toObject();
        let pointBuy=itemData.system.pointBuy;
        let chars=itemData.system.characteristics;
        let hasInfluence=chars.hasInfluence;
        let experience = parseInt(itemData.system.experience);
        let update={
            "flags.fortyk.pointbuy":pointBuy,
            "flags.fortyk.creationstage":1,
            "flags.fortyk.hasinfluence":hasInfluence,
            "system.experience.starting":experience
        };
        await this.actor.update(update);
        await this.actor.createEmbeddedDocuments("Item",[itemData]);
        await sleep(100);
        this.render({force:true});



    }
    async _onConfirmCharSpent(event){
        let pointBuy=this.pointBuy;
        if(pointBuy.remaining!==0){
            return ui.notifications.warn("You must spend all your characteristic points.");
        }
        let chars=pointBuy.characteristics;
        let update={system:{characteristics:{}}};
        for(const char in chars){
            update.system.characteristics[char]={value:chars[char].total};
        }
        update["flags.fortyk.creationstage"]=3;
        
        await this.actor.update(update);
        this.render();
    }
    getSkillDescriptions(){
        let actor=this.actor;
        let skills=actor.itemTypes.skill;
        let descriptionObject={};
        for(const skill of skills){
            if(!skill.system.parent.value){
                descriptionObject[skill.name]=skill.system.description.value;
            }
        }
        return descriptionObject;
    }
    createAptitudeString(aptitudes) {
        for(let i=0; i<aptitudes.length;i++){
            let aptitude=aptitudes[i];
            if(aptitude.choices){
                let selectedValue=$(`input[name='apt-choice${i}']:checked`).val();
                aptitude.key=selectedValue;
            }
        }
        let aptitudeArray=[];
        aptitudes.map((apt)=>aptitudeArray.push(apt.key));
        let aptitudeString = aptitudeArray.join(",");
        return aptitudeString;
    }

    createSkillString() {
        let skills=this.featureSkill;
        for(let i=0; i<skills.length;i++){
            let skill=skills[i];
            if(skill.choices){
                let selectedValue=$(`input[name='skill-choice${i}']:checked`).val();
                skill.key=selectedValue;
            }
        }
        let skillArray=[];
        skills.map((skill)=>skillArray.push(skill.key));
        let skillString = skillArray.join(",");
        return skillString;
    }
    createItemArray(){
        let baseItemArray=[];
        let processedArray=[];
        if(this.featureBoni){
            baseItemArray=baseItemArray.concat(this.featureBoni);
        }
        if(this.featureEAs){
            baseItemArray=baseItemArray.concat(this.featureEAs);
        }
        if(this.featureGear){
            baseItemArray=baseItemArray.concat(this.featureGear);
        }
        if(this.featureTalents){ 

            baseItemArray=baseItemArray.concat(this.featureTalents);
        }
        if(this.featureTraits){

            baseItemArray=baseItemArray.concat(this.featureTraits);
        }
        for(const item of baseItemArray){
            if(item.length){
                for(const choice of item){
                    if(choice.checked){
                        if(choice.length){
                            for(const and of choice){
                                processedArray.push(and);
                            }
                        }else{
                            processedArray.push(choice);
                        }
                    }
                }
            }else{
                processedArray.push(item);
            }
        }

        return this.mergeDuplicates(processedArray);
    }
    mergeDuplicates(itemArray){
        let mergedArray=[];
        for(const item of itemArray){
            if(!item.spec){
                mergedArray.push(item);
                continue;
            }
            let duplicate=false;
            for(const mergedItem of mergedArray){
                if(item.uuid===mergedItem.uuid){
                    mergedItem.spec+=`, ${item.spec}`;
                    duplicate=true;
                    break;
                }
            }
            if(!duplicate){
                mergedArray.push(item);
            }
        }
        return mergedArray;
    }

    async _onConfirmPlanetClick(event){
        let planet=this.feature;
        let corruptionCheck=!this.feature.system.characteristics.cor||this.rolledCorruption;
        let insanityCheck=!this.feature.system.characteristics.ins||this.rolledInsanity;
        let aptitudes=this.featureAptitude;
        let aptitudesCheck=true;
        for(let aptitude of aptitudes){
            if(aptitude.key==="any"){
                aptitudesCheck=false;
            }
        }
        let skillCheck=true;
        for(let skill of this.featureSkill){
            if(skill.key.indexOf("any")!==-1){
                skillCheck=false;
            }
        }
        let rolledWounds=this.rolledWounds;
        if(game.settings.get("fortyk","alternateWounds")){

            rolledWounds=true;
        }
        let plusMinusCheck;
        let plus1Check=planet.system.characteristics.plus1!=="any";
        let plus2Check=planet.system.characteristics.plus2!=="any";
        let minusCheck=planet.system.characteristics.minus!=="any";
        plusMinusCheck=plus1Check&&plus2Check&&minusCheck;
        if(!(rolledWounds&&this.hideEmpBless&&skillCheck&&aptitudesCheck&&plusMinusCheck&&corruptionCheck&&insanityCheck)){
            return ui.notifications.warn("You have yet to complete all your choices for this stage.");
        }

        let fate=planet.system.fate;
        let actor = this.actor;
        let update={};
        update["system.secChar.fate.max"]=fate.threshold;
        update["system.secChar.fate.value"]=fate.threshold;
        await actor.setFlag("fortyk","alternatewoundmodifier", planet.system.wounds.alternate);
        if(game.settings.get("fortyk","alternateWounds")){


        }else{
            let wounds=this.rolledWounds;
            update["system.secChar.wounds.max"]=wounds;
            update["system.secChar.wounds.value"]=wounds;
        }
        if(this.rolledInsanity){
            update["system.secChar.insanity.value"]=this.rolledInsanity;
        }
        if(this.rolledCorruption){
            update["system.secChar.corruption.value"]=this.rolledCorruption;
        }
        planet.system.aptitude.value=this.createAptitudeString(aptitudes);

        planet.system.skills=this.createSkillString();
        await actor.update(update);
        await actor.createEmbeddedDocuments("Item",[planet]);
        await actor.setFlag("fortyk","creationstage",2);
        this.resetStage();
        this.render();
    }
    resetStage() {
        this.rolledWounds=undefined;
        this.hideEmpBless=undefined;
        this.featureCost=undefined;
        this.rolledInsanity=undefined;
        this.rolledCorruption=undefined;
        this.pointBuy=undefined;
        this.featureBoni=undefined;
        this.featureTalents=undefined;
        this.featureTraits=undefined;
        this.featureGear=undefined;
        this.featureSkills=undefined;
        this.featureAptitude=undefined;
        this.feature=undefined;
    }

    async _onConfirmFeature(event){
        let feature=this.feature;
        let corruptionCheck=!feature.system.characteristics.cor||this.rolledCorruption;
        let insanityCheck=!feature.system.characteristics.ins||this.rolledInsanity;
        let aptitudes=this.featureAptitude;
        let aptitudesCheck=true;
        for(let aptitude of aptitudes){
            if(aptitude.key==="any"){
                aptitudesCheck=false;
            }
        }
        let skillCheck=true;
        let featureSkills = this.featureSkill;
        if(featureSkills){
            for(let skill of featureSkills){
                if(skill.key.indexOf("any")!==-1){
                    skillCheck=false;
                }
            }
        }

        if(!(skillCheck&&aptitudesCheck&&corruptionCheck&&insanityCheck)){
            return ui.notifications.warn("You have yet to complete all your choices for this stage.");
        }
        let actor = this.actor;
        let update={};
        if(this.rolledInsanity){
            update["system.secChar.insanity.value"]=this.rolledInsanity+actor.system.secChar.insanity.value;
        }
        if(this.rolledCorruption){
            update["system.secChar.corruption.value"]=this.rolledCorruption+actor.system.secChar.corruption.value;
        }
        let items=this.createItemArray();
        feature.system.items=items;

        if(featureSkills){
            feature.system.skills=this.createSkillString();
        }

        feature.system.aptitude.value=this.createAptitudeString(aptitudes);

        var cost = parseInt(feature.system.cost.value);
        if(cost){
            let actorExp=actor.system.experience.starting;
            actorExp-=cost;
            update["system.experience.starting"]=actorExp;
        }
        await actor.update(update);
        await actor.createEmbeddedDocuments("Item",[feature]);
        let stage=actor.getFlag("fortyk","creationstage");
        stage++;
        await actor.setFlag("fortyk","creationstage",stage);
        this.resetStage();
        this.render();
    }
    async _onFeatureChange(event){
        this.resetStage();
        let featureSelect=event.currentTarget;
        let featureId=featureSelect.value;
        let featureDoc= await fromUuid(featureId);
        let featureBoni=[];
        let featureTalents=[];
        let featureGear=[];
        let featureTraits=[];
        let featureEAs=[];
        for(const item of featureDoc.system.items){
            let copy=foundry.utils.duplicate(item);
            let itemInstance= await fromUuid(item.uuid);
            copy.description=itemInstance.system.description.value;
            if(item.uuid.indexOf("bonus")!==-1){
                featureBoni.push(copy);
            }else if(item.uuid.indexOf("talent")!==-1){
                featureTalents.push(copy);
            }else if(item.uuid.indexOf("wargear")!==-1){
                featureGear.push(copy);
            }else if(item.uuid.indexOf("traits")!==-1){
                featureTraits.push(copy);
            }else if(item.uuid.indexOf("elite-advances")!==-1){
                featureEAs.push(copy);
            }

        }
        featureTalents=this.parseChoices(featureTalents);
        featureGear=this.parseChoices(featureGear);
        featureTraits=this.parseChoices(featureTraits);
        if(featureBoni.length>0){
            this.featureBoni=featureBoni; 
        }else{
            this.featureBoni=undefined;
        }
        if(featureTalents.length>0){
            this.featureTalents=featureTalents;
        }else{
            this.featureTalents=undefined;
        }
        if(featureGear.length>0){
            this.featureGear=featureGear;
        }else{
            this.featureGear=undefined;
        }
        if(featureTraits.length>0){
            this.featureTraits=featureTraits;
        }else{
            this.featureTraits=undefined;
        }
        if(featureEAs.length>0){
            this.featureEAs=featureEAs;  
        }else{
            this.featureEAs=undefined;
        }



        this.feature=featureDoc.toObject();
        this.featureAptitude=this.parseAptitudes(this.feature.system.aptitude.value);
        this.featureSkill=this.parseSkills(this.feature.system.skills);
        this.featureCost=parseInt(featureDoc.system.cost.value);


        this.render();
    }
    async createStartingAmmo(){
        let actor=this.actor;
        let rangedWeapons=actor.itemTypes.rangedWeapon;
        let ammoDatas=[];
        for(const rangedWeapon of rangedWeapons){
            let weaponSource=rangedWeapon._source;
            let ammoData={};
            ammoData.name=`${weaponSource.name} Ammunition`;
            ammoData.type="ammunition";
            ammoData.flags=weaponSource.flags;
            ammoData["system.class.value"]=weaponSource.system.class.value;
            ammoData["system.damageType.value"]=weaponSource.system.damageType.value;
            ammoData["system.type.value"]=weaponSource.system.type.value;
            ammoData["system.weight.value"]=Math.round((parseFloat(weaponSource.system.weight.value)*0.1 + Number.EPSILON) * 100) / 100; 


            ammoData["system.damageFormula.formula"]=weaponSource.system.damageFormula.formula;
            ammoData["system.pen.formula"]=weaponSource.system.pen.formula;
            ammoData["system.range.formula"]=weaponSource.system.range.formula;
            ammoData["system.amount.value"]=2;
            ammoDatas.push(ammoData);

        }
        await actor.createEmbeddedDocuments("Item",ammoDatas);

    }
    async _onFinishCharacterCreation(event){
        let aptitudes=this.actor.actorAptitudes;
        let duplicate=false;
        for(let apt in aptitudes){
            let aptitude=aptitudes[apt];
            if(aptitude.isCharDuplicate||aptitude.isWildcardDuplicate){
                duplicate=true;
            }
        }

        if(duplicate){
            return ui.notifications.warn("You still have duplicate aptitudes.");
        }
        new Dialog({
            title: "Finish Character Creation",
            content: "Are you sure you want to finish Character Creation? You will no longer be able to purchase advances which require it.",
            buttons:{
                submit:{
                    label:"Yes",
                    callback: async dlg => { 

                        this.resetStage();
                        await this.createStartingAmmo();
                        let wounds=this.actor.system.secChar.wounds.max;
                        let fate=this.actor.system.secChar.fate.max;
                        let infBonus=Math.floor(this.actor.system.characteristics.inf.total/10);
                        let startMoney=200*parseInt(infBonus);
                        let update={
                            "flags.fortyk.pointbuy":null,
                            "flags.fortyk.creationstage":null,
                            "flags.fortyk.charactercreation":null,
                            "system.secChar.wounds.value":wounds,
                            "system.secChar.fate.value":fate,
                            "system.currency.value":startMoney
                        };
                        await this.actor.update(update);
                        this.render();
                    }
                },
                cancel:{
                    label: "No",
                    callback: null
                }
            },
            default: "submit"
        }).render(true);


    }
    async _onGoToPreviousStage(event){
        let actor=this.actor;
        let stage=actor.getFlag("fortyk","creationstage");
        let feature;
        let update={};
        update['flags.fortyk.creationstage']=stage-1;
        switch(stage){
            case 2:
                feature=actor.planet;

                break;
            case 3:
                feature=null;

                break;
            case 4:
                feature=actor.background;
                break;
            case 5:
                let proceed;
                await Dialog.wait({
                    title: "Are you sure you want to go back?",
                    content: "Going back will remove any advances you have purchased.",
                    buttons: {
                        submit: {
                            label: 'Go Back',
                            callback: (html) => {
                                proceed=true;
                            },
                            cancel:{
                                label:"Nevermind",
                                callback: (html) => {
                                    proceed=false;
                                }
                            }
                        },
                        render: (html)=>{
                        },
                        default: "submit",
                        width:100}
                });
                if(!proceed)return;
                feature=actor.role;
                let advances=actor.itemTypes.advancement;
                for(let advance of advances){
                    await advance.delete();
                }
                break;
        }

        if(feature){
            let cost=parseInt(feature.system.cost.value);
            if(cost){
                let startExp=actor.system.experience.starting;
                startExp+=cost;
                update["system.experience.starting"]=startExp;
            }
        }
        await actor.update(update);
        await feature?.delete();
        this.resetStage();
        this.render();
        console.log(actor,feature,stage, update);
    }
    /* -------------------------------------------- */

    _onSkillsTab(event){
        const tab = $(event.target.closest("[data-tab]")).html();

        if(tab==="SKILLS"){
            document.getElementById("skillfilter").select();  
        }


    }
    async _onSpendExp(event){
        event.preventDefault();
        let dialog=new SpendExpDialog({actor:this.actor});
        dialog.render(true,{title:"Add Advancements"});

    }

    //handle creating a wargear item, these can be several types of different item types
    async _onWargearCreate(event){
        event.preventDefault();
        let templateOptions={"type":[{"name":"wargear","label":"Wargear"},{"name":"meleeWeapon","label":"Melee Weapon"},{"name":"rangedWeapon","label":"Ranged Weapon"},{"name":"ammunition","label":"Ammunition"},{"name":"armor","label":"Armor"},{"name":"forceField","label":"Forcefield"}/*,{"name":"consummable","label":"Consummable"}*/]};

        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/select-wargear-type-dialog.html', templateOptions);

        renderedTemplate.then(content => { 
            new Dialog({
                title: "New Wargear Type",
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

    /**
    *Handle select change for cybernetic location selector
    * @param {Event} event   The originating click event
    * @private
    */
    async _onCyberLocationEdit(event){

        event.preventDefault();

        let newLoc=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= this.actor.getEmbeddedDocument("Item", dataItemId);

        item.update({"system.location.value":newLoc});


    }

    async _onPowerTrainingEdit(event){
        event.preventDefault();

        let newTraining=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= this.actor.getEmbeddedDocument("Item", dataItemId);

        item.update({"system.training.value":newTraining});


    }


    /**
    *Handle select change for skill characterteristic selector
    * @param {Event} event   The originating change event
    * @private
    */
    async _onSkillCharEdit(event){

        event.preventDefault();
        let newChar=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= this.actor.getEmbeddedDocument("Item", dataItemId);
        item.update({"system.characteristic.value":newChar});

    }
    /**
    *Handle select change for skill advancement selector
    * @param {Event} event   The originating click event
    * @private
    */
    async _onSkillAdvEdit(event){
        event.preventDefault();
        let newAdv=event.target.value;
        let dataItemId=event.target.attributes["data-item-id"].value;
        let item= this.actor.getEmbeddedDocument("Item", dataItemId);
        item.update({"system.value":newAdv});



    }




    //handles adding extra worn weapon slots
    async _onAddExtraWeapon(event){
        let actor=this.actor;
        let data=foundry.utils.duplicate(actor);

        let weapons=Object.values(data.system.secChar.wornGear.extraWeapons);
        weapons.push({});
        let weaponsObj=Object.assign({},weapons);
        await actor.update({"system.secChar.wornGear.extraWeapons":weaponsObj});

    }
    //handles removing extra weapon slots
    async _onRemoveExtraWeapon(event){
        event.preventDefault();
        let actor=this.actor;
        let data=foundry.utils.duplicate(actor.system);
        let weapons=Object.values(data.secChar.wornGear.extraWeapons);

        if(weapons.length>0){

            weapons.pop();

            await actor.update({"system.secChar.wornGear.extraWeapons":weapons});
        }

    }
    async _onExtraWeaponChange(event){
        let actor=this.actor;
        const weaponId=event.currentTarget.value;
        const index=parseInt(event.currentTarget.dataset["index"]);
        const previousWeaponId=this.actor.system.secChar.wornGear.extraWeapons[index].id;
        let str="extra"+index;
        let updates=[];
        if(weaponId!==""){
            updates.push({"_id":weaponId,"system.isEquipped":str});
        }
        if(previousWeaponId!==undefined){
            updates.push({"_id":previousWeaponId,"system.isEquipped":false});
        }
        if(updates.length>0){
            await actor.updateEmbeddedDocuments("Item",updates);
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
            weaponUpdate["system.clip.value"]=ammo.system.currentClip.value;
            ammo.update({"system.isEquipped":true});
        }else{
            weaponUpdate["system.clip.value"]=0;
        }


        weapon.update(weaponUpdate);



    }
    //handles reloading a ranged weapon
    async _onWeaponReload(event){
        event.preventDefault;
        const dataset=event.currentTarget.dataset;

        let weapon=this.actor.getEmbeddedDocument("Item",dataset.weapon);

        let actor=this.actor;
        let update=[];
        let weaponUpdate={};
        let ammoUpdate={};

        let ooa=false;
        //different logic for throwing weapons
        if(weapon.system.class.value!=="Thrown"){
            const ammo=this.actor.getEmbeddedDocument("Item",weapon.system.ammo._id);

            if(ammo!==null){
                let ammoAmt=parseInt(ammo.system.amount.value);

                if(ammoAmt>0){
                    weaponUpdate["system.clip.value"]=weapon.system.clip.max;
                    ammoUpdate["system.amount.value"]=ammoAmt-1
                    weapon.update(weaponUpdate);
                    ammo.update(ammoUpdate);


                }else{
                    ooa=true;
                } 
            }else{
                return;
            }

        }else{
            if(weapon.system.amount.value>0){

                weaponUpdate["system.clip.value"]=weapon.system.clip.max;
                weaponUpdate["system.amount.value"]=parseInt(weapon.system.amount.value)-1;
                weapon.update(weaponUpdate);
            }else{
                ooa=true;
            }

        }
        //check if out of ammo to reload
        if(ooa){
            new Dialog({
                title: `Out of Ammunition!`,
                content: `You are out of ammunition and cannot reload.`,
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: null
                    }
                },
                default: "submit",


                width:100}
                      ).render(true);
        }



    }
    //handles when weapons are swapped and stuff
    async _onWeaponChange(event){
        event.preventDefault();
        const data=this.actor.system;

        let actor=this.actor;
        let weapon=actor.items.get(event.currentTarget.value);


        const weaponID=event.currentTarget.value;
        const hand=event.currentTarget.dataset["hand"];
        const leftHand=document.getElementById("left");
        const rightHand=document.getElementById("right");
        var update=[];
        var previousWeaponID="";
        if(hand==="right"){
            previousWeaponID=data.secChar.wornGear.weapons[1].id;
            if(previousWeaponID){
                update.push({"_id":previousWeaponID,"system.isEquipped":false});
            }
            if(weaponID!==""){
                if(weapon.system.twohanded.value){
                    update.push({"_id":weaponID,"system.isEquipped":"rightleft"});
                    let offHandWeaponId=data.secChar.wornGear.weapons[0].id;
                    if(offHandWeaponId){
                        update.push({"_id":offHandWeaponId,"system.isEquipped":false});
                    }
                }else{
                    update.push({"_id":weaponID,"system.isEquipped":"right"});
                }

            }

        }else if(hand==="left"){

            previousWeaponID=data.secChar.wornGear.weapons[0].id;
            if(previousWeaponID){
                update.push({"_id":previousWeaponID,"system.isEquipped":false});
            }
            if(weaponID!==""){
                if(weapon.system.twohanded.value){
                    update.push({"_id":weaponID,"system.isEquipped":"rightleft"});
                    let offHandWeaponId=data.secChar.wornGear.weapons[1].id;
                    if(offHandWeaponId){
                        update.push({"_id":offHandWeaponId,"system.isEquipped":false});
                    }
                }else{
                    update.push({"_id":weaponID,"system.isEquipped":"left"});
                }
            }

        }


        if(update.length>0){
            await this.actor.updateEmbeddedDocuments("Item",update);
        }


    }
    async _onFavoriteClick(event){
        let dataset=event.currentTarget.dataset;
        let powerID=dataset["itemId"];
        let power=this.actor.items.get(powerID);

        let favorite=power.system.favorite;
        if(favorite){
            await power.update({"system.favorite":false});
        }else{
            await power.update({"system.favorite":true});
        }
        await this.actor.prepare();
    }

    _onFilterChange(event){

        let skills=document.getElementsByName("skill");
        let skillHeads=document.getElementsByName("skillheads");

        let filterInput=document.getElementById("skillfilter");
        let filter=filterInput.value.toLowerCase();
        for(let i=0;i<skills.length;i++){
            let skill=skills[i];
            let elements=skill.getElementsByTagName("a");
            let nameElement=elements[0];
            let skillName=nameElement.attributes["data-name"].value.toLowerCase();
            if(skillName.indexOf(filter)>-1){
                skill.style.display="";
            }else{
                skill.style.display="none";
            }
        }
        for(let index=0;index<skillHeads.length;index++){
            if(filter===""){
                skillHeads[index].style.display="";
            }else{
                skillHeads[index].style.display="none";
            }
        }
    }

}
