/* provides functions for doing tests or damage rolls
*/
import {FORTYKTABLES} from "./FortykTables.js";
import {getActorToken} from "./utilities.js";
import {tokenDistance} from "./utilities.js";
import {getVehicleFacing} from "./utilities.js";
import {sleep} from "./utilities.js";
import {parseHtmlForInline} from "./utilities.js";
import {FortykRollDialogs} from "./FortykRollDialogs.js"
export class FortykRolls{
    /*The base test function, will roll against the target and return the success and degree of failure/success, the whole roll message is handled by the calling function.
@char: a characteristic object that contains any unattural characteristic the object may have
@type: the type of test, skills, psy powers, and ranged attacks can have some extra effects
@target: the target number for the test
@actor: the calling actor
@label: what to name the test
@Weapon: the weapon is needed for attack rolls, this is where psy powers are put also
@reroll: if the roll is a reroll or not
returns the roll message*/
    static async fortykTest(char, type, target, actor, label, fortykWeapon=null, reroll=false, fireRate="",delayMsg=false, modifiers=null){

        //cap target at 100 or floor at 1
        if(target>100){
            target=100;
        }else if(target<1){
            target=1;
        }
        let roll=new Roll("1d100ms<@tar",{tar:target});
        await roll.roll();
        let weapon
        if(fortykWeapon){
            weapon=fortykWeapon.data
        }
        let weaponid=""
        if(fortykWeapon===null){
        }else{
            weaponid=weapon._id;
        }
        let template='systems/fortyk/templates/chat/chat-test.html';
        var templateOptions={
            title:"",
            rollResult:"",
            target:"",
            pass:"",
            dos:"",
            success:false,
            reroll:reroll,
            weapon:weaponid,
            fireRate:fireRate,
            modifiers:modifiers,
            id:randomID(5)
        }
        if(!reroll){
            templateOptions["actor"]=actor.id;
            templateOptions["char"]=char;
            templateOptions["type"]=type;
            templateOptions["targetNumber"]=target;
            templateOptions["label"]=label;
        }
        //prepare chat output
        if(delayMsg){
            templateOptions["title"]=label.charAt(0).toUpperCase()+label.slice(1)+" test.";
        }else if(reroll){
            templateOptions["title"]="Rerolling "+label+" test.";
        }else{
            templateOptions["title"]="Rolling "+label+" test.";
        }
        const testRoll=target-roll._total;
        //check for jams
        let jam=false;
        if(type==="rangedAttack"){
            if(weapon.data.quality.value==="Best"){
            }else if(fortykWeapon.getFlag("fortyk","reliable")){
                if(testRoll===100){
                    jam=true; 
                }
            }else if(fortykWeapon.getFlag("fortyk","unreliable")||weapon.data.quality.value==="Poor"){
                if(testRoll>=91){
                    jam=true; 
                }
                if(weapon.data.quality.value==="Poor"){
                    if(testRoll>target){
                        jam=true;
                    }
                }
            }else if(fortykWeapon.getFlag("fortyk","overheats")){
                if(testRoll>=91){
                    jam=true; 
                }
            }else if(testRoll>=96){
                jam=true;
            }else if((fireRate==="full"||fireRate==="semi")&&testRoll>=94){
                jam=true;
            }
        }
        templateOptions["rollResult"]="Roll: "+testRoll.toString();
        templateOptions["target"]="Target: "+target.toString();
        const testResult=roll._total>=0;
        try{
            var charObj=actor.system.characteristics[char];
        }catch(err){
            var charObj=undefined;
        }
        if(charObj===undefined){charObj={"uB":0}}
        var testDos=0;
        //check for vehicle target and if attacker is vehicle
        if(actor.type!=="spaceship"){
            var vehicle=actor.system.secChar.lastHit.vehicle;
            var isVehicle=false;
            if(actor.type==="vehicle"){
                isVehicle=true;
            }
        }
        if(isVehicle&&fortykWeapon){
            if(fortykWeapon.getFlag("fortyk","taxing")){
                let newHeat=parseInt(actor.system.knight.heat.value)+parseInt(fortykWeapon.getFlag("fortyk","taxing"));
                actor.update({"data.knight.heat.value":newHeat});
            }
        }
        //calculate degrees of failure and success
        if((testResult&&testRoll<96||testRoll===1)&&!jam){
            testDos=Math.floor(Math.abs(roll._total)/10)+1+Math.ceil(charObj.uB/2);
            //close quarter combat dos bonus
            if((type==="rangedAttack"||type==="meleeAttack")&&actor.getFlag("fortyk","closequarterdiscipline")){
                let attackRange=actor.system.secChar.lastHit.attackRange;
                if(attackRange==="melee"||attackRange==="pointBlank"||attackRange==="short"){
                    testDos+=1;
                } 
            }
            //weapon instinct bonus DoS
            if((type==="rangedAttack"||type==="meleeAttack")&&actor.getFlag("fortyk","weaponinstinct")&&fortykWeapon&&weapon.data.type.value==="Exotic"){
                testDos+=1;
            }
            //void strike extra dos
            if((type==="rangedAttack"||type==="meleeAttack")&&fortykWeapon&&fortykWeapon.getFlag("fortyk","voidstrike")){
                testDos+=1;
            }
            templateOptions["dos"]="with "+testDos.toString()+" degree";
            if(testDos===1){}else{templateOptions["dos"]+="s";}
            templateOptions["dos"]+=" of success!";
            templateOptions["pass"]="Success!";
            templateOptions["success"]=true;
        }else{
            testDos=Math.floor(Math.abs(roll._total)/10)+1;
            templateOptions["dos"]="with "+testDos.toString()+" degree";
            if(testDos===1){}else{templateOptions["dos"]+="s";}
            templateOptions["dos"]+=" of failure!";
            templateOptions["success"]=false;
            if(jam){
                if(fortykWeapon.getFlag("fortyk","overheats")){
                    templateOptions["pass"]="Weapon overheated!"
                }else{
                    templateOptions["pass"]="Weapon jammed!";
                }
            }else if(testRoll>=96){
                templateOptions["pass"]="96+ is an automatic failure!";
            }
            else{
                templateOptions["pass"]="Failure!"; 
            }
        }
        //adamantium faith logic
        if(type==="fear"&&!templateOptions["success"]&&actor.getFlag("fortyk","adfaith")){
            let wpb=actor.system.characteristics.wp.bonus;
            let newDos=testDos-wpb;
            testDos=newDos;
            if(newDos<=0){
                templateOptions["dos"]="with 1 degree";
                templateOptions["dos"]+=" of success!";
                templateOptions["pass"]="Adamantium Faith Pass!";
                templateOptions["success"]=true;
            }else{
                templateOptions["dos"]="with "+newDos+" degree";
                if(newDos===1){}else{templateOptions["dos"]+="s";}
                templateOptions["dos"]+=" of failure!";
                templateOptions["success"]=false;
                if(testRoll>=96){
                    templateOptions["pass"]="96+ is an automatic failure!";
                }
                else{
                    templateOptions["pass"]="Adamantium Faith Failure!"; 
                }
            }
        }
        let attack=false;
        if((type==="rangedAttack"||type==="meleeAttack"||type==="focuspower"&&(fortykWeapon.system.class.value==="Psychic Bolt"||fortykWeapon.system.class.value==="Psychic Barrage"||fortykWeapon.system.class.value==="Psychic Storm"||fortykWeapon.system.class.value==="Psychic Blast"))){
            attack=true;
        }
        //determine number of hits
        let hits=0;
        if(attack&&templateOptions["success"]){
            hits=1;
            let attackType=actor.system.secChar.lastHit.attackType;
            let attackTarget=game.user.targets.first();
            if(type==="meleeAttack"){
                let wsBonus
                if(isVehicle){
                    wsBonus=Math.floor(parseInt(actor.system.crew.ws)/10)
                }else{
                    wsBonus=actor.system.characteristics.ws.bonus;
                }
                if(attackType==="swift"){
                    hits+=Math.min(wsBonus-1,Math.floor((testDos-1)/2))
                }else if(attackType==="lightning"){
                    hits=Math.min(testDos,wsBonus);
                }

                if(attackTarget!==undefined&&attackTarget.actor.type!=="vehicle"){
                    let horde=attackTarget.actor.system.horde.value;
                    if(horde){
                        hits+=Math.floor(testDos/2)
                        if(fortykWeapon.getFlag("fortyk","sweeping")){
                            hits+=testDos*3;
                        }
                    }
                }
            }else if(type==="rangedAttack"){
                let rof=1;
                if(attackType==="semi"){
                    rof=parseInt(weapon.data.rof[1].value)-1;
                    hits+=Math.min(rof,Math.floor((testDos-1)/2));
                }else if(attackType==="full"){
                    rof=parseInt(weapon.data.rof[2].value);
                    hits=Math.min(rof,(testDos));
                }
                if(fortykWeapon.getFlag("fortyk","twinlinked")&&testDos>=3){
                    hits++
                }
                if(fortykWeapon.getFlag("fortyk","storm")){
                    hits=hits*2;
                }
                //scatter weapon logic
                if(fortykWeapon.getFlag("fortyk","scatter")){
                    if(attackTarget!==undefined){
                        let attackerToken=getActorToken(actor);
                        let distance=tokenDistance(attackerToken,attackTarget);
                        if(distance<=2||distance<=2*canvas.dimensions.distance){
                            hits+=testDos;
                        }else if(distance<=parseInt(weapon.data.range.value)/2){
                            hits+=Math.floor(testDos/2);
                        }
                    }
                }
            }else if(type==="focuspower"){
                let pr=weapon.data.curPR.value;
                if(fortykWeapon.system.class.value==="Psychic Barrage"){
                    hits+=Math.min(pr-1,Math.floor((testDos-1)/2))
                }else if(fortykWeapon.system.class.value==="Psychic Storm"){
                    hits=Math.min(pr,testDos);
                }
            }

            templateOptions["numberHits"]=`The attack scores ${hits} hit`
            if(hits>1){
                templateOptions["numberHits"]+="s."
            }else{
                templateOptions["numberHits"]+="."
            }

            if(actor.getFlag("fortyk","inescapableattack")&&(attackType!=="semi"&&attackType!=="full"&&attackType!=="swift"&&attackType!=="lightning")&&((actor.getFlag("fortyk","inescapableattack").toLowerCase().indexOf("ranged")!==-1&&type==="rangedAttack")||(actor.getFlag("fortyk","inescapableattack").toLowerCase().indexOf("melee")!==-1&&type==="meleeAttack"))){
                let inescPenalty=Math.max(-60,testDos*(-10));
                templateOptions["inescapableAttack"]=`Inescapable attack evasion penalty: ${inescPenalty}`; 
            }
        }
        let attackTarget=game.user.targets.first();
        if(attack&&attackTarget&&templateOptions["success"]){
            let tarActor=attackTarget.actor;
            let tarSize=tarActor.system.secChar.size.value;
            let attackerSize=actor.system.secChar.size.value;
            if(attackerSize>tarSize){
                let penalty=(tarSize-attackerSize)*10;
                templateOptions["sizePenalty"]=`Evasion penalty due to size difference: ${penalty}`
            }
        }

        //give the chat object options and stuff
        let result={}
        let renderedTemplate= await renderTemplate(template,templateOptions);
        if(delayMsg){
            let id=randomID(5);
            let popupTemplate='systems/fortyk/templates/chat/chat-test-popup.html'
            templateOptions.id=id;
            let renderedPopupTemplate=await renderTemplate(popupTemplate,templateOptions);
            result.template=renderedPopupTemplate;        
        }else{
            await roll.toMessage({user: game.user._id,
                                  speaker:{actor,alias:actor.name},
                                  content:renderedTemplate,
                                  classes:["fortyk"],
                                  author:actor.name})
        }
        //get first and second digits for hit locations and perils
        let firstDigit=Math.floor(testRoll/10);
        let secondDigit=testRoll-firstDigit*10;
        //determine hitlocation if the attack is a success
        if(attack&&templateOptions["success"]){
            //reverse roll to get hit location
            let inverted=parseInt(secondDigit*10+firstDigit);
            let hitlocation=FORTYKTABLES.hitLocations[inverted];
            let vehicleHitlocation
            let attackTarget=game.user.targets.first();
            //vehicles without turrets get hit in the hull instead
            if(attackTarget!==undefined&&attackTarget.actor.type==="vehicle"){
                if(!attackTarget.actor.system.hasTurret.value){
                    if(inverted>=81){
                        vehicleHitlocation= FORTYKTABLES.vehicleHitLocations[59];
                    }else{
                        vehicleHitlocation= FORTYKTABLES.vehicleHitLocations[inverted];
                    }
                }else{
                    vehicleHitlocation= FORTYKTABLES.vehicleHitLocations[inverted];
                } 
            }
            if(actor.system.secChar.lastHit.attackType==="called"){
                hitlocation=FORTYKTABLES.hitLocations[actor.system.secChar.lastHit.called];
                vehicleHitlocation=FORTYKTABLES.vehicleHitLocations[actor.system.secChar.lastHit.called];
            }
            await actor.update({"data.secChar.lastHit.value":hitlocation.value,"data.secChar.lastHit.label":hitlocation.label,"data.secChar.lastHit.dos":testDos,"data.secChar.lastHit.hits":hits,"data.secChar.lastHit.vehicleHitLocation":vehicleHitlocation});
            let content="";
            if(vehicle){
                content=`Location: ${vehicleHitlocation.label}`
            }else{
                content=`Location: ${hitlocation.label}`;
            }
            let chatOp={user: game.user._id,
                        speaker:{actor,alias:actor.name},
                        content:content,
                        classes:["fortyk"],
                        flavor:"Hit location",
                        author:actor.name}
            await ChatMessage.create(chatOp,{});
        }
        //blast
        if(attack&&(weapon.data.type==="Launcher"||weapon.data.type==="Grenade")&&fortykWeapon.getFlag("fortyk","blast")&&!testResult&&jam){
            let fumbleRoll=new Roll("1d10");
            await fumbleRoll.roll();
            await fumbleRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: "Rolling for fumble."
            });
            let content="";
            let fumbleResult=fumbleRoll._total;
            if(fumbleResult===10){
                content="The explosive detonates immediately on you! Launchers are destroyed by this result."
            }else{
                content="The explosive is a dud."
            }
            let chatFumble={user: game.user._id,
                            speaker:{actor,alias:actor.name},
                            content:content,
                            flavor:"Fumble or Dud!",
                            author:actor.name}
            await ChatMessage.create(chatFumble,{});
        }else if(attack&&fortykWeapon.getFlag("fortyk","blast")&&!testResult){
            let chatScatter={user: game.user._id,
                             speaker:{actor,alias:actor.name},
                             content:`The shot goes wild! <img class="fortyk" src="../systems/fortyk/icons/scatter.png">`,
                             flavor:"Shot Scatters!",
                             author:actor.name}
            await ChatMessage.create(chatScatter,{});
            let scatterDice="1d5";
            if(attackTarget!==undefined){
                let attackerToken=getActorToken(actor);
                let distance=tokenDistance(attackerToken,attackTarget);
                let weaponRng=parseInt(weapon.data.range.value);
                if(distance<=weaponRng/2){
                }else if(distance<=weaponRng*2){
                    scatterDice="1d10";
                }else if(distance<=weaponRng*3){
                    scatterDice="2d10";
                }else if(distance<=weaponRng*4){
                    scatterDice="3d10";
                }
            }
            let distanceRoll=new Roll("1d5");
            await distanceRoll.roll();
            await distanceRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: "Rolling for scatter distance."
            });
            let directionRoll=new Roll("1d10");
            await directionRoll.roll();
            await directionRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: "Rolling for scatter direction."
            });
        }
        //overheats
        if(attack&&fortykWeapon.getFlag("fortyk","overheats")&&jam){
            let chatOverheat={user: game.user._id,
                              speaker:{actor,alias:actor.name},
                              content:`<div class="fortyk"><p>The weapon overheats!</p> <a class="button overheat" data-actor="${actor.id}"  data-weapon="${weaponid}">Take Damage</a></div>`,
                              flavor:"Weapon Overheat!",
                              author:actor.name}
            await ChatMessage.create(chatOverheat,{});
        }
        //if attack has target, check if target has forcefield and do forcefield tests if so
        /*
        if(attack&&game.user.targets.size!==0){
            console.log("hey")
            if(game.user.isGM){
                for(let tar of game.user.targets){
                    let tarActor=tar.actor;
                    let forcefield=tarActor.system.secChar.wornGear.forceField.document;
                    if(forcefield){
                        this.fortykForcefieldTest(forcefield,tarActor,hits);
                    }
                }
            }else{
                //if user isnt GM use socket to have gm roll the forcefield tests
                let socketOp={type:"forcefieldRoll",package:{targets:game.user.targets.ids,hits:hits}}
                await game.socket.emit("system.fortyk",socketOp);
            }
        }*/
        //logic for psychic phenomena and perils of the warp
        if(type==="focuspower"){
            let psykerType=actor.system.psykana.psykerType.value;
            let basePR=actor.system.psykana.pr.effective;
            let powerPR=weapon.data.curPR.value;
            let push=false;
            let phenom=false;
            let perils=false;
            if(psykerType!=="navigator"){
                if(powerPR>basePR){push=true}
                if(!push&&(firstDigit===secondDigit||testRoll===100)){
                    phenom=true;
                }else if(push&&(psykerType==="bound")&&(firstDigit!==secondDigit)){
                    phenom=true;
                }else if(push&&(psykerType!=="bound")){
                    phenom=true;
                }
                if(phenom){
                    let mod=parseInt(actor.system.psykana.phenomena.value);
                    let sustain=parseInt(actor.system.psykana.pr.sustain);
                    if(sustain>1){
                        mod=(sustain-1)*10;
                    }
                    if(psykerType!=="bound"&&push){
                        let pushAmt=powerPR-basePR;
                        if(psykerType==="unbound"){
                            mod=mod+pushAmt*5;
                        }
                        if(psykerType==="daemon"){
                            mod=mod+pushAmt*10;
                        }
                    }
                    let psyRoll=new Roll("1d100+@mod",{mod:mod})
                    let psyFlavor="Psychic Phenomena!";
                    if(actor.system.race.value==="Ork"){
                        psyFlavor="Perils of the Waaagh!";
                    }
                    await psyRoll.roll();
                    await psyRoll.toMessage({
                        speaker: ChatMessage.getSpeaker({ actor: actor }),
                        flavor: psyFlavor
                    });
                    let phenomResult=parseInt(psyRoll._total);
                    if(phenomResult>100){phenomResult=100}
                    if(phenomResult<1){phenomResult=1}
                    if(phenomResult>75){perils=true}
                    let phenomMessage="";
                    let flavor="";
                    var ork=false;
                    if(actor.system.race.value==="Ork"){
                        phenomMessage=FORTYKTABLES.weirdFings[phenomResult];
                        flavor="Weird Fing!"
                        ork=true;
                    }else{
                        phenomMessage=FORTYKTABLES.psychicPhenomena[phenomResult]; 
                        flavor="Psychic Phenomenom!"
                    }
                    let chatPhenom={user: game.user._id,
                                    speaker:{actor,alias:actor.name},
                                    content:phenomMessage,
                                    classes:["fortyk"],
                                    flavor:flavor,
                                    author:actor.name}
                    await ChatMessage.create(chatPhenom,{});
                }
                if(perils){
                    if(game.user.isGM){
                        this.perilsOfTheWarp(ork);
                    }else{
                        //if user isnt GM use socket to have gm roll the perils result
                        let socketOp={type:"perilsRoll",package:{ork:ork}}
                        await game.socket.emit("system.fortyk",socketOp);
                    }
                }  
            }
        } 
        else if(type==="fear"&&!templateOptions["success"]){
            //generating insanity when degrees of failure are high enough
            if(testDos>=3){
                let insanityRoll=new Roll("1d5");
                await insanityRoll.roll();
                await insanityRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling insanity for 3+ Degrees of failure (Add to sheet)"
                });
            }
            if(game.combats.active){
                let fearRoll=new Roll("1d100 +@mod",{mod:testDos*10});
                await fearRoll.roll();
                await fearRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Shock Roll!"
                });
                let shockMes="";
                let fearCap=0;
                if(actor.getFlag("fortyk","atsknf")){
                    fearCap=Math.min(80,parseInt(fearRoll._total)-1);
                    shockMes=FORTYKTABLES.atsknf[fearCap];
                }else{
                    fearCap=Math.min(170,parseInt(fearRoll._total)-1);
                    shockMes=FORTYKTABLES.fear[fearCap];
                }
                let chatShock={user: game.user._id,
                               speaker:{actor,alias:actor.name},
                               content:shockMes,
                               classes:["fortyk"],
                               flavor:"Shock effect",
                               author:actor.name}
                await ChatMessage.create(chatShock,{}); 
            }else{
                let chatShock={user: game.user._id,
                               speaker:{actor,alias:actor.name},
                               content:"Fear imposes a -10 penalty until the end of the scene!",
                               classes:["fortyk"],
                               flavor:"Shock effect",
                               author:actor.name}
                await ChatMessage.create(chatShock,{}); 
                let shockEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("shock")]);
                let ae=[];
                ae.push(shockEffect);
                let token=await Token.fromActor(actor);
                await this.applyActiveEffect(token,ae);
            }
        }
        result.dos=testDos;
        result.value=templateOptions["success"];
        if(hits){
            result.hits=hits; 
        }
        return result;
    }
    //rolls a result on the perils of the warp table, checks if the roll should be private or not
    static async perilsOfTheWarp(ork=false){
        let rollMode="";
        if(game.settings.get("fortyk","privatePerils")){
            rollMode="gmroll";
        }else{
            rollMode="default";
        }
        let perilsRoll=new Roll("1d100",{});
        let perilsFlavor="Perils of the Warp!!";
        if(ork){
            perilsFlavor="'Eadbang!";
        }
        await perilsRoll.roll();
        await perilsRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ user: game.users.current }),
            flavor: perilsFlavor
        },{rollMode:rollMode});
        let perilsResult=parseInt(perilsRoll._total);
        if(perilsResult>100){perilsResult=100}
        let perilsMessage=FORTYKTABLES.perils[perilsResult];
        if(ork){perilsMessage=FORTYKTABLES.eadBang[perilsResult]}
        let chatPhenom={user: game.users.current,
                        speaker:{user: game.users.current},
                        content:perilsMessage,
                        classes:["fortyk"],
                        flavor:perilsFlavor,
                        author:game.users.current
                       }
        if(game.settings.get("fortyk","privatePerils")){
            chatPhenom["whisper"]=ChatMessage.getWhisperRecipients("GM");
        }else{
            chatPhenom["whisper"]=undefined;
        }
        await ChatMessage.create(chatPhenom,{});
    }
    //handles forcefield tests
    static async fortykForcefieldTest(forcefield,actor,hits){
        if(forcefield.system.broken.value){
            return
        }
        let data=forcefield.system;
        let rating=data.rating.value;
        let overload=data.rating.overload;
        let breakOnOverload=data.overloadBreak.value;
        let formula=`${hits}d100cs<=${rating}`;
        let roll=new Roll(formula, {});
        await roll.evaluate();
        let overloaded=false;
        let remainingHits=hits;
        let die=roll.dice[0].results;
        let template='systems/fortyk/templates/chat/chat-forcefield-test.html';
        var templateOptions={
            title:`${forcefield.name} Test`,
            hits:hits,
            rating:rating,
            overload:overload,
            breakOnOverload:breakOnOverload
        }
        let hitResults=[];
        let i=0;
        while(!(breakOnOverload&&overloaded)&&i<hits){
            let dice=die[i];
            let roll1=dice.result;
            let pass=dice.success;
            overloaded=false;
            let result={overload:false,roll:roll1,pass:pass,string:""}
            if(roll1<=overload){
                overloaded=true;
                result.overload=overloaded;
            }
            let string="";
            if(overloaded){
                string=`Hit ${i+1} overloads with a roll of ${roll1}!`;
                remainingHits--;
            }else if(pass){
                string=`Hit ${i+1} is deflected with a roll of ${roll1}!`;
                remainingHits--;
            }else{
                string=`Hit ${i+1} goes through with a roll of ${roll1}!`;
            }
            result.string=string;
            hitResults.push(result);
            i++;
        }
        if(breakOnOverload&&overloaded){
            await forcefield.update({"data.broken.value":true});
            templateOptions.breaks=`${forcefield.name} breaks!`
        }
        templateOptions.results=hitResults;
        templateOptions.remainingHits=remainingHits;
        let renderedTemplate= await renderTemplate(template,templateOptions);
        await roll.toMessage({user: game.user._id,
                              speaker:{actor,alias:actor.name},
                              content:renderedTemplate,
                              classes:["fortyk"],
                              author:actor.name})
    }
    //handles damage rolls and applies damage to the target, generates critical effects
    static async damageRoll(formula,actor,fortykWeapon,hits=1, self=false, overheat=false,magdamage=0,extraPen=0, user=game.users.current, lastHit=null, targets=null){
        let weapon=deepClone(fortykWeapon.data);
        let righteous=10;
        if(fortykWeapon.getFlag("fortyk","vengeful")){
            righteous=fortykWeapon.getFlag("fortyk","vengeful");
        }
        let ignoreSON=(fortykWeapon.type==="psychicPower"||fortykWeapon.getFlag("fortyk","force")||fortykWeapon.getFlag("fortyk","sanctified")||fortykWeapon.getFlag("fortyk","daemonbane")||fortykWeapon.getFlag("fortyk","warp"));
        if(!lastHit){
            lastHit=actor.system.secChar.lastHit;
        }
        let attackerToken=actor.getActiveTokens()[0];
        let curHit={}
        var hammer=false;
        if(actor.getFlag("fortyk","hammerblow")&&lastHit.attackType==="allout"){
            if(isNaN(parseInt(fortykWeapon.getFlag("fortyk","concussive")))){
                hammer=true;
                await fortykWeapon.setFlag("fortyk","concussive",2);
            }else{
                await fortykWeapon.setFlag("fortyk","concussive",fortykWeapon.getFlag("fortyk","concussive")+2);
            }
            weapon.data.pen.value=parseInt(weapon.data.pen.value)+Math.ceil(actor.system.characteristics.s.bonus/2);
        }
        if(targets===null){
            targets=user.targets;
        }
        if(self){
            if(overheat){
                if(actor.type==="vehicle"){
                    curHit=game.fortyk.FORTYK.vehicleHitLocations.weapon;
                }else{
                    let arm=["rArm","lArm"];
                    let rng=Math.floor(Math.random() * 2);
                    curHit=game.fortyk.FORTYK.extraHits[arm[rng]][0];  
                }
            }else{
                curHit=game.fortyk.FORTYK.extraHits["body"][0];
            }
            targets.clear();
            targets.add(attackerToken);
        }else{
            curHit=lastHit;
        }
        let form=formula.value.toLowerCase();
        //peerless killer
        if(actor.getFlag("fortyk","peerlesskiller")&&lastHit.attackType==="called"){
            form+="+2";
        }

        //change formula for d5 weapons
        form=form.replace("d5","d10/2");
        //change formula for tearing weapons 
        if(fortykWeapon.getFlag("fortyk","tearing")){
            let dPos = form.indexOf('d');
            let dieNum = form.substr(0,dPos);
            let newNum=parseInt(dieNum)+1;
            if(actor.getFlag("fortyk","chainweaponexpertise")&&weapon.data.type.value==="Chain"){
                newNum++;
            }
            form=form.slice(dPos);
            form=newNum+form;
            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);
            if(actor.getFlag("fortyk","chainweaponexpertise")&&weapon.data.type.value==="Chain"){
                form=startstr+"dl2"+endstr;
            }else{
                form=startstr+"dl1"+endstr; 
            }
        }
        //change formula for master crafted weapons 
        if(fortykWeapon.getFlag("fortyk","mastercrafted")){
            let dPos = form.indexOf('d10');



            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);

            form=startstr+"r1"+endstr; 

        }
        //change formula for shredding weapons 
        if(fortykWeapon.getFlag("fortyk","shredding")){
            let dPos = form.indexOf('d');
            let dieNum = form.substr(0,dPos);
            let newNum=parseInt(dieNum)*2;
            form=form.slice(dPos);
            form=newNum+form;
            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);
            form=startstr+"dl"+dieNum+endstr; 
        }
        //change formula for primitive and proven weapons
        if(fortykWeapon.getFlag("fortyk","primitive")||fortykWeapon.getFlag("fortyk","proven")){
            let dPos = form.indexOf('d');
            let dieNum = parseInt(form.substr(0,dPos));
            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);
            if(fortykWeapon.getFlag("fortyk","primitive")){
                form=startstr+`max${fortykWeapon.getFlag("fortyk","primitive")}`+endstr; 
            }else if(fortykWeapon.getFlag("fortyk","proven")){
                form=startstr+`min${fortykWeapon.getFlag("fortyk","proven")}`+endstr; 
            }
        }
        //change formula for cleanse with fire for flame weapons
        if(actor.getFlag("fortyk","cleansewithfire")&&fortykWeapon.getFlag("fortyk","flame")){
            let wpb=actor.system.characteristics.wp.bonus;
            let dPos = form.indexOf('d');
            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);
            form=startstr+`r<${wpb}`+endstr;
        }
        //make an array to store the wounds of all targets so that they can all be updated together once done
        var newWounds=[]
        for(let i=0;i<targets.size;i++){
            newWounds.push(false);
        }
        if(self){
            newWounds.push(false);
        }
        let hitNmbr=0;
        let selfToxic=false;
        //loop for the number of hits
        for(let h=0;h<(hits);h++){
            if(!self){
                if(h>0){
                    var randomLocation=new Roll("1d100",{});
                    await randomLocation.roll();
                    //curHit=game.fortyk.FORTYKTABLES.hitLocations[randomLocation._total];
                }
            }
            //spray and blast weapons always hit the body hit location
            if(fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","spray")){

                curHit={value:"body",label:"Body"}
            }
            //formations and hordes always get hit in the body
            if(targets.size>0){
                let targetIt=targets.values();
                let target=targetIt.next().value;
                let targetData=target.actor.system;
                if(target.actor.type!=="vehicle"){
                    if(targetData.horde.value||targetData.formation.value){
                        curHit.value="body";
                        curHit.label="Body";
                    }
                }else{
                    //if a vehicle blast and spray weapons hit the hull
                    if(fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","spray")){

                        curHit={value:"hull",label:"Hull"}
                    }
                }
            }
            let roll=new Roll(form,actor.system);
            let label = weapon.name ? `Rolling ${weapon.name} damage to ${curHit.label}.` : 'damage';
            await roll.roll();
            //calculate righteous for non targetted rolls
            let tenz=0;
            try{
                for ( let r of roll.dice[0].results ) {
                    if(r.active){
                        if(r.result>=righteous){
                            tenz+=1;
                        }
                    }
                } 
            }catch(err){
            }
            //round up the total in case of d5 weapons
            roll._total=Math.ceil(roll._total);
            //handle spray weapon jams
            if(fortykWeapon.getFlag("fortyk","spray")&&weapon.type==="rangedWeapon"){
                let jam=false;
                for ( let r of roll.dice[0].results ) {
                    if(r.roll===9){
                        jam=true;
                    }
                }
                if(jam){
                    let jamOptions={user: user._id,
                                    speaker:{actor,alias:actor.name},
                                    content:"Spray weapon jammed on a roll of 9",
                                    classes:["fortyk"],
                                    flavor:`Weapon Jam`,
                                    author:actor.name}
                    await ChatMessage.create(jamOptions,{});
                }
            }
            //check to see if attack is targetted or just rolling damage with no targets
            if(targets.size!==0||self){
                let tarNumbr=0;
                //if there are targets apply damage to all of them
                for (let tar of targets){
                    let activeEffects=[];
                    let data={}
                    let tarActor={}
                    data=tar.actor.system; 
                    tarActor=tar.actor;
                    //check if target is dead
                    if(!tarActor.getFlag("core","dead")){
                        //check if target is vehicle
                        let vehicle=false;
                        if(tarActor.type==="vehicle"){
                            vehicle=true
                        }
                        let facing=null;
                        if(vehicle){
                            facing=getVehicleFacing(tar,attackerToken);
                        }
                        let armorSuit=undefined;
                        let isHordelike=false;
                        if(!vehicle){
                            armorSuit=data.secChar.wornGear.armor.document;
                            if(data.horde.value||data.formation.value){
                                isHordelike=true;
                            }
                        }
                        //give new hit location for multiple hits check for vehicle
                        if(vehicle){
                            curHit.value=lastHit.vehicleHitLocation.value;
                            curHit.label=lastHit.vehicleHitLocation.label;
                        }
                        let tarRighteous=righteous;
                        //calc distance
                        let distance=tokenDistance(attackerToken,tar);
                        if(h>0){
                            if(!vehicle){
                                curHit.value=game.fortyk.FORTYKTABLES.hitLocations[randomLocation._total].value;
                                curHit.label=game.fortyk.FORTYKTABLES.hitLocations[randomLocation._total].label;
                            }else{
                                if(!data.hasTurret.value){
                                    if(randomLocation._total>=81){
                                        curHit.value=FORTYKTABLES.vehicleHitLocations[59];
                                        curHit.value=FORTYKTABLES.vehicleHitLocations[59];
                                    }else{
                                        curHit.value=game.fortyk.FORTYKTABLES.vehicleHitLocations[randomLocation._total].value;
                                        curHit.label=game.fortyk.FORTYKTABLES.vehicleHitLocations[randomLocation._total].label;
                                    }
                                }else{
                                    curHit.value=game.fortyk.FORTYKTABLES.vehicleHitLocations[randomLocation._total].value;
                                    curHit.label=game.fortyk.FORTYKTABLES.vehicleHitLocations[randomLocation._total].label;
                                } 
                            }
                        }
                        let damageOptions={
                            wpnName:fortykWeapon.name,
                            target:tarActor.name,
                            dmgType:weapon.data.damageType.value,
                            hitLocation:curHit.label,
                            results:[],
                            vehicle:vehicle
                        }
                        if(vehicle){
                            var targetWpn=null;
                            //check if hitting a weapon, weapons count as the same facing as the facing they are mounted on
                            if(curHit.value==="weapon"){
                                let facingWeapons=[]
                                let facingString=facing.label;
                                let newFacingString="";
                                if(facing.path==="front"){
                                    facingWeapons=data.frontWeapons;
                                }else if(facing.path==="rear"){
                                    facingWeapons=data.rearWeapons;
                                }else if(facing.path==="lSide"){
                                    facingWeapons=data.leftSideWeapons;
                                }else if(facing.path==="rSide"){
                                    facingWeapons=data.rightSideWeapons;
                                }
                                //if there are weapons proceed to randomly select one, if not proceed with normal armor facing
                                if(facingWeapons.length>0){
                                    let wpnnmbr=facingWeapons.length;
                                    let wpnRoll=new Roll(`1d${wpnnmbr}-1`,{});
                                    await wpnRoll.roll();
                                    targetWpn=facingWeapons[wpnRoll._total];
                                    newFacingString=targetWpn.name;
                                    if(targetWpn.data.mounting.value==="turret"){
                                        facing=data.facings["front"];
                                    }
                                    damageOptions.facing=newFacingString;
                                }else{
                                    damageOptions.facing=facing.label;
                                }
                            }else{
                                damageOptions.facing=facing.label; 
                            }
                        }
                        let damageTemplate='systems/fortyk/templates/chat/chat-damage.html';
                        let deathwatch=false;
                        var toxic=fortykWeapon.getFlag("fortyk","toxic");
                        if(!vehicle&&actor.getFlag("fortyk","deathwatchtraining")){
                            let targetRace=data.race.value.toLowerCase();
                            let forRaces=actor.data.flags.fortyk.deathwatchtraining;
                            if(forRaces.includes(targetRace)){
                                deathwatch=true;
                                tarRighteous-=1;
                                //Xenos bane #1
                                if(actor.getFlag("fortyk","xenosbane")){
                                    if(toxic){
                                        toxic++;
                                    }else{
                                        toxic=1;
                                    }
                                }
                                if(actor.getFlag("fortyk","ailments")){
                                    let ailmentAmt=Math.ceil(actor.system.characteristics.int.bonus/2);
                                    if(toxic){
                                        toxic+=ailmentAmt;
                                    }else{
                                        toxic=ailmentAmt;
                                    }
                                }
                            }
                        }
                        let daemonic=tarActor.getFlag("fortyk","daemonic");
                        if(fortykWeapon.getFlag("fortyk","daemonbane")){
                            if(daemonic){
                                tarRighteous-=1;
                            }
                        }
                        //graviton increased crit against vehicles
                        if(vehicle&&fortykWeapon.getFlag("fortyk","graviton")){
                            tarRighteous-=1;
                        }

                        let tens=0;
                        let dieResults=[];
                        let discards=[];
                        console.log(roll);
                        try{
                            for ( let r of roll.dice[0].results ) {
                                if(!r.active){
                                    discards.push(true);
                                }else{
                                    discards.push(false);
                                }
                                dieResults.push(r.result);
                                if(r.active){
                                    if(r.result>=tarRighteous){
                                        tens+=1;
                                    }
                                }
                            } 
                        }catch(err){
                        }
                        let damageString="";
                        if(dieResults.length<1){
                            damageString=roll.result.replace(/\s+/g, '');
                        }else{
                            let rollString=""
                            for(let i=0;i<dieResults.length;i++){
                                let htmlString=`<span class="`
                                if(discards[i]){
                                    htmlString+=`discard `
                                }
                                if(dieResults[i]>=tarRighteous){
                                    htmlString+=`chat-righteous">${dieResults[i]}</span>`
                                }else if(dieResults[i]===1){
                                    htmlString+=`chat-crit-fail">${dieResults[i]}</span>`
                                }else{
                                    htmlString+=`">${dieResults[i]}</span>`
                                }
                                rollString+=htmlString;
                                if(i+1<dieResults.length){
                                    rollString+="+";  
                                }
                            }
                            if(roll.terms.length!==1){
                                damageString=roll.result.replace(/\s+/g, '')
                                damageString="+"+damageString.substring(damageString.indexOf("+") + 1)
                            }
                            damageString ="("+rollString+")"+damageString;
                        }
                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        damageOptions.results.push(`<div style="flex:none">Weapon damage roll: ${damageString}</div>`)
                        if(tens){
                            damageOptions.results.push(`<span class="chat-righteous">Righteous Fury!</span>`)
                        }
                        damageOptions.results.push(`</div>`);
                        if(!armorSuit){
                            armorSuit=await Item.create({type:"armor",name:"standin"},{temporary:true});
                        }
                        let wounds=data.secChar.wounds;
                        let curWounds=wounds.value
                        if(newWounds[tarNumbr]===false){
                            newWounds[tarNumbr]=curWounds;
                        }
                        //killers eye
                        if(!vehicle&&actor.getFlag("fortyk","killerseye")&&lastHit.attackType==="called"&&(lastHit.dos>=data.characteristics.agi.bonus)){
                            let randomKiller=new Roll("1d5",{});
                            await randomKiller.roll();
                            let killerCrit=randomKiller._total;
                            await this.critEffects(tar,killerCrit,curHit.value,weapon.data.damageType.value,ignoreSON,activeEffects,"Killer's Eye ");
                        }
                        let soak=0;
                        let armor
                        if(vehicle){
                            if(curHit.value==="turret"){
                                armor=data.facings["front"].armor; 
                            }else{
                                armor=facing.armor;
                            }
                        }else{
                            armor=parseInt(data.characterHitLocations[curHit.value].armor); 
                        }
                        //scatter weapon logic

                        if(fortykWeapon.getFlag("fortyk","scatter")){



                            if(distance>=parseInt(weapon.data.range.value)/2){
                                damageOptions.results.push(`<div class="chat-target flexcol">`);
                                damageOptions.results.push(`<span> Armor is doubled against Scatter weapon at this distance!</span>`);
                                armor=armor*2;
                                damageOptions.results.push(`</div>`);
                            }
                        }

                        //check if weapon ignores soak
                        if(!fortykWeapon.getFlag("fortyk","ignoreSoak")){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let pen=0;
                            //random pen logic
                            if(isNaN(weapon.data.pen.value)){
                                let randomPen=new Roll(weapon.data.pen.value,{});
                                await randomPen.roll();
                                damageOptions.results.push(`<span>Random weapon ${weapon.data.pen.value} penetration: ${randomPen._total}</span>`);
                                pen=randomPen._total;
                            }else{
                                pen=parseInt(weapon.data.pen.value); 
                            }
                            pen+=extraPen;
                            //smite the unholy
                            if(actor.getFlag("fortyk","smitetheunholy")&&tarActor.getFlag("fortyk","fear")&&weapon.type==="meleeWeapon"){
                                let fear=parseInt(tarActor.getFlag("fortyk","fear"));
                                if(!isNaN(fear)){
                                    pen+=fear;
                                    damageOptions.results.push(`<span>Smite the unholy increases damage and penetration by ${tarActor.getFlag("fortyk","fear")} against the target.</span>`);
                                }
                            }
                            //razor sharp weapons
                            if(fortykWeapon.getFlag("fortyk","razorsharp")&&lastHit.dos>=3){
                                pen=pen*2;
                                damageOptions.results.push(`Razor Sharp doubles penetration to ${pen}</span>`);
                            }
                            //lance weapons
                            if(fortykWeapon.getFlag("fortyk","lance")){
                                pen=pen*lastHit.dos;
                                damageOptions.results.push(`<span>Lance increases penetration to ${pen}</span>`);
                            }
                            //handle melta weapons
                            if(fortykWeapon.getFlag("fortyk","melta")&&!tarActor.getFlag("fortyk","ceramiteplating")){
                                let shortRange=parseInt(weapon.data.range.value)/2
                                if(distance<=shortRange){
                                    pen=pen*3;
                                    damageOptions.results.push(`<span>Melta range increases penetration to ${pen}</span>`);
                                }
                            }
                            //ignore natural armor weapons
                            if(fortykWeapon.getFlag("fortyk","ignoreNaturalArmor")&&tarActor.getFlag("fortyk","naturalarmor")){
                                pen+=parseInt(tarActor.getFlag("fortyk","naturalarmor"));
                                damageOptions.results.push(`<span>The weapon ignores ${tarActor.getFlag("fortyk","naturalarmor")} natural armor.</span>`);
                            }
                            let maxPen=Math.min(armor,pen);
                            if(vehicle){
                                if(curHit.value==="turret"){
                                    soak=data.facings["front"].value; 
                                }else{
                                    soak=facing.value;
                                }
                            }else{
                                soak=parseInt(data.characterHitLocations[curHit.value].value);
                            }
                            //resistant armor
                            if(armorSuit.getFlag("fortyk",weapon.data.damageType.value.toLowerCase())){
                                soak+=Math.ceil(armor*0.5);
                                damageOptions.results.push(`<span>Armor is resistant against this damage type.</span>`);
                            }
                            //warp weapon vs holy armor
                            if(fortykWeapon.getFlag("fortyk","warp")&&!armorSuit.getFlag("fortyk","holy")&&!vehicle){
                                maxPen=armor;
                                damageOptions.results.push(`<span>Warp weapon bypasses armor.</span>`);
                            }else if(fortykWeapon.getFlag("fortyk","warp")&&armorSuit.getFlag("fortyk","holy")){
                                damageOptions.results.push(`<span>Warp weapon is repelled by warded armor.</span>`);
                            }

                            if(!vehicle&&fortykWeapon.getFlag("fortyk","felling")&&parseInt(tarActor.system.characteristics.t.uB)){
                                let ut=parseInt(tarActor.system.characteristics.t.uB);
                                let fel=Math.min(ut,fortykWeapon.getFlag("fortyk","felling"));
                                damageOptions.results.push(`<span>Felling ignores ${fel} unnatural toughness.</span>`);
                                soak-=fel;
                            }
                            soak=soak-maxPen;
                            //sanctified logic
                            let daemonic=tarActor.getFlag("fortyk","daemonic");
                            if(daemonic&&(weapon.type==="psychicPower"||fortykWeapon.getFlag("fortyk","force")||fortykWeapon.getFlag("fortyk","warp")||fortykWeapon.getFlag("fortyk","sanctified")||fortykWeapon.getFlag("fortyk","daemonbane"))){
                                daemonic=parseInt(daemonic);
                                if(!isNaN(daemonic)){
                                    soak-=parseInt(daemonic);
                                    damageOptions.results.push(`<span>The attack ignores ${daemonic} soak from the daemonic trait.</span>`);
                                }
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        let damage=roll._total;

                        let chatDamage=damage;

                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        //damage part of smite the unholy
                        if(actor.getFlag("fortyk","smitetheunholy")&&tarActor.getFlag("fortyk","fear")&&weapon.type==="meleeWeapon"){
                            if(!isNaN(tarActor.getFlag("fortyk","fear"))){
                                damage+=parseInt(tarActor.getFlag("fortyk","fear"));
                                chatDamage+=parseInt(tarActor.getFlag("fortyk","fear"));
                            }
                        }
                        //volkite logic
                        if(fortykWeapon.getFlag("fortyk","volkite")&&tens>0){
                            let volkForm=tens+"d10";
                            let volkRoll=new Roll(volkForm,{});
                            await volkRoll.roll();
                            damage+=volkRoll._total;
                            chatDamage+=volkRoll._total;
                            damageOptions.results.push(`<span>Volkite extra damage: ${volkRoll.result}</span>`);
                        }
                        //GRAVITON LOGIC
                        if(fortykWeapon.getFlag("fortyk","graviton")){
                            if(vehicle){
                                soak=0;
                                curHit.value="motive";
                                damageOptions.results.push(`<span>Graviton ignores vehicle armor and increases vengeful.`);
                            }else{
                                let gravitonDmg=2*armor;
                                damage+=gravitonDmg;
                                chatDamage+=gravitonDmg;
                                damageOptions.results.push(`<span>Graviton extra damage: ${gravitonDmg}</span>`); 
                            }
                        }
                        //accurate weapon logic
                        if(fortykWeapon.getFlag("fortyk","accurate")&&lastHit.aim){
                            if(distance>10){
                                let accDice=Math.min(fortykWeapon.getFlag("fortyk","accurate"),Math.ceil((lastHit.dos-1)/2));
                                let accForm=accDice+"d10"
                                let accRoll=new Roll(accForm,{});
                                await accRoll.roll();
                                damageOptions.results.push(`<span>Accurate extra damage: ${accRoll.dice[0].values.join("+")}</span>`);
                                damage+=accRoll._total;
                                chatDamage+=accRoll._total;
                            }
                        }
                        //handle cover
                        let cover=parseFloat(data.secChar.cover.value);

                        if(!self&&!fortykWeapon.getFlag("fortyk","ignoreCover")&&!fortykWeapon.getFlag("fortyk","spray")&&cover&&(weapon.type==="rangedWeapon"||weapon.type==="psychicPower")){
                            if(actor.getFlag('fortyk','nowheretohide')){
                                cover=cover-0.25;
                                damageOptions.results.push(`<span>Nowhere to hide reduces cover by 25%</span>`);
                            }
                            let coverReduction=1-cover;
                            damage=Math.ceil(coverReduction*damage);
                            damageOptions.results.push(`<span>Cover reduces ranged damage by ${cover*100}%</span>`);

                        }
                        //logic against swarm enemies
                        if(tarActor.getFlag("fortyk","swarm")&&!(fortykWeapon.getFlag("fortyk","spray")||fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","flame")||fortykWeapon.getFlag("fortyk","scatter"))){
                            damage=Math.ceil(damage/2);
                            damageOptions.results.push(`<span>Swarm enemies take reduced damage against non blast, spray, flame or scatter weapons.</span>`);
                        }
                        damage=damage-soak;
                        //corrosive weapon logic
                        if(fortykWeapon.getFlag("fortyk","corrosive")&&!isHordelike){
                            let corrosiveAmt=new Roll("1d10",{});
                            await corrosiveAmt.roll();
                            let id=randomID(5);
                            damageOptions.results.push(`<label class="popup" data-id="${id}"> Corrosive Weapon armor damage: ${corrosiveAmt._total}. <span class="popuptext chat-background" id="${id}">Excess corrosion is transferred to damage.</span></label> `);
                            let corrosiveDamage=0;
                            let newArmor=Math.max(0,(armor-corrosiveAmt._total));
                            corrosiveDamage=Math.abs(Math.min(0,(armor-corrosiveAmt._total)));
                            let corrosiveAmount=-corrosiveAmt._total;
                            let path="";
                            if(vehicle){
                                path=`data.facings.${facing.path}.armor`;
                            }else{
                                path=`data.characterHitLocations.${curHit.value}.armorMod`;
                            }
                            let corrodeActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("corrode")]);
                            corrodeActiveEffect.changes=[];
                            let changes={key:path,value:corrosiveAmount,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}
                            corrodeActiveEffect.changes.push(changes);
                            activeEffects.push(corrodeActiveEffect);
                            if(damage<=0){
                                damage=corrosiveDamage;
                                chatDamage=corrosiveDamage;
                            }else{
                                damage+=corrosiveDamage;
                                chatDamage+=corrosiveDamage;
                            }
                        }
                        damageOptions.results.push(`</div>`) 
                        //toxic weapon logic
                        if(!vehicle&&damage>0&&!isNaN(parseInt(toxic))&&!tarActor.getFlag("fortyk","stuffofnightmares")&&!tarActor.getFlag("fortyk","undying")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let toxicMod=toxic*10;
                            if(tarActor.getFlag("fortyk","resistance")&&tarActor.getFlag("fortyk","resistance").toLowerCase().includes("toxic")){
                                toxicMod=-10;
                            }
                            let toxicTest=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-toxicMod),tarActor, `Resist toxic ${toxic}`,null,false,"",true);
                            damageOptions.results.push(toxicTest.template);
                            if(!toxicTest.value){
                                let toxicDmg=new Roll("1d10",{});
                                await toxicDmg.roll();
                                damageOptions.results.push(`Toxic extra damage: ${toxicDmg._total}`);
                                damage+=toxicDmg._total;
                                chatDamage+=toxicDmg._total;
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        let messages=[];
                        //shocking weapon logic
                        if(!vehicle&&damage>0&&fortykWeapon.getFlag("fortyk","shocking")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let shock=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total),tarActor, "Resist shocking",null,false,"",true);
                            damageOptions.results.push(shock.template);
                            if(!shock.value){
                                let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                stunActiveEffect.transfer=false;
                                stunActiveEffect.duration={
                                    rounds:shock.dos
                                }
                                activeEffects.push(stunActiveEffect);
                                let id=randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Stunned for ${shock.dos} rounds. <span class="popuptext chat-background" id="${id}">${tarActor.name} is stunned for ${shock.dos} rounds and takes 1 fatigue!</span></label>`)
                                let newfatigue=1;
                                this._addFatigue(tarActor,newfatigue);
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        //abyssal drain weapon logic
                        if(!vehicle&&damage>0&&fortykWeapon.getFlag("fortyk","abyssalDrain")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let drain=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-20),tarActor, "Resist abyssal drain",null,false,"",true);
                            damageOptions.results.push(drain.template);
                            if(!drain.value){
                                let drainActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                                drainActiveEffect.transfer=false;
                                drainActiveEffect.changes=[];
                                let strDmg=new Roll("2d10",{});
                                await strDmg.roll();
                                drainActiveEffect.changes.push({key:`data.characteristics.s.value`,value:-1*strDmg._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD})
                                let tDmg=new Roll("2d10",{});
                                await tDmg.roll();
                                drainActiveEffect.changes.push({key:`data.characteristics.t.value`,value:-1*tDmg._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD})
                                activeEffects.push(drainActiveEffect);
                                let id=randomID(5);
                                damageOptions.results.push(`Drained for ${strDmg.result} strength damage and ${tDmg.result} toughness damage!`)
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        //cryogenic weapon logic
                        if(!vehicle&&damage>0&&fortykWeapon.getFlag("fortyk","cryogenic")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let cryo=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-40),tarActor, "Resist freezing",null,false,"",true);
                            damageOptions.results.push(cryo.template);
                            if(!cryo.value){
                                let cryoRoll=new Roll("1d5",{});
                                await cryoRoll.roll();
                                let cryoDuration=parseInt(cryoRoll.result);
                                let cryoActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("cryogenic")]);
                                cryoActiveEffect.transfer=false;
                                cryoActiveEffect.duration={
                                    rounds:cryoDuration
                                }
                                activeEffects.push(cryoActiveEffect);
                                let id=randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Freezing for ${cryoRoll._total} rounds. <span class="popuptext chat-background" id="${id}">${tarActor.name} is freezing for ${cryoRoll.result} rounds and will take 2d10 toughness damage per round, freezing if reaching 0 toughness!</span></label>`)
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        //hallucinogenic
                        if(!vehicle&&!isNaN(parseInt(fortykWeapon.getFlag("fortyk","hallucinogenic")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let halluMod=parseInt(fortykWeapon.getFlag("fortyk","hallucinogenic"))*10;
                            if(armorSuit.getFlag("fortyk","sealed")){
                                halluMod+=20;
                            }
                            let hallu=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-halluMod),tarActor, "Resist hallucinogenic",null,false,"",true);
                            damageOptions.results.push(hallu.template);
                            if(!hallu.value){
                                let halluActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("hallucinogenic")]);
                                halluActiveEffect.transfer=false;
                                halluActiveEffect.duration={
                                    rounds:hallu.dos
                                }
                                activeEffects.push(halluActiveEffect);
                                let halluRoll=new Roll("1d10",{});
                                await halluRoll.roll();
                                let halluText=FORTYKTABLES.hallucinogenic[halluRoll._total-1];
                                let id=randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Hallucinating for ${hallu.dos+1} rounds. <span class="popuptext chat-background" id="${id}">${halluText}</span></label>`)
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        //crippling weapon logic
                        if(!vehicle&&damage>0&&fortykWeapon.getFlag("fortyk","crippling")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let crippleActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("crippled")]);
                            crippleActiveEffect.location=curHit;
                            crippleActiveEffect.num=fortykWeapon.getFlag("fortyk","crippling");
                            activeEffects.push(crippleActiveEffect);
                            let id=randomID(5);
                            damageOptions.results.push(`<label class="popup" data-id="${id}"> ${tarActor.name} is crippled. <span class="popuptext chat-background" id="${id}">${tarActor.name} is crippled, they take ${fortykWeapon.getFlag("fortyk","crippling")} damage to the ${curHit.label} which ignores all soak, if they ever take more than a half action in a turn. This lasts until they are fully healed or until the end of the encounter.</span></label>`)
                            damageOptions.results.push(`</div>`) 
                        }
                        //NIDITUS WEAPON
                        if(!vehicle&&(fortykWeapon.getFlag("fortyk","niditus")&&damage)>0){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            if(tarActor.system.psykana.pr.value>0){
                                let stun=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total),tarActor, "Resist niditus stun",null,false,"",true);
                                damageOptions.results.push(stun.template);
                                if(!stun.value){
                                    let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                    stunActiveEffect.transfer=false;
                                    stunActiveEffect.duration={
                                        rounds:stun.dos
                                    }
                                    activeEffects.push(stunActiveEffect);
                                    let id=randomID(5);
                                    damageOptions.results.push(`<label class="popup" data-id="${id}"> Stunned for ${stun.dos} rounds. <span class="popuptext chat-background" id="${id}">${tarActor.name} is stunned for ${stun.dos} rounds!</span></label>`)
                                }
                            }
                            if(tarActor.getFlag("fortyk","warpinstability")){
                                let warpinst=await this.fortykTest("wp", "char", (tarActor.system.characteristics.wp.total-10),tarActor, "Warp instability niditus",null,false,"",true);
                                damageOptions.results.push(warpinst.template);
                                if(!warpinst.value){
                                    let warpdmg=warpinst.dos;
                                    if(warpdmg>newWounds){
                                        damageOptions.results.push(`${actor.name} is banished to the warp!`);
                                        await this.applyDead(tar,actor,"banishment");
                                    }else{
                                        damage+=warpdmg;
                                        chatDamage+=warpdmg;
                                    }
                                }
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        //flame weapon
                        if(!armorSuit.getFlag("fortyk","flamerepellent")&&fortykWeapon.getFlag("fortyk","flame")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            if(vehicle){
                                damageOptions.results.push(`Pilot must make a +${facing.armor} Operate test or the vehicle catches fire.`)
                            }else{
                                let fire=await this.fortykTest("agi", "char", tarActor.system.characteristics.agi.total,tarActor, "Resist fire",null,false,"",true);
                                damageOptions.results.push(fire.template);
                                if(!fire.value){
                                    let fireActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                                    activeEffects.push(fireActiveEffect);
                                    let id=randomID(5);
                                    damageOptions.results.push(`Catches fire!`)
                                } 
                            }
                            damageOptions.results.push(`</div>`) 
                        } 
                        //thermal weapon
                        let heat=0;
                        if(vehicle&&fortykWeapon.getFlag("fortyk","thermal")){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            if(tarActor.getFlag("fortyk","superheavy")){
                                damageOptions.results.push(`Gains 1 heat from thermal weapon.`);
                                heat++;
                            }else{
                                let fireActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                                activeEffects.push(fireActiveEffect);
                                let id=randomID(5);
                                damageOptions.results.push(`Catches fire from thermal weapon!`);
                            }

                            damageOptions.results.push(`</div>`) 
                        } 
                        //snare weapon
                        if(!vehicle&&!isNaN(parseInt(fortykWeapon.getFlag("fortyk","snare")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let snareMod=fortykWeapon.getFlag("fortyk","snare")*10;
                            let snare=await this.fortykTest("agi", "char", (tarActor.system.characteristics.agi.total-snareMod),tarActor, "Resist snare",null,false,"",true);
                            damageOptions.results.push(snare.template);
                            if(!snare.value){
                                let id=randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Immobilised. <span class="popuptext chat-background" id="${id}">${tar.name} is immobilised. An Immobilised target can attempt no actions other than trying to escape the bonds. As a Full Action, he can make a (-${snareMod}) Strength or Agility test to break free.</span></label>`)
                                let snareActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("snare")]);
                                activeEffects.push(snareActiveEffect);
                            }
                            damageOptions.results.push(`</div>`);
                        }
                        //concussive weapon
                        if(!vehicle&&!isNaN(parseInt(fortykWeapon.getFlag("fortyk","concussive")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let stunMod=parseInt(fortykWeapon.getFlag("fortyk","concussive"))*10;
                            let stun=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-stunMod),tarActor, "Resist stun",null,false,"",true);
                            damageOptions.results.push(stun.template);
                            if(!stun.value){
                                let id=randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Stunned for ${stun.dos} rounds. <span class="popuptext chat-background" id="${id}">${tar.name} is stunned for ${stun.dos} rounds!</span></label>`)
                                let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                stunActiveEffect.duration={
                                    rounds:stun.dos
                                }
                                activeEffects.push(stunActiveEffect);
                                if(damage>tarActor.system.characteristics.s.bonus){
                                    let proneActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                                    activeEffects.push(proneActiveEffect);
                                    damageOptions.results.push(`<span>Knocked down.</span>`)
                                }
                            }
                            damageOptions.results.push(`</div>`) 
                        }else if(vehicle&&tarActor.getFlag("fortyk","walker")&&fortykWeapon.getFlag("fortyk","concussive")&&damage>0){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let difficulty=60-damage+data.crew.rating-10*parseInt(fortykWeapon.getFlag("fortyk","concussive"));
                            let knockdown=await this.fortykTest("", "crew", (difficulty),tarActor, "Resist knockdown",null,false,"",true);
                            damageOptions.results.push(knockdown.template);
                            if(!knockdown.value){
                                let proneActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                                activeEffects.push(proneActiveEffect);
                                damageOptions.results.push(`<span>Knocked down.</span>`)
                            }
                            damageOptions.results.push(`</div>`);

                        }
                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        //deathdealer
                        if(!vehicle&&damage>0&&damage>newWounds[tarNumbr]&&actor.getFlag("fortyk","deathdealer")&&(weapon.type.toLowerCase().includes(actor.getFlag("fortyk","deathdealer").toLowerCase()))){
                            damage+=actor.system.characteristics.per.bonus;
                            chatDamage+=actor.system.characteristics.per.bonus;
                            damageOptions.results.push(`Deathdealer increases critical damage by ${actor.system.characteristics.per.bonus}.`);
                        }
                        //peerless killer
                        if(!vehicle&&damage>0&&damage>newWounds[tarNumbr]&&actor.getFlag("fortyk","peerlesskiller")&&lastHit.attackType==="called"){
                            damage+=4;
                            chatDamage+=4;
                            damageOptions.results.push(`Peerless Killer increases critical damage by 4 on called shots.`);
                        }
                        damageOptions.results.push(`</div>`); 
                        // true grit!@!!@
                        if(!vehicle&&!data.suddenDeath.value&&!isHordelike&&(damage>0)&&(newWounds[tarNumbr]-damage)<0&&tarActor.getFlag("fortyk","truegrit")){
                            let trueSoak=data.characteristics.t.bonus;
                            let tempDmg=damage-newWounds[tarNumbr]-trueSoak;
                            if(tempDmg<=0){
                                damage=newWounds[tarNumbr]+1
                            }else{
                                damage=damage-trueSoak;
                            }
                            if(damage<=0){damage=1}
                            let chatOptions={user: user._id,
                                             speaker:{actor,alias:tarActor.name},
                                             content:"True Grit reduces critical damage!",
                                             classes:["fortyk"],
                                             flavor:`Critical effect`,
                                             author:tarActor.name}
                            messages.push(chatOptions);
                        }
                        //impenetrable armor logic
                        if(armorSuit.getFlag("fortyk","impenetrable")){
                            damage=Math.ceil(damage/2);
                            if(damage>0){
                                let impOptions={user: user._id,
                                                speaker:{actor,alias:tarActor.name},
                                                content:"Impenetrable reduces damage taken by half!",
                                                classes:["fortyk"],
                                                flavor:`${armorSuit.name} is impenetrable!`,
                                                author:tarActor.name}
                                messages.push(impOptions);
                            }
                        }
                        //reinforced armor
                        if(vehicle&&damage>0&&damage>newWounds[tarNumbr]&&tarActor.getFlag("fortyk","reinforcedarmour")){
                            let critDamage=0;
                            if(newWounds[tarNumbr]<=0){
                                critDamage=damage;
                            }else{
                                critDamage=damage-newWounds[tarNumbr];
                            }
                            damage=damage-(Math.floor(critDamage/2));
                            let reinforcedOptions={user: user._id,
                                                   speaker:{actor,alias:tarActor.name},
                                                   content:"Reinforced armor reduces critical damage taken by half!",
                                                   classes:["fortyk"],
                                                   flavor:`Reinforced Armor`,
                                                   author:tarActor.name}
                            messages.push(reinforcedOptions);
                        }
                        //check if target has toxic trait and if attacker dealt damage to it in melee range, sets flag if so
                        if(!vehicle&&tarActor.getFlag("fortyk","toxic")&&distance<=1&&damage>0){
                            selfToxic=tarActor.getFlag("fortyk","toxic");
                        }
                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        //process horde damage for different weapon qualities
                        if(!vehicle){
                            if(data.horde.value&&damage>0){
                                damage=1+magdamage;
                                chatDamage=1+magdamage;
                                if(weapon.data.damageType.value==="Explosive"){
                                    damage+=1;
                                    chatDamage+=1;
                                    damageOptions.results.push(`<span>Explosive adds 1 damage.</span>`);
                                }
                                if(fortykWeapon.getFlag("fortyk","powerfield")){
                                    damage+=1;
                                    chatDamage+=1;
                                    damageOptions.results.push(`<span>Power field adds 1 damage.</span>`);
                                }
                                if(fortykWeapon.getFlag("fortyk","blast")){
                                    damage+=fortykWeapon.getFlag("fortyk","blast");
                                    chatDamage+=fortykWeapon.getFlag("fortyk","blast");
                                    damageOptions.results.push(`<span>Blast adds ${fortykWeapon.getFlag("fortyk","blast")} damage.</span>`);
                                }
                                if(fortykWeapon.getFlag("fortyk","spray")){
                                    let additionalHits=parseInt(weapon.data.range.value);
                                    additionalHits=Math.ceil(additionalHits/4);
                                    let addHits=new Roll("1d5");
                                    await addHits.roll();
                                    damageOptions.results.push(`<span>Spray adds 1d5 damage: ${addHits.total}.</span>`)
                                    additionalHits+=addHits.total;
                                    damage+=additionalHits;
                                    chatDamage+=additionalHits;
                                }
                            }
                            //process damage against formations
                            if(data.formation.value&&damage>0){
                                damage=1;
                                chatDamage=1;
                                if(fortykWeapon.getFlag("fortyk","blast")){
                                    damage+=2;
                                    chatDamage+=2;
                                    damageOptions.results.push(`<span>Blast adds 2 damage.</span>`);
                                    if(tens){
                                        damageOptions.results.push(`<span>Blast adds ${fortykWeapon.getFlag("fortyk","blast")} further damage on righteous fury.</span>`);
                                        damage+=fortykWeapon.getFlag("fortyk","blast");
                                        chatDamage+=fortykWeapon.getFlag("fortyk","blast");
                                    }
                                }
                                if(fortykWeapon.getFlag("fortyk","spray")){
                                    damage+=1;
                                    chatDamage+=1;
                                    damageOptions.results.push(`<span>Spray adds 1 damage.</span>`);
                                    if(tens){
                                        damage+=1;
                                        chatDamage+=1;
                                        damageOptions.results.push(`<span>Spray adds 1 extra damage on righteous fury.</span>`);
                                    }
                                }
                            }
                        }
                        damageOptions.results.push(`</div>`) 
                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        damageOptions.results.push(`<span>Total Damage: ${chatDamage}.</span>`);
                        if(damage<=0){
                            damageOptions.results.push(`<span>Damage is fully absorbed.</span>`);
                        }
                        damageOptions.results.push(`</div>`) 
                        let renderedDamageTemplate= await renderTemplate(damageTemplate,damageOptions);
                        var txt = document.createElement("textarea");
                        txt.innerHTML = renderedDamageTemplate;
                        renderedDamageTemplate= txt.value;
                        await roll.toMessage({user: game.user._id,
                                              speaker:{actor,alias:actor.name},
                                              content:renderedDamageTemplate,
                                              classes:["fortyk"],
                                              author:actor.name});
                        //await ChatMessage.create({content:renderedDamageTemplate},{});
                        for(let i=0;i<messages.length;i++){
                            await ChatMessage.create(messages[i],[]);
                        }
                        let superheavyOptions={};
                        if(tarActor.getFlag("fortyk","superheavy")){
                            superheavyOptions.targetWeapon=targetWpn;
                            superheavyOptions.facing=facing;
                            superheavyOptions.threshold=0;
                            let thresholds=data.secChar.wounds.thresholds;
                            if(curWounds>thresholds["1"]){
                                superheavyOptions.threshold=1;
                            }else if(curWounds>thresholds["2"]){
                                superheavyOptions.threshold=2;
                            }else if(curWounds>thresholds["3"]){
                                superheavyOptions.threshold=3;
                            }else if(curWounds>thresholds["4"]){
                                superheavyOptions.threshold=4;
                            }else{
                                superheavyOptions.threshold=5;
                            }
                        }
                        //check for righteous fury
                        let crit=await this._righteousFury(actor,label,weapon,curHit,tens,damage,tar,ignoreSON,activeEffects,superheavyOptions);
                        //if righteous fury ensure attack deals atleast 1 dmg
                        if(tens&&damage<=0){
                            damage=1;
                        }else if(damage<=0){
                            damage=0;
                        }
                        //set new hp of target
                        newWounds[tarNumbr]=newWounds[tarNumbr]-damage;
                        newWounds[tarNumbr]=Math.max(wounds.min,newWounds[tarNumbr]);
                        //check for super-heavies if a threshold was crossed then apply relevant critical effect
                        if(tarActor.getFlag("fortyk","superheavy")){

                            let thresholds=data.secChar.wounds.thresholds;

                            let crossed=[];
                            if(curWounds>thresholds["1"]&&thresholds["1"]>=newWounds[tarNumbr]){
                                console.log("hey")
                                crossed.push(0);
                            }
                            if(curWounds>thresholds["2"]&&thresholds["2"]>=newWounds[tarNumbr]){
                                crossed.push(1);
                            }
                            if(curWounds>thresholds["3"]&&thresholds["3"]>=newWounds[tarNumbr]){
                                crossed.push(2);
                            }
                            if(curWounds>thresholds["4"]&&thresholds["4"]>=newWounds[tarNumbr]){
                                crossed.push(3);
                            }
                            console.log(crossed)
                            if(crossed.length>0){
                                console.log(curHit)
                                await this.thresholdCrits(crossed,curHit.value,tar,activeEffects);
                                if(weapon.data.damageType.value.toLowerCase()==="energy"){

                                    heat+=crossed.length;

                                }
                            }
                            let knightHeat=parseInt(tarActor.system.knight.heat.value);
                            knightHeat+=heat;
                            await tarActor.update({"data.knight.heat.value":knightHeat});
                        }

                        //apply field practitioner critical
                        if(lastHit.fieldPractice&&damage>0){
                            await this.critEffects(tar,lastHit.fieldPractice,curHit.value,weapon.data.damageType.value,ignoreSON,activeEffects,"Field practice ");
                        }
                        //handle critical effects and death
                        //Xenos Bane Logic #2
                        if(!vehicle&&tens&&deathwatch&actor.getFlag("fortyk","xenosbane")&&(actor.system.secChar.wounds.value>=curWounds)&&!isHordelike){
                            let banetest=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total),tarActor, `Resist Xenos Bane intant death`,null,false,"",true);
                            if(!banetest.value){
                                this.applyDead(tarActor,actor,"Xenos Bane");
                            }
                        }
                        if((isHordelike)&&newWounds[tarNumbr]<=0){
                            await this.applyDead(tar,actor,`${actor.name}`);
                        }else if(!vehicle&&data.suddenDeath.value&&newWounds[tarNumbr]<=0){
                            await this.applyDead(tar,actor,`${actor.name}`);
                        }else if(newWounds[tarNumbr]<0&&damage>0){
                            let crit=Math.abs(newWounds[tarNumbr])-1;
                            await this.critEffects(tar,crit+1,curHit.value,weapon.data.damageType.value,ignoreSON,activeEffects);
                        }
                        //report damage dealt to gm and the target's owner
                        if(game.user.isGM){
                            this.reportDamage(tarActor, damage);
                        }else{
                            //if user isnt GM use socket to have gm update the actor
                            let tokenId=tar.data._id;
                            let socketOp={type:"reportDamage",package:{target:tokenId,damage:damage}}
                            await game.socket.emit("system.fortyk",socketOp);
                        }
                        await this.applyActiveEffect(tar,activeEffects,ignoreSON);
                    }
                    if(h===hits-1){
                        //update wounds
                        if(game.user.isGM||tar.owner){
                            await tarActor.update({"data.secChar.wounds.value":newWounds[tarNumbr]});
                        }else{
                            //if user isnt GM use socket to have gm update the actor
                            let tokenId=tar.data._id;
                            let socketOp={type:"updateValue",package:{token:tokenId,value:newWounds[tarNumbr],path:"data.secChar.wounds.value"}}
                            await game.socket.emit("system.fortyk",socketOp);
                        }
                    }
                    tarNumbr++;
                }
            }else{
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: label
                });
                this._righteousFury(actor,label,weapon,lastHit,tenz);
            }
            hitNmbr++;
        }
        //HAYWIRE TABLE ROLL
        if(!isNaN(parseInt(fortykWeapon.getFlag("fortyk","haywire")))){
            let hayRoll=new Roll("1d5",{});
            await hayRoll.roll();
            let hayText=FORTYKTABLES.haywire[hayRoll._total-1];
            let hayOptions={user: user._id,
                            speaker:{actor,alias:actor.name},
                            content:hayText,
                            classes:["fortyk"],
                            flavor:`Haywire Effect #${hayRoll._total} ${fortykWeapon.getFlag("fortyk","haywire")}m radius`,
                            author:actor.name}
            await ChatMessage.create(hayOptions,{});
        }
        if(actor.getFlag("fortyk","hammerblow")&&lastHit.attackType==="All Out"){
            if(hammer){
                await fortykWeapon.setFlag("fortyk","concussive",false);
            }else{
                await fortykWeapon.setFlag("fortyk","concussive",fortykWeapon.getFlag("fortyk","concussive")-2);
            }
        }
        //does the toxic test if the attacker attacked a toxic target in melee
        if(selfToxic!==false&&selfToxic!==undefined&&!self){
            let toxic=parseInt(selfToxic);
            let toxicMod=toxic*10;
            if(actor.getFlag("fortyk","resistance")&&actor.getFlag("fortyk","resistance").toLowerCase().includes("toxic")){
                toxicMod=-10;
            }
            let toxicTest=await this.fortykTest("t", "char", (actor.system.characteristics.t.total-toxicMod),actor, `Resist toxic ${toxic}`,null,false,"",false);
            if(!toxicTest.value){
                let toxicData={name:"Toxic",type:"meleeWeapon"}
                let toxicWpn=await Item.create(toxicData, {temporary: true});
                toxicWpn.data.flags.fortyk={}
                toxicWpn.data.flags.fortyk.ignoreSoak=true;
                toxicWpn.system.damageType.value="Energy";
                await this.damageRoll(toxicWpn.system.damageFormula,actor,toxicWpn,1, true);
            }
        }
    }
    //reports damage to a target's owners
    static async reportDamage(tarActor, chatDamage){
        if(game.settings.get("fortyk","privateDamage")){
            let user_ids = Object.entries(tarActor.data.permission).filter(p=> p[0] !== `default` && p[1] === 3).map(p=>p[0]);
            for(let user of user_ids)
            {
                if(user!==game.users.current.id||user_ids.length===1){
                    let recipient=[user];
                    let damageOptions={user: game.users.current,
                                       speaker:{user,alias:tarActor.name},
                                       content:`Attack did ${chatDamage} damage. </br>`,
                                       classes:["fortyk"],
                                       flavor:`Damage done`,
                                       author:tarActor.name,
                                       whisper:recipient
                                      }
                    await ChatMessage.create(damageOptions,{});
                }
            } 
        }else{
            let damageOptions={user: game.users.current,
                               speaker:{user,alias:tarActor.name},
                               content:`Attack did ${chatDamage} damage. </br>`,
                               classes:["fortyk"],
                               flavor:`Damage done`,
                               author:tarActor.name
                              }
            await ChatMessage.create(damageOptions,{});
        }
    }
    //handles righteous fury
    static async _righteousFury(actor,label,weapon,curHit,tens, damage=1, tar=null, ignoreSON=false,activeEffects=null,superHeavyOptions={}){
        var crit=false;
        if(tens>0){
            crit=true;
        }
        let vehicle=false;
        if(tar){
            if(tar.actor.type==="vehicle"){
                vehicle=true;
            }
        }
        if(!vehicle&&tar!==null&&(tar.actor.system.horde.value||tar.actor.system.formation.value)){crit=false}
        //if righteous fury roll the d5 and spew out the crit result
        if(!vehicle&&tar!==null&&crit&&tar.actor.system.suddenDeath.value){
            this.applyDead(tar,actor,'<span class="chat-righteous">Righteous Fury</span>');
            return true;
        }
        if(crit&&damage>0){
            let diceStr="1d5";
            if(vehicle&&tar.actor.getFlag("fortyk","ramshackle")){
                diceStr="1d10";    
            }
            let rightRoll=new Roll(diceStr,actor.system);
            await rightRoll.roll();
            let res=rightRoll._total;
            if(tar!==null){
                if(tar.actor.getFlag("fortyk","superheavy")){
                    await this.superHeavyRightEffects(tar,res,curHit.value,weapon.data.damageType.value,ignoreSON,activeEffects,`<span class="chat-righteous">Righteous Fury </span>`,superHeavyOptions);
                }else{
                    await this.critEffects(tar,res,curHit.value,weapon.data.damageType.value,ignoreSON,activeEffects,`<span class="chat-righteous">Righteous Fury </span>`);
                }

            }
            return true;
        }else if(crit&&damage<1){
            let chatOptions={user: game.user._id,
                             speaker:{actor,alias:actor.name},
                             content:`<span class="chat-righteous">Righteous Fury</span> does 1 damage through the soak!`,
                             classes:["fortyk"],
                             flavor:`<span class="chat-righteous">Righteous Fury</span>`,
                             author:actor.name}
            await ChatMessage.create(chatOptions,{});
            return true;
        }else{
            return false;
        }
    }
    //crit messages
    static async _critMsg(hitLoc,mesHitLoc, mesRes, mesDmgType,actor,source="",threshold=false){
        let vehicle=false;
        if(actor.type==="vehicle"){vehicle=true;}
        let rightMes
        //check for vehicle, vehicle have different crit effects
        if(threshold){
            console.log(hitLoc)
            rightMes=FORTYKTABLES.thresholdCrits[hitLoc][mesRes];
        }else if(vehicle){
            rightMes=FORTYKTABLES.vehicleCrits[hitLoc][mesRes-1];
        }else{
            rightMes=FORTYKTABLES.crits[mesDmgType][hitLoc][mesRes-1];
        }
        console.log(rightMes);
        //parse for tests inside the crit message
        let testStr=rightMes.match(/(?<=\#)(.*?)(?=\^)/g);
        let tests=[]
        if(testStr!==null){
            //do each test and push the result inside the result array
            for(let i=0;i<testStr.length;i++){
                let testParam=testStr[i].split(";");
                let target=actor.system.characteristics[testParam[0]].total+parseInt(testParam[1]);
                let test=await this.fortykTest(testParam[0], "char", (target),actor, testParam[2],null,false,"",true);
                tests.push(test);
            }
            for(let i=0;i<tests.length;i++){
                rightMes=rightMes.replace(/\#.*?\^/,tests[i].template) 
            }
        }
        //use a text area to convert to html
        var txt = document.createElement("textarea");
        txt.innerHTML = rightMes;
        rightMes= txt.value;
        //report crit effect
        let chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:rightMes,
                         classes:["fortyk"],
                         flavor:`${source}${mesHitLoc}: ${mesRes}, ${mesDmgType} Critical effect`,
                         author:actor.name}
        let critMsg=await ChatMessage.create(chatOptions,{});
        let inlineResults={}
        //parse any inline rolls and give them to the crit function to apply critical effects
        inlineResults.rolls=parseHtmlForInline(critMsg.data.content);
        inlineResults.tests=tests;
        return inlineResults;
    }
    //text blurp for the stuff of nightmares talent
    static async _sON(actor){
        let chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:"Stuff of nightmares ignores stuns, bleeds and cirtical effects!",
                         classes:["fortyk"],
                         flavor:`Stuff of Nightmares!`,
                         author:actor.name}
        await ChatMessage.create(chatOptions,{});
    }
    static async superHeavyRightEffects(token,num,hitLoc,type,ignoreSON,activeEffects=null,source="",options={}){

        let actor=token.actor;
        let rightMes="";
        let facing=options.facing;
        let weapon=options.targetWeapon;
        let weaponData;
        let weaponUpdate
        let threshold=options.threshold;
        if(threshold===1){
            rightMes=`Righteous fury reduces ${facing.label} armor by 1!`
            let armor=facing.armor;
            armor--;
            let update={};
            update[`data.facings.${facing.path}.armor`]=armor;
            await actor.update(update);
        }else if(threshold===2){
            let armorRoll=new Roll(`1d5`,{});

            await armorRoll.roll();
            let armorReduction=armorRoll._total;
            rightMes=`Righteous fury reduces ${facing.label} armor by ${armorReduction}!`
            let armor=facing.armor;
            armor=armor-armorReduction;
            let update={};
            update[`data.facings.${facing.path}.armor`]=armor;
            await actor.update(update);
        }else if(threshold>=3){
            switch(hitLoc){
                case "hull":
                    let components=[];
                    components=components.concat(actor.itemTypes.ammunition,actor.itemTypes.forceField,actor.itemTypes.knightComponent,actor.itemTypes.knightCore);
                    components=components.filter(component=>(component.system.state!=="X")&&(component.system.state!==0));
                    let size=components.length;

                    let compRoll=new Roll(`1d${size}-1`,{});

                    await compRoll.roll();
                    let component=components[compRoll._total];
                    let compData=component.system;
                    let compUpdate={};
                    if(component.type==="ammunition"){
                        compUpdate["data.state.value"]="X";
                        rightMes=`${component.name} explodes dealing weapon damage!`;
                    }else if(compData.state.value==="O"||compData.state.value===""){
                        compUpdate["data.state.value"]="D";
                        rightMes=`${component.name} is damaged.`;
                    }else if(compData.state.value==="D"){
                        compUpdate["data.state.value"]="X";
                        rightMes=`${component.name} is destroyed.`;
                    }else if(!isNaN(parseInt(compData.state.value))){
                        compUpdate["data.state.value"]=parseInt(compData.state.value)-1;
                        if(compUpdate["data.state.value"]===0){
                            rightMes=`${component.name} is destroyed.`;
                        }else{
                            rightMes=`${component.name} is damaged.`; 
                        }
                    }
                    component.update(compUpdate);

                    break;
                case "weapon":
                    weapon=weapon.document;
                    weaponData=weapon.system;
                    weaponUpdate={};
                    if(weaponData.state.value==="O"||weaponData.state.value===""){
                        weaponUpdate["data.state.value"]="D";
                        rightMes=`${weapon.name} is damaged.`;
                    }else if(weaponData.state.value==="D"){
                        weaponUpdate["data.state.value"]="X";
                        rightMes=`${weapon.name} is destroyed.`;
                    }
                    weapon.update(weaponUpdate);

                    break;
                case "motive":
                    if(activeEffects){
                        let ae={};
                        ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                        ae.label="Motive System Damage";
                        if(actor.system.secChar.speed.motive==="O"){
                            let speedRoll=new Roll(`1d10`,{});

                            await speedRoll.roll();
                            let speedReduction=speedRoll._total;
                            ae.changes=[{key:`data.secChar.speed.mod`,value:-speedReduction,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                        {key:`data.secChar.speed.motive`,value:"I",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];

                            rightMes=`The motive system is impaired reducing tactical speed by ${speedReduction}!`;
                        }else if(actor.system.secChar.speed.motive==="I"){

                            ae.changes=[{key:`data.secChar.speed.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                        {key:`data.secChar.speed.motive`,value:"C",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];

                            rightMes=`The motive system is crippled reducing tactical speed by half!`;
                        }else if(actor.system.secChar.speed.motive==="C"){

                            ae.changes=[{key:`data.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                        {key:`data.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];

                            rightMes=`The motive system is destroyed immobilizing the vehicle!`;
                        }else{
                            rightMes="The motive system is already destroyed!";
                        }

                        activeEffects.push(ae);
                    }

                    break;
                case "turret":                    
                    weapon=weapon.document;
                    weaponData=weapon.system;
                    weaponUpdate={};
                    if(weaponData.state.value==="O"||weaponData.state.value===""){
                        weaponUpdate["data.state.value"]="D";
                        rightMes=`${weapon.name} is damaged.`;
                    }else if(weaponData.state.value==="D"){
                        weaponUpdate["data.state.value"]="X";
                        rightMes=`${weapon.name} is destroyed.`;
                    }
                    weapon.update(weaponUpdate);
                    break;
            }
        }

        //report crit effect
        let chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:rightMes,
                         classes:["fortyk"],
                         flavor:`${source} ${hitLoc} Critical effect`,
                         author:actor.name}
        let critMsg=await ChatMessage.create(chatOptions,{});
    }
    //applies critical results to token/actor
    static async critEffects(token,num,hitLoc,type,ignoreSON,activeEffects=null,source=""){
        if(game.user.isGM||token.owner){
            let actor=token.actor;
            if(actor.type!=="vehicle"){
                switch(type){
                    case "Energy":
                        await this.energyCrits(actor,num,hitLoc,ignoreSON,activeEffects,source);
                        break;
                    case "Explosive":
                        await this.explosiveCrits(actor,num,hitLoc,ignoreSON,activeEffects,source);
                        break;
                    case "Impact":
                        await this.impactCrits(actor,num,hitLoc,ignoreSON,activeEffects,source);
                        break;
                    case "Rending":
                        await this.rendingCrits(actor,num,hitLoc,ignoreSON,activeEffects,source);
                        break;
                }
            }else{
                await this.vehicleCrits(token,num,hitLoc,ignoreSON,activeEffects,source);
            }
        }else{
            //if user isnt GM use socket to have gm update the actor
            let tokenId=token.data._id;
            let socketOp={type:"critEffect",package:{token:tokenId,num:num,hitLoc:hitLoc,type:type,ignoreSON:ignoreSON}}
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async energyCrits(actor,num,hitLoc,ignoreSON,activeEffects=null,source=""){
        switch(hitLoc){
            case "head":
                await this.energyHeadCrits(actor,num,ignoreSON,activeEffects,source);
                break;
            case "body":
                await this.energyBodyCrits(actor,num,ignoreSON,activeEffects,source);
                break;
            case "lArm":
                await this.energyArmCrits(actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rArm":
                await this.energyArmCrits(actor,num,"right",ignoreSON,activeEffects,source);
                break;
            case "lLeg":
                await this.energyLegCrits(actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rLeg":
                await this.energyLegCrits(actor,num,"right",ignoreSON,activeEffects,source);
                break;
        }
    }
    static async energyHeadCrits(actor,num,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("head","Head", num, "Energy",actor,source);
        switch(num){
            case 1:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                }
                ae.changes=[]
                for(let char in game.fortyk.FORTYK.skillChars){
                    if(char!=="t"){
                        ae.changes.push({key:`data.characteristics.${char}.total`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}); 
                    }
                }
                activeEffects.push(ae);
                break;
            case 2:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                break;
            case 4:
                this._addFatigue(actor,2);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`data.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}]
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Facial scarring"}]);
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]);
                ae.changes=[{key:`data.characteristics.per.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Severe facial scarring"}]);
                activeEffects.push(ae);
                break;
            case 7:
                this._addFatigue(actor,rolls.rolls[0]);
                actor.createEmbeddedDocuments("Item",[{name:"Permanently Blinded",type:"injury"}]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`data.characteristics.fel.value`,value:rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Blind"}]);
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Tremendous facial scarring"}]);
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an energy head critical hit");
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an energy head critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy head critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async energyBodyCrits(actor,num,ignoreSON,activeEffects=null,source=""){
        let tTest=false;
        let agiTest=false;
        let actorToken=getActorToken(actor);
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("body","Body", num, "Energy",actor,source);
        switch(num){
            case 1:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 2:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 3:
                this._addFatigue(actor,2);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                agiTest=rolls.tests[0]
                if(!agiTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                    activeEffects.push(ae);
                }
                tTest=rolls.tests[1]
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    }
                    activeEffects.push(ae);
                }
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[1]
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                agiTest=rolls.tests[0]
                if(!agiTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                    activeEffects.push(ae);
                }
                break;
            case 7:
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                injury.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                await this._createInjury(actor,"Third degree chest burns.",injury);
                break;
            case 8:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("s")]);
                ae.changes=[{key:`data.characteristics.s.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                            {key:`data.characteristics.s.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`data.characteristics.t.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                            {key:`data.characteristics.t.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`data.characteristics.agi.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                            {key:`data.characteristics.agi.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an energy body critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy body critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async energyArmCrits(actor,num,arm,ignoreSON,activeEffects=null,source=""){
        let tTest=false;
        let actorToken=getActorToken(actor);
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Energy",actor,source);
        switch(num){
            case 1:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                break;
            case 2:
                this._addFatigue(actor,1);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                break;
            case 3:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                ae.changes=[{key:`data.characteristics.ws.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.changes=[{key:`data.characteristics.bs.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Lost "+arm+" hand",injury);
                break;
            case 7:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 8:
                this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[1]
                    }
                    activeEffects.push(ae);
                }
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Lost "+arm+" arm",injury);
                break;
            case 9:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an energy arm critical hit");
                    return;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return
                    }
                    this._addFatigue(actor,rolls.rolls[0]);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    }
                    activeEffects.push(ae);
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                }
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy arm critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async energyLegCrits(actor,num,leg,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let critActiveEffect=[];
        let tTest=false;
        let injury=null;
        if(num<10&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Energy",actor,source);
        switch(num){
            case 1:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:2
                }
                activeEffects.push(ae);
                break;
            case 2:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,1);
                }
                break;
            case 3:
                this._addFatigue(actor,1);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                ae.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 5:
                this._addFatigue(actor,1);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                ae.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,2);
                tTest=rolls.tests[0];
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                if(tTest.value){
                    activeEffects.push(injury);
                }else{
                    await this._createInjury(actor,"Broken "+leg+" foot",injury);
                }
                break;
            case 7:
                this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    }
                    activeEffects.push(ae);
                }
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Broken "+leg+" leg",injury);
                break;
            case 8:
                this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    }
                }
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Lost "+leg+" leg",injury);
                break;
            case 9:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an energy leg critical hit");
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return
                    }
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                }
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy leg critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async explosiveCrits(actor,num,hitLoc,ignoreSON,activeEffects=null,source=""){
        switch(hitLoc){
            case "head":
                await this.explosiveHeadCrits(actor,num,ignoreSON,activeEffects,source);
                break;
            case "body":
                await this.explosiveBodyCrits(actor,num,ignoreSON,activeEffects,source);
                break;
            case "lArm":
                await this.explosiveArmCrits(actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rArm":
                await this.explosiveArmCrits(actor,num,"right",ignoreSON,activeEffects,source);
                break;
            case "lLeg":
                await this.explosiveLegCrits(actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rLeg":
                await this.explosiveLegCrits(actor,num,"right",ignoreSON,activeEffects,source);
                break;
        }
    }
    static async explosiveHeadCrits(actor,num,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<6&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("head","Head", num, "Explosive",actor,source);
        switch(num){
            case 1:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 2:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 3:
                this._addFatigue(actor,2);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]);
                    injury.changes=[{key:`data.characteristics.per.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    injury.changes.push({key:`data.characteristics.fel.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD});
                    await this._createInjury(actor,"Facial scar",injury);
                }
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                ae.changes=[{key:`data.characteristics.int.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:2
                    }
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                    ae.changes=[{key:`data.characteristics.int.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                injury.changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this._createInjury(actor,"Severe facial scarring",injury);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                await this._createInjury(actor,"Deaf",injury);
                break;
            case 6:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                break;
            case 7:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async explosiveBodyCrits(actor,num,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("body","Body", num, "Explosive",actor,source);
        switch(num){
            case 1:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 2:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                await this._addFatigue(actor,rolls.rolls[0]);
                activeEffects.push(ae);
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 4:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    }
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                await this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                    ae.changes=[{key:`data.characteristics.t.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 6:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 7:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")]);
                    activeEffects.push(ae);
                }
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an explosive body critical hit");
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an explosive body critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an explosive body critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async explosiveArmCrits(actor,num,arm,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Explosive",actor,source);
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    }
                    activeEffects.push(ae);
                }
                break;
            case 3:
                await this._createInjury(actor,arm+`hand missing ${rolls.rolls[0]} fingers.`,null);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                ae.changes=[{key:`data.characteristics.ws.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.changes=[{key:`data.characteristics.bs.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 5:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                    ae.changes=[{key:`data.characteristics.ws.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                    ae.changes=[{key:`data.characteristics.bs.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }else{
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" hand",injury);
                }
                break;
            case 6:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                await this._addFatigue(actor,rolls.rolls[0]);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 7:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an explosive arm critical hit");
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return
                    }
                    await this._addFatigue(actor,rolls.rolls[0]);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[1]
                    }
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                }
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an explosive arm critical hit");
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an explosive arm critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an explosive arm critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async explosiveLegCrits(actor,num,leg,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Explosive",actor,source);
        switch(num){
            case 1:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 2:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4:
                let chatScatter={user: game.user._id,
                                 speaker:{actor,alias:actor.name},
                                 content:`${actor.name} is blown away! <img class="fortyk" src="../systems/fortyk/icons/scatter.png">`,
                                 flavor:"Target is blown away!",
                                 author:actor.name}
                await ChatMessage.create(chatScatter,{});
                let distanceRoll=new Roll("1d5");
                await distanceRoll.roll();
                await distanceRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for scatter distance."
                });
                let directionRoll=new Roll("1d10");
                await directionRoll.roll();
                await directionRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for scatter direction."
                });
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                activeEffects.duration={
                    rounds:rolls.rolls[0]
                }
                ae.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 5:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,rolls.rolls[0]);
                }
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this._createInjury(actor,"Lost "+leg+" foot",injury);
                }else{
                    await this._createInjury(actor,"Useless "+leg+" leg",injury);
                }
                break;
            case 7:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an explosive leg critical hit");
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return
                    }
                    this._addFatigue(actor,rolls.rolls[0]);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[1]
                    }
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    ae.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    activeEffects.push(ae);
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                }
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an explosive leg critical hit");
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an explosive leg critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an explosive leg critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async impactCrits(actor,num,hitLoc,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        switch(hitLoc){
            case "head":
                await this.impactHeadCrits(actor,num,ignoreSON,activeEffects,source);
                break;
            case "body":
                await this.impactBodyCrits(actor,num,ignoreSON,activeEffects,source);
                break;
            case "lArm":
                await this.impactArmCrits(actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rArm":
                await this.impactArmCrits(actor,num,"right",ignoreSON,activeEffects,source);
                break;
            case "lLeg":
                await this.impactLegCrits(actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rLeg":
                await this.impactLegCrits(actor,num,"right",ignoreSON,activeEffects,source);
                break;
        }
    }
    static async impactHeadCrits(actor,num,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let agiTest=false;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("head","Head", num, "Impact",actor,source);
        switch(num){
            case 1:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                ae.changes=[{key:`data.characteristics.per.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                ae.changes=[{key:`data.characteristics.int.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } 
                }
                activeEffects.push(ae);
                break;
            case 4:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } 
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 5:
                this._addFatigue(actor,1);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                } 
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                ae.changes=[{key:`data.characteristics.int.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 6:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 7:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an impact head critical hit");
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact head critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact head critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async impactBodyCrits(actor,num,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let agiTest=false;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("body","Body", num, "Impact",actor,source);
        switch(num){
            case 1:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 2:
                this._addFatigue(actor,1);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:2
                }
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,rolls.rolls[0]);
                }
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:2
                }
                activeEffects.push(ae);
                break;
            case 7:
                await this._createInjury(actor,rolls.rolls[0]+" ribs broken",null);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 8:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact body critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact body critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async impactArmCrits(actor,num,arm,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Impact",actor,source);
        switch(num){
            case 1:
                break;
            case 2:
                this._addFatigue(actor,1);
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 4:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                    ae.changes=[{key:`data.characteristics.ws.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                    ae.changes=[{key:`data.characteristics.bs.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                activeEffects.push(ae);
                await this._createInjury(actor,"Useless "+arm+" arm",null);
                break;
            case 6:
                this._addFatigue(actor,1);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                    ae.changes=[{key:`data.characteristics.ws.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                    ae.changes=[{key:`data.characteristics.bs.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 7:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an impact arm critical hit");
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return
                    }
                    this._addFatigue(actor,rolls.rolls[0]);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[1]
                    }
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Useless "+arm+" arm",injury);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact arm critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact arm critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async impactLegCrits(actor,num,leg,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Impact",actor,source);
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:1
                }
                ae.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } 
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                } 
                activeEffects.push(ae);
                let base=actor.system.secChar.movement.half;
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`data.secChar.movement.multi`,value:(1/base),mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,2);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this._createInjury(actor,"Lost "+leg+" foot",injury);
                    activeEffects.push(injury);
                }else{
                    ae=injury;
                    activeEffects.push(ae);
                }
                break;
            case 7:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:2
                } 
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Useless "+leg+" leg",injury);
                activeEffects.push(injury);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an impact leg critical hit");
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return
                    }
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    activeEffects.push(injury);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                    ae.changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact leg critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact leg critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async rendingCrits(actor,num,hitLoc,ignoreSON,activeEffects=null,source=""){
        switch(hitLoc){
            case "head":
                await this.rendingHeadCrits(actor,num,ignoreSON,activeEffects,source);
                break;
            case "body":
                await this.rendingBodyCrits(actor,num,ignoreSON,activeEffects,source);
                break;
            case "lArm":
                await this.rendingArmCrits(actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rArm":
                await this.rendingArmCrits(actor,num,"right",ignoreSON,activeEffects,source);
                break;
            case "lLeg":
                await this.rendingLegCrits(actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rLeg":
                await this.rendingLegCrits(actor,num,"right",ignoreSON,activeEffects,source);
                break;
        }
    }
    static async rendingHeadCrits(actor,num,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("head","Head", num, "Rending",actor,source);
        switch(num){
            case 1:
                if(parseInt(actor.system.characterHitLocations.head.armor)===0){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                ae.changes=[{key:`data.characteristics.ws.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                ae.changes=[{key:`data.characteristics.bs.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("target")]);
                ae.changes=[{key:`data.characterHitLocations.head.armorMod`,value:-99,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                ae.changes=[{key:`data.characteristics.per.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                    await this._createInjury(actor,"Lost eye",injury);
                }
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                if(parseInt(actor.system.characterHitLocations.head.armor)===0){
                    await this._createInjury(actor,"Lost ear",null);
                    tTest=rolls.tests[0];
                    if(!tTest.value){
                        ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                        ae.changes=[{key:`data.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                        activeEffects.push(ae);
                    }
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                    activeEffects.push(ae);
                }else{
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects["target"]);
                    ae.changes=[{key:`data.characterHitLocations.head.armorMod`,value:-99,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    activeEffects.push(ae);
                }
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                if(rolls.rolls[1]<=3){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                    await this._createInjury(actor,"Lost eye",injury);
                }else if(rolls.rolls[1]<=7){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                    injury.changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(injury);
                    await this._createInjury(actor,"Lost nose",injury);
                }else if(rolls.rolls[1]<=10){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                    await this._createInjury(actor,"Lost ear",injury);
                }
                break;
            case 7:
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                await this._createInjury(actor,"Permanent blindness",injury);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                break;
            case 8:
                await this.applyDead(actorToken,actor,"a rending head critical hit");
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending head critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending head critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async rendingBodyCrits(actor,num,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("body","Body", num, "Rending",actor,source);
        switch(num){
            case 1:
                if(parseInt(actor.system.characterHitLocations.body.armor)===0){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:
                this._addFatigue(actor,1);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } 
                    activeEffects.push(ae);
                }
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                } 
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                } 
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 6:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 7:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("crippled")]);
                activeEffects.push(ae);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"a rending body critical hit");
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return
                    }
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                    ae.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}]; 
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } 
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending body critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending body critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async rendingArmCrits(actor,num,arm,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Rending",actor,source);
        switch(num){
            case 1:
                break;
            case 2:
                this._addFatigue(actor,1);
                break;
            case 3:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 4:
                this._addFatigue(actor,2);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                activeEffects.push(ae);
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 6:
                tTest=rolls.tests[0];
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                if(!tTest.value){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" hand",injury);
                }else{
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,arm+` hand maimed, lost ${rolls.rolls[0]} fingers`,injury);
                }
                break;
            case 7:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("s")]);
                ae.changes=[{key:`data.characteristics.s.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"a rending arm critical hit");
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return
                    }
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[0]
                    }
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending arm critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending arm critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async rendingLegCrits(actor,num,leg,ignoreSON,activeEffects=null,source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let agiTest=false;
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Rending",actor,source);
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]); 
                    activeEffects.push(ae);
                }
                break;
            case 3:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4: 
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                    ae.changes=[{key:`data.characteristics.agi.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 6:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(injury);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this._createInjury(actor,"Lost "+leg+" foot",injury);
                }
                break;
            case 7:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                }
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"a rending leg critical hit");
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return
                    }
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    activeEffects.push(injury);
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[0]
                    }
                    activeEffects.push(ae);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending leg critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending leg critical hit");
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async vehicleCrits(token,num,hitLoc,ignoreSON,activeEffects,source){
        let actor=token.actor;
        switch(hitLoc){
            case "hull":
                await this._critMsg("hull","Hull", num, "",actor,source);
                break;
            case "weapon":
                await this._critMsg("weapon","Weapon", num, "",actor,source);
                break;
            case "motive":
                await this._critMsg("motive","Motive System", num, "",actor,source);
                break;
            case "turret":
                await this._critMsg("turret","Turret", num, "",actor,source);
                break;
        }
    }
    static async thresholdCrits(crossed,hitLoc,tar,activeEffects){
        let actor=tar.actor;
        let source="Threshold crit ";

        for(let i=0;i<crossed.length;i++){
            console.log(hitLoc)
            switch(hitLoc){
                case "hull":
                    await this._critMsg("hull","Hull", crossed[i], "",actor,source,true);
                    break;
                case "weapon":
                    await this._critMsg("weapon","Weapon", crossed[i], "",actor,source,true);
                    break;
                case "motive":
                    await this._critMsg("motive","Motive System", crossed[i], "",actor,source,true);
                    break;
                case "turret":
                    await this._critMsg("turret","Turret", crossed[i], "",actor,source,true);
                    break;
            }
        }

    }
    static async applyActiveEffect(token,effect,ignoreSON=false){
        if(effect.length>0){
            if(game.user.isGM||token.isOwner){

                let actor
                if(token instanceof Token){
                    actor=token.actor;
                }else{
                    actor=token;
                }
                console.log(effect)
                let aEs=[];
                for(let index=0; index <effect.length;index++){
                    let dupp=false;
                    let newAe=effect[index];
                    for(let ae of actor.effects){
                        if(ae.data.flags.core){
                            if(ae.data.flags.core.statusId!=="weakened"&&ae.data.flags.core.statusId!=="buff"&&ae.data.flags.core.statusId===newAe.flags.core.statusId){
                                dupp=true;
                                let change=false;
                                let upg=false;
                                let changes=ae.data.changes
                                if(ae.data.icon!==newAe.icon){
                                    change=true;
                                }
                                for(let i=0;i<ae.data.changes.length;i++){
                                    for(let z=0;z<newAe.changes.length;z++){
                                        if((ae.data.changes[i].key===newAe.changes[z].key)&&ae.data.changes[i].mode===newAe.changes[z].mode){

                                            if(ae.data.changes[i].mode===5||ae.data.changes[i].mode===0){

                                            }else{
                                                if(!isNaN(parseInt(newAe.changes[z].value))){

                                                    newAe.changes[z].value=parseInt(newAe.changes[z].value)+parseInt(ae.data.changes[i].value);
                                                }else{

                                                    newAe.changes[z].value+=ae.data.changes[i].value;
                                                }
                                            }



                                            upg=true;
                                        } 
                                    }
                                }
                                if(effect[index].duration&&(effect[index].duration.rounds>ae.duration.remaining)){
                                    change=true;
                                }
                                if(change||upg){
                                    aEs.push(newAe);
                                    await ae.delete();
                                }
                            }
                        }
                    }
                    let skip=false;
                    if(effect[index].id==="stunned"&&actor.getFlag("fortyk","ironjaw")){
                        skip=(await this.fortykTest("t", "char", (actor.system.characteristics.t.total),actor, "Iron Jaw")).value;
                    }
                    if(effect[index].id==="stunned"&&actor.getFlag("fortyk","frenzy")){
                        skip=true;
                    }
                    if(!ignoreSON&&(effect[index].id==="stunned"||effect[index].id==="bleeding")&&actor.getFlag("fortyk","stuffoffnightmares")){
                        skip=true;
                        this._sON(actor);
                    }
                    if(!dupp&&!skip){
                        aEs.push(effect[index])
                    }
                }
                console.log(aEs)
                await actor.createEmbeddedDocuments("ActiveEffect",aEs);
            }else{
                //if user isnt GM use socket to have gm update the actor
                let tokenId=token.data._id;
                let socketOp={type:"applyActiveEffect",package:{token:tokenId,effect:effect}}
                await game.socket.emit("system.fortyk",socketOp);
            }
        }
    }
    static async applyDead(target,actor,cause=""){
        if(game.user.isGM||target.owner){
            let msg=target.name+" is killed";
            if(cause!==""){
                msg+=" by "+cause+"!";
            }else{
                msg+="!";
            }
            let chatOptions={user: game.user._id,
                             speaker:{actor,alias:actor.name},
                             content:msg,
                             classes:["fortyk"],
                             flavor:`Death Report`,
                             author:actor.name}
            await ChatMessage.create(chatOptions,{});
            let id=target.data._id;
            let activeEffect=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("dead")])];
            await this.applyActiveEffect(target,activeEffect);
            try{
                let combatant = await game.combat.getCombatantByToken(id);
                let combatid=combatant.id;
                let update=[];
                update.push({"_id":combatid, 'defeated':true})
                await game.combat.updateEmbeddedDocuments("Combatant",update) 
            }catch(err){
            }
        }else{
            let tokenId=target.data._id;
            let socketOp={type:"applyDead",package:{token:tokenId,actor:actor,cause:cause}}
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async _addFatigue(actor,newfatigue){
        newfatigue=newfatigue+parseInt(actor.system.secChar.fatigue.value);
        if(game.user.isGM||actor.owner){
            await actor.update({"data.secChar.fatigue.value":newfatigue});
        }else{
            let tokenId=null;
            //if user isnt GM use socket to have gm update the actor
            if(actor.token===null){
                tokenId=getActorToken(actor).id;
            }else{
                tokenId=actor.token.data._id;
            }
            let socketOp={type:"updateValue",package:{token:tokenId,value:newfatigue,path:"data.secChar.fatigue.value"}}
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async _createInjury(actor,injury,injuryAeData){
        if(actor.type!=="npc"){
            let injuryItem=await Item.create({type:"injury",name:injury},{temporary:true});
            //injuryAeData.transfer=true;
            //await injuryItem.createEmbeddedDocuments("ActiveEffect",[injuryAeData]);
            await actor.createEmbeddedDocuments("Item",[injuryItem.data]);
        }
    }
}