/* provides functions for doing tests or damage rolls
*/
import {FORTYKTABLES} from "./FortykTables.js";
import {getActorToken} from "./utilities.js";
import {tokenDistance} from "./utilities.js";
import {getVehicleFacing} from "./utilities.js";
import {getAttackAngle} from "./utilities.js";
import {sleep} from "./utilities.js";
import {parseHtmlForInline} from "./utilities.js";
import {FortykRollDialogs} from "./FortykRollDialogs.js";

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
        await roll.evaluate({async: true});

        let weapon
        if(fortykWeapon){
            weapon=fortykWeapon
        }
        let weaponid=""
        if(fortykWeapon===null){
        }else{
            weaponid=weapon._id;
        }
        let attack=false;
        if((type==="rangedAttack"||type==="meleeAttack"||type==="focuspower"&&(fortykWeapon.system.class.value==="Psychic Bolt"||fortykWeapon.system.class.value==="Psychic Barrage"||fortykWeapon.system.class.value==="Psychic Storm"||fortykWeapon.system.class.value==="Psychic Blast"))){
            attack=true;

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
        let title=""
        if(delayMsg){
            title=label.charAt(0).toUpperCase()+label.slice(1)+" test";
        }else if(reroll){
            title="Rerolling "+label+" test";
        }else{
            title="Rolling "+label+" test";
        }
        if(type==="rangedAttack"||type==="meleeAttack"){
            title+=` using ${weapon.name}`;
            if(weapon.type==="rangedWeapon"){
                if(weapon.system.ammo.name){
                    title+=` with ${weapon.system.ammo.name}`;
                }
            }
        }
        var isVehicle=false;
        //check for vehicle target and if attacker is vehicle
        if(actor.type!=="spaceship"){
            var vehicle=actor.system.secChar.lastHit.vehicle;

            if(actor.type==="vehicle"){
                isVehicle=true;
            }
        }
        if(vehicle){
            let facing=actor.system.secChar.lastHit.facing;
            title+=` against ${facing.label} armor`
        }
        templateOptions["title"]=title+".";
        const testRoll=target-roll._total;
        //check for jams
        let jam=false;
        if(type==="rangedAttack"){
            if(weapon.system.quality.value==="Best"){
            }else if(fortykWeapon.getFlag("fortyk","reliable")){
                if(testRoll===100){
                    jam=true; 
                }
            }else if(fortykWeapon.getFlag("fortyk","unreliable")||weapon.system.quality.value==="Poor"){
                if(testRoll>=91){
                    jam=true; 
                }
                if(weapon.system.quality.value==="Poor"){
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

        if(isVehicle&&fortykWeapon){
            if(fortykWeapon.getFlag("fortyk","taxing")){
                let newHeat=parseInt(actor.system.knight.heat.value)+parseInt(fortykWeapon.getFlag("fortyk","taxing"));
                actor.update({"system.knight.heat.value":newHeat});
            }
        }
        //calculate degrees of failure and success
        if((testResult&&testRoll<96||testRoll===1)&&!jam){
            testDos=Math.floor(Math.abs(roll._total)/10)+1+Math.ceil(charObj.uB/2);
            //close quarter combat dos bonus
            if(attack&&actor.getFlag("fortyk","closequarterdiscipline")){
                let attackRange=actor.system.secChar.lastHit.attackRange;
                if(attackRange==="melee"||attackRange==="pointBlank"||attackRange==="short"){
                    testDos+=1;
                } 
            }
            //weapon instinct bonus DoS
            if(attack&&actor.getFlag("fortyk","weaponinstinct")&&fortykWeapon&&weapon.system.type.value==="Exotic"){
                testDos+=1;
            }
            //void strike extra dos
            if(attack&&fortykWeapon&&fortykWeapon.getFlag("fortyk","voidstrike")){
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

        //determine number of hits
        let hits=0;
        let attackType=actor.system.secChar.lastHit.attackType;
        if(attack&&templateOptions["success"]){
            hits=1;
            let attackTarget=game.user.targets.first();

            if(actor.type!=="vehicle"&&actor.system.formation.value){
                hits=Math.min(testDos,actor.system.secChar.wounds.value); 
            }else if(type==="meleeAttack"){
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
                    rof=parseInt(weapon.system.rof[1].value)-1;
                    hits+=Math.min(rof,Math.floor((testDos-1)/2));
                }else if(attackType==="full"){
                    rof=parseInt(weapon.system.rof[2].value);
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
                        }else if(distance<=parseInt(weapon.system.range.value)/2){
                            hits+=Math.floor(testDos/2);
                        }
                    }
                }
            }else if(type==="focuspower"){
                let pr=weapon.system.curPR.value;
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
            let evadepenalty=0;
            if(actor.getFlag("fortyk","inescapableattack")&&(attackType!=="semi"&&attackType!=="full"&&attackType!=="swift"&&attackType!=="lightning")&&((actor.getFlag("fortyk","inescapableattack").toLowerCase().indexOf("ranged")!==-1&&type==="rangedAttack")||(actor.getFlag("fortyk","inescapableattack").toLowerCase().indexOf("melee")!==-1&&type==="meleeAttack"))){
                let inescPenalty=Math.max(-60,testDos*(-10));
                evadepenalty+=inescPenalty;
                templateOptions["inescapableAttack"]=`Inescapable attack evasion penalty: ${inescPenalty}`; 
            }
            let tarActor;
            if(attackTarget!==undefined){
                tarActor=attackTarget.actor;
                let tarSize=tarActor.system.secChar.size.value;
                let attackerSize=actor.system.secChar.size.value;
                if(attackerSize>tarSize){
                    let penalty=(tarSize-attackerSize)*10;
                    evadepenalty+=penalty;
                    templateOptions["sizePenalty"]=`Evasion penalty due to size difference: ${penalty}`
                }
            }

            evadepenalty=Math.max(evadepenalty,-60);
            if(tarActor){
                if(game.user.isGM||tarActor.isOwner){
                    await tarActor.setFlag("fortyk","evadeMod",evadepenalty);
                }else{
                    //if user isnt GM use socket to have gm update the actor
                    let tokenId=attackTarget.id;
                    let socketOp={type:"setFlag",package:{token:tokenId,value:evadepenalty,scope:"fortyk",flag:"evadeMod"}}
                    await game.socket.emit("system.fortyk",socketOp);
                }

            }

        }
        if(attackType==="charge"&&actor.getFlag("fortyk","hardtarget")){
            actor.setFlag("fortyk","hardtargetEvasion",true);
        }

        //give the chat object options and stuff
        let result={}
        result.roll=roll;
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
            if(fortykWeapon.getFlag("fortyk","tarHead")){
                hitlocation=FORTYKTABLES.hitLocations[1];
                vehicleHitlocation=FORTYKTABLES.vehicleHitLocations[81];
            }
            await actor.update({"system.secChar.lastHit.value":hitlocation.value,"system.secChar.lastHit.label":hitlocation.label,"system.secChar.lastHit.dos":testDos,"system.secChar.lastHit.hits":hits,"system.secChar.lastHit.vehicleHitLocation":vehicleHitlocation});
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

        if(attack&&type==="rangedAttack"){
            //blast
            let blast=false;
            if(Number.isInteger(parseInt(fortykWeapon.getFlag("fortyk","blast")))){
                blast=true;
            }
            let rof=1;
            if(attackType==="semi"){
                rof=parseInt(weapon.system.rof[1].value);

            }else if(attackType==="full"){
                rof=parseInt(weapon.system.rof[2].value);
            }
            console.log(fortykWeapon,weapon)
            if(weapon.getFlag("fortyk","twinlinked")){
                rof=rof*2;
            }
            if(weapon.getFlag("fortyk","storm")){
                rof=rof*2;
            }
            console.log(rof)
            let missedHits=rof-hits;
            var attacker=actor.getActiveTokens()[0];
            if((weapon.system.type==="Launcher"||weapon.system.type==="Grenade")&&blast&&!testResult&&jam){
                let fumbleRoll=new Roll("1d10");
                await fumbleRoll.evaluate({async: true});
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
            }else if(attack&&blast){

                let targets=game.user.targets;
                if(targets.size>0){
                    let attackTarget=game.user.targets.first();



                    let attackAngle=getAttackAngle(attackTarget,attacker);
                    let scatterDice="1d5";
                    if(attackTarget!==undefined){


                        let distance=tokenDistance(attacker,attackTarget);

                        let weaponRng=parseInt(weapon.system.range.value);
                        if(distance<=weaponRng/2){
                        }else if(distance<=weaponRng*2){
                            scatterDice="1d10";
                        }else if(distance<=weaponRng*3){
                            scatterDice="2d10";
                        }else if(distance<=weaponRng*4){
                            scatterDice="3d10";
                        }
                    }
                    let targetx=attackTarget.x+(attackTarget.w/2);//adjust to get middle of token
                    let targety=attackTarget.y+(attackTarget.h/2);//adjust to get middle of token

                    let gridRatio=canvas.dimensions.size/canvas.dimensions.distance;
                    let templates=[];
                    let contentStr="<div class='flexcol'><img class='fortyk' src='../systems/fortyk/icons/scatter.png'>";

                    for(let i=0;i<rof;i++){
                        let template={};
                        template.angle=0;
                        template.borderColor="#000000";
                        template.direction=2;
                        template.distance=Math.max(0.1,fortykWeapon.getFlag("fortyk","blast"));

                        template.fillColor=game.user.color;
                        template.hidden=false;
                        template.t="circle";
                        if(i<missedHits){
                            //if the hit is a miss roll random scatter direction
                            let directionRoll=new Roll("1d10");
                            await directionRoll.evaluate({async: true});
                            let directionIndex=directionRoll._total;
                            let baseAngle=FORTYKTABLES.scatterAngles[directionIndex-1];
                            let modifiedAngle=baseAngle+attackAngle;
                            if(modifiedAngle>359){modifiedAngle=modifiedAngle-360};

                            let distanceRoll=new Roll(scatterDice);
                            await distanceRoll.evaluate({async: true});
                            let mult=1;
                            if(!templateOptions["success"]){
                                mult=testDos;
                            }
                            let distance=distanceRoll._total*mult;

                            let pixelDistance=distance*gridRatio;
                            let radianAngle=modifiedAngle*(Math.PI/180);
                            let xDistance=-(pixelDistance*Math.sin(radianAngle));
                            let yDistance=(pixelDistance*Math.cos(radianAngle));
                            contentStr+=`<div>Shot #${i+1} scatters (${distanceRoll._total}x${mult})m to the ${directionRoll._total}</div>`;
                            template.x=Math.min(xDistance+targetx,canvas.dimensions.width);
                            if(template.x<0){template.x=0};
                            template.y=Math.min(yDistance+targety,canvas.dimensions.height);
                            if(template.y<0){template.y=0};
                        }else{
                            contentStr+=`<div>Shot #${i+1} is a direct hit!</div>`;
                            template.x=targetx;
                            template.y=targety;
                        }





                        templates.push(template);


                    }
                    contentStr+="</div>"
                    let scene= game.scenes.active;
                    let instancedTemplates= await scene.createEmbeddedDocuments("MeasuredTemplate",templates);

                    let chatScatter= {user: game.user._id,
                                      speaker:{actor,alias:actor.name},
                                      content:contentStr,
                                      flavor:"Shot Scatters!",
                                      author:actor.name}
                    await ChatMessage.create(chatScatter,{});
                }


                /*let chatScatter={user: game.user._id,
                                 speaker:{actor,alias:actor.name},
                                 content:`The shot goes wild! <img class="fortyk" src="../systems/fortyk/icons/scatter.png">`,
                                 flavor:"Shot Scatters!",
                                 author:actor.name}
                await ChatMessage.create(chatScatter,{});
                let scatterDice="1d5";
                if(attackTarget!==undefined){
                    let attackerToken=getActorToken(actor);

                    let distance=tokenDistance(attackerToken,attackTarget);
                    let weaponRng=parseInt(weapon.system.range.value);
                    if(distance<=weaponRng/2){
                    }else if(distance<=weaponRng*2){
                        scatterDice="1d10";
                    }else if(distance<=weaponRng*3){
                        scatterDice="2d10";
                    }else if(distance<=weaponRng*4){
                        scatterDice="3d10";
                    }
                }
                let distanceRoll=new Roll(scatterDice);
                await distanceRoll.evaluate({async: true});
                await distanceRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for scatter distance."
                });
                let directionRoll=new Roll("1d10");
                await directionRoll.evaluate({async: true});
                await directionRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for scatter direction."
                });*/
            }
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
            let powerPR=weapon.system.curPR.value;
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
                    await psyRoll.evaluate({async: true});
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
                        this.perilsOfTheWarp(actor,ork);
                    }else{
                        //if user isnt GM use socket to have gm roll the perils result
                        let socketOp={type:"perilsRoll",package:{actorId:actor.id,ork:ork}}
                        await game.socket.emit("system.fortyk",socketOp);
                    }
                }  
            }
        } 
        else if(type==="fear"&&!templateOptions["success"]){
            //generating insanity when degrees of failure are high enough
            if(testDos>=3){
                let insanityRoll=new Roll("1d5");
                await insanityRoll.evaluate({async: true});
                await insanityRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling insanity for 3+ Degrees of failure (Add to sheet)"
                });
            }
            if(game.combats.active){
                let fearRoll=new Roll("1d100 +@mod",{mod:testDos*10});
                await fearRoll.evaluate({async: true});
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
    static async perilsOfTheWarp(actor,ork=false){
        let perilsResult
        let rollMode="";
        let perilsFlavor="Perils of the Warp!!";
        if(game.settings.get("fortyk","privatePerils")){
            rollMode="gmroll";
        }else{
            rollMode="default";
        }

        if(actor.getFlag("fortyk","soulbound")){
            let soulboundRoll=new Roll("3d10",{});
            await soulboundRoll.evaluate({async: true});
            await soulboundRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ user: game.users.current }),
                flavor: "Soulbound perils of the Warp dice result"
            },{rollMode:rollMode})
            let tensDigit=soulboundRoll.terms[0].values[0];
            let onesDigit=soulboundRoll.terms[0].values[1];
            let extraDie=soulboundRoll.terms[0].values[2];
            if(tensDigit>extraDie){
                tensDigit=extraDie;
            }else if(onesDigit>=extraDie){
                onesDigit=extraDie;
            }

            /*
            let digits=[];

            digits.push(soulboundRoll.terms[0].values[0]);
            digits.push(soulboundRoll.terms[0].values[1]);
            digits.push(soulboundRoll.terms[0].values[2]);
            let tensDigit=Infinity;
            let digit=Infinity;
            for(let i=0;i<digits.length;i++){
                if(tensDigit>digits[i]){
                    digit=tensDigit;
                    tensDigit=digits[i];

                }else if(digit>digits[i]){
                    digit=digits[i];
                }
            }*/
            perilsResult=10*tensDigit+onesDigit;
        }else{
            let perilsRoll=new Roll("1d100",{});

            if(ork){
                perilsFlavor="'Eadbang!";
            }
            await perilsRoll.evaluate({async: true});
            await perilsRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ user: game.users.current }),
                flavor: perilsFlavor
            },{rollMode:rollMode});
            perilsResult=parseInt(perilsRoll._total);  
        }


        if(perilsResult>100){perilsResult=100}
        let perilsMessage=FORTYKTABLES.perils[perilsResult];
        if(ork){perilsMessage=FORTYKTABLES.eadBang[perilsResult]}
        let chatPhenom={user: game.users.current,
                        speaker:{user: game.users.current},
                        content:perilsMessage,
                        classes:["fortyk"],
                        flavor:perilsFlavor+` #${perilsResult}`,
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
        let formula=`1d100cs<=${rating}`;

        let overloaded=false;
        let remainingHits=hits;

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
        let rolls=[];
        while(!(breakOnOverload&&overloaded)&&i<hits){
            let roll=new Roll(formula, {});

            await roll.evaluate();
            roll.dice[0].options.rollOrder = i+1;
            rolls.push(roll);
            console.log(roll)
            let roll1=roll.dice[0].values[0];
            let pass=roll.dice[0].results[0].success;
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
            await forcefield.update({"system.broken.value":true});
            templateOptions.breaks=`${forcefield.name} breaks!`
        }
        if(remainingHits===0){
            actor.setFlag("fortyk","evadeMod",0);
        }
        templateOptions.results=hitResults;
        templateOptions.remainingHits=remainingHits;
        let renderedTemplate= await renderTemplate(template,templateOptions);
        let chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:renderedTemplate,
                         type: CONST.CHAT_MESSAGE_TYPES.ROLL,
                         rolls: rolls,
                         rollMode: game.settings.get("core", "rollMode"),
                         sound:"sounds/dice.wav",
                         classes:["fortyk"],
                         author:actor.name}
        await ChatMessage.create(chatOptions);

    }
    //handles damage rolls and applies damage to the target, generates critical effects
    static async damageRoll(formula,actor,fortykWeapon,hits=1, self=false, overheat=false,magdamage=0,extraPen=0,rerollNum=0, user=game.users.current, lastHit=null, targets=null){
        let weapon=deepClone(fortykWeapon);
        if(!weapon.system.isPrepared){
            weapon.prepareData();
        }
        let righteous=10;
        let damageType=weapon.system.damageType.value.toLowerCase();
        if(fortykWeapon.getFlag("fortyk","vengeful")){
            righteous=fortykWeapon.getFlag("fortyk","vengeful");
        }
        if(fortykWeapon.getFlag("fortyk","gauss")){
            righteous--;
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
            weapon.system.pen.value=parseInt(weapon.system.pen.value)+Math.ceil(actor.system.characteristics.s.bonus/2);
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
            if(actor.getFlag("fortyk","chainweaponexpertise")&&weapon.system.type.value==="Chain"){
                newNum++;
            }
            form=form.slice(dPos);
            form=newNum+form;
            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);
            if(actor.getFlag("fortyk","chainweaponexpertise")&&weapon.system.type.value==="Chain"){
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
        if(rerollNum>0){
            let dPos = form.indexOf('d10');



            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);

            form=startstr+`r<=${rerollNum}`+endstr;
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
                    await randomLocation.evaluate({async: true});
                    //curHit=game.fortyk.FORTYKTABLES.hitLocations[randomLocation._total];
                }
            }


            let roll=new Roll(form,actor.system);
            let label = weapon.name ? `Rolling ${weapon.name} damage to ${curHit.label}.` : 'damage';
            console.log(roll)
            await roll.evaluate({async: true});
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
                try{
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
                }catch(err){

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
                            armorSuit=data.secChar.wornGear.armor;
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
                        //spray and blast weapons always hit the body hit location, the hull on vehicles
                        if(fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","spray")){
                            if(!vehicle){
                                curHit={value:"body",label:"Body"}
                            }else{
                                curHit={value:"hull",label:"Hull"}
                            }

                        }
                        //hordes and formations always get hit in the body
                        if(isHordelike){
                            curHit.value="body";
                            curHit.label="Body";
                        }
                        let damageOptions={
                            wpnName:fortykWeapon.name,
                            target:tarActor.name,
                            dmgType:weapon.system.damageType.value,
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
                                    await wpnRoll.evaluate({async: true});
                                    targetWpn=facingWeapons[wpnRoll._total];
                                    newFacingString=targetWpn.name;
                                    if(targetWpn.system.mounting.value==="turret"){
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
                            let forRaces=actor.getFlag("fortyk","deathwatchtraining");
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
                        let terms=roll.terms;
                        let numbers=[]
                        console.log(terms)
                        //parsing the roll result
                        for ( let t=0; t<terms.length;t++){
                            console.log(terms[t])
                            if(terms[t] instanceof Die){
                                console.log(terms[t])
                                for ( let r of roll.terms[t].results ) {
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
                            }else if(terms[t] instanceof NumericTerm){
                                numbers.push(terms[t].number);
                            }

                        }
                        console.log(numbers)
                        //compiling the roll output
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

                            for(let n=0;n<numbers.length;n++){
                                if(numbers[n]!==0){
                                    damageString+=`+${numbers[n]}`
                                }

                            }
                            //damageString=roll.result.replace(/\s+/g, '')
                            //damageString="+"+damageString.substring(damageString.indexOf("+") + 1)

                            damageString ="("+rollString+")"+damageString;
                        }
                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        damageOptions.results.push(`<div style="flex:none">Weapon damage roll: ${damageString}</div>`)
                        if(tens){
                            damageOptions.results.push(`<span class="chat-righteous">Righteous Fury!</span>`)
                        }
                        damageOptions.results.push(`</div>`);
                        console.log(armorSuit)
                        if(jQuery.isEmptyObject(armorSuit)){
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
                            await randomKiller.evaluate({async: true});
                            let killerCrit=randomKiller._total;
                            await this.critEffects(tar,killerCrit,curHit.value,weapon.system.damageType.value,ignoreSON,activeEffects,"Killer's Eye ");
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


                        //check if weapon ignores soak
                        let ignoreSoak=false;
                        if(fortykWeapon.getFlag("fortyk","ignoreSoak")){
                            ignoreSoak=true;
                        }
                        if(tarActor.getFlag("fortyk","machine")&&fortykWeapon.getFlag("fortyk","mindscrambler")){
                            ignoreSoak=true;
                        }
                        if(!ignoreSoak){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let pen=0;
                            //random pen logic
                            if(isNaN(weapon.system.pen.value)){
                                let randomPen=new Roll(weapon.system.pen.value,{});
                                await randomPen.evaluate({async: true});
                                damageOptions.results.push(`<span>Random weapon ${weapon.system.pen.value} penetration: ${randomPen._total}</span>`);
                                pen=randomPen._total;
                            }else{
                                pen=parseInt(weapon.system.pen.value); 
                            }
                            damageOptions.results.push(`<span>Base weapon penetration: ${pen}</span>`);
                            pen+=extraPen;
                            if(extraPen){
                                damageOptions.results.push(`<span>Additional penetration: ${extraPen}</span>`);
                            }
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
                                let shortRange=parseInt(weapon.system.range.value)/2
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
                            //scatter weapon logic
                            if(fortykWeapon.getFlag("fortyk","scatter")){



                                if(distance>=parseInt(weapon.system.range.value)/2){
                                    damageOptions.results.push(`<div class="chat-target flexcol">`);
                                    damageOptions.results.push(`<span> Armor is doubled against Scatter weapon at this distance!</span>`);
                                    soak+=armor;
                                    damageOptions.results.push(`</div>`);
                                }
                            }

                            //reactive plating
                            console.log(tarActor.getFlag("fortyk","reactiveplating"))
                            if(tarActor.getFlag("fortyk","reactiveplating")&&((damageType==="explosive")||damageType==="impact")){
                                soak+=Math.ceil(armor*0.1);
                                damageOptions.results.push(`<span>Reactive Plating is resistant against this damage type.</span>`);
                            }
                            //resistant armor
                            if(armorSuit.getFlag("fortyk",damageType)){
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
                            if(!vehicle&&fortykWeapon.getFlag("fortyk","wpSoak")){
                                let ts=parseInt(tarActor.system.characteristics.t.bonus);
                                soak-=ts;
                                let wps=parseInt(tarActor.system.characteristics.wp.bonus);
                                soak+=wps;
                                damageOptions.results.push(`<span>This attack targets the target's willpower instead of toughness!</span>`);
                            }else if(!vehicle&&fortykWeapon.getFlag("fortyk","felling")&&parseInt(tarActor.system.characteristics.t.uB)){
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
                        if(tarActor.getFlag("fortyk","moltenman")&&(damageType==="energy")){
                            damage=Math.ceil(damage/2);
                            damageOptions.results.push(`<span>Molten man reduces energy damage by half!</span>`);
                        }
                        let chatDamage=damage;
                        console.log(damage)
                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        //damage part of smite the unholy
                        if(actor.getFlag("fortyk","smitetheunholy")&&tarActor.getFlag("fortyk","fear")&&weapon.type==="meleeWeapon"){
                            if(!isNaN(tarActor.getFlag("fortyk","fear"))){
                                damage+=parseInt(tarActor.getFlag("fortyk","fear"));
                                chatDamage+=parseInt(tarActor.getFlag("fortyk","fear"));
                                damageOptions.results.push(`<span>Smite the Unholy increases damage by ${parseInt(tarActor.getFlag("fortyk","fear"))}</span>`);
                            }
                        }
                        //volkite logic
                        if(fortykWeapon.getFlag("fortyk","volkite")&&tens>0){
                            let volkForm=tens+"d10";
                            let volkRoll=new Roll(volkForm,{});
                            await volkRoll.evaluate({async: true});
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
                            if(actor.getFlag("fortyk","marksmanshonor")||distance>10){
                                let accDice=Math.min(parseInt(fortykWeapon.getFlag("fortyk","accurate")),Math.ceil((lastHit.dos-1)/2));
                                let accForm=accDice+"d10"
                                let accRoll=new Roll(accForm,{});
                                await accRoll.evaluate({async: true});
                                damageOptions.results.push(`<span>Accurate extra damage: ${accRoll.dice[0].values.join("+")}</span>`);
                                damage+=accRoll._total;
                                chatDamage+=accRoll._total;
                            }
                        }
                        //handle cover
                        let cover=parseFloat(data.secChar.cover.value);

                        if(!self&&!fortykWeapon.getFlag("fortyk","ignoreCover")&&!fortykWeapon.getFlag("fortyk","spray")&&cover&&(weapon.type==="rangedWeapon"||weapon.type==="psychicPower")){
                            if(actor.getFlag('fortyk','nowheretohide')){
                                cover=Math.max(0,cover-0.20);
                                damageOptions.results.push(`<span>Nowhere to hide reduces cover to ${Math.round(cover*100)}%</span>`);
                            }else{
                                damageOptions.results.push(`<span>Cover reduces ranged damage by ${cover*100}%</span>`);
                            }
                            let coverReduction=1-cover;
                            damage=Math.ceil(coverReduction*damage);


                        }
                        //logic against swarm enemies
                        if(tarActor.getFlag("fortyk","swarm")&&!(fortykWeapon.getFlag("fortyk","spray")||fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","flame")||fortykWeapon.getFlag("fortyk","scatter"))){
                            damage=Math.ceil(damage/2);
                            damageOptions.results.push(`<span>Swarm enemies take reduced damage against non blast, spray, flame or scatter weapons.</span>`);
                        }
                        console.log(damage)
                        damage=damage-soak;
                        console.log(damage)
                        //gauss weapon logic
                        if(fortykWeapon.getFlag("fortyk","gauss")&&tens&&!isHordelike){
                            let gaussAmt=new Roll("1d5",{});
                            await gaussAmt.evaluate({async: true});

                            damageOptions.results.push(`<label> Gauss Weapon armor damage: ${gaussAmt._total}.</label> `);

                            let newArmor=Math.max(0,(armor-gaussAmt._total));

                            let gaussAmount=-gaussAmt._total;
                            let path="";
                            if(vehicle){
                                path=`system.facings.${facing.path}.armor`;
                            }else{
                                path=`system.characterHitLocations.${curHit.value}.armorMod`;
                            }
                            let gaussActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("corrode")]);
                            gaussActiveEffect.changes=[];
                            let changes={key:path,value:gaussAmount,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}
                            gaussActiveEffect.changes.push(changes);
                            activeEffects.push(gaussActiveEffect);

                        }
                        //corrosive weapon logic
                        if(fortykWeapon.getFlag("fortyk","corrosive")&&!isHordelike){
                            let corrosiveAmt=new Roll("1d10",{});
                            await corrosiveAmt.evaluate({async: true});
                            let id=randomID(5);
                            damageOptions.results.push(`<label class="popup" data-id="${id}"> Corrosive Weapon armor damage: ${corrosiveAmt._total}. <span class="popuptext chat-background" id="${id}">Excess corrosion is transferred to damage.</span></label> `);
                            let corrosiveDamage=0;
                            let newArmor=Math.max(0,(armor-corrosiveAmt._total));
                            corrosiveDamage=Math.abs(Math.min(0,(armor-corrosiveAmt._total)));
                            let corrosiveAmount=-corrosiveAmt._total;
                            let path="";
                            if(vehicle){
                                path=`system.facings.${facing.path}.armor`;
                            }else{
                                path=`system.characterHitLocations.${curHit.value}.armorMod`;
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
                        console.log(damage)
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
                                await toxicDmg.evaluate({async: true});
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
                                await strDmg.evaluate({async: true});
                                drainActiveEffect.changes.push({key:`system.characteristics.s.value`,value:-1*strDmg._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD})
                                let tDmg=new Roll("2d10",{});
                                await tDmg.evaluate({async: true});
                                drainActiveEffect.changes.push({key:`system.characteristics.t.value`,value:-1*tDmg._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD})
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
                                await cryoRoll.evaluate({async: true});
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
                                await halluRoll.evaluate({async: true});
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
                        //luminagen weapon logic
                        if(fortykWeapon.getFlag("fortyk","luminagen")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let luminagenActiveEffect={
                                id: "luminagen",
                                name: "Luminagen",
                                icon: "icons/svg/eye.svg",
                                flags: { core: { statusId: "luminagen" } }
                            };
                            let lumiRoll=new Roll("1d5",{});
                            await lumiRoll.evaluate({async: true});
                            let lumiDuration=parseInt(lumiRoll.result);

                            luminagenActiveEffect.transfer=false;
                            luminagenActiveEffect.duration={
                                rounds:lumiDuration
                            }
                            activeEffects.push(luminagenActiveEffect);

                            damageOptions.results.push(`The target is affected by Luminagen and suffers a -10 penalty to all evasion tests for ${lumiDuration} rounds!`)
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
                                        await this.applyDead(tar,tarActor,"banishment");
                                    }else{
                                        damage+=warpdmg;
                                        chatDamage+=warpdmg;
                                    }
                                }
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        console.log(damage)
                        //flame weapon
                        if(!armorSuit.getFlag("fortyk","flamerepellent")&&fortykWeapon.getFlag("fortyk","flame")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let fire
                            if(vehicle){

                                fire=await this.fortykTest("agi", "char", tarActor.system.crew.ratingTotal+facing.armor,tarActor, "Resist fire",null,false,"",true);


                            }else{
                                fire=await this.fortykTest("agi", "char", tarActor.system.characteristics.agi.total,tarActor, "Resist fire",null,false,"",true);


                            }
                            damageOptions.results.push(fire.template);
                            if(!fire.value){
                                let fireActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                                activeEffects.push(fireActiveEffect);
                                let id=randomID(5);
                                damageOptions.results.push(`Catches fire!`)
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
                        let tempDmg= damage;
                        if(armorSuit.getFlag("fortyk","impenetrable")){
                            tempDmg=Math.ceil(damage/2);
                        }
                        //deathdealer
                        if(!vehicle&&tempDmg>0&&tempDmg>newWounds[tarNumbr]&&actor.getFlag("fortyk","deathdealer")&&(weapon.type.toLowerCase().includes(actor.getFlag("fortyk","deathdealer").toLowerCase()))){
                            damage+=actor.system.characteristics.per.bonus;
                            chatDamage+=actor.system.characteristics.per.bonus;
                            tempDmg+=Math.ceil(actor.system.characteristics.per.bonus/2);
                            damageOptions.results.push(`Deathdealer increases critical damage by ${actor.system.characteristics.per.bonus}.`);
                        }
                        //peerless killer
                        if(!vehicle&&tempDmg>0&&tempDmg>newWounds[tarNumbr]&&actor.getFlag("fortyk","peerlesskiller")&&lastHit.attackType==="called"){
                            damage+=4;
                            chatDamage+=4;
                            damageOptions.results.push(`Peerless Killer increases critical damage by 4 on called shots.`);
                        }
                        damageOptions.results.push(`</div>`); 
                        console.log(damage)
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
                        console.log(damage)
                        //artificer hull
                        if(vehicle&&damage>0&&damage>newWounds[tarNumbr]&&tarActor.getFlag("fortyk","artificerhull")){
                            let critDamage=0;
                            if(newWounds[tarNumbr]<=0){
                                critDamage=damage;
                            }else{
                                critDamage=damage-newWounds[tarNumbr];
                            }
                            critDamage=Math.max(critDamage-4,0);
                            damage=damage-critDamage;
                            let artificerOptions={user: user._id,
                                                  speaker:{actor,alias:tarActor.name},
                                                  content:"Artificer hull reduces critical damage by 4!",
                                                  classes:["fortyk"],
                                                  flavor:`Artificer Hull`,
                                                  author:tarActor.name}
                            messages.push(artificerOptions);
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
                                if(weapon.system.damageType.value==="Explosive"){
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
                                    let additionalHits=parseInt(weapon.system.range.value);
                                    additionalHits=Math.ceil(additionalHits/4);
                                    let addHits=new Roll("1d5");
                                    await addHits.evaluate({async: true});
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
                        console.log(damage)
                        //if righteous fury ensure attack deals atleast 1 dmg
                        if(tens&&damage<=0){

                            damageOptions.results.push(`<span>Righteous fury deals 1 damage through the soak!</span>`);
                            damage=1;
                            tens=0;


                        }else if(damage<=0){
                            damage=0;
                            damageOptions.results.push(`<span>Damage is fully absorbed.</span>`);
                        }
                        //cleansing pain
                        if(damage>0&&tarActor.getFlag("fortyk","cleansingpain")){
                            let tempMod=tarActor.system.secChar.tempMod.value+10;
                            await tarActor.update({"system.secChar.tempMod.value":tempMod});
                            let chatOptions={user: user._id,
                                             speaker:{tarActor,alias:tarActor.name},
                                             content:"Cleansing Pain grants a +10 bonus to next test!",
                                             classes:["fortyk"],
                                             flavor:`Cleansing Pain`,
                                             author:tarActor.name}
                            messages.push(chatOptions);
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

                        //check for righteous fury
                        let crit=await this._righteousFury(actor,label,weapon,curHit,tens,damage,tar,ignoreSON,activeEffects,superheavyOptions);
                        if(crit){
                            await ChatMessage.create(crit,[]);
                        }


                        //set new hp of target
                        newWounds[tarNumbr]=newWounds[tarNumbr]-damage;
                        newWounds[tarNumbr]=Math.max(wounds.min,newWounds[tarNumbr]);
                        //check for super-heavies if a threshold was crossed then apply relevant critical effect
                        if(tarActor.getFlag("fortyk","superheavy")){

                            let thresholds=data.secChar.wounds.thresholds;

                            let crossed=[];
                            if(curWounds>thresholds["1"]&&thresholds["1"]>=newWounds[tarNumbr]){

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
                            if(crossed.length>0){
                                await this.thresholdCrits(crossed,curHit.value,tar,activeEffects);
                                if(weapon.system.damageType.value.toLowerCase()==="energy"){

                                    heat++;
                                    let chatOptions={user: game.user._id,
                                                     speaker:{actor,alias:actor.name},
                                                     content:"Gained 1 heat from energy attack triggering threshold.",
                                                     classes:["fortyk"],
                                                     flavor:`Gained heat`,
                                                     author:actor.name}
                                    await ChatMessage.create(chatOptions,{});

                                }
                            }
                            let knightHeat=parseInt(tarActor.system.knight.heat.value);
                            knightHeat+=heat;
                            await tarActor.update({"system.knight.heat.value":knightHeat});

                        }

                        //apply field practitioner critical
                        if(lastHit.fieldPractice&&damage>0){
                            await this.critEffects(tar,lastHit.fieldPractice,curHit.value,weapon.system.damageType.value,ignoreSON,activeEffects,"Field practice ");
                        }
                        //handle critical effects and death
                        //Xenos Bane Logic #2
                        if(!vehicle&&tens&&deathwatch&actor.getFlag("fortyk","xenosbane")&&(actor.system.secChar.wounds.value>=curWounds)&&!isHordelike){
                            let banetest=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total),tarActor, `Resist Xenos Bane instant death`,null,false,"",true);
                            if(!banetest.value){
                                this.applyDead(tar,tarActor,"Xenos Bane");
                            }
                        }
                        if((isHordelike)&&newWounds[tarNumbr]<=0){
                            await this.applyDead(tar,tarActor,`${actor.name}`);
                        }else if(!vehicle&&data.suddenDeath.value&&newWounds[tarNumbr]<=0){
                            await this.applyDead(tar,tarActor,`${actor.name}`);
                        }else if(newWounds[tarNumbr]<0&&damage>0){
                            let crit=Math.abs(newWounds[tarNumbr])-1;
                            if(tarActor.getFlag("fortyk","superheavy")){
                                crit=Math.floor(crit/10);
                            }
                            await this.critEffects(tar,crit+1,curHit.value,weapon.system.damageType.value,ignoreSON,activeEffects);
                        }
                        //report damage dealt to gm and the target's owner
                        if(game.user.isGM){
                            this.reportDamage(tarActor, damage);
                        }else{
                            //if user isnt GM use socket to have gm update the actor
                            let tokenId=tar.id;
                            let socketOp={type:"reportDamage",package:{target:tokenId,damage:damage}}
                            await game.socket.emit("system.fortyk",socketOp);
                        }
                        await this.applyActiveEffect(tar,activeEffects,ignoreSON);
                    }
                    if(h===hits-1){
                        //update wounds
                        if(game.user.isGM||tar.isOwner){
                            await tarActor.update({"system.secChar.wounds.value":newWounds[tarNumbr]});
                        }else{
                            //if user isnt GM use socket to have gm update the actor
                            let tokenId=tar.id;
                            let socketOp={type:"updateValue",package:{token:tokenId,value:newWounds[tarNumbr],path:"system.secChar.wounds.value"}}
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
            await hayRoll.evaluate({async: true});
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
                toxicWpn.flags.fortyk={}
                toxicWpn.flags.fortyk.ignoreSoak=true;
                toxicWpn.system.damageType.value="Energy";
                await this.damageRoll(toxicWpn.system.damageFormula,actor,toxicWpn,1, true);
            }
        }
    }
    //reports damage to a target's owners
    static async reportDamage(tarActor, chatDamage){
        if(game.settings.get("fortyk","privateDamage")){
            let user_ids = Object.entries(tarActor.ownership).filter(p=> p[0] !== `default` && p[1] === 3).map(p=>p[0]);
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
            this.applyDead(tar,tar.actor,'<span class="chat-righteous">Righteous Fury</span>');
            return false;
        }
        if((crit&&damage>0)){
            let diceStr="1d5";
            if(vehicle&&tar.actor.getFlag("fortyk","ramshackle")){
                diceStr="1d10";    
            }
            let rightRoll=new Roll(diceStr,actor.system);
            await rightRoll.evaluate({async: true});
            let res=rightRoll._total;
            if(tar!==null){
                if(tar.actor.getFlag("fortyk","superheavy")){
                    await this.superHeavyRightEffects(tar,res,curHit.value,weapon.system.damageType.value,ignoreSON,activeEffects,`<span class="chat-righteous">Righteous Fury </span>`,superHeavyOptions);
                }else{
                    await this.critEffects(tar,res,curHit.value,weapon.system.damageType.value,ignoreSON,activeEffects,`<span class="chat-righteous">Righteous Fury </span>`);
                }

            }
            return false;
        }else if(crit&&damage<1){

            let chatOptions={user: game.user._id,
                             speaker:{actor,alias:actor.name},
                             content:`<span class="chat-righteous">Righteous Fury</span> does ${dmg} damage through the soak!`,
                             classes:["fortyk"],
                             flavor:`<span class="chat-righteous">Righteous Fury</span>`,
                             author:actor.name}
            //await ChatMessage.create(chatOptions,{});
            return chatOptions;
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
            rightMes=FORTYKTABLES.thresholdCrits[hitLoc][mesRes];
        }else if(vehicle){
            rightMes=FORTYKTABLES.vehicleCrits[hitLoc][mesRes-1];
        }else{
            rightMes=FORTYKTABLES.crits[mesDmgType][hitLoc][mesRes-1];
        }
        if(rightMes){

        }
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
        console.log(critMsg)
        inlineResults.rolls=parseHtmlForInline(critMsg.content);
        inlineResults.tests=tests;
        return inlineResults;
    }
    //text blurp for the stuff of nightmares talent
    static async _sON(actor){
        let chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:"Stuff of nightmares ignores stuns, bleeds and critical effects!",
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
            update[`system.facings.${facing.path}.armor`]=armor;
            await actor.update(update);
        }else if(threshold===2){
            let armorRoll=new Roll(`1d5`,{});

            await armorRoll.evaluate({async: true});
            let armorReduction=armorRoll._total;
            rightMes=`Righteous fury reduces ${facing.label} armor by ${armorReduction}!`
            let armor=facing.armor;
            armor=armor-armorReduction;
            let update={};
            update[`system.facings.${facing.path}.armor`]=armor;
            await actor.update(update);
        }else if(threshold>=3){
            switch(hitLoc){
                case "hull":
                    let components=[];
                    components=components.concat(actor.itemTypes.ammunition,actor.itemTypes.forceField,actor.itemTypes.knightComponent,actor.itemTypes.knightCore);
                    components=components.filter(component=>(component.system.state!=="X")&&(component.system.state!==0));
                    let size=components.length;

                    let compRoll=new Roll(`1d${size}-1`,{});

                    await compRoll.evaluate({async: true});
                    let component=components[compRoll._total];
                    if(component){
                        let compData=component.system;
                        let compUpdate={};
                        if(component.type==="ammunition"){
                            compUpdate["system.state.value"]="X";
                            rightMes=`${component.name} explodes dealing weapon damage!`;
                        }else if(compData.state.value==="O"||compData.state.value===""){
                            compUpdate["system.state.value"]="D";
                            rightMes=`${component.name} is damaged.`;
                        }else if(compData.state.value==="D"){
                            compUpdate["system.state.value"]="X";
                            rightMes=`${component.name} is destroyed.`;
                        }else if(!isNaN(parseInt(compData.state.value))){
                            compUpdate["system.state.value"]=parseInt(compData.state.value)-1;
                            if(compUpdate["system.state.value"]===0){
                                rightMes=`${component.name} is destroyed.`;
                            }else{
                                rightMes=`${component.name} is damaged.`; 
                            }
                        }
                        component.update(compUpdate);
                    }


                    break;
                case "weapon":
                    if(weapon){
                        weapon=weapon.document;
                        weaponData=weapon.system;
                        weaponUpdate={};
                        if(weaponData.state.value==="O"||weaponData.state.value===""){
                            weaponUpdate["system.state.value"]="D";
                            rightMes=`${weapon.name} is damaged.`;
                        }else if(weaponData.state.value==="D"){
                            weaponUpdate["system.state.value"]="X";
                            rightMes=`${weapon.name} is destroyed.`;
                        }
                        weapon.update(weaponUpdate);
                    }


                    break;
                case "motive":
                    if(activeEffects){
                        let ae={};
                        ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                        ae.label="Motive System Damage";
                        if(actor.system.secChar.speed.motive==="O"){
                            let speedRoll=new Roll(`1d10`,{});

                            await speedRoll.evaluate({async: true});
                            let speedReduction=speedRoll._total;
                            ae.changes=[{key:`system.secChar.speed.mod`,value:-speedReduction,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                        {key:`system.secChar.speed.motive`,value:"I",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];

                            rightMes=`The motive system is impaired reducing tactical speed by ${speedReduction}!`;
                        }else if(actor.system.secChar.speed.motive==="I"){

                            ae.changes=[{key:`system.secChar.speed.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                        {key:`system.secChar.speed.motive`,value:"C",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];

                            rightMes=`The motive system is crippled reducing tactical speed by half!`;
                        }else if(actor.system.secChar.speed.motive==="C"){

                            ae.changes=[{key:`system.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                        {key:`system.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];

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
                        weaponUpdate["system.state.value"]="D";
                        rightMes=`${weapon.name} is damaged.`;
                    }else if(weaponData.state.value==="D"){
                        weaponUpdate["system.state.value"]="X";
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
        console.log(token,num,hitLoc,type,ignoreSON,activeEffects,source)
        if(game.user.isGM||token.isOwner){

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
            let tokenId=token.id;
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
                        ae.changes.push({key:`system.characteristics.${char}.total`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}); 
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
                ae.changes=[{key:`system.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}]
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Facial scarring"}]);
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]);
                ae.changes=[{key:`system.characteristics.per.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Severe facial scarring"}]);
                activeEffects.push(ae);
                break;
            case 7:
                this._addFatigue(actor,rolls.rolls[0]);
                actor.createEmbeddedDocuments("Item",[{name:"Permanently Blinded",type:"injury"}]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`system.characteristics.fel.value`,value:rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                injury.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.s.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                            {key:`system.characteristics.s.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                            {key:`system.characteristics.t.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                            {key:`system.characteristics.agi.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.ws.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.changes=[{key:`system.characteristics.bs.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,2);
                tTest=rolls.tests[0];
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                    injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                    injury.changes=[{key:`system.characteristics.per.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    injury.changes.push({key:`system.characteristics.fel.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD});
                    await this._createInjury(actor,"Facial scar",injury);
                }
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                ae.changes=[{key:`system.characteristics.int.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:2
                    }
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                    ae.changes=[{key:`system.characteristics.int.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                injury.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                    ae.changes=[{key:`system.characteristics.t.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.ws.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.changes=[{key:`system.characteristics.bs.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                    ae.changes=[{key:`system.characteristics.ws.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                    ae.changes=[{key:`system.characteristics.bs.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                await distanceRoll.evaluate({async: true});
                await distanceRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for scatter distance."
                });
                let directionRoll=new Roll("1d10");
                await directionRoll.evaluate({async: true});
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
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 5:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,rolls.rolls[0]);
                }
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                    ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                ae.changes=[{key:`system.characteristics.per.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                ae.changes=[{key:`system.characteristics.int.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.int.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 8:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                    ae.changes=[{key:`system.characteristics.ws.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                    ae.changes=[{key:`system.characteristics.bs.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                    ae.changes=[{key:`system.characteristics.ws.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                    ae.changes=[{key:`system.characteristics.bs.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.secChar.movement.multi`,value:(1/base),mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,2);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                    injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    activeEffects.push(injury);
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                    ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.ws.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                }
                ae.changes=[{key:`system.characteristics.bs.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characterHitLocations.head.armorMod`,value:-99,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                ae.changes=[{key:`system.characteristics.per.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                        ae.changes=[{key:`system.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                        activeEffects.push(ae);
                    }
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                    activeEffects.push(ae);
                }else{
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects["target"]);
                    ae.changes=[{key:`system.characterHitLocations.head.armorMod`,value:-99,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    activeEffects.push(ae);
                }
                break;
            case 6:
                console.log(rolls)
                this._addFatigue(actor,rolls.rolls[0]);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                if(rolls.rolls[1]<=3){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                    await this._createInjury(actor,"Lost eye",injury);
                }else if(rolls.rolls[1]<=7){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                    injury.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 6:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 7:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                    ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}]; 
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
                ae.changes=[{key:`system.characteristics.s.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
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
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4: 
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 5:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                    ae.changes=[{key:`system.characteristics.agi.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 6:
                ae=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
                    injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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
        console.log(effect)
        if(effect.length>0){
            if(game.user.isGM||token.isOwner){
                console.log(game.user)

                let actor
                if(token instanceof Token){
                    actor=token.actor;
                }else{
                    actor=token;
                }
                console.log(actor, token)
                let aEs=[];
                for(let index=0; index <effect.length;index++){
                    let dupp=false;
                    let newAe=effect[index];
                    for(let ae of actor.effects){
                        if(ae.flags.core){
                            if(!ae.statuses.has("weakened")&&!ae.statuses.has("buff")&&ae.flags.core.statusId===newAe.flags.core.statusId){
                                dupp=true;
                                let change=false;
                                let upg=false;
                                let changes=ae.changes
                                if(ae.icon!==newAe.icon){
                                    change=true;
                                }
                                for(let i=0;i<ae.changes.length;i++){
                                    for(let z=0;z<newAe.changes.length;z++){
                                        if((ae.changes[i].key===newAe.changes[z].key)&&ae.changes[i].mode===newAe.changes[z].mode){

                                            if(ae.changes[i].mode===5||ae.changes[i].mode===0){

                                            }else{
                                                if(!isNaN(parseInt(newAe.changes[z].value))){

                                                    newAe.changes[z].value=parseInt(newAe.changes[z].value)+parseInt(ae.changes[i].value);
                                                }else{

                                                    newAe.changes[z].value+=ae.changes[i].value;
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
                    if(effect[index].id==="stunned"&&actor.getFlag("core","frenzy")){
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
                let effects=await actor.createEmbeddedDocuments("ActiveEffect",aEs);
                if (window.EffectCounter) {
                    console.log(window.EffectCounter)
                    for(let i=0;i<effects.length;i++){

                        let effectInstance=effects[i];
                        if(effectInstance.duration.rounds){
                            new ActiveEffectCounter(effectInstance.duration.rounds,effectInstance.icon,effectInstance); 
                        }


                    }
                }




            }else{
                //if user isnt GM use socket to have gm update the actor
                let tokenId=token.id;
                let socketOp={type:"applyActiveEffect",package:{token:tokenId,effect:effect}}
                await game.socket.emit("system.fortyk",socketOp);
            }
        }
    }
    static async applyDead(target,actor,cause=""){
        if(game.user.isGM||target.isOwner){

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
            let id=target._id;

            if(actor.getFlag("fortyk","regeneration")&&actor.system.race.value==="Necron"){
                let activeEffect=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")])];
                await this.applyActiveEffect(actor,activeEffect);
            }else{
                let activeEffect=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("dead")])];
                await this.applyActiveEffect(actor,activeEffect);
                /*try{
                    let combatant = await game.combat.getCombatantByToken(id);
                    let combatid=combatant.id;
                    let update=[];
                    update.push({"_id":combatid, 'defeated':true})
                    await game.combat.updateEmbeddedDocuments("Combatant",update) 
                }catch(err){
                } */
            }


        }else{
            let tokenId=target._id;
            let socketOp={type:"applyDead",package:{token:tokenId,actor:actor,cause:cause}}
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async _addFatigue(actor,newfatigue){
        console.log(newfatigue,actor)
        newfatigue=parseInt(newfatigue)+parseInt(actor.system.secChar.fatigue.value);
        if(game.user.isGM||actor.isOwner){
            await actor.update({"system.secChar.fatigue.value":newfatigue});
        }else{
            let tokenId=null;
            //if user isnt GM use socket to have gm update the actor
            if(actor.token===null){
                tokenId=getActorToken(actor).id;
            }else{
                tokenId=actor.token._id;
            }
            let socketOp={type:"updateValue",package:{token:tokenId,value:newfatigue,path:"system.secChar.fatigue.value"}}
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async _createInjury(actor,injury,injuryAeData){
        if(actor.type!=="npc"){
            let injuryItem=await Item.create({type:"injury",name:injury},{temporary:true});
            //injuryAeData.transfer=true;
            //await injuryItem.createEmbeddedDocuments("ActiveEffect",[injuryAeData]);
            await actor.createEmbeddedDocuments("Item",[duplicate(injuryItem)]);
        }
    }
}