import {FortykRolls} from "./FortykRolls.js";
export class FortykRollDialogs{
    //handles test rerolls
    static async _onReroll(event){
        event.preventDefault();
        event.currentTarget.style.display = "none";
        const dataset=event.currentTarget.dataset;

        const actor=game.actors.get(dataset["actor"]);
        const char=dataset["char"];
        const type=dataset["rollType"];

        const target=dataset["target"];
        const label=dataset["label"];

        const weapon=actor.items.get(dataset["weapon"]);
        const fireRate=dataset["fire"];

        this.callRollDialog(char, type, target, actor, label, weapon , true, fireRate);

    }
    //focuses the modifier input on rerolls
    static _onModifierCall(event){


        setTimeout(function() {document.getElementById('modifier').select();}, 50);

    }
    //handles dealing damage if the actor doesnt drop the weapon on overheat
    static async _onOverheat(event){
        event.preventDefault();
        const dataset=event.currentTarget.dataset;

        const actor=game.actors.get(dataset["actor"]);

        const weapon=duplicate(actor.getEmbeddedDocument("Item",dataset["weapon"]));
        let newWeapon=await Item.create(weapon,{temporary:true});
        const formula=weapon.data.damageFormula;
        newWeapon.data.data.pen.value=0;


        await FortykRolls.damageRoll(formula,actor,newWeapon,1,true,true);


    }
    static async callRollDialog(testChar, testType, testTarget, actor, testLabel, item, reroll, title=""){

        if(reroll){
            title+=`${testLabel} `+"Reroll";
        }else{
            title+=`${testLabel} `+"Test";
        }
        new Dialog({
            title: title,
            content: `<p><label>Modifier:</label> <input id="modifier" type="text" name="modifier" value="0" autofocus/></p>`,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (html) => {
                        const bonus = Number($(html).find('input[name="modifier"]').val());
                        if(isNaN(bonus)){
                            this.callRollDialog(testChar, testType, testTarget, actor, testLabel, item, reroll,"Invalid Number ");
                        }else{
                            testTarget=parseInt(testTarget)+parseInt(bonus);

                            FortykRolls.fortykTest(testChar, testType, testTarget, actor, testLabel, item, reroll);
                        }
                        AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, loop: false}, true);
                    }

                }
            },
            default: "submit",


            width:100}
                  ).render(true);

    }
    //handles the melee attack dialog WHEW
    static async callMeleeAttackDialog(testChar, testType, testTarget, actor, testLabel, item, modifiers){

        let template="systems/fortyk/templates/actor/dialogs/melee-attack-dialog.html"
        let templateOptions={};
        templateOptions["modifiers"]=actor.data.data.secChar.attacks;
        templateOptions["options"]={}
        templateOptions["options"].swift=actor.getFlag("fortyk","swiftattack");
        templateOptions["options"].lightning=actor.getFlag("fortyk","lightningattack");
        templateOptions["options"].prone=modifiers.prone;
        templateOptions["options"].selfProne=modifiers.selfProne;
        templateOptions["options"].stunned=modifiers.stunned;
        templateOptions["options"].helpless=modifiers.helpless;
        templateOptions["options"].size=modifiers.size;
        templateOptions["options"].blindfight=actor.getFlag("fortyk","blindfight");
        templateOptions["options"].running=modifiers.running;
        templateOptions["options"].totalDef=modifiers.totalDef;
        if(!templateOptions["options"].blindfight){
            templateOptions["options"].selfBlind=modifiers.selfBlind;
        }
        templateOptions["size"]=game.fortyk.FORTYK.size;

        let renderedTemplate= await renderTemplate(template,templateOptions);

        new Dialog({
            title: `${item.name} Melee Attack Test.`,
            classes:"fortky",
            content: renderedTemplate,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: async (html) => {
                        const attackTypeBonus = Number($(html).find('input[name="attack-type"]:checked').val());

                        let guarded = Number($(html).find('input[name="guarded"]:checked').val());
                        const aimBonus = Number($(html).find('input[name="aim-type"]:checked').val());
                        const outnumberBonus = Number($(html).find('input[name="outnumber"]:checked').val());
                        const terrainBonus = Number($(html).find('input[name="terrain"]:checked').val());
                        const visibilityBonus = Number($(html).find('input[name="visibility"]:checked').val());
                        let defensive = Number($(html).find('input[name="defensive"]:checked').val());
                        let prone = Number($(html).find('input[name="prone"]:checked').val());
                        let high = Number($(html).find('input[name="high"]:checked').val());
                        let surprised = Number($(html).find('input[name="surprised"]:checked').val());
                        let stunned = Number($(html).find('input[name="stunned"]:checked').val());
                        let running= Number($(html).find('input[name="running"]:checked').val());
                        const size = Number($(html).find('select[name="size"]').val());
                        let other = Number($(html).find('input[name="other"]').val());
                        let addLabel=html.find('input[name=attack-type]:checked')[0].attributes["label"].value;

                        let attackType=html.find('input[name=attack-type]:checked')[0].attributes["attacktype"].value;
                        let update={};
                        update["data.secChar.lastHit.attackType"]=attackType;
                        if(attackType==="called"){

                            update["data.secChar.lastHit.called"]=$(html).find('select[name="calledLoc"] option:selected').val();

                        }
                        await actor.update(update);
                        if(html.find('input[name="guarded"]').is(':checked')){
                            addLabel=html.find('input[name="guarded"]')[0].attributes["label"].value+" "+addLabel;
                        }
                        testLabel=addLabel+" "+ testLabel;
                        if(isNaN(running)){running=0}
                        if(isNaN(guarded)){guarded=0}
                        if(isNaN(defensive)){defensive=0}
                        if(isNaN(prone)){prone=0}
                        if(isNaN(high)){high=0}
                        if(isNaN(surprised)){surprised=0}
                        if(isNaN(stunned)){stunned=0}
                        if(isNaN(other)){other=0}
                        
                        testTarget=parseInt(testTarget)+parseInt(running)+parseInt(attackTypeBonus)+parseInt(guarded)+parseInt(aimBonus)+parseInt(outnumberBonus)+parseInt(terrainBonus)+parseInt(visibilityBonus)+parseInt(defensive)+parseInt(prone)+parseInt(high)+parseInt(surprised)+parseInt(stunned)+parseInt(size)+parseInt(other);
                        FortykRolls.fortykTest(testChar, testType, testTarget, actor, testLabel, item, false);
                    }

                }
            },
            default: "submit",


            width:400}
                  ).render(true);
    }
    static async callRangedAttackDialog(testChar, testType, testTarget, actor, testLabel, item, modifiers){
        let template="systems/fortyk/templates/actor/dialogs/ranged-attack-dialog.html"
        let templateOptions={};
        let itemData=item.data;

        templateOptions["modifiers"]=actor.data.data.secChar.attacks;
        templateOptions["size"]=game.fortyk.FORTYK.size;
        templateOptions["modifiers"].standard=itemData.data.attackMods.single;
        templateOptions["modifiers"].semi=itemData.data.attackMods.semi;
        templateOptions["modifiers"].full=itemData.data.attackMods.full;
        if(templateOptions["modifiers"].semi||templateOptions["modifiers"].full){
            templateOptions["modifiers"].supp=true;
        }else{
            templateOptions["modifiers"].supp=false;
        }
        templateOptions["modifiers"].suppressive=itemData.data.attackMods.suppressive;
        templateOptions["modifiers"].aim=itemData.data.attackMods.aim;
        templateOptions["modifiers"].testMod=itemData.data.testMod.value;

        templateOptions["modifiers"].inaccurate=item.getFlag("fortyk","innacurate");


        for (let [key, rng] of Object.entries(templateOptions.modifiers.range)){
            let wepMod=itemData.data.attackMods.range[key];
            templateOptions.modifiers.range[key]=Math.max(wepMod,rng);
        }
        //set flags for rate of fire
        let curAmmo=parseInt(itemData.data.clip.value);
        let consump=parseInt(itemData.data.clip.consumption);
        let rofSingle=parseInt(itemData.data.rof[0].value);
        let rofSemi=parseInt(itemData.data.rof[1].value);
        if(isNaN(rofSingle)){
            rofSingle=1;
        }
        let rofFull=parseInt(itemData.data.rof[2].value);
        let canShoot=false;
        if(parseInt(rofSingle)===0){
            templateOptions["single"]=false;
        }else{

            if(rofSingle*consump>curAmmo){
                templateOptions["single"]=false;
            }else{
                templateOptions["single"]=true;
                canShoot=true;
            }

        }
        if(parseInt(rofSemi)===0){
            templateOptions["semi"]=false;
        }else{
            if(rofSemi*consump>curAmmo){
                templateOptions["semi"]=false;
            }else{
                templateOptions["semi"]=true;
                canShoot=true;
            }

        }
        if(parseInt(rofFull)===0){
            templateOptions["full"]=false;
        }else{
            if(rofFull*consump>curAmmo){
                templateOptions["full"]=false;
            }else{
                templateOptions["full"]=true;
                canShoot=true;
            }
        }
        //if cant shoot return
        if(!canShoot){
            new Dialog({
                title: `Not enough Ammo.`,
                classes:"fortky",
                content: "You are out of ammunition, reload!",
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: null

                    }
                },
                default: "submit",


                width:400}
                      ).render(true);
            return;
        }else if(actor.getFlag("core","blind")){
            new Dialog({
                title: `Blind`,
                classes:"fortky",
                content: "You are blind and can't shoot!",
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: null

                    }
                },
                default: "submit",


                width:400}
                      ).render(true);
            return;
        }
        templateOptions["options"]={}
        templateOptions["options"].prone=modifiers.prone;
        templateOptions["options"].stunned=modifiers.stunned;
        templateOptions["options"].helpless=modifiers.helpless;
        templateOptions["options"].size=modifiers.size;
        templateOptions["options"].running=modifiers.running;
        templateOptions["options"].normal=true;

        //distance shenanigans

        if(modifiers.distance){
            let distance=modifiers.distance;
            let pointblank=false;
            let short=false;
            let normal=false;
            let long=false;
            let extreme=false;
            let range=itemData.data.range.value;
            if((distance<=1||distance<=canvas.dimensions.distance)){
                if(itemData.data.class.value==="Pistol"){
                    normal=true;
                }else{
                    new Dialog({
                        title: `Melee`,
                        classes:"fortky",
                        content: "You cannot shoot while engaged in melee!",
                        buttons: {
                            submit: {
                                label: 'OK',
                                callback: null

                            }
                        },
                        default: "submit",


                        width:400}
                              ).render(true);
                    return;
                }

            }else if(distance<=2||distance<=2*canvas.dimensions.distance){
                pointblank=true;
            }else if(distance<=parseInt(range)/2){
                short=true;
            }else if(distance<=range){
                normal=true;
            }else if(distance<=2*range){
                long=true;
            }else if(distance<=3*range){
                extreme=true;
            }else{
                new Dialog({
                    title: `Out of range`,
                    classes:"fortky",
                    content: "You are out of range!",
                    buttons: {
                        submit: {
                            label: 'OK',
                            callback: null

                        }
                    },
                    default: "submit",


                    width:400}
                          ).render(true);
                return;
            }
            templateOptions["options"].pointblank=pointblank;
            templateOptions["options"].short=short;
            templateOptions["options"].normal=normal;
            templateOptions["options"].long=long;
            templateOptions["options"].extreme=extreme;
        }
        templateOptions["size"]=game.fortyk.FORTYK.size;

        let renderedTemplate= await renderTemplate(template,templateOptions);

        new Dialog({
            title: `${item.name} Ranged Attack Test.`,
            classes:"fortky",
            content: renderedTemplate,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: async (html) => {

                        const attackTypeBonus = Number($(html).find('input[name="attack-type"]:checked').val());


                        let guarded = Number($(html).find('input[name="guarded"]:checked').val());
                        let aimBonus = Number($(html).find('input[name="aim-type"]:checked').val());
                        const rangeBonus = Number($(html).find('input[name="distance"]:checked').val());
                        if(isNaN(aimBonus)){
                            aimBonus=0;
                        }

                        const visibilityBonus = Number($(html).find('input[name="visibility"]:checked').val());
                        let concealed = Number($(html).find('input[name="concealed"]:checked').val());
                        let prone = Number($(html).find('input[name="prone"]:checked').val());
                        let high = Number($(html).find('input[name="high"]:checked').val());
                        let surprised = Number($(html).find('input[name="surprised"]:checked').val());
                        let running= Number($(html).find('input[name="running"]:checked').val());
                        let stunned = Number($(html).find('input[name="stunned"]:checked').val());
                        const size = Number($(html).find('select[name="size"]').val());
                        let other = Number($(html).find('input[name="other"]').val());
                        //get attack type name for title

                        let addLabel=html.find('input[name=attack-type]:checked')[0].attributes["label"].value;
                        if(html.find('input[name="guarded"]').is(':checked')){
                            addLabel=html.find('input[name="guarded"]')[0].attributes["label"].value+" "+addLabel;
                        }
                        testLabel=addLabel+" "+ testLabel;

                        let attackType=html.find('input[name=attack-type]:checked')[0].attributes["attacktype"].value;
                        let update={};
                        update["data.secChar.lastHit.attackType"]=attackType;
                        if(attackType==="called"){

                            update["data.secChar.lastHit.called"]=$(html).find('select[name="calledLoc"] option:selected').val();

                        }
                        await actor.update(update);
                        //spend ammo on gun
                        let rofIndex=parseInt(html.find('input[name=attack-type]:checked')[0].attributes["index"].value);

                        let rof=0;
                        if(rofIndex===3){
                            rof=Math.max(rofSemi,rofFull)*consump;
                        }else if(rofIndex===2){
                            rof=rofFull*consump;
                        }else if(rofIndex===1){
                            rof=rofSemi*consump;
                        }else if(rofIndex===0){
                            rof=rofSingle*consump;
                        }


                        await item.update({"data.clip.value":curAmmo-rof});
                        //convert unchosen checkboxes into 0s
                        if(isNaN(running)){running=0}
                        if(isNaN(guarded)){guarded=0}
                        if(isNaN(prone)){prone=0}
                        if(isNaN(high)){high=0}
                        if(isNaN(surprised)){surprised=0}
                        if(isNaN(stunned)){stunned=0}
                        if(isNaN(concealed)){concealed=0}
                        if(isNaN(other)){other=0}

                        testTarget=parseInt(testTarget)+parseInt(running)+parseInt(attackTypeBonus)+parseInt(guarded)+parseInt(aimBonus)+parseInt(visibilityBonus)+parseInt(prone)+parseInt(high)+parseInt(surprised)+parseInt(stunned)+parseInt(size)+parseInt(other)+parseInt(concealed)+parseInt(rangeBonus);
                        await FortykRolls.fortykTest(testChar, testType, testTarget, actor, testLabel, item, false, attackType);
                        if(aimBonus>0){
                            await actor.update({"data.secChar.lastHit.aim":true});
                            actor.data.data.secChar.lastHit.aim=true;
                        }else{
                            await actor.update({"data.secChar.lastHit.aim":false});
                        }
                    }

                }
            },
            default: "submit",


            width:400}
                  ).render(true);

    }
    static async callFocusPowerDialog(testChar, testType, testTarget, actor, testLabel, item, modifiers){
        let template="systems/fortyk/templates/actor/dialogs/psychic-power-attack-dialog.html"
        let templateOptions={};

        templateOptions["modifiers"]=actor.data.data.secChar.attacks;
        templateOptions["options"]={}
        templateOptions["options"].prone=modifiers.prone;
        templateOptions["options"].stunned=modifiers.stunned;
        templateOptions["options"].helpless=modifiers.helpless;
        templateOptions["options"].size=modifiers.size;
        templateOptions["options"].running=modifiers.running;
        templateOptions["options"].normal=true;

        //distance shenanigans

        if(modifiers.distance){
            let distance=modifiers.distance;
            let pointblank=false;
            let short=false;
            let normal=false;
            let long=false;
            let extreme=false;
            let range=item.data.data.range.value;
            if(distance<=2||distance<=2*canvas.dimensions.distance){
                pointblank=true;
            }else if(distance<=parseInt(range)/2){
                short=true;
            }else if(distance<=range){
                normal=true;
            }else if(distance<=2*range){
                long=true;
            }else if(distance<=3*range){
                extreme=true;
            }else{
                new Dialog({
                    title: `Out of range`,
                    classes:"fortky",
                    content: "You are out of range!",
                    buttons: {
                        submit: {
                            label: 'OK',
                            callback: null

                        }
                    },
                    default: "submit",


                    width:400}
                          ).render(true);
                return;
            }
            templateOptions["options"].pointblank=pointblank;
            templateOptions["options"].short=short;
            templateOptions["options"].normal=normal;
            templateOptions["options"].long=long;
            templateOptions["options"].extreme=extreme;
        }
        templateOptions["size"]=game.fortyk.FORTYK.size;

        let renderedTemplate= await renderTemplate(template,templateOptions);

        new Dialog({
            title: `${item.name} Psychic Attack Test.`,
            classes:"fortky",
            content: renderedTemplate,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (html) => {



                        const rangeBonus = Number($(html).find('input[name="distance"]:checked').val());

                        const visibilityBonus = Number($(html).find('input[name="visibility"]:checked').val());

                        let prone = Number($(html).find('input[name="prone"]:checked').val());
                        let high = Number($(html).find('input[name="high"]:checked').val());
                        let surprised = Number($(html).find('input[name="surprised"]:checked').val());
                        let stunned = Number($(html).find('input[name="stunned"]:checked').val());
                        let running= Number($(html).find('input[name="running"]:checked').val());
                        let melee = Number($(html).find('input[name="melee"]:checked').val());
                        const size = Number($(html).find('select[name="size"]').val());
                        let other = Number($(html).find('input[name="other"]').val());
                        let concealed= Number($(html).find('input[name="concealed"]:checked').val());

                        if(isNaN(melee)){melee=0}
                        if(isNaN(running)){running=0}
                        if(isNaN(concealed)){concealed=0}
                        if(isNaN(prone)){prone=0}
                        if(isNaN(high)){high=0}
                        if(isNaN(surprised)){surprised=0}
                        if(isNaN(stunned)){stunned=0}
                        if(isNaN(other)){other=0}
                        testTarget=parseInt(testTarget)+parseInt(running)+parseInt(melee)+parseInt(concealed)+parseInt(rangeBonus)+parseInt(visibilityBonus)+parseInt(prone)+parseInt(high)+parseInt(surprised)+parseInt(stunned)+parseInt(size)+parseInt(other);
                        FortykRolls.fortykTest(testChar, testType, testTarget, actor, testLabel, item, false);
                    }

                }
            },
            default: "submit",


            width:400}
                  ).render(true);
    }
    //activate chatlisteners
    static chatListeners(html){
        html.on("mouseup",".reroll", this._onReroll.bind(this));
        html.on("click",".reroll", this._onModifierCall.bind(this));
        html.on("click",".overheat", this._onOverheat.bind(this));
    }
}
