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

    //handles dealing damage if the actor doesnt drop the weapon on overheat
    static async _onOverheat(event){
        event.preventDefault();
        const dataset=event.currentTarget.dataset;
        const actor=game.actors.get(dataset["actor"]);

        const weapon=actor.getEmbeddedDocument("Item",dataset["weapon"]);
        let newWeapon=weapon.clone({},[]);
        const formula=weapon.system.damageFormula;
        newWeapon.system.pen.value=0;


        await FortykRolls.damageRoll(formula,actor,newWeapon,1,true,true);


    }
    static async _onTestPoppup(event){
        event.preventDefault();
        const dataset=event.currentTarget.dataset;
        let poppupId=dataset["id"];
        let poppup=document.getElementById(poppupId);
        poppup.classList.toggle("show");
    }
    static async callRollDialog(testChar, testType, testTarget, actor, testLabel, item, reroll, title=""){

        if(reroll){
            title+=`${testLabel} `+"Reroll";
        }else{
            title+=`${testLabel} `+"Test";

        }
        let modifier=0;

        if(testType==="evasion"){
            if(actor.getFlag("fortyk","evadeMod")){

                modifier=actor.getFlag("fortyk","evadeMod");
            }
            if(actor.getFlag("core","luminagen")){
                modifier-=10;
            }
            if(actor.getFlag("core","holyShield")){
                modifier+=10;
            }
        }

        new Dialog({
            title: title,
            content: `<p><label>Modifier:</label> <input id="modifier" type="text" name="modifier" value="${modifier}" autofocus/></p>`,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (html) => {
                        const bonus = Number($(html).find('input[name="modifier"]').val());
                        if(isNaN(bonus)){
                            this.callRollDialog(testChar, testType, testTarget, actor, testLabel, item, reroll,"Invalid Number ");
                        }else{
                            testTarget=parseInt(testTarget)+parseInt(bonus);
                            if(testType==="fear"){
                                testTarget+=parseInt(actor.system.secChar.fearMod);
                                if(actor.getFlag("fortyk","resistance")&&actor.getFlag("fortyk","resistance").toLowerCase().includes("fear")){
                                    testTarget+=10;
                                }
                            }
                            if(!reroll){

                                if(testType==="evasion"){
                                    if(actor.getFlag("fortyk","evadeMod")){
                                        actor.setFlag("fortyk","evadeMod",false);
                                    }
                                    let aeData={};
                                    aeData.id="evasion";
                                    aeData.label= "Evasion";
                                    if(actor.getFlag("core","evasion")){
                                        aeData.icon= "systems/fortyk/icons/evasion2.png";
                                    }else{
                                        aeData.icon= "systems/fortyk/icons/evasion.png"; 
                                    }


                                    aeData.flags= { core: { statusId: "evasion" } }
                                    aeData.duration={

                                        rounds:0
                                    };
                                    FortykRolls.applyActiveEffect(actor,[aeData]);

                                }
                            }
                            FortykRolls.fortykTest(testChar, testType, testTarget, actor, testLabel, item, reroll);
                        }

                    }

                }
            },
            default: "submit",


            width:100}
                  ).render(true);

    }
    //handles the melee attack dialog WHEW
    static async callMeleeAttackDialog(testChar, testType, testTarget, actor, testLabel, item, modifiers){

        let itemData=item;
        let template="systems/fortyk/templates/actor/dialogs/melee-attack-dialog.html"
        let templateOptions={};
        let modifierTracker=[];
        let miscMods=0;
        templateOptions["modifiers"]=duplicate(actor.system.secChar.attacks);
        templateOptions["modifiers"].testMod=0;
        modifierTracker.push({"value":`${testTarget}`,"label":`Base Target Value`});
        miscMods+=item.system.testMod.value;
        if(miscMods!==0){
            modifierTracker.push({"value":`${miscMods}`,"label":"Weapon Bonus"});
        }
        templateOptions["options"]={}
        templateOptions["options"].swift=actor.getFlag("fortyk","swiftattack");
        templateOptions["options"].lightning=actor.getFlag("fortyk","lightningattack");
        templateOptions["options"].prone=modifiers.prone;
        templateOptions["options"].selfProne=modifiers.selfProne;
        templateOptions["options"].stunned=modifiers.stunned;
        templateOptions["options"].helpless=modifiers.helpless;
        if(modifiers.size){
            templateOptions["options"].size=modifiers.size; 
        }else{
            templateOptions["options"].size=actor.system.secChar.size.value;
        }


        templateOptions["options"].blindfight=actor.getFlag("fortyk","blindfight");
        templateOptions["options"].counter=actor.getFlag("fortyk","counterattack");
        templateOptions["options"].running=modifiers.running;
        templateOptions["options"].totalDef=modifiers.totalDef;
        templateOptions["options"].rough=actor.getFlag("core","rough");
        templateOptions["options"].tough=actor.getFlag("core","tough");
        templateOptions["options"].severe=actor.getFlag("core","severe");
        if(!(templateOptions["options"].rough&&templateOptions["options"].tough&&templateOptions["options"].severe)){
            templateOptions["options"].normal=true;
        }else{
            templateOptions["options"].normal=false;
        }
        if(!templateOptions["options"].blindfight){
            templateOptions["options"].selfBlind=modifiers.selfBlind;
        }

        //elevation stuff
        if(modifiers.elevation>0){
            templateOptions["options"].prone=true;
        }else if(modifiers.elevation<0){

            templateOptions["options"].selfProne=true;
        }
        templateOptions["size"]=game.fortyk.FORTYK.size;

        if(actor.type!=="vehicle"&&actor.system.formation.value){
            let unitStr=actor.system.secChar.wounds.value;
            templateOptions["modifiers"].charge=Math.min((10+unitStr*5),60);
            templateOptions["modifiers"].standard=Math.min(unitStr*5,60);

        }
        if(actor.type!=="vehicle"&&actor.system.horde.value){
            let hordeSize=actor.system.secChar.wounds.value;

            if((actor.getFlag("fortyk","massAssault")&&item.type==="meleeWeapon")||(actor.getFlag("fortyk","focusedFire")&&item.type==="rangedWeapon")){

                miscMods+=Math.min(30,hordeSize);
                modifierTracker.push({"value":`+${Math.min(30,hordeSize)}`,"label":"Horde Trait Bonus"});

            }
        }
        let targets=game.user.targets;
        let target=targets.values().next().value;
        let vehicle=false;
        if(targets.size>0){
            console.log(modifiers)
            miscMods+=-modifiers.tarEvasion;
            console.log(miscMods)
            if(modifiers.tarEvasion){
                modifierTracker.push({"value":`${-modifiers.tarEvasion}`,"label":"Target Speed Modifier"});
            }
            let tarActor=target.actor;
            let tar=tarActor;
            if(!actor.getFlag("fortyk","blindfight")&&tarActor.getFlag("fortyk","invisible")){
                miscMods+=parseInt(tarActor.getFlag("fortyk","invisible"));
                modifierTracker.push({"value":tarActor.getFlag("fortyk","invisible"),"label":"Invisible"});
            }
            if(tarActor.type==="vehicle"){
                vehicle=true;
                templateOptions.vehicle=true;
            }
            if(!vehicle){
                if(tar.system.horde.value){
                    let hordeSize=tar.system.secChar.wounds.value;
                    if(hordeSize>=120){
                        miscMods+=60;
                        modifierTracker.push({"value":`60`,"label":"Horde Size Modifier"});
                    }else if(hordeSize>=90){
                        miscMods+=50;
                        modifierTracker.push({"value":`50`,"label":"Horde Size Modifier"});
                    }else if(hordeSize>=60){
                        miscMods+=40;
                        modifierTracker.push({"value":`40`,"label":"Horde Size Modifier"});
                    }else if(hordeSize>=30){
                        miscMods+=30;
                        modifierTracker.push({"value":`30`,"label":"Horde Size Modifier"});
                    }
                }



                if(!vehicle&&actor.getFlag("fortyk","fieldvivisection")){


                    var tarRace=targetActor.system.race.value.toLowerCase();
                    if(actor.getFlag("fortyk","fieldvivisection").includes(tarRace)){
                        templateOptions["modifiers"].called+=actor.system.fieldVivisection;
                        if(actor.getFlag("fortyk","fieldpractitioner")){
                            let praticeArray=[];
                            var practiceMax=Math.ceil(actor.system.characteristics.int.bonus/2);
                            for(let i=1;i<=practiceMax;i++){
                                praticeArray.push(i);
                            }
                            templateOptions.fieldPractice=praticeArray;
                        }
                    }
                }
            }
        }
        templateOptions["modifiers"].miscMods=miscMods;
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
                        let counter = Number($(html).find('input[name="counter"]:checked').val());
                        const aimBonus = Number($(html).find('input[name="aim-type"]:checked').val());
                        let aimType = html.find('input[name=aim-type]:checked')[0].attributes["aimtype"].value;
                        const outnumberBonus = Number($(html).find('input[name="outnumber"]:checked').val());
                        let outnumberType = html.find('input[name=outnumber]:checked')[0].attributes["outnumbertype"].value;
                        const terrainBonus = Number($(html).find('input[name="terrain"]:checked').val());
                        let terrainType = html.find('input[name=terrain]:checked')[0].attributes["terraintype"].value;
                        const visibilityBonus = Number($(html).find('input[name="visibility"]:checked').val());
                        let visibilityType = html.find('input[name=visibility]:checked')[0].attributes["visibilitytype"].value;
                        let defensive = Number($(html).find('input[name="defensive"]:checked').val());
                        let prone = Number($(html).find('input[name="prone"]:checked').val());
                        let high = Number($(html).find('input[name="high"]:checked').val());
                        let surprised = Number($(html).find('input[name="surprised"]:checked').val());
                        let stunned = Number($(html).find('input[name="stunned"]:checked').val());
                        let running= Number($(html).find('input[name="running"]:checked').val());
                        let size = Number($(html).find('select[name="size"]').val());
                        //adjust size penalty
                        size=(size-actor.system.secChar.size.value)*10;
                        if(actor.getFlag("fortyk","preysense")){

                            if(size<0){
                                let preysense=parseInt(actor.getFlag("fortyk","preysense"))*10
                                size=Math.min(0,size+preysense)
                            }
                        }
                        let other = Number($(html).find('input[name="other"]').val());
                        let addLabel=html.find('input[name=attack-type]:checked')[0].attributes["label"].value;

                        let attackType=html.find('input[name=attack-type]:checked')[0].attributes["attacktype"].value;
                        let attacklabel=html.find('input[name=attack-type]:checked')[0].attributes["label"].value;
                        let update={};
                        update["system.secChar.lastHit.attackType"]=attackType;
                        if(attackType==="allout"){
                            let aeData={};
                            aeData.id="evasion";
                            aeData.label= "Evasion";
                            if(actor.getFlag("core","evasion")){
                                aeData.icon= "systems/fortyk/icons/evasion2.png";
                            }else{
                                aeData.icon= "systems/fortyk/icons/evasion.png"; 
                            }


                            aeData.flags= { core: { statusId: "evasion" } }
                            aeData.duration={

                                rounds:0
                            };
                            FortykRolls.applyActiveEffect(actor,[aeData]);
                        }

                        if(guarded){
                            let guardActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("holyShield")]);
                            guardActiveEffect.duration={
                                rounds:0
                            }
                            FortykRolls.applyActiveEffect(actor,[guardActiveEffect]);
                        }
                        if(attackType==="called"){

                            update["system.secChar.lastHit.called"]=$(html).find('select[name="calledLoc"] option:selected').val();
                            if(!vehicle&&actor.getFlag("fortyk","fieldvivisection")&&actor.getFlag("fortyk","fieldvivisection").includes(tarRace)&&actor.getFlag("fortyk","fieldpractitioner")){


                                update["system.secChar.lastHit.fieldPractice"]=$(html).find('select[name="fieldPracticeAmt"] option:selected').val();
                            }else{
                                update["system.secChar.lastHit.fieldPractice"]=null;
                            }
                        }else{
                            update["system.secChar.lastHit.fieldPractice"]=null;
                        }
                        await actor.update(update);
                        if(html.find('input[name="guarded"]').is(':checked')){
                            addLabel=html.find('input[name="guarded"]')[0].attributes["label"].value+" "+addLabel;
                        } 
                        if(html.find('input[name="counter"]').is(':checked')){
                            addLabel=  html.find('input[name="counter"]')[0].attributes["label"].value+" "+addLabel
                        }
                        testLabel=addLabel+" "+ testLabel;
                        if(isNaN(running)){running=0}else{ modifierTracker.push({"value":`${running}`,"label":`Running Target Modifier`});}
                        if(isNaN(guarded)){guarded=0}else{ modifierTracker.push({"value":`${guarded}`,"label":`Guarded Action Modifier`});}
                        if(isNaN(counter)){counter=0}else{ modifierTracker.push({"value":`${counter}`,"label":`Counter Attack Modifier`});}
                        if(isNaN(defensive)){defensive=0}else{ modifierTracker.push({"value":`${defensive}`,"label":`Total Defense Modifier`});}
                        if(isNaN(prone)){prone=0}else{ modifierTracker.push({"value":`${prone}`,"label":`Prone Target Modifier`});}
                        if(isNaN(high)){high=0}else{ modifierTracker.push({"value":`${high}`,"label":`Higher Ground Modifier`});}
                        if(isNaN(surprised)){surprised=0}else{ modifierTracker.push({"value":`${surprised}`,"label":`Surprised Target Modifier`});}
                        if(isNaN(stunned)){stunned=0}else{ modifierTracker.push({"value":`${stunned}`,"label":`Stunned Target Modifier`});}
                        if(isNaN(other)){other=0}else{modifierTracker.push({"value":`${other}`,"label":`Other Modifiers`});}

                        modifierTracker.push({"value":`${attackTypeBonus}`,"label":`${attacklabel} Attack Modifier`});
                        modifierTracker.push({"value":`${aimBonus}`,"label":`${aimType} Aim Modifier`});
                        modifierTracker.push({"value":`${visibilityBonus}`,"label":`${visibilityType} Visibility Modifier`});
                        modifierTracker.push({"value":`${terrainBonus}`,"label":`${terrainType} Terrain Modifier`});
                        modifierTracker.push({"value":`${outnumberBonus}`,"label":`${outnumberType} Modifier`});
                        modifierTracker.push({"value":`${size}`,"label":`Size Modifier`});
                        testTarget=miscMods+parseInt(testTarget)+parseInt(running)+parseInt(attackTypeBonus)+parseInt(guarded)+parseInt(counter)+parseInt(aimBonus)+parseInt(outnumberBonus)+parseInt(terrainBonus)+parseInt(visibilityBonus)+parseInt(defensive)+parseInt(prone)+parseInt(high)+parseInt(surprised)+parseInt(stunned)+parseInt(size)+parseInt(other);
                        actor.system.secChar.lastHit.attackRange="melee";
                        actor.system.secChar.lastHit.vehicle=vehicle;
                        actor.system.secChar.lastHit.facing=modifiers.facing;
                        FortykRolls.fortykTest(testChar, testType, testTarget, actor, testLabel, item, false, "", false, modifierTracker);
                    }

                }
            },
            default: "submit",


            width:400}
                  ).render(true);
    }
    static async callRangedAttackDialog(testChar, testType, testTarget, actor, testLabel, item, modifiers){
        console.log(testTarget)
        let template="systems/fortyk/templates/actor/dialogs/ranged-attack-dialog.html"
        let templateOptions={};
        let itemData=item;
        let modifierTracker=[];
        let miscMods=0;
        templateOptions["modifiers"]=duplicate(actor.system.secChar.attacks);
        templateOptions["size"]=game.fortyk.FORTYK.size;

        if(item.system.rof[1].value||item.system.rof[2].value){
            templateOptions["modifiers"].supp=true;
        }else{
            templateOptions["modifiers"].supp=false;
        }

        templateOptions["modifiers"].suppressive=parseInt(item.system.attackMods.suppressive);
        templateOptions["modifiers"].full=parseInt(item.system.attackMods.full);
        templateOptions["modifiers"].semi=parseInt(item.system.attackMods.semi);
        templateOptions["modifiers"].standard=parseInt(item.system.attackMods.single);
        templateOptions["modifiers"].aim=item.system.attackMods.aim;
        templateOptions["modifiers"].testMod=0;
        modifierTracker.push({"value":`${testTarget}`,"label":`Base Target Value`});
        modifierTracker.push({"value":`${item.system.testMod.value}`,"label":"Weapon Bonus"});
        miscMods+=item.system.testMod.value;

        if(item.getFlag("fortyk","twinlinked")){

            miscMods+=20;
            modifierTracker.push({"value":"20","label":"Twin-Linked"});
        }


        if(actor.type!=="vehicle"&&actor.system.formation.value){
            let unitStr=actor.system.secChar.wounds.value;
            templateOptions["modifiers"].standard=Math.min(unitStr*5,60);
        }
        if(actor.type!=="vehicle"&&actor.system.horde.value){
            let hordeSize=actor.system.secChar.wounds.value;

            if((actor.getFlag("fortyk","massAssault")&&item.type==="meleeWeapon")||(actor.getFlag("fortyk","focusedFire")&&item.type==="rangedWeapon")){

                miscMods+=Math.min(30,hordeSize);
                modifierTracker.push({"value":`${Math.min(30,hordeSize)}`,"label":"Horde Trait Bonus"});
            }
        }
        templateOptions["modifiers"].inaccurate=item.getFlag("fortyk","innacurate");


        for (let [key, rng] of Object.entries(templateOptions.modifiers.range)){
            let wepMod=item.system.attackMods.range[key];
            templateOptions.modifiers.range[key]=Math.max(wepMod,rng);
        }
        //set flags for rate of fire
        let curAmmo=parseInt(item.system.clip.value);
        let consump=parseInt(item.system.clip.consumption);

        let rofSingle=item.system.rof[0].value;
        let rofSemi=parseInt(item.system.rof[1].value);

        let rofFull=parseInt(item.system.rof[2].value);
        let canShoot=false;
        console.log(rofSingle);
        if(parseInt(rofSingle)===0||rofSingle==="-"){
            templateOptions["single"]=false;
        }else{
            rofSingle=1;
            if(rofSingle*consump>curAmmo){
                templateOptions["single"]=false;
            }else{
                templateOptions["single"]=true;
                canShoot=true;
            }

        }
        if(rofSemi===0||Number.isNaN(rofSemi)){
            templateOptions["semi"]=false;
        }else{
            if(rofSemi*consump>curAmmo){
                templateOptions["semi"]=false;
            }else{
                templateOptions["semi"]=true;
                canShoot=true;
            }

        }
        if(rofFull===0||Number.isNaN(rofFull)){

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
        if(modifiers.size){
            templateOptions["options"].size=modifiers.size; 
        }else{
            templateOptions["options"].size=actor.system.secChar.size.value;
        }

        templateOptions["options"].running=modifiers.running;
        templateOptions["options"].normal=true;
        //elevation stuff
        if(modifiers.elevation>0){
            templateOptions["options"].high=true;
        }else if(modifiers.elevation<0){
            templateOptions["options"].prone=true;
        }
        //target specific changes
        let targets=game.user.targets;
        let vehicle=false;
        if(targets.size>0){
            if(actor.getFlag("fortyk","gyro")){
                let gyro=parseInt(actor.getFlag("fortyk","gyro"))*10;
                miscMods+=-modifiers.tarEvasion;
                miscMods+=-Math.max(0,modifiers.selfEvasion-gyro);


                if(-Math.max(0,modifiers.selfEvasion-gyro)){
                    modifierTracker.push({"value":`${-Math.max(0,modifiers.selfEvasion-gyro)}`,"label":"Speed Modifier"});
                }
                if(modifiers.tarEvasion){
                    modifierTracker.push({"value":`${-modifiers.tarEvasion}`,"label":"Target Speed Modifier"});
                }
            }else{
                miscMods+=-modifiers.tarEvasion-modifiers.selfEvasion; 
                if(modifiers.selfEvasion){
                    modifierTracker.push({"value":`${-modifiers.selfEvasion}`,"label":"Speed Modifier"});
                }
                if(modifiers.tarEvasion){
                    modifierTracker.push({"value":`${-modifiers.tarEvasion}`,"label":"Target Speed Modifier"});
                }


            }
            let target=targets.values().next().value;
            let tarActor=target.actor;
            let tar=tarActor;
            if(tarActor.type==="vehicle"){
                vehicle=true;
                templateOptions.vehicle=true;
            }
            if(tarActor.getFlag("fortyk","invisible")){
                miscMods+=parseInt(tarActor.getFlag("fortyk","invisible"));
                modifierTracker.push({"value":tarActor.getFlag("fortyk","invisible"),"label":"Invisible"});
            }
            if(!vehicle&&tar.system.horde.value){
                let hordeSize=tar.system.secChar.wounds.value;
                if(hordeSize>=120){
                    miscMods+=60;
                    modifierTracker.push({"value":`60`,"label":"Horde Size Modifier"});
                }else if(hordeSize>=90){
                    miscMods+=50;
                    modifierTracker.push({"value":`50`,"label":"Horde Size Modifier"});
                }else if(hordeSize>=60){
                    miscMods+=40;
                    modifierTracker.push({"value":`40`,"label":"Horde Size Modifier"});
                }else if(hordeSize>=30){
                    miscMods+=30;
                    modifierTracker.push({"value":`30`,"label":"Horde Size Modifier"});
                }
            }
            if(tarActor.getFlag("fortyk","supersonic")){
                if(actor.getFlag("fortyk","skyfire")||item.getFlag("fortyk","skyfire")){
                    templateOptions["options"].prone=false;


                }
                else{miscMods-=60

                     modifierTracker.push({"value":`-60`,"label":"Supersonic Target Modifier"});
                    }
            }else{
                if(item.getFlag("fortyk","skyfire")){
                    templateOptions["options"].prone=false;
                    miscMods-=20;

                    modifierTracker.push({"value":`-20`,"label":"Skyfire Modifier"});
                }
            }
        }
        if(actor.getFlag("fortyk","fieldvivisection")&&targets.size>0){

            let targetIt=targets.values();
            let target=targetIt.next().value;

            let targetActor=target.actor;
            if(!vehicle){
                var tarRace=targetActor.system.race.value.toLowerCase();
                if(actor.getFlag("fortyk","fieldvivisection").includes(tarRace)){
                    templateOptions["modifiers"].called+=actor.system.fieldVivisection;
                    if(actor.getFlag("fortyk","fieldpractitioner")){
                        let praticeArray=[];
                        var practiceMax=Math.ceil(actor.system.characteristics.int.bonus/2);
                        for(let i=1;i<=practiceMax;i++){
                            praticeArray.push(i);
                        }
                        templateOptions.fieldPractice=praticeArray;
                    }
                }
            }

        }
        //distance shenanigans
        let attackRange="normal";
        if(modifiers.distance){
            let distance=modifiers.distance;
            let pointblank=false;
            let short=false;
            let normal=false;
            let long=false;
            let extreme=false;
            let range=item.system.range.value;
            if(distance<=2||distance<=2*canvas.dimensions.distance){
                pointblank=true;
                attackRange="pointBlank";
            }else if(distance<=parseInt(range)/2){
                short=true;
                attackRange="short";
            }else if(distance<=2*range){
                normal=true;
                attackRange="normal";
            }else if(distance<=3*range){
                long=true;
                attackRange="long";
            }else if(distance<=4*range){
                extreme=true;
                attackRange="extreme";
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
        templateOptions["modifiers"].miscMods=miscMods;
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
                        let overwatch = Number($(html).find('input[name="overwatch"]:checked').val());
                        let aimBonus = Number($(html).find('input[name="aim-type"]:checked').val());
                        let aimType = html.find('input[name=aim-type]:checked')[0].attributes["aimtype"].value;
                        const rangeBonus = Number($(html).find('input[name="distance"]:checked').val());
                        let rangeType= html.find('input[name=distance]:checked')[0].attributes["rangetype"].value;
                        if(isNaN(aimBonus)){
                            aimBonus=0;
                        }

                        const visibilityBonus = Number($(html).find('input[name="visibility"]:checked').val());
                        let visibilityType= html.find('input[name=visibility]:checked')[0].attributes["visibilitytype"].value;
                        let concealed = Number($(html).find('input[name="concealed"]:checked').val());
                        let prone = Number($(html).find('input[name="prone"]:checked').val());
                        let high = Number($(html).find('input[name="high"]:checked').val());
                        let surprised = Number($(html).find('input[name="surprised"]:checked').val());
                        let running= Number($(html).find('input[name="running"]:checked').val());
                        let stunned = Number($(html).find('input[name="stunned"]:checked').val());
                        let size = Number($(html).find('select[name="size"]').val());
                        //adjust size penalty
                        size=(size-actor.system.secChar.size.value)*10;
                        if(actor.getFlag("fortyk","preysense")){

                            if(size<0){
                                let preysense=parseInt(actor.getFlag("fortyk","preysense"))*10;
                                size=Math.min(0,size+preysense);
                            }
                        }
                        if(item.getFlag("fortyk","scatter")){
                            if(size<0){
                                size=0;
                            }
                        }
                        if(guarded){
                            let guardActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("holyShield")]);
                            guardActiveEffect.duration={
                                rounds:0
                            }
                            FortykRolls.applyActiveEffect(actor,[guardActiveEffect]);
                        }
                        let other = Number($(html).find('input[name="other"]').val());
                        let melee = Number($(html).find('input[name="melee"]:checked').val());
                        //get attack type name for title

                        let addLabel=html.find('input[name=attack-type]:checked')[0].attributes["label"].value;
                        if(html.find('input[name="guarded"]').is(':checked')){
                            addLabel=html.find('input[name="guarded"]')[0].attributes["label"].value+" "+addLabel;
                        }
                        if(html.find('input[name="overwatch"]').is(':checked')){
                            addLabel=  html.find('input[name="overwatch"]')[0].attributes["label"].value+" "+addLabel
                        }
                        testLabel=addLabel+" "+ testLabel;

                        let attackType=html.find('input[name=attack-type]:checked')[0].attributes["attacktype"].value;
                        let attacklabel=html.find('input[name=attack-type]:checked')[0].attributes["label"].value;
                        let update={};
                        update["system.secChar.lastHit.attackType"]=attackType;
                        if(attackType==="called"){

                            update["system.secChar.lastHit.called"]=$(html).find('select[name="calledLoc"] option:selected').val();

                            if(!vehicle&&actor.getFlag("fortyk","fieldvivisection")&&actor.getFlag("fortyk","fieldvivisection").includes(tarRace)&&actor.getFlag("fortyk","fieldpractitioner")){


                                update["system.secChar.lastHit.fieldPractice"]=$(html).find('select[name="fieldPracticeAmt"] option:selected').val();
                            }else{
                                update["system.secChar.lastHit.fieldPractice"]=null;
                            }
                        }else{
                            update["system.secChar.lastHit.fieldPractice"]=null;
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


                        await item.update({"system.clip.value":curAmmo-rof});

                        //convert unchosen checkboxes into 0s
                        if(isNaN(running)){running=0}else{ modifierTracker.push({"value":`${running}`,"label":`Running Target Modifier`});}
                        if(isNaN(guarded)){guarded=0}else{ modifierTracker.push({"value":`${guarded}`,"label":`Guarded Action Modifier`});}
                        if(isNaN(overwatch)){overwatch=0}else{ modifierTracker.push({"value":`${overwatch}`,"label":`Overwatch Action Modifier`});}
                        if(isNaN(prone)){prone=0}else{ modifierTracker.push({"value":`${prone}`,"label":`Prone Target Modifier`});}
                        if(isNaN(high)){high=0}else{ modifierTracker.push({"value":`${high}`,"label":`Higher Ground Modifier`});}
                        if(isNaN(surprised)){surprised=0}else{ modifierTracker.push({"value":`${surprised}`,"label":`Surprised Target Modifier`});}
                        if(isNaN(stunned)){stunned=0}else{ modifierTracker.push({"value":`${stunned}`,"label":`Stunned Target Modifier`});}
                        if(isNaN(concealed)){concealed=0}else{ modifierTracker.push({"value":`${concealed}`,"label":`Concealed Target Modifier`});}
                        if(isNaN(other)){other=0}else{modifierTracker.push({"value":`${other}`,"label":`Other Modifiers`});}
                        if(isNaN(melee)){melee=0}else{ modifierTracker.push({"value":`${melee}`,"label":`Melee Modifier`});} 
                        modifierTracker.push({"value":`${attackTypeBonus}`,"label":`${attacklabel} Attack Modifier`});
                        modifierTracker.push({"value":`${aimBonus}`,"label":`${aimType} Aim Modifier`});
                        modifierTracker.push({"value":`${visibilityBonus}`,"label":`${visibilityType} Visibility Modifier`});
                        modifierTracker.push({"value":`${rangeBonus}`,"label":`${rangeType} Range Modifier`});
                        modifierTracker.push({"value":`${size}`,"label":`Size Modifier`});

                        testTarget=miscMods+parseInt(testTarget)+parseInt(running)+parseInt(attackTypeBonus)+parseInt(guarded)+parseInt(overwatch)+parseInt(aimBonus)+parseInt(visibilityBonus)+parseInt(prone)+parseInt(high)+parseInt(surprised)+parseInt(stunned)+parseInt(size)+parseInt(other)+parseInt(concealed)+parseInt(rangeBonus)+parseInt(melee);
                        actor.system.secChar.lastHit.attackRange=attackRange;
                        actor.system.secChar.lastHit.vehicle=vehicle;
                        actor.system.secChar.lastHit.facing=modifiers.facing;
                        await FortykRolls.fortykTest(testChar, testType, testTarget, actor, testLabel, item, false, attackType, false, modifierTracker);
                        if(aimBonus>0){
                            await actor.update({"system.secChar.lastHit.aim":true});
                            actor.system.secChar.lastHit.aim=true;

                        }else{
                            await actor.update({"system.secChar.lastHit.aim":false});
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

        let renderedTemplate= await renderTemplate(template,templateOptions);

        new Dialog({
            title: `${item.name} Focus Power Test.`,
            classes:"fortky",
            content: renderedTemplate,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (html) => {




                        let other = Number($(html).find('input[name="other"]').val());


                        testTarget=parseInt(testTarget)+parseInt(other);

                        FortykRolls.fortykTest(testChar, testType, testTarget, actor, testLabel, item, false);
                    }

                }
            },
            default: "submit",


            width:200}
                  ).render(true);
    }
    static async callSprayAttackDialog(actor, testLabel, weapon, options, title="Enter test modifier"){
        console.log("hey")
        new Dialog({
            title: title,
            content: `<p><label>Modifier:</label> <input id="modifier" type="text" name="modifier" value="0" autofocus/></p>`,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: async(html) => {
                        let targets=game.user.targets;
                        let mod = Number($(html).find('input[name="modifier"]').val());
                        let psy=false;
                        console.log(weapon)
                        if(weapon.type==="psychicPower"){
                            psy=true;
                        }

                        if(!psy){
                            var ammo=weapon.system.clip.value;
                            if(ammo===0){
                                return;
                            } 
                        }

                        if(targets.size===0){
                            this.callSprayAttackDialog(actor, testLabel, weapon, options, "No targets");
                            return;
                        }

                        if(isNaN(mod)){
                            this.callSprayAttackDialog(actor, testLabel, weapon, options, "Invalid Number");
                            return;
                        }


                        let messageContent="";
                        let updatedtargets=[];
                        let rolls=[];
                        let i=1;
                        for(let token of targets){
                            let tokenActor=token.actor;
                            let tokenActorData=token.actor;
                            let data=token.actor.system;

                            let testTarget=0;
                            if(tokenActor.type==="vehicle"){
                                testTarget=data.crew.ratingTotal+mod
                            }else{
                                testTarget=data.characteristics.agi.total+mod; 
                            }
                            let test=await game.fortyk.FortykRolls.fortykTest("agi", "Test", testTarget, tokenActor, "Avoid Spray Attack",weapon,false,"",true);
                            messageContent+=`<div>${tokenActor.name}'s `+test.template+`</div>`;
                            if(!test.value){
                                updatedtargets.push(token.id);
                            }

                            let r=test.roll;
                            r.dice[0].options.rollOrder = i;
                            rolls.push(test.roll);
                            i++;

                        }
                        messageContent+=`<div>Selected targets may attempt to evade if they have a reaction remaining and can move out of the attack's area of effect.</div>`
                        game.user.updateTokenTargets(updatedtargets);
                        game.user.broadcastActivity({targets:updatedtargets});
                        let chatOptions={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                                         rolls: rolls,
                                         content:messageContent,
                                         classes:["fortyk"],
                                         sound:"sounds/dice.wav",
                                         flavor:`Spray Attack result`,
                                         author:actor.name}
                        await ChatMessage.create(chatOptions,{});
                        if(!psy){
                            await weapon.update({"system.clip.value":ammo-1});
                        }





                    }

                }
            },
            default: "submit",


            width:100}
                  ).render(true);
    }
    static async callForcefieldDialog(forcefield,actor,title="Enter number of hits"){
        new Dialog({
            title: title,
            content: `<p><label>Number of Hits:</label> <input id="modifier" type="text" name="modifier" value="1" autofocus/></p>`,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (html) => {
                        const hits = Number($(html).find('input[name="modifier"]').val());
                        if(isNaN(hits)){
                            this.callForcefieldDialog(forcefield,actor,"Invalid Number");
                        }else{

                            FortykRolls.fortykForcefieldTest(forcefield,actor,hits);
                        }

                    }

                }
            },
            default: "submit",


            width:100}
                  ).render(true);
    }
    //activate chatlisteners
    static chatListeners(html){
        html.on("mouseup",".reroll", this._onReroll.bind(this));
        html.on("click",".overheat", this._onOverheat.bind(this));
        html.on("click",".popup", this._onTestPoppup.bind(this));
    }

}
