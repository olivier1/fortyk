/* provides functions for doing tests or damage rolls
*/
import {FORTYKTABLES} from "./FortykTables.js";
import {FORTYK} from "./FortykConfig.js";
import {getActorToken} from "./utilities.js";
import {tokenDistance} from "./utilities.js";
import {getVehicleFacing} from "./utilities.js";
import {getAttackAngle} from "./utilities.js";
import {sleep} from "./utilities.js";
import {parseHtmlForInline} from "./utilities.js";
import {knockbackPoint}  from "./utilities.js";
import {collisionPoint} from "./utilities.js";
import {smallestDistance} from "./utilities.js";
import {FortykRollDialogs} from "./FortykRollDialogs.js";

export class FortykRolls{
    /*The base test function, will roll against the target and return the success and degree of failure/success, the whole roll message is handled by the calling function.
@char: a characteristic object that contains any unattural characteristic the object may have
@type: the type of test, skills, psy powers, and ranged attacks can have some extra effects
@target: the target number for the test
@actor: the calling actor
@label: what to name the test
@fortykWeapon: the weapon is needed for attack rolls, this is where psy powers are put also
@reroll: if the roll is a reroll or not
@fireRate: declares which fire rate was used for ranged attacks
@delayMsg: tells if the message should be delayed, used for popup tests
@modifiers: object that keeps track of modifiers and their origin for attack rolls
returns the roll message*/
    static async fortykTest(char, type, target, actor, label, fortykWeapon=null, reroll=false, fireRate="",delayMsg=false, modifiers=null){

        //cap target at 100 or floor at 1
        /*if(target>100){
            target=100;
        }else*/ 
        try{
            let base=actor.system.characteristics[char].preGlobal;
            target=Math.max(base-60,target);
            target=Math.min(base+60,target);
        }catch(err){

        }

        if(target<1){
            target=1;
        }
        let roll=new Roll("1d100ms<@tar",{tar:target});
        await roll.evaluate();

        let weapon;
        if(fortykWeapon){
            if(fortykWeapon.getFlag("fortyk","explosion")){
                let explosionRoll=new Roll("1d10");
                await explosionRoll.evaluate();
                await explosionRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "On a 3 or higher the weapon explodes"
                });
                if(explosionRoll.total>=3){
                    await fortykWeapon.update({"system.state.value":"X"});
                    await this.ammoExplosion(actor, fortykWeapon,fortykWeapon.system.facing);
                    return;
                }
            }
            weapon=fortykWeapon;
        }
        let weaponid="";
        if(fortykWeapon===null){
        }else{
            weaponid=weapon._id;
        }

        let attack=false;
        if((type==="rangedAttack"||type==="meleeAttack"||type==="focuspower"&&(fortykWeapon.system.class.value==="Psychic Bolt"||fortykWeapon.system.class.value==="Psychic Barrage"||fortykWeapon.system.class.value==="Psychic Storm"||fortykWeapon.system.class.value==="Psychic Blast"))){
            attack=true;

        }
        //prepare chat output
        let title="";
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
        var vehicle;
        if(actor.type!=="spaceship"){
            vehicle=actor.system.secChar.lastHit.vehicle;

            if(actor.type==="vehicle"){
                isVehicle=true;
            }
        }
        var facing;
        if(vehicle&&attack){
            facing=actor.system.secChar.lastHit.facing;
            title+=` against ${facing.label} armor`;
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
            id:foundry.utils.randomID(5)
        };
        if(!reroll){
            templateOptions["actor"]=actor.id;
            templateOptions["char"]=char;
            templateOptions["type"]=type;
            templateOptions["targetNumber"]=target;
            templateOptions["label"]=label;
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
        var charObj;
        try{
            charObj=actor.system.characteristics[char];
        }catch(err){
            charObj=undefined;
        }
        if(charObj===undefined){charObj={"uB":0};}
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
            //extra dos from flags
            if(type==="evasion"&&actor.getFlag("fortyk","bonusevasiondos")){
                testDos+=parseInt(actor.getFlag("fortyk","bonusevasiondos"));
            }
            if(type==="rangedAttack"&&actor.getFlag("fortyk","bonusrangedattackdos")){
                testDos+=parseInt(actor.getFlag("fortyk","bonusrangedattackdos"));
            }
            if(type==="meleeAttack"&&actor.getFlag("fortyk","bonusmeleeattackdos")){
                testDos+=parseInt(actor.getFlag("fortyk","bonusmeleeattackdos"));
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
                    templateOptions["pass"]="Weapon overheated!";
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
                let wsBonus;
                if(isVehicle){
                    wsBonus=Math.floor(parseInt(actor.system.crew.ws)/10);
                }else{
                    wsBonus=actor.system.characteristics.ws.bonus;
                }
                if(attackType==="swift"){
                    hits+=Math.min(wsBonus-1,Math.floor((testDos-1)/2));
                }else if(attackType==="lightning"){
                    hits=Math.min(testDos,wsBonus);
                }


                if(attackTarget!==undefined&&attackTarget.actor.type!=="vehicle"){
                    let horde=attackTarget.actor.system.horde.value;
                    if(horde){
                        hits+=Math.floor(testDos/2);
                        if(fortykWeapon.getFlag("fortyk","sweeping")){
                            hits+=testDos*3;
                        }
                    }
                }
                if(fortykWeapon.getFlag("fortyk","mirror")){
                    hits=hits*2;
                }
            }else if(type==="rangedAttack"){
                let rof=1;
                if(attackType==="semi"){
                    rof=parseInt(weapon.system.rof[1].value)-1;
                    hits+=Math.min(rof,Math.floor((testDos-1)/2));
                }else if(attackType==="full"){
                    if(actor.getFlag("fortyk","overwhelmingfirepower")){
                        testDos++;
                    }
                    rof=parseInt(weapon.system.rof[2].value);
                    hits=Math.min(rof,(testDos));
                }
                if(fortykWeapon.getFlag("fortyk","twinlinked")&&testDos>=3){
                    hits++;
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
                    hits+=Math.min(pr-1,Math.floor((testDos-1)/2));
                }else if(fortykWeapon.system.class.value==="Psychic Storm"){
                    hits=Math.min(pr,testDos);
                }
            }

            templateOptions["numberHits"]=`The attack scores ${hits} hit`;
            if(hits>1){
                templateOptions["numberHits"]+="s.";
            }else{
                templateOptions["numberHits"]+=".";
            }
            let evadepenalty=0;
            if(actor.getFlag("fortyk","inescapablebolt")&&fortykWeapon.system.class.value==="Psychic Bolt"){
                let inescPenalty=Math.max(-60,testDos*(-10));
                evadepenalty+=inescPenalty;
                templateOptions["inescapableBolt"]=`Inescapable bolt evasion penalty: ${inescPenalty}`; 
            }
            if(actor.getFlag("fortyk","inescapableattack")&&(attackType!=="semi"&&attackType!=="full"&&attackType!=="swift"&&attackType!=="lightning")&&((actor.getFlag("fortyk","inescapableattack").toLowerCase().indexOf("ranged")!==-1&&type==="rangedAttack")||(actor.getFlag("fortyk","inescapableattack").toLowerCase().indexOf("melee")!==-1&&type==="meleeAttack"))){
                let inescPenalty=Math.max(-60,testDos*(-10));
                evadepenalty+=inescPenalty;
                templateOptions["inescapableAttack"]=`Inescapable attack evasion penalty: ${inescPenalty}`; 
            }
            if(actor.getFlag("fortyk","desolationprotocols")){
                evadepenalty+=-10;
                templateOptions["desolationPenalty"]=`Evasion penalty due to Desolation protocols: ${-10}`;
            }
            if(type==="meleeAttack"&&actor.getFlag("fortyk","huntergyro")){
                let hunterPenalty=parseInt(actor.getFlag("fortyk","huntergyro"));
                evadepenalty+=hunterPenalty;
                templateOptions["huntergyroPenalty"]=`Evasion penalty due to Hunter Gyro: ${hunterPenalty}`;
            }
            let tarActor;
            if(attackTarget!==undefined){
                tarActor=attackTarget.actor;
                let tarSize=tarActor.system.secChar.size.value;
                let attackerSize=actor.system.secChar.size.value;

                if(attackerSize>tarSize){
                    let penalty=(tarSize-attackerSize)*10;
                    evadepenalty+=penalty;
                    templateOptions["sizePenalty"]=`Evasion penalty due to size difference: ${penalty}`;
                }
            }

            evadepenalty=Math.max(evadepenalty,-60);
            if(tarActor){
                if(game.user.isGM||tarActor.isOwner){
                    await tarActor.setFlag("fortyk","evadeMod",evadepenalty);
                }else{
                    //if user isnt GM use socket to have gm update the actor
                    let tokenId=attackTarget.id;
                    let socketOp={type:"setFlag",package:{token:tokenId,value:evadepenalty,scope:"fortyk",flag:"evadeMod"}};
                    await game.socket.emit("system.fortyk",socketOp);
                }

            }

        }
        if(attackType==="charge"&&actor.getFlag("fortyk","hardtarget")){
            actor.setFlag("fortyk","hardtargetEvasion",true);
        }

        //give the chat object options and stuff
        let result={};
        result.roll=roll;
        let renderedTemplate= await renderTemplate(template,templateOptions);
        if(delayMsg){
            let id=foundry.utils.randomID(5);
            let popupTemplate='systems/fortyk/templates/chat/chat-test-popup.html';
            templateOptions.id=id;
            let renderedPopupTemplate=await renderTemplate(popupTemplate,templateOptions);
            result.template=renderedPopupTemplate;        
        }else{
            await roll.toMessage({user: game.user._id,
                                  speaker:{actor,alias:actor.name},
                                  content:renderedTemplate,
                                  classes:["fortyk"],
                                  author:actor.id});
        }
        //get first and second digits for hit locations and perils
        let firstDigit=Math.floor(testRoll/10);
        let secondDigit=testRoll-firstDigit*10;
        //determine hitlocation if the attack is a success
        if(attack&&templateOptions["success"]){
            //reverse roll to get hit location
            let inverted=parseInt(secondDigit*10+firstDigit);
            let hitlocation=FORTYKTABLES.hitLocations[inverted];
            let vehicleHitlocation;
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
            await actor.update({"system.secChar.lastHit.value":hitlocation.value,"system.secChar.lastHit.label":hitlocation.label,"system.secChar.lastHit.dos":testDos,"system.secChar.lastHit.hits":hits,"system.secChar.lastHit.vehicleHitLocation":vehicleHitlocation, "system.secChar.lastHit.vehicle":vehicle, "system.secChar.lastHit.facing":facing, "system.secChar.lastHit.type":type});
            let content="";
            if(vehicle){
                content=`Location: ${vehicleHitlocation.label}`;
            }else{
                content=`Location: ${hitlocation.label}`;
            }
            let chatOp={user: game.user._id,
                        speaker:{actor,alias:actor.name},
                        content:content,
                        classes:["fortyk"],
                        flavor:"Hit location",
                        author:actor.id};
            await ChatMessage.create(chatOp,{});
        }else if(attack){
            actor.update({"system.secChar.lastHit.vehicle":vehicle,"system.secChar.lastHit.facing":facing, "system.secChar.lastHit.type":type});
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

            if(weapon.getFlag("fortyk","twinlinked")){
                rof=rof*2;
            }
            if(weapon.getFlag("fortyk","storm")){
                rof=rof*2;
            }

            let missedHits=rof-hits;
            var attacker=actor.getActiveTokens()[0];
            if((weapon.system.type==="Launcher"||weapon.system.type==="Grenade")&&blast&&!testResult&&jam){
                let fumbleRoll=new Roll("1d10");
                await fumbleRoll.evaluate();
                await fumbleRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for fumble."
                });
                let content="";
                let fumbleResult=fumbleRoll._total;
                if(fumbleResult===10){
                    content="The explosive detonates immediately on you! Launchers are destroyed by this result.";
                }else{
                    content="The explosive is a dud.";
                }
                let chatFumble={user: game.user._id,
                                speaker:{actor,alias:actor.name},
                                content:content,
                                flavor:"Fumble or Dud!",
                                author:actor.id};
                await ChatMessage.create(chatFumble,{});
            }else if(attack&&blast&&!jam){

                let targets=game.user.targets;
                if(targets.size>0){
                    //clear templates before proceeding
                    let scene=game.scenes.active;
                    let userTemplates=scene.templates;
                    for(const template of userTemplates){
                        if(template.isOwner){

                            await template.delete();
                        }
                    }
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
                            await directionRoll.evaluate();
                            let directionIndex=directionRoll._total;
                            let baseAngle=FORTYKTABLES.scatterAngles[directionIndex-1];
                            let modifiedAngle=baseAngle+attackAngle;
                            if(modifiedAngle>359){modifiedAngle=modifiedAngle-360;}

                            let distanceRoll=new Roll(scatterDice);
                            await distanceRoll.evaluate();
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
                            if(template.x<0){template.x=0;}
                            template.y=Math.min(yDistance+targety,canvas.dimensions.height);
                            if(template.y<0){template.y=0;}
                        }else{
                            contentStr+=`<div>Shot #${i+1} is a direct hit!</div>`;
                            template.x=targetx;
                            template.y=targety;
                        }





                        templates.push(template);


                    }
                    contentStr+="</div>";

                    let instancedTemplates= await scene.createEmbeddedDocuments("MeasuredTemplate",templates);

                    let chatScatter= {user: game.user._id,
                                      speaker:{actor,alias:actor.name},
                                      content:contentStr,
                                      flavor:"Shot Scatters!",
                                      author:actor.id};
                    await ChatMessage.create(chatScatter,{});
                }


                /*let chatScatter={user: game.user._id,
                                 speaker:{actor,alias:actor.name},
                                 content:`The shot goes wild! <img class="fortyk" src="../systems/fortyk/icons/scatter.png">`,
                                 flavor:"Shot Scatters!",
                                 author:actor.id}
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
                await distanceRoll.evaluate();
                await distanceRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for scatter distance."
                });
                let directionRoll=new Roll("1d10");
                await directionRoll.evaluate();
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
                              author:actor.id};
            await ChatMessage.create(chatOverheat,{});
        }
        //if attack has target, check if target has forcefield and do forcefield tests if so
        /*
        if(attack&&game.user.targets.size!==0){

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
                if(powerPR>basePR){push=true;}
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
                    let psyRoll=new Roll("1d100+@mod",{mod:mod});
                    let psyFlavor="Psychic Phenomena!";
                    if(actor.system.race.value==="Ork"){
                        psyFlavor="Perils of the Waaagh!";
                    }
                    await psyRoll.evaluate();
                    await psyRoll.toMessage({
                        speaker: ChatMessage.getSpeaker({ actor: actor }),
                        flavor: psyFlavor
                    });
                    let phenomResult=parseInt(psyRoll._total);
                    if(phenomResult>100){phenomResult=100;}
                    if(phenomResult<1){phenomResult=1;}
                    if(phenomResult>75){perils=true;}
                    let phenomMessage="";
                    let flavor="";
                    var ork=false;
                    if(actor.system.race.value==="Ork"){
                        phenomMessage=FORTYKTABLES.weirdFings[phenomResult];
                        flavor="Weird Fing!";
                        ork=true;
                    }else{
                        phenomMessage=FORTYKTABLES.psychicPhenomena[phenomResult]; 
                        flavor="Psychic Phenomenom!";
                    }
                    let chatPhenom={user: game.user._id,
                                    speaker:{actor,alias:actor.name},
                                    content:phenomMessage,
                                    classes:["fortyk"],
                                    flavor:flavor,
                                    author:actor.id};
                    await ChatMessage.create(chatPhenom,{});
                    if(perils){
                        if(game.user.isGM){
                            this.perilsOfTheWarp(actor,ork);
                        }else{
                            //if user isnt GM use socket to have gm roll the perils result
                            let socketOp={type:"perilsRoll",package:{actorId:actor.id,ork:ork}};
                            await game.socket.emit("system.fortyk",socketOp);
                        }
                    }  
                }

            }
        } 
        else if(type==="fear"&&!templateOptions["success"]){
            //generating insanity when degrees of failure are high enough
            if(testDos>=3){
                let insanityRoll=new Roll("1d5");
                await insanityRoll.evaluate();
                await insanityRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling insanity for 3+ Degrees of failure (Add to sheet)"
                });
            }
            if(game.combats.active){
                let fearRoll=new Roll("1d100 +@mod",{mod:testDos*10});
                await fearRoll.evaluate();
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
                               author:actor.id};
                await ChatMessage.create(chatShock,{}); 
            }else{
                let chatShock={user: game.user._id,
                               speaker:{actor,alias:actor.name},
                               content:"Fear imposes a -10 penalty until the end of the scene!",
                               classes:["fortyk"],
                               flavor:"Shock effect",
                               author:actor.id};
                await ChatMessage.create(chatShock,{}); 
                let shockEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("shock")]);
                let ae=[];
                ae.push(shockEffect);

                await this.applyActiveEffect(actor,ae);
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
        let perilsResult;
        let rollMode="";
        let perilsFlavor="Perils of the Warp!!";
        if(game.settings.get("fortyk","privatePerils")){
            rollMode="gmroll";
        }else{
            rollMode="default";
        }

        if(actor.getFlag("fortyk","soulbound")){
            let soulboundRoll=new Roll("3d10",{});
            await soulboundRoll.evaluate();
            await soulboundRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ user: game.users.current }),
                flavor: "Soulbound perils of the Warp dice result"
            },{rollMode:rollMode});
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
            await perilsRoll.evaluate();
            await perilsRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ user: game.users.current }),
                flavor: perilsFlavor
            },{rollMode:rollMode});
            perilsResult=parseInt(perilsRoll._total);  
        }


        if(perilsResult>100){perilsResult=100;}
        let perilsMessage=FORTYKTABLES.perils[perilsResult];
        if(ork){perilsMessage=FORTYKTABLES.eadBang[perilsResult];}
        let chatPhenom={user: game.users.current,
                        speaker:{user: game.users.current},
                        content:perilsMessage,
                        classes:["fortyk"],
                        flavor:perilsFlavor+` #${perilsResult}`,
                        author:game.users.current.id
                       };
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
            return;
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
        };
        let hitResults=[];
        let i=0;
        let rolls=[];
        while(!(breakOnOverload&&overloaded)&&i<hits){
            let roll=new Roll(formula, {});

            await roll.evaluate();
            roll.dice[0].options.rollOrder = i+1;
            rolls.push(roll);

            let roll1=roll.dice[0].values[0];
            let pass=roll.dice[0].results[0].success;
            overloaded=false;
            let result={overload:false,roll:roll1,pass:pass,string:""};
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
            templateOptions.breaks=`${forcefield.name} breaks!`;
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
                         author:actor.id};
        await ChatMessage.create(chatOptions);

    }
    //handles damage rolls and applies damage to the target, generates critical effects
    static async damageRoll(formula,actor,fortykWeapon,hits=1, self=false, overheat=false,magdamage=0,extraPen=0,rerollNum=0, user=game.users.current, lastHit=null, targets=null){
        let weapon=foundry.utils.deepClone(fortykWeapon);
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
        //prepare attacker coords for knockbacks
        let attacker={x:attackerToken.center.x,y:attackerToken.center.y};

        //if weapon is blast the knockback origin is different
        if(weapon.getFlag("fortyk","blast")||weapon.getFlag("fortyk","blast")===0){
            attacker=fortykWeapon.template;
        }
        let curHit={};
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
                    curHit=game.fortyk.FORTYKTABLES.vehicleHitLocations[70];
                }else{
                    let arm=["rArm","lArm"];
                    let rng=Math.floor(Math.random() * 2);
                    curHit=game.fortyk.FORTYK.extraHits[arm[rng]][0];  
                }
            }else{
                curHit=game.fortyk.FORTYK.extraHits["body"][0];
            }
            targets=new Set([attackerToken]);
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
            let numlength=function getlength(number) {
                return number.toString().length-1;
            };
            let offset=numlength(newNum);
            form=form.slice(dPos);
            form=newNum+form;
            let afterD=dPos+3+offset;
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
        if(actor.getFlag("fortyk","cleansewithfire")&&(fortykWeapon.getFlag("fortyk","flame")||fortykWeapon.getFlag("fortyk","purifyingflame"))){
            let wpb=actor.system.characteristics.wp.bonus;
            let dPos = form.indexOf('d');
            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);
            form=startstr+`r<${wpb}`+endstr;
        }
        //make an array to store the wounds of all targets so that they can all be updated together once done
        var newWounds=[];
        var extraDamage=[];
        //make and array to track which walker vehicles have fallen
        var fallen=[];

        if(self){
            newWounds.push(false);
            extraDamage.push([]);
            fallen.push(false);
        }else{
            for(let i=0;i<targets.size;i++){
                newWounds.push(false);
                extraDamage.push([]);
                fallen.push(false);
            }  
        }


        let hitNmbr=0;
        let selfToxic=false;
        let damageDone=[];

        //loop for the number of hits
        for(let h=0;h<(hits);h++){

            if(h>0||fortykWeapon.getFlag("fortyk","randomlocation")){
                var randomLocation=new Roll("1d100",{});
                await randomLocation.evaluate();
                //curHit=game.fortyk.FORTYKTABLES.hitLocations[randomLocation._total];
            }



            let roll=new Roll(form,actor.system);
            let label = weapon.name ? `Rolling ${weapon.name} damage to ${curHit.label}.` : 'damage';

            await roll.evaluate();
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
                //delete templates for spray weapons
                let scene=game.scenes.active;
                let templates=scene.templates;
                for(const template of templates){
                    if(template.isOwner){

                        await template.delete();
                    }
                }
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
                                        author:actor.id};
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
                    let data={};
                    let tarActor={};
                    data=tar.actor.system; 
                    tarActor=tar.actor;
                    //check if target is dead
                    if(!tarActor.getFlag("core","dead")){
                        //check if target is vehicle
                        var vehicle=false;
                        if(tarActor.type==="vehicle"){
                            vehicle=true;
                        }
                        let facing=null;
                        if(vehicle){
                            if(fortykWeapon.getFlag("fortyk","setfacing")){
                                facing=fortykWeapon.getFlag("fortyk","setfacing");
                            }else{
                                facing=getVehicleFacing(tar,attackerToken);
                            }

                        }
                        let armorSuit;
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
                        if(h>0||fortykWeapon.getFlag("fortyk","randomlocation")){
                            if(!vehicle){
                                curHit.value=game.fortyk.FORTYKTABLES.hitLocations[randomLocation._total].value;
                                curHit.label=game.fortyk.FORTYKTABLES.hitLocations[randomLocation._total].label;
                            }else{
                                if(!data.hasTurret.value){
                                    if(randomLocation._total>=81){
                                        curHit.value=FORTYKTABLES.vehicleHitLocations[59].value;
                                        curHit.label=FORTYKTABLES.vehicleHitLocations[59].label;
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
                                curHit={value:"body",label:"Body"};
                            }else{
                                curHit={value:"hull",label:"Hull"};
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
                        };
                        if(vehicle){
                            var targetWpn=null;
                            //check if hitting a weapon, weapons count as the same facing as the facing they are mounted on
                            if(curHit.value==="weapon"){
                                let facingWeapons=[];
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
                                facingWeapons=facingWeapons.filter(weapon=>(weapon.system.state!=="X"));
                                //if there are weapons proceed to randomly select one, if not proceed with normal armor facing
                                if(facingWeapons.length>0){

                                    let wpnnmbr=facingWeapons.length;
                                    let wpnRoll=new Roll(`1d${wpnnmbr}-1`,{});
                                    await wpnRoll.evaluate();
                                    targetWpn=facingWeapons[wpnRoll._total];
                                    newFacingString=targetWpn.name;
                                    if(targetWpn.system.mounting.value==="turret"){
                                        if(targetWpn.getFlag("fortyk","rear")){
                                            facing=data.facings["rear"]; 
                                        }else{
                                            facing=data.facings["front"];
                                        }

                                    }
                                    damageOptions.facing=newFacingString;
                                }else{
                                    damageOptions.facing=facing.label;
                                }
                            }else if(curHit.value==="turret"){
                                let turretWeapons=tarActor.itemTypes.rangedWeapon.filter(weapon=>(weapon.system.mounting.value==="turret"&&weapon.system.state.value!=="X"));
                                let wpnnmbr=turretWeapons.length;
                                if(turretWeapons.length>0){
                                    let wpnRoll=new Roll(`1d${wpnnmbr}-1`,{});
                                    await wpnRoll.evaluate();
                                    targetWpn=turretWeapons[wpnRoll._total];
                                    damageOptions.facing=targetWpn.name;
                                    if(targetWpn.getFlag("fortyk","rear")){
                                        facing=data.facings["rear"]; 
                                    }else{
                                        facing=data.facings["front"];
                                    }
                                }
                            }else{
                                damageOptions.facing=facing.label; 
                            }
                            var vehicleOptions={};

                            vehicleOptions.explosions=extraDamage[tarNumbr];
                            vehicleOptions.targetWeapon=targetWpn;
                            vehicleOptions.facing=facing;
                            vehicleOptions.fallen=fallen;
                            vehicleOptions.targetNumber=tarNumbr;

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
                                tarRighteous-=2;
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
                        let numbers=[];
                        let operators=[];
                        //parsing the roll result

                        for ( let t=0; t<terms.length;t++){

                            if(terms[t] instanceof foundry.dice.terms.Die){

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
                            }else if(terms[t] instanceof foundry.dice.terms.NumericTerm){
                                numbers.push(terms[t].number);
                            }else{
                                operators.push(terms[t].operator);
                            }

                        }
                        //compiling the roll output
                        let damageString="";
                        if(dieResults.length<1){
                            damageString=roll.result.replace(/\s+/g, '');
                        }else{
                            let rollString="";

                            for(let i=0;i<dieResults.length;i++){
                                let htmlString=`<span class="`;
                                if(discards[i]){
                                    htmlString+=`discard `;
                                }
                                if(dieResults[i]>=tarRighteous){
                                    htmlString+=`chat-righteous">${dieResults[i]}</span>`;
                                }else if(dieResults[i]===1){
                                    htmlString+=`chat-crit-fail">${dieResults[i]}</span>`;
                                }else{
                                    htmlString+=`">${dieResults[i]}</span>`;
                                }
                                rollString+=htmlString;
                                if(i+1<dieResults.length){
                                    rollString+="+"; 

                                }
                            }
                            let operatorCounter=0;
                            damageString ="("+rollString+")";
                            if(numbers[0]){
                                damageString+="+";
                            }

                            operatorCounter++;
                            for(let n=0;n<numbers.length;n++){
                                if(numbers[n]!==0){

                                    damageString+=`${numbers[n]}`;

                                    if((operatorCounter<operators.length)&&(numbers[n+1]!==0)){
                                        damageString+=`${operators[operatorCounter]}`;  
                                        operatorCounter++;
                                    }
                                }else{
                                    operatorCounter++;
                                }
                            }
                            //damageString=roll.result.replace(/\s+/g, '')
                            //damageString="+"+damageString.substring(damageString.indexOf("+") + 1)

                            // damageString =rollString+damageString;
                        }
                        damageOptions.results.push(`<div class="chat-target flexcol">`);
                        damageOptions.results.push(`<div style="flex:none">Weapon damage roll: ${damageString}</div>`);
                        if(tens){
                            damageOptions.results.push(`<span class="chat-righteous">Righteous Fury!</span>`);
                        }
                        damageOptions.results.push(`</div>`);

                        if(jQuery.isEmptyObject(armorSuit)){
                            armorSuit=await Item.create({type:"armor",name:"standin"},{temporary:true});
                        }
                        let wounds=data.secChar.wounds;
                        let curWounds=wounds.value;
                        if(newWounds[tarNumbr]===false){
                            newWounds[tarNumbr]=curWounds;
                        }
                        //killers eye
                        if(!vehicle&&actor.getFlag("fortyk","killerseye")&&lastHit.attackType==="called"&&(lastHit.dos>=data.characteristics.agi.bonus)){
                            let randomKiller=new Roll("1d5",{});
                            await randomKiller.evaluate();
                            let killerCrit=randomKiller._total;
                            await this.critEffects(attacker, tar, killerCrit, curHit.value, weapon.system.damageType.value, ignoreSON, activeEffects, "Killer's Eye ");
                        }
                        let soak=0;
                        let armor;
                        if(vehicle){
                            if(curHit.value==="turret"){
                                if(targetWpn&&targetWpn.getFlag("fortyk","rear")){
                                    armor=data.facings["rear"].armor; 
                                }else{
                                    armor=data.facings["front"].armor; 
                                }

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
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let pen=0;
                            //random pen logic
                            if(isNaN(weapon.system.pen.value)){
                                let randomPen=new Roll(weapon.system.pen.value,{});
                                await randomPen.evaluate();
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
                            if(vehicle&&weapon.type==="rangedWeapon"&&weapon.getFlag("fortyk","tankhunter")&&!self){
                                let bsb;
                                if(actor.type==="vehicle"){
                                    bsb=actor.system.crew.bsb;
                                    bsb??=Math.floor(actor.system.crew.bs/10);
                                }else{
                                    bsb=actor.system.characteristics.bs.bonus;
                                }
                                pen+=bsb;
                                damageOptions.push(`<span>Tank hunter additional penetration: ${bsb}</span>`);
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
                                damageOptions.results.push(`<span>Razor Sharp doubles penetration to ${pen}</span>`);
                            }
                            //lance weapons
                            if(fortykWeapon.getFlag("fortyk","lance")){
                                pen=pen*lastHit.dos;
                                damageOptions.results.push(`<span>Lance increases penetration to ${pen}</span>`);
                            }
                            //handle melta weapons
                            if(fortykWeapon.getFlag("fortyk","melta")&&!tarActor.getFlag("fortyk","ceramiteplating")){
                                let shortRange=parseInt(weapon.system.range.value)/2;
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

                                soak=facing.value;

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

                            if(tarActor.getFlag("fortyk","reactiveplating")&&((damageType==="explosive")||damageType==="impact")){
                                soak+=Math.ceil(armor*0.2);
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
                            damageOptions.results.push(`</div>`);
                        }
                        let damage=roll._total;
                        if(tarActor.getFlag("fortyk","moltenman")&&(damageType==="energy")){
                            damage=Math.ceil(damage/2);
                            damageOptions.results.push(`<span>Molten man reduces energy damage by half!</span>`);
                        }
                        let chatDamage=damage;
                        damageOptions.results.push(`<div class="chat-target flexcol">`);
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
                            await volkRoll.evaluate();
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
                                let accForm=accDice+"d10";
                                let accRoll=new Roll(accForm,{});
                                await accRoll.evaluate();
                                damageOptions.results.push(`<span>Accurate extra damage: ${accRoll.dice[0].values.join("+")}</span>`);
                                damage+=accRoll._total;
                                chatDamage+=accRoll._total;
                            }else{
                                damageOptions.results.push(`<span>Too close for accurate bonus damage.</span>`); 
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
                        if(tarActor.getFlag("fortyk","swarm")&&!(fortykWeapon.getFlag("fortyk","spray")||fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","flame")||fortykWeapon.getFlag("fortyk","purifyingflame")||fortykWeapon.getFlag("fortyk","scatter"))){
                            damage=Math.ceil(damage/2);
                            damageOptions.results.push(`<span>Swarm enemies take reduced damage against non blast, spray, flame or scatter weapons.</span>`);
                        }

                        damage=damage-soak;
                        //gauss weapon logic
                        if(fortykWeapon.getFlag("fortyk","gauss")&&tens&&!isHordelike){
                            let gaussAmt=new Roll("1d5",{});
                            await gaussAmt.evaluate();

                            damageOptions.results.push(`<label> Gauss Weapon armor damage: ${gaussAmt._total}.</label> `);

                            let newArmor=Math.max(0,(armor-gaussAmt._total));

                            let gaussAmount=-gaussAmt._total;
                            let path="";

                            let gaussActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("corrode")]);
                            if(vehicle){
                                path=`system.facings.${facing.path}.armor`;
                                gaussActiveEffect.flags={fortyk:{repair:"armordmg"}};
                            }else{
                                path=`system.characterHitLocations.${curHit.value}.armorMod`;
                            }
                            gaussActiveEffect.changes=[];
                            let changes={key:path,value:gaussAmount,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD};
                            gaussActiveEffect.changes.push(changes);
                            activeEffects.push(gaussActiveEffect);

                        }
                        //corrosive weapon logic
                        if(fortykWeapon.getFlag("fortyk","corrosive")&&!isHordelike){
                            let corrosiveAmt=new Roll("1d10",{});
                            await corrosiveAmt.evaluate();
                            let id=foundry.utils.randomID(5);
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
                            let corrodeActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("corrode")]);
                            corrodeActiveEffect.changes=[];
                            if(vehicle){
                                corrodeActiveEffect.flags={fortyk:{repair:"armordmg"}};
                            }
                            let changes={key:path,value:corrosiveAmount,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD};
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
                        damageOptions.results.push(`</div>`);
                        //toxic weapon logic
                        if(!vehicle&&damage>0&&!isNaN(parseInt(toxic))&&!tarActor.getFlag("fortyk","stuffofnightmares")&&!tarActor.getFlag("fortyk","undying")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let toxicMod=toxic*10;
                            if(tarActor.getFlag("fortyk","resistance")&&tarActor.getFlag("fortyk","resistance").toLowerCase().includes("toxic")){
                                toxicMod=-10;
                            }
                            let toxicTest=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-toxicMod),tarActor, `Resist toxic ${toxic}`,null,false,"",true);
                            damageOptions.results.push(toxicTest.template);
                            if(!toxicTest.value){
                                let toxicDmg=new Roll("1d10",{});
                                await toxicDmg.evaluate();
                                damageOptions.results.push(`Toxic extra damage: ${toxicDmg._total}`);
                                damage+=toxicDmg._total;
                                chatDamage+=toxicDmg._total;
                            }
                            damageOptions.results.push(`</div>`);
                        }
                        let messages=[];
                        //shocking weapon logic
                        if(!vehicle&&damage>0&&fortykWeapon.getFlag("fortyk","shocking")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let shock=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total),tarActor, "Resist shocking",null,false,"",true);
                            damageOptions.results.push(shock.template);
                            if(!shock.value){
                                let stunActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                stunActiveEffect.transfer=false;
                                stunActiveEffect.duration={
                                    rounds:shock.dos
                                };
                                activeEffects.push(stunActiveEffect);
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Stunned for ${shock.dos} rounds. <span class="popuptext chat-background" id="${id}">${tarActor.name} is stunned for ${shock.dos} rounds and takes 1 fatigue!</span></label>`);
                                let newfatigue=1;
                                this._addFatigue(tarActor,newfatigue);
                            }
                            damageOptions.results.push(`</div>`);
                        }
                        //abyssal drain weapon logic
                        if(!vehicle&&damage>0&&fortykWeapon.getFlag("fortyk","abyssalDrain")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let drain=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-20),tarActor, "Resist abyssal drain",null,false,"",true);
                            damageOptions.results.push(drain.template);
                            if(!drain.value){
                                let drainActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                                drainActiveEffect.transfer=false;
                                drainActiveEffect.changes=[];
                                let strDmg=new Roll("2d10",{});
                                await strDmg.evaluate();
                                drainActiveEffect.changes.push({key:`system.characteristics.s.value`,value:-1*strDmg._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD});
                                let tDmg=new Roll("2d10",{});
                                await tDmg.evaluate();
                                drainActiveEffect.changes.push({key:`system.characteristics.t.value`,value:-1*tDmg._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD});
                                activeEffects.push(drainActiveEffect);
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`Drained for ${strDmg.result} strength damage and ${tDmg.result} toughness damage!`);
                            }
                            damageOptions.results.push(`</div>`) ;
                        }
                        //cryogenic weapon logic
                        if(!vehicle&&damage>0&&fortykWeapon.getFlag("fortyk","cryogenic")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let cryo=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-40),tarActor, "Resist freezing",null,false,"",true);
                            damageOptions.results.push(cryo.template);
                            if(!cryo.value){
                                let cryoRoll=new Roll("1d5",{});
                                await cryoRoll.evaluate();
                                let cryoDuration=parseInt(cryoRoll.result);
                                let cryoActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("cryogenic")]);
                                cryoActiveEffect.transfer=false;
                                cryoActiveEffect.duration={
                                    rounds:cryoDuration
                                };
                                activeEffects.push(cryoActiveEffect);
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Freezing for ${cryoRoll._total} rounds. <span class="popuptext chat-background" id="${id}">${tarActor.name} is freezing for ${cryoRoll.result} rounds and will take 2d10 toughness damage per round, freezing if reaching 0 toughness!</span></label>`);
                            }
                            damageOptions.results.push(`</div>`) ;
                        }
                        //hallucinogenic
                        if(!vehicle&&!isNaN(parseInt(fortykWeapon.getFlag("fortyk","hallucinogenic")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let halluMod=parseInt(fortykWeapon.getFlag("fortyk","hallucinogenic"))*10;
                            if(armorSuit.getFlag("fortyk","sealed")){
                                halluMod+=20;
                            }
                            let hallu=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-halluMod),tarActor, "Resist hallucinogenic",null,false,"",true);
                            damageOptions.results.push(hallu.template);
                            if(!hallu.value){
                                let halluActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("hallucinogenic")]);
                                halluActiveEffect.transfer=false;
                                halluActiveEffect.duration={
                                    rounds:hallu.dos
                                };
                                activeEffects.push(halluActiveEffect);
                                let halluRoll=new Roll("1d10",{});
                                await halluRoll.evaluate();
                                let halluText=FORTYKTABLES.hallucinogenic[halluRoll._total-1];
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Hallucinating for ${hallu.dos+1} rounds. <span class="popuptext chat-background" id="${id}">${halluText}</span></label>`);
                            }
                            damageOptions.results.push(`</div>`);
                        }
                        //crippling weapon logic
                        if(!vehicle&&damage>0&&fortykWeapon.getFlag("fortyk","crippling")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let crippleActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("crippled")]);
                            crippleActiveEffect.location=curHit;
                            crippleActiveEffect.num=fortykWeapon.getFlag("fortyk","crippling");
                            activeEffects.push(crippleActiveEffect);
                            let id=foundry.utils.randomID(5);
                            damageOptions.results.push(`<label class="popup" data-id="${id}"> ${tarActor.name} is crippled. <span class="popuptext chat-background" id="${id}">${tarActor.name} is crippled, they take ${fortykWeapon.getFlag("fortyk","crippling")} damage to the ${curHit.label} which ignores all soak, if they ever take more than a half action in a turn. This lasts until they are fully healed or until the end of the encounter.</span></label>`);
                            damageOptions.results.push(`</div>`);
                        }
                        //luminagen weapon logic
                        if(fortykWeapon.getFlag("fortyk","luminagen")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let luminagenActiveEffect={
                                id: "luminagen",
                                name: "Luminagen",
                                icon: "icons/svg/eye.svg",
                                flags: { core: { statusId: "luminagen" } }
                            };
                            let lumiRoll=new Roll("1d5",{});
                            await lumiRoll.evaluate();
                            let lumiDuration=parseInt(lumiRoll.result);

                            luminagenActiveEffect.transfer=false;
                            luminagenActiveEffect.duration={
                                rounds:lumiDuration
                            };
                            activeEffects.push(luminagenActiveEffect);

                            damageOptions.results.push(`The target is affected by Luminagen and suffers a -10 penalty to all evasion tests for ${lumiDuration} rounds!`);
                            damageOptions.results.push(`</div>`);
                        }
                        //NIDITUS WEAPON
                        if(!vehicle&&(fortykWeapon.getFlag("fortyk","niditus")&&damage)>0){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            if(tarActor.system.psykana.pr.value>0){
                                let stun=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total),tarActor, "Resist niditus stun",null,false,"",true);
                                damageOptions.results.push(stun.template);
                                if(!stun.value){
                                    let stunActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                    stunActiveEffect.transfer=false;
                                    stunActiveEffect.duration={
                                        rounds:stun.dos
                                    };
                                    activeEffects.push(stunActiveEffect);
                                    let id=foundry.utils.randomID(5);
                                    damageOptions.results.push(`<label class="popup" data-id="${id}"> Stunned for ${stun.dos} rounds. <span class="popuptext chat-background" id="${id}">${tarActor.name} is stunned for ${stun.dos} rounds!</span></label>`);
                                }
                            }
                            if(tarActor.getFlag("fortyk","warpinstability")){
                                let warpinst=await this.fortykTest("wp", "char", (tarActor.system.characteristics.wp.total-10),tarActor, "Warp instability niditus",null,false,"",true);
                                damageOptions.results.push(warpinst.template);
                                if(!warpinst.value){
                                    let warpdmg=warpinst.dos;
                                    if(warpdmg>newWounds[tarNumbr]){
                                        damageOptions.results.push(`${actor.name} is banished to the warp!`);
                                        await this.applyDead(tar,tarActor,"banishment");
                                        tarActor.flags.core.dead=true;
                                    }else{
                                        damage+=warpdmg;
                                        chatDamage+=warpdmg;
                                    }
                                }
                            }
                            damageOptions.results.push(`</div>`);
                        }
                        //flame weapon
                        if(!armorSuit.getFlag("fortyk","flamerepellent")&&fortykWeapon.getFlag("fortyk","flame")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let fire;
                            if(vehicle){

                                fire=await this.fortykTest("agi", "char", tarActor.system.crew.ratingTotal+facing.armor,tarActor, "Resist fire",null,false,"",true);


                            }else{
                                fire=await this.fortykTest("agi", "char", tarActor.system.characteristics.agi.total,tarActor, "Resist fire",null,false,"",true);


                            }
                            damageOptions.results.push(fire.template);
                            if(!fire.value){
                                let fireActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                                activeEffects.push(fireActiveEffect);
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`Catches fire!`);
                            } 
                            damageOptions.results.push(`</div>`);
                        } 
                        //purifying flame
                        if(!armorSuit.getFlag("fortyk","flamerepellent")&&fortykWeapon.getFlag("fortyk","purifyingflame")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let fire;
                            if(vehicle){

                                fire=await this.fortykTest("wp", "char", tarActor.system.crew.ratingTotal+facing.armor,tarActor, "Resist fire",null,false,"",true);


                            }else{
                                fire=await this.fortykTest("wp", "char", tarActor.system.characteristics.wp.total,tarActor, "Resist fire",null,false,"",true);


                            }
                            damageOptions.results.push(fire.template);
                            if(!fire.value){
                                let fireActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("purifyingflame")]);
                                //if target is not daemon apply normal fire instead
                                if(!tarActor.getFlag("fortyk","daemonic")){
                                    fireActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                                }
                                fireActiveEffect.flags={"fortyk":{"damageString":fortykWeapon.getFlag("fortyk","purifyingflame")}};
                                activeEffects.push(fireActiveEffect);
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`Bursts in purifying flames!`);
                            } 
                            damageOptions.results.push(`</div>`);
                        } 
                        //thermal weapon
                        let heat=0;
                        if(vehicle&&!tarActor.getFlag("fortyk","platinginsulation")&&fortykWeapon.getFlag("fortyk","thermal")){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            if(tarActor.getFlag("fortyk","superheavy")){
                                damageOptions.results.push(`Gains 1 heat from thermal weapon.`);
                                heat++;
                            }else{
                                let fireActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                                activeEffects.push(fireActiveEffect);
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`Catches fire from thermal weapon!`);
                            }

                            damageOptions.results.push(`</div>`);
                        } 
                        //snare weapon
                        if(!vehicle&&!isNaN(parseInt(fortykWeapon.getFlag("fortyk","snare")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let snareMod=fortykWeapon.getFlag("fortyk","snare")*10;
                            let snare=await this.fortykTest("agi", "char", (tarActor.system.characteristics.agi.total-snareMod),tarActor, "Resist snare",null,false,"",true);
                            damageOptions.results.push(snare.template);
                            if(!snare.value){
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Immobilised. <span class="popuptext chat-background" id="${id}">${tar.name} is immobilised. An Immobilised target can attempt no actions other than trying to escape the bonds. As a Full Action, he can make a (-${snareMod}) Strength or Agility test to break free.</span></label>`);
                                let snareActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("snare")]);
                                activeEffects.push(snareActiveEffect);
                            }
                            damageOptions.results.push(`</div>`);
                        }
                        //blinding weapon
                        if(!vehicle&&!isNaN(parseInt(fortykWeapon.getFlag("fortyk","blinding")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let blindMod=parseInt(fortykWeapon.getFlag("fortyk","blinding"))*10;
                            let blind=await this.fortykTest("agi", "char", (tarActor.system.characteristics.agi.total-blindMod),tarActor, "Resist blind",null,false,"",true);
                            damageOptions.results.push(blind.template);
                            if(!blind.value){
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Blinded for ${blind.dos} rounds. <span class="popuptext chat-background" id="${id}">${tar.name} is blinded for ${blind.dos} rounds!</span></label>`);
                                let blindActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                                blindActiveEffect.duration={
                                    rounds:blind.dos
                                };
                                activeEffects.push(blindActiveEffect);
                            }
                            damageOptions.results.push(`</div>`) ;
                        }
                        //concussive weapon
                        if(!vehicle&&!isNaN(parseInt(fortykWeapon.getFlag("fortyk","concussive")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let stunMod=parseInt(fortykWeapon.getFlag("fortyk","concussive"))*10;
                            let stun=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total-stunMod),tarActor, "Resist stun",null,false,"",true);
                            damageOptions.results.push(stun.template);
                            if(!stun.value){
                                let id=foundry.utils.randomID(5);
                                damageOptions.results.push(`<label class="popup" data-id="${id}"> Stunned for ${stun.dos} rounds. <span class="popuptext chat-background" id="${id}">${tar.name} is stunned for ${stun.dos} rounds!</span></label>`);
                                let stunActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                stunActiveEffect.duration={
                                    rounds:stun.dos
                                };
                                activeEffects.push(stunActiveEffect);
                                if(damage>tarActor.system.characteristics.s.bonus){
                                    let proneActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                                    activeEffects.push(proneActiveEffect);
                                    damageOptions.results.push(`<span>Knocked down.</span>`);
                                }
                            }
                            damageOptions.results.push(`</div>`) ;
                        }else if(vehicle&&tarActor.getFlag("fortyk","walker")&&fortykWeapon.getFlag("fortyk","concussive")&&damage>0){
                            damageOptions.results.push(`<div class="chat-target flexcol">`);
                            let difficulty=60-damage+data.crew.rating-10*parseInt(fortykWeapon.getFlag("fortyk","concussive"));
                            let knockdown=await this.fortykTest("", "crew", (difficulty),tarActor, "Resist knockdown",null,false,"",true);
                            damageOptions.results.push(knockdown.template);
                            if(!knockdown.value){
                                let proneActiveEffect=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                                if(!tarActor.getFlag("core","prone")){
                                    fallen[tarNumbr]=true;
                                }

                                activeEffects.push(proneActiveEffect);
                                damageOptions.results.push(`<span>Knocked down.</span>`);
                            }
                            damageOptions.results.push(`</div>`);

                        }
                        damageOptions.results.push(`<div class="chat-target flexcol">`);
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
                        //impenetrable armor logic
                        if(armorSuit.getFlag("fortyk","impenetrable")){
                            damage=Math.ceil(damage/2);
                            if(damage>0){
                                let impOptions={user: user._id,
                                                speaker:{actor,alias:tarActor.name},
                                                content:"Impenetrable reduces damage taken by half!",
                                                classes:["fortyk"],
                                                flavor:`${armorSuit.name} is impenetrable!`,
                                                author:tarActor.id};
                                messages.push(impOptions);
                            }
                        }
                        //weakness trait
                        if(tarActor.getFlag("fortyk","weakness")){
                            if(tarActor.getFlag("fortyk","weakness").toLowerCase().includes(damageType)){
                                damage=damage*2;
                                if(damage>0){
                                    let weaknessOptions={user: user._id,
                                                         speaker:{actor,alias:tarActor.name},
                                                         content:"Weakness doubles damage taken!",
                                                         classes:["fortyk"],
                                                         flavor:`${tarActor.name} is weak to damage type!`,
                                                         author:tarActor.id};
                                    messages.push(weaknessOptions);
                                }
                            }
                        }
                        //resilience trait
                        if(tarActor.getFlag("fortyk","resilience")){
                            if(tarActor.getFlag("fortyk","resilience").toLowerCase().includes(damageType)){
                                damage=Math.ceil(damage/2);
                                if(damage>0){
                                    let weaknessOptions={user: user._id,
                                                         speaker:{actor,alias:tarActor.name},
                                                         content:"Resilience halves damage taken!",
                                                         classes:["fortyk"],
                                                         flavor:`${tarActor.name} is resilient to damage type!`,
                                                         author:tarActor.id};
                                    messages.push(weaknessOptions);
                                }
                            }
                        }
                        // true grit!@!!@
                        if(!vehicle&&!data.suddenDeath.value&&!isHordelike&&(damage>0)&&(newWounds[tarNumbr]-damage)<0&&tarActor.getFlag("fortyk","truegrit")){
                            let trueSoak=data.characteristics.t.bonus;
                            let tempDmg=damage-newWounds[tarNumbr]-trueSoak;
                            if(tempDmg<=0){
                                damage=newWounds[tarNumbr]+1;
                            }else{
                                damage=damage-trueSoak;
                            }
                            if(damage<=0){damage=1;}
                            let chatOptions={user: user._id,
                                             speaker:{actor,alias:tarActor.name},
                                             content:"True Grit reduces critical damage!",
                                             classes:["fortyk"],
                                             flavor:`Critical effect`,
                                             author:tarActor.id};
                            messages.push(chatOptions);
                        }
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
                                                  author:tarActor.id};
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
                                                   author:tarActor.id};
                            messages.push(reinforcedOptions);
                        }
                        //check if target has toxic trait and if attacker dealt damage to it in melee range, sets flag if so
                        if(!vehicle&&tarActor.getFlag("fortyk","toxic")&&distance<=1&&damage>0){
                            selfToxic=tarActor.getFlag("fortyk","toxic");
                        }
                        damageOptions.results.push(`<div class="chat-target flexcol">`);
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
                                    await addHits.evaluate();
                                    damageOptions.results.push(`<span>Spray adds 1d5 damage: ${addHits.total}.</span>`);
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
                        damageOptions.results.push(`</div>`) ;
                        damageOptions.results.push(`<div class="chat-target flexcol">`);
                        damageOptions.results.push(`<span>Total Damage: ${chatDamage}.</span>`);

                        if(tarActor.getFlag("fortyk","superheavy")){

                            vehicleOptions.threshold=0;
                            let thresholds=data.secChar.wounds.thresholds;
                            if(curWounds>thresholds["1"]){
                                vehicleOptions.threshold=1;
                            }else if(curWounds>thresholds["2"]){
                                vehicleOptions.threshold=2;
                            }else if(curWounds>thresholds["3"]){
                                vehicleOptions.threshold=3;
                            }else if(curWounds>thresholds["4"]){
                                vehicleOptions.threshold=4;
                            }else{
                                vehicleOptions.threshold=5;
                            }
                        }
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
                                             author:tarActor.id};
                            messages.push(chatOptions);
                        }
                        damageOptions.results.push(`</div>`) ;
                        let renderedDamageTemplate= await renderTemplate(damageTemplate,damageOptions);
                        var txt = document.createElement("textarea");
                        txt.innerHTML = renderedDamageTemplate;
                        renderedDamageTemplate= txt.value;
                        await roll.toMessage({user: game.user._id,
                                              speaker:{actor,alias:actor.name},
                                              content:renderedDamageTemplate,
                                              classes:["fortyk"],
                                              author:actor.id});
                        //await ChatMessage.create({content:renderedDamageTemplate},{});
                        for(let i=0;i<messages.length;i++){
                            await ChatMessage.create(messages[i],[]);
                        }

                        //check for righteous fury
                        let crit=await this._righteousFury(actor,label,weapon,curHit,tens,damage,tar,ignoreSON,activeEffects,vehicleOptions);
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

                                crossed.push(1);
                            }
                            if(curWounds>thresholds["2"]&&thresholds["2"]>=newWounds[tarNumbr]){
                                crossed.push(2);
                            }
                            if(curWounds>thresholds["3"]&&thresholds["3"]>=newWounds[tarNumbr]){
                                crossed.push(3);
                            }
                            if(curWounds>thresholds["4"]&&thresholds["4"]>=newWounds[tarNumbr]){
                                crossed.push(4);
                            }
                            if(crossed.length>0){
                                await this.thresholdCrits(crossed,curHit.value,tar,activeEffects, vehicleOptions);
                                if(weapon.system.damageType.value.toLowerCase()==="energy"){

                                    heat++;
                                    let chatOptions={user: game.user._id,
                                                     speaker:{actor,alias:actor.name},
                                                     content:"Gained 1 heat from energy attack triggering threshold.",
                                                     classes:["fortyk"],
                                                     flavor:`Gained heat`,
                                                     author:actor.id};
                                    await ChatMessage.create(chatOptions,{});

                                }
                            }
                            let knightHeat=parseInt(tarActor.system.knight.heat.value);
                            knightHeat+=heat;
                            await tarActor.update({"system.knight.heat.value":knightHeat});

                        }

                        //apply field practitioner critical
                        if(lastHit.fieldPractice&&damage>0){
                            await this.critEffects(attacker, tar, lastHit.fieldPractice, curHit.value, weapon.system.damageType.value, ignoreSON, activeEffects, "Field practice ");
                        }
                        //handle critical effects and death
                        //Xenos Bane Logic #2
                        if(!vehicle&&tens&&deathwatch&actor.getFlag("fortyk","xenosbane")&&(actor.system.secChar.wounds.value>=curWounds)&&!isHordelike){
                            let banetest=await this.fortykTest("t", "char", (tarActor.system.characteristics.t.total),tarActor, `Resist Xenos Bane instant death`,null,false,"",true);

                            damageOptions.results.push(banetest.template);
                            if(!banetest.value){
                                await this.applyDead(tar,tarActor,"Xenos Bane");
                                tarActor.flags.core.dead=true;
                            }
                        }
                        if((isHordelike)&&newWounds[tarNumbr]<=0){
                            await this.applyDead(tar,tarActor,`${actor.name}`);
                            tarActor.flags.core.dead=true;
                        }else if(!vehicle&&data.suddenDeath.value&&newWounds[tarNumbr]<=0){
                            await this.applyDead(tar,tarActor,`${actor.name}`);
                            tarActor.flags.core.dead=true;
                        }else if(newWounds[tarNumbr]<0&&damage>0){
                            let crit=Math.abs(newWounds[tarNumbr]);
                            if(tarActor.getFlag("fortyk","superheavy")){
                                crit=Math.ceil(crit/10);
                            }
                            if(vehicle){
                                await this.vehicleCrits(tar,crit,curHit.value,ignoreSON,activeEffects,"",vehicleOptions);
                            }else{
                                await this.critEffects(attacker,tar,crit,curHit.value,weapon.system.damageType.value,ignoreSON,activeEffects);
                            }

                        }
                        damageDone.push(damage);
                        //report damage dealt to gm and the target's owner
                        if(game.user.isGM){
                            this.reportDamage(tarActor, damage);
                        }else{
                            //if user isnt GM use socket to have gm update the actor
                            let tokenId=tar.id;
                            let socketOp={type:"reportDamage",package:{target:tokenId,damage:damage}};
                            await game.socket.emit("system.fortyk",socketOp);
                        }
                        await this.applyActiveEffect(tar,activeEffects,ignoreSON);
                    }
                    if(h===hits-1){
                        //update wounds
                        if(game.user.isGM||tar.isOwner){
                            if(tarNumbr<=newWounds.length-1){
                                await tarActor.update({"system.secChar.wounds.value":newWounds[tarNumbr]});
                                let explosions=extraDamage[tarNumbr];

                                explosions.forEach(async function(params){
                                    await FortykRolls.ammoExplosion(params.vehicle,params.component,params.facing,params.extraDamage);
                                })
                                if(vehicle&&fallen[tarNumbr]){
                                    await this.fallingWalker(tarActor,tar);
                                }
                            }


                        }else{
                            //if user isnt GM use socket to have gm update the actor
                            let tokenId=tar.id;
                            let socketOp={type:"updateValue",package:{token:tokenId,value:newWounds[tarNumbr],path:"system.secChar.wounds.value"}};
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
            await hayRoll.evaluate();
            let hayText=FORTYKTABLES.haywire[hayRoll._total-1];
            let hayOptions={user: user._id,
                            speaker:{actor,alias:actor.name},
                            content:hayText,
                            classes:["fortyk"],
                            flavor:`Haywire Effect #${hayRoll._total} ${fortykWeapon.getFlag("fortyk","haywire")}m radius`,
                            author:actor.id};
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
                let toxicData={name:"Toxic",type:"meleeWeapon"};
                let toxicWpn=await Item.create(toxicData, {temporary: true});
                toxicWpn.flags.fortyk={};
                toxicWpn.flags.fortyk.ignoreSoak=true;
                toxicWpn.system.damageType.value="Energy";
                await this.damageRoll(toxicWpn.system.damageFormula,actor,toxicWpn,1, true);
            }
        }
        return damageDone;
    }
    //reports damage to a target's owners
    static async reportDamage(tarActor, chatDamage){
        if(game.settings.get("fortyk","privateDamage")){
            let user_ids = Object.entries(tarActor.ownership).filter(p=> p[0] !== `default` && p[1] === 3).map(p=>p[0]);
            console.log(user_ids)
            for(let user of user_ids)
            {
                let userInstance=game.users.get(user);
                let gm=userInstance?.isGM;
                if(user!==game.users.current.id||gm){
                    let recipient=[user];
                    let damageOptions={user: game.users.current,
                                       speaker:{user,alias:tarActor.name},
                                       content:`Attack did ${chatDamage} damage. </br>`,
                                       classes:["fortyk"],
                                       flavor:`Damage done`,
                                       author:tarActor.id,
                                       whisper:recipient
                                      };
                    await ChatMessage.create(damageOptions,{});
                }
            } 
        }else{
            let damageOptions={user: game.users.current,
                               speaker:{user,alias:tarActor.name},
                               content:`Attack did ${chatDamage} damage. </br>`,
                               classes:["fortyk"],
                               flavor:`Damage done`,
                               author:tarActor.id
                              };
            await ChatMessage.create(damageOptions,{});
        }
    }
    //handles righteous fury
    static async _righteousFury(actor,label,weapon,curHit,tens, damage=1, tar=null, ignoreSON=false,activeEffects=[],vehicleOptions={}){
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
        if(!vehicle&&tar!==null&&(tar.actor.system.horde.value||tar.actor.system.formation.value)){crit=false;}
        //if righteous fury roll the d5 and spew out the crit result
        if(!vehicle&&tar!==null&&crit&&tar.actor.system.suddenDeath.value){
            if(!tar.actor.getFlag("fortyk","stuffoffnightmares")||ignoreSON&&tar.actor.getFlag("fortyk","stuffoffnightmares")){
                await this.applyDead(tar,tar.actor,'<span class="chat-righteous">Righteous Fury</span>');
                tar.actor.flags.core.dead=true;
                return false;
            }

        }
        if((crit&&damage>0)){
            let diceStr="1d5";
            if(vehicle&&tar.actor.getFlag("fortyk","ramshackle")){
                diceStr="1d10";    
            }
            let rightRoll=new Roll(diceStr,actor.system);
            await rightRoll.evaluate();
            let res=rightRoll._total;
            if(tar!==null){
                if(tar.actor.getFlag("fortyk","superheavy")){
                    await this.superHeavyRightEffects(tar,res,curHit,ignoreSON,activeEffects,`<span class="chat-righteous">Righteous Fury </span>`,vehicleOptions);
                }else if(vehicle){
                    await this.vehicleCrits(tar,res,curHit.value,ignoreSON,activeEffects,`<span class="chat-righteous">Righteous Fury </span>`, vehicleOptions);
                }else{
                    if(weapon.getFlag("fortyk","blast")||weapon.getFlag("fortyk","blast")===0){
                        await this.critEffects(weapon.template,tar,res,curHit.value,weapon.system.damageType.value,ignoreSON,activeEffects,`<span class="chat-righteous">Righteous Fury </span>`);
                    }else{
                        await this.critEffects(actor,tar,res,curHit.value,weapon.system.damageType.value,ignoreSON,activeEffects,`<span class="chat-righteous">Righteous Fury </span>`);
                    }

                }

            }
            return false;
        }else if(crit&&damage<1){

            let chatOptions={user: game.user._id,
                             speaker:{actor,alias:actor.name},
                             content:`<span class="chat-righteous">Righteous Fury</span> does ${dmg} damage through the soak!`,
                             classes:["fortyk"],
                             flavor:`<span class="chat-righteous">Righteous Fury</span>`,
                             author:actor.id};
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
        let rightMes;
        //check for vehicle, vehicle have different crit effects
        if(threshold){

            rightMes=FORTYKTABLES.thresholdCrits[hitLoc][mesRes-1];
        }else if(vehicle){
            rightMes=FORTYKTABLES.vehicleCrits[hitLoc][mesRes-1];
        }else{
            rightMes=FORTYKTABLES.crits[mesDmgType][hitLoc][mesRes-1];
        }
        //parse for tests inside the crit message
        let testStr=rightMes.match(/(?<=\#)(.*?)(?=\^)/g);
        let tests=[];
        if(testStr!==null){
            //do each test and push the result inside the result array
            for(let i=0;i<testStr.length;i++){
                let testParam=testStr[i].split(";");
                let target;
                if(vehicle){
                    target=actor.system.crew.rating;
                }else{
                    target=target=actor.system.characteristics[testParam[0]].total;
                }
                target+=parseInt(testParam[1]);
                let test=await this.fortykTest(testParam[0], "char", (target),actor, testParam[2],null,false,"",true);
                tests.push(test);
            }
            for(let i=0;i<tests.length;i++){
                rightMes=rightMes.replace(/\#.*?\^/,tests[i].template) ;
            }
        }
        //use a text area to convert to html
        var txt = document.createElement("textarea");
        txt.innerHTML = rightMes;
        rightMes= txt.value;
        if(threshold){
            mesDmgType="Threshold";
        }
        //report crit effect
        let chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:rightMes,
                         classes:["fortyk"],
                         flavor:`${source}${mesHitLoc}: ${mesRes}, ${mesDmgType} Critical effect`,
                         author:actor.id};
        let critMsg=await ChatMessage.create(chatOptions,{});
        let inlineResults={};
        //parse any inline rolls and give them to the crit function to apply critical effects

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
                         author:actor.id};
        await ChatMessage.create(chatOptions,{});
    }

    //applies critical results to token/actor
    static async critEffects(attacker, token,num,hitLoc,type,ignoreSON,activeEffects=[],source=""){

        if(game.user.isGM||token.isOwner){

            let actor=token.actor;

            switch(type){
                case "Energy":
                    await this.energyCrits(attacker,actor,num,hitLoc,ignoreSON,activeEffects,source);
                    break;
                case "Explosive":
                    await this.explosiveCrits(attacker,actor,num,hitLoc,ignoreSON,activeEffects,source);
                    break;
                case "Impact":
                    await this.impactCrits(attacker,actor,num,hitLoc,ignoreSON,activeEffects,source);
                    break;
                case "Rending":
                    await this.rendingCrits(attacker,actor,num,hitLoc,ignoreSON,activeEffects,source);
                    break;
            }

        }else{
            //if user isnt GM use socket to have gm update the actor
            let tokenId=token.id;
            let socketOp={type:"critEffect",package:{token:tokenId,num:num,hitLoc:hitLoc,type:type,ignoreSON:ignoreSON}};
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async energyCrits(attacker,actor,num,hitLoc,ignoreSON,activeEffects=[],source=""){
        switch(hitLoc){
            case "head":
                await this.energyHeadCrits(attacker,actor,num,ignoreSON,activeEffects,source);
                break;
            case "body":
                await this.energyBodyCrits(attacker,actor,num,ignoreSON,activeEffects,source);
                break;
            case "lArm":
                await this.energyArmCrits(attacker,actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rArm":
                await this.energyArmCrits(attacker,actor,num,"right",ignoreSON,activeEffects,source);
                break;
            case "lLeg":
                await this.energyLegCrits(attacker,actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rLeg":
                await this.energyLegCrits(attacker,actor,num,"right",ignoreSON,activeEffects,source);
                break;
        }
    }
    static async energyHeadCrits(attacker,actor,num,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;
        let rolls=await this._critMsg("head","Head", num, "Energy",actor,source);
        switch(num){
            case 1:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                };
                ae.changes=[];
                for(let char in game.fortyk.FORTYK.skillChars){
                    if(char!=="t"){
                        ae.changes.push({key:`system.characteristics.${char}.total`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}); 
                    }
                }
                activeEffects.push(ae);
                break;
            case 2:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                break;
            case 4:
                this._addFatigue(actor,2);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`system.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Facial scarring"}]);
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]);
                ae.changes=[{key:`system.characteristics.per.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Severe facial scarring"}]);
                activeEffects.push(ae);
                break;
            case 7:
                this._addFatigue(actor,rolls.rolls[0]);
                actor.createEmbeddedDocuments("Item",[{name:"Permanently Blinded",type:"injury"}]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`system.characteristics.fel.value`,value:rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Blind"}]);
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Tremendous facial scarring"}]);
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an energy head critical hit");
                actor.flags.core.dead=true;
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an energy head critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy head critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async energyBodyCrits(attacker,actor,num,ignoreSON,activeEffects=[],source=""){
        let tTest=false;
        let agiTest=false;
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
        let ae;
        let rolls=await this._critMsg("body","Body", num, "Energy",actor,source);
        switch(num){
            case 1:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 2:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 3:
                this._addFatigue(actor,2);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                    activeEffects.push(ae);
                }
                tTest=rolls.tests[1];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    };
                    activeEffects.push(ae);
                }
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[1]
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                    activeEffects.push(ae);
                }
                break;
            case 7:
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                injury.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                await this._createInjury(actor,"Third degree chest burns.",injury);
                break;
            case 8:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("s")]);
                ae.changes=[{key:`system.characteristics.s.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                            {key:`system.characteristics.s.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                            {key:`system.characteristics.t.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                            {key:`system.characteristics.agi.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an energy body critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy body critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async energyArmCrits(attacker,actor,num,arm,ignoreSON,activeEffects=[],source=""){
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
        let ae;
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Energy",actor,source);
        switch(num){
            case 1:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                break;
            case 2:
                this._addFatigue(actor,1);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                break;
            case 3:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 4:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                ae.changes=[{key:`system.characteristics.ws.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.changes=[{key:`system.characteristics.bs.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Lost "+arm+" hand",injury);
                break;
            case 7:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 8:
                this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[1]
                    };
                    activeEffects.push(ae);
                }
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Lost "+arm+" arm",injury);
                break;
            case 9:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an energy arm critical hit");
                    actor.flags.core.dead=true;
                    return;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return;
                    }
                    this._addFatigue(actor,rolls.rolls[0]);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    };
                    activeEffects.push(ae);
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                }
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy arm critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async energyLegCrits(attacker,actor,num,leg,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        let critActiveEffect=[];
        let tTest=false;
        let injury=null;
        if(num<10&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;
        console.log(leg, num);
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Energy",actor,source);
        switch(num){
            case 1:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:2
                };
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
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 5:
                this._addFatigue(actor,1);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,2);
                tTest=rolls.tests[0];
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
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
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    };
                    activeEffects.push(ae);
                }
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Broken "+leg+" leg",injury);
                break;
            case 8:
                this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    };
                }
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Lost "+leg+" leg",injury);
                break;
            case 9:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an energy leg critical hit");
                    actor.flags.core.dead=true;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return;
                    }
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                }
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy leg critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async explosiveCrits(attacker,actor,num,hitLoc,ignoreSON,activeEffects=[],source=""){
        switch(hitLoc){
            case "head":
                await this.explosiveHeadCrits(attacker,actor,num,ignoreSON,activeEffects,source);
                break;
            case "body":
                await this.explosiveBodyCrits(attacker,actor,num,ignoreSON,activeEffects,source);
                break;
            case "lArm":
                await this.explosiveArmCrits(attacker,actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rArm":
                await this.explosiveArmCrits(attacker,actor,num,"right",ignoreSON,activeEffects,source);
                break;
            case "lLeg":
                await this.explosiveLegCrits(attacker,actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rLeg":
                await this.explosiveLegCrits(attacker,actor,num,"right",ignoreSON,activeEffects,source);
                break;
        }
    }
    static async explosiveHeadCrits(attacker,actor,num,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<6&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;
        let rolls=await this._critMsg("head","Head", num, "Explosive",actor,source);
        switch(num){
            case 1:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 2:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 3:
                this._addFatigue(actor,2);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]);
                    injury.changes=[{key:`system.characteristics.per.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    injury.changes.push({key:`system.characteristics.fel.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD});
                    await this._createInjury(actor,"Facial scar",injury);
                }
                break;
            case 4:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                ae.changes=[{key:`system.characteristics.int.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:2
                    };
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                    ae.changes=[{key:`system.characteristics.int.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                injury.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this._createInjury(actor,"Severe facial scarring",injury);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                await this._createInjury(actor,"Deaf",injury);
                break;
            case 6:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                actor.flags.core.dead=true;
                break;
            case 7:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                actor.flags.core.dead=true;
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                actor.flags.core.dead=true;
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an explosive head critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async explosiveBodyCrits(attacker,actor,num,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);

        let tTest=false;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;

        let rolls=await this._critMsg("body","Body", num, "Explosive",actor,source);
        switch(num){
            case 1:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                this.knockback(rolls.rolls[0], attacker, actorToken);



                break;
            case 2:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                await this._addFatigue(actor,rolls.rolls[0]);
                activeEffects.push(ae);
                this.knockback(rolls.rolls[0], attacker, actorToken);
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                this.knockback(rolls.rolls[0], attacker, actorToken);

                break;
            case 4:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    };
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                await this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                    ae.changes=[{key:`system.characteristics.t.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 6:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 7:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")]);
                    activeEffects.push(ae);
                }
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an explosive body critical hit");
                actor.flags.core.dead=true;
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an explosive body critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an explosive body critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async explosiveArmCrits(attacker,actor,num,arm,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Explosive",actor,source);
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    };
                    activeEffects.push(ae);
                }
                break;
            case 3:
                await this._createInjury(actor,arm+`hand missing ${rolls.rolls[0]} fingers.`,null);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                ae.changes=[{key:`system.characteristics.ws.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.changes=[{key:`system.characteristics.bs.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 5:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                    ae.changes=[{key:`system.characteristics.ws.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                    ae.changes=[{key:`system.characteristics.bs.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }else{
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" hand",injury);
                }
                break;
            case 6:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                await this._addFatigue(actor,rolls.rolls[0]);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 7:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an explosive arm critical hit");
                    actor.flags.core.dead=true;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return;
                    }
                    await this._addFatigue(actor,rolls.rolls[0]);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[1]
                    };
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                }
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an explosive arm critical hit");
                actor.flags.core.dead=true;
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an explosive arm critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an explosive arm critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async explosiveLegCrits(attacker,actor,num,leg,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);

        let tTest=false;
        let injury=null;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;

        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Explosive",actor,source);
        switch(num){
            case 1:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 2:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4:

                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                activeEffects.duration={
                    rounds:rolls.rolls[1]
                };
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                this.knockback(rolls.rolls[0], attacker, actorToken, true);
                break;
            case 5:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,rolls.rolls[0]);
                }
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
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
                    actor.flags.core.dead=true;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return;
                    }
                    this._addFatigue(actor,rolls.rolls[0]);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[1]
                    };
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    activeEffects.push(ae);
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                }
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an explosive leg critical hit");
                actor.flags.core.dead=true;
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an explosive leg critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an explosive leg critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async impactCrits(attacker,actor,num,hitLoc,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        switch(hitLoc){
            case "head":
                await this.impactHeadCrits(attacker,actor,num,ignoreSON,activeEffects,source);
                break;
            case "body":
                await this.impactBodyCrits(attacker,actor,num,ignoreSON,activeEffects,source);
                break;
            case "lArm":
                await this.impactArmCrits(attacker,actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rArm":
                await this.impactArmCrits(attacker,actor,num,"right",ignoreSON,activeEffects,source);
                break;
            case "lLeg":
                await this.impactLegCrits(attacker,actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rLeg":
                await this.impactLegCrits(attacker,actor,num,"right",ignoreSON,activeEffects,source);
                break;
        }
    }
    static async impactHeadCrits(attacker,actor,num,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);

        let tTest=false;
        let agiTest=false;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;
        let rolls=await this._critMsg("head","Head", num, "Impact",actor,source);
        switch(num){
            case 1:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                ae.changes=[{key:`system.characteristics.per.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                ae.changes=[{key:`system.characteristics.int.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } ;
                }
                activeEffects.push(ae);
                break;
            case 4:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } ;
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 5:
                this._addFatigue(actor,1);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                } ;
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]);
                ae.changes=[{key:`system.characteristics.int.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                this.knockback(rolls.rolls[0], attacker, actorToken);
                break;
            case 6:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                this.knockback(rolls.rolls[1], attacker, actorToken);
                break;
            case 7:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 8:
                await this.applyDead(actorToken,actor,"an impact head critical hit");
                actor.flags.core.dead=true;
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact head critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact head critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async impactBodyCrits(attacker,actor,num,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);

        let tTest=false;
        let agiTest=false;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;
        let rolls=await this._critMsg("body","Body", num, "Impact",actor,source);
        switch(num){
            case 1:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 2:
                this._addFatigue(actor,1);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 4:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:2
                };
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,rolls.rolls[0]);
                }
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:2
                };
                activeEffects.push(ae);
                this.knockback(rolls.rolls[1], attacker, actorToken);
                break;
            case 7:
                await this._createInjury(actor,rolls.rolls[0]+" ribs broken",null);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 8:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact body critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact body critical hit");
                actor.flags.core.dead=true;
                this.knockback(rolls.rolls[0], attacker, actorToken);
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async impactArmCrits(attacker,actor,num,arm,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
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
        let ae;
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Impact",actor,source);
        switch(num){
            case 1:
                break;
            case 2:
                this._addFatigue(actor,1);
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 4:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                    ae.changes=[{key:`system.characteristics.ws.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                    ae.changes=[{key:`system.characteristics.bs.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                activeEffects.push(ae);
                await this._createInjury(actor,"Useless "+arm+" arm",null);
                break;
            case 6:
                this._addFatigue(actor,1);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                    ae.changes=[{key:`system.characteristics.ws.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                    ae.changes=[{key:`system.characteristics.bs.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 7:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an impact arm critical hit");
                    actor.flags.core.dead=true;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return;
                    }
                    this._addFatigue(actor,rolls.rolls[0]);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[1]
                    };
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Useless "+arm+" arm",injury);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact arm critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact arm critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async impactLegCrits(attacker,actor,num,leg,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
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
        let ae;
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Impact",actor,source);
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.duration={
                    rounds:1
                };
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } ;
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                    activeEffects.push(ae);
                }
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                } ;
                activeEffects.push(ae);
                let base=actor.system.secChar.movement.half;
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`system.secChar.movement.multi`,value:(1/base),mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 6:
                this._addFatigue(actor,2);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
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
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:2
                } ;
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Useless "+leg+" leg",injury);
                activeEffects.push(injury);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"an impact leg critical hit");
                    actor.flags.core.dead=true;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return;
                    }
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    activeEffects.push(injury);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                    ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact leg critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact leg critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async rendingCrits(attacker,actor,num,hitLoc,ignoreSON,activeEffects=[],source=""){
        switch(hitLoc){
            case "head":
                await this.rendingHeadCrits(attacker,actor,num,ignoreSON,activeEffects,source);
                break;
            case "body":
                await this.rendingBodyCrits(attacker,actor,num,ignoreSON,activeEffects,source);
                break;
            case "lArm":
                await this.rendingArmCrits(attacker,actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rArm":
                await this.rendingArmCrits(attacker,actor,num,"right",ignoreSON,activeEffects,source);
                break;
            case "lLeg":
                await this.rendingLegCrits(attacker,actor,num,"left",ignoreSON,activeEffects,source);
                break;
            case "rLeg":
                await this.rendingLegCrits(attacker,actor,num,"right",ignoreSON,activeEffects,source);
                break;
        }
    }
    static async rendingHeadCrits(attacker,actor,num,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let injury=null;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;
        let rolls=await this._critMsg("head","Head", num, "Rending",actor,source);
        switch(num){
            case 1:
                if(parseInt(actor.system.characterHitLocations.head.armor)===0){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                ae.changes=[{key:`system.characteristics.ws.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                ae.changes=[{key:`system.characteristics.bs.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("target")]);
                ae.changes=[{key:`system.characterHitLocations.head.armorMod`,value:-99,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 4:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                ae.changes=[{key:`system.characteristics.per.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                    await this._createInjury(actor,"Lost eye",injury);
                }
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                if(parseInt(actor.system.characterHitLocations.head.armor)===0){
                    await this._createInjury(actor,"Lost ear",null);
                    tTest=rolls.tests[0];
                    if(!tTest.value){
                        ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                        ae.changes=[{key:`system.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                        activeEffects.push(ae);
                    }
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                    activeEffects.push(ae);
                }else{
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects["target"]);
                    ae.changes=[{key:`system.characterHitLocations.head.armorMod`,value:-99,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    activeEffects.push(ae);
                }
                break;
            case 6:
                this._addFatigue(actor,rolls.rolls[0]);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                if(rolls.rolls[1]<=3){
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                    await this._createInjury(actor,"Lost eye",injury);
                }else if(rolls.rolls[1]<=7){
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                    injury.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(injury);
                    await this._createInjury(actor,"Lost nose",injury);
                }else if(rolls.rolls[1]<=10){
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                    await this._createInjury(actor,"Lost ear",injury);
                }
                break;
            case 7:
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                await this._createInjury(actor,"Permanent blindness",injury);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                ae.changes=[{key:`system.characteristics.fel.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 8:
                await this.applyDead(actorToken,actor,"a rending head critical hit");
                actor.flags.core.dead=true;
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending head critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending head critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async rendingBodyCrits(attacker,actor,num,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let upd=false;
        if(activeEffects===null){
            upd=true;
            activeEffects=[];
        }
        let ae;
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
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } ;
                    activeEffects.push(ae);
                }
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                } ;
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 4:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                } ;
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 6:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                break;
            case 7:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("crippled")]);
                activeEffects.push(ae);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"a rending body critical hit");
                    actor.flags.core.dead=true;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return;
                    }
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                    ae.changes=[{key:`system.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}]; 
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:1
                    } ;
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending body critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending body critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async rendingArmCrits(attacker,actor,num,arm,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
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
        let ae;
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
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                }
                break;
            case 4:
                this._addFatigue(actor,2);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                ae.duration={
                    rounds:rolls.rolls[0]
                };
                activeEffects.push(ae);
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 6:
                tTest=rolls.tests[0];
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                if(!tTest.value){
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" hand",injury);
                }else{
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,arm+` hand maimed, lost ${rolls.rolls[0]} fingers`,injury);
                }
                break;
            case 7:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("s")]);
                ae.changes=[{key:`system.characteristics.s.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"a rending arm critical hit");
                    actor.flags.core.dead=true;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return;
                    }
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[0]
                    };
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending arm critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending arm critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async rendingLegCrits(attacker,actor,num,leg,ignoreSON,activeEffects=[],source=""){
        let actorToken=getActorToken(actor);
        let tTest=false;
        let agiTest=false;
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
        let ae;
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Rending",actor,source);
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]); 
                    activeEffects.push(ae);
                }
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                break;
            case 4: 
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                ae.changes=[{key:`system.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(ae);
                break;
            case 5:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]);
                    ae.changes=[{key:`system.characteristics.agi.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    activeEffects.push(ae);
                }
                break;
            case 6:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                activeEffects.push(injury);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this._createInjury(actor,"Lost "+leg+" foot",injury);
                }
                break;
            case 7:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                activeEffects.push(ae);
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                activeEffects.push(ae);
                break;
            case 8:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this.applyDead(actorToken,actor,"a rending leg critical hit");
                    actor.flags.core.dead=true;
                }else{
                    if(!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
                        await this._sON(actor);
                        return;
                    }
                    injury=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`system.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    activeEffects.push(injury);
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]);
                    activeEffects.push(ae);
                    ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                    ae.duration={
                        rounds:rolls.rolls[0]
                    };
                    activeEffects.push(ae);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending leg critical hit");
                actor.flags.core.dead=true;
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending leg critical hit");
                actor.flags.core.dead=true;
                break;
        }
        if(upd){
            await this.applyActiveEffect(actorToken,activeEffects);
        }
    }
    static async superHeavyRightEffects(token,num,hitLoc,ignoreSON,activeEffects=[],source="",options={}){

        let actor=token.actor;
        let rightMes="";
        let facing=options.facing;
        let weapon=options.targetWeapon;
        let weaponData;
        let weaponUpdate;
        let threshold=options.threshold;
        let vehicleOptions=options;
        let ae;
        if(threshold===1){
            rightMes=`Righteous fury reduces ${facing.label} armor by 1!`;
            ae={};
            ae.name=`${facing.label} Armor damage`;
            ae.changes=[{key:`system.facings.${facing.path}.armor`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
            ae.flags={fortyk:{repair:"armordmg"}};
            activeEffects.push(ae);


        }else if(threshold===2){
            let armorRoll=new Roll(`1d5`,{});

            await armorRoll.evaluate();
            let armorReduction=armorRoll._total;
            rightMes=`Righteous fury reduces ${facing.label} armor by ${armorReduction}!`;
            ae={};
            ae.name=`${facing.label} Armor damage`;
            ae.changes=[{key:`system.facings.${facing.path}.armor`,value:-armorReduction,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
            ae.flags={fortyk:{repair:"armordmg"}};
            activeEffects.push(ae);
        }else if(threshold>=3){
            switch(hitLoc.value){
                case "hull":
                    let components=[];
                    components=components.concat(actor.itemTypes.ammunition,actor.itemTypes.forceField,actor.itemTypes.knightComponent,actor.itemTypes.knightCore);
                    components=components.filter(component=>(component.system.state!=="X")&&(component.system.state!==0));
                    let size=components.length;

                    let compRoll=new Roll(`1d${size}-1`,{});

                    await compRoll.evaluate();
                    let component=components[compRoll._total];
                    if(component){
                        let compData=component.system;
                        let compUpdate={};
                        if(component.type==="ammunition"){
                            component.system.state.value="X";
                            compUpdate["system.state.value"]="X";
                            rightMes=`${component.name} explodes dealing weapon damage!`;
                            options.explosions.push({vehicle:actor,component:component,facing:facing,extraDmg:""});

                        }else if(compData.state.value==="O"){
                            compUpdate["system.state.value"]="D";
                            rightMes=`${component.name} is damaged.`;
                        }else if(compData.state.value==="D"){
                            component.system.state.value="X";
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
                        await component.update(compUpdate);
                    }


                    break;
                case "weapon":
                    if(!weapon){return;}
                    if(weapon){
                        weaponData=weapon.system;
                        weaponUpdate={};
                        if(weaponData.state.value==="O"){
                            weaponUpdate["system.state.value"]="D";
                            rightMes=`${weapon.name} is damaged.`;
                        }else if(weaponData.state.value==="D"){
                            weaponUpdate["system.state.value"]="X";
                            rightMes=`${weapon.name} is destroyed.`;
                            vehicleOptions.explosions.push({vehicle:vehicle,component:weapon,facing:facing});
                        }
                        await weapon.update(weaponUpdate);
                    }


                    break;
                case "motive":
                    if(activeEffects){
                        let ae={};
                        ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);

                        if(actor.system.secChar.speed.motive==="O"){
                            ae.name="Motive System Impaired";
                            let speedRoll=new Roll(`1d10`,{});

                            await speedRoll.evaluate();
                            let speedReduction=speedRoll._total;
                            ae.changes=[{key:`system.secChar.speed.mod`,value:-speedReduction,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                        {key:`system.secChar.speed.motive`,value:"I",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                            ae.flags={fortyk:{repair:"motiveimpaired"}};
                            rightMes=`The motive system is impaired reducing tactical speed by ${speedReduction}!`;
                        }else if(actor.system.secChar.speed.motive==="I"){
                            ae.name="Motive System Crippled";
                            ae.changes=[{key:`system.secChar.speed.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                        {key:`system.secChar.speed.motive`,value:"C",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                            ae.flags={fortyk:{repair:"motivecrippled"}};
                            rightMes=`The motive system is crippled reducing tactical speed by half!`;
                        }else if(actor.system.secChar.speed.motive==="C"){
                            ae.name="Motive System Destroyed";
                            ae.changes=[{key:`system.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                        {key:`system.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                            ae.flags={fortyk:{repair:"motivedestroyed"}};
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
                    if(weaponData.state.value==="O"){
                        weaponUpdate["system.state.value"]="D";
                        rightMes=`${weapon.name} is damaged.`;
                    }else if(weaponData.state.value==="D"){
                        weaponUpdate["system.state.value"]="X";
                        rightMes=`${weapon.name} is destroyed.`;
                        vehicleOptions.explosions.push({vehicle:vehicle,component:weapon,facing:facing});
                    }
                    await weapon.update(weaponUpdate);
                    break;
            }
        }

        //report crit effect
        let chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:rightMes,
                         classes:["fortyk"],
                         flavor:`${source} Threshold:${threshold} ${hitLoc.label} Critical effect`,
                         author:actor.id};
        let critMsg=await ChatMessage.create(chatOptions,{});
    }
    static async vehicleCrits(token,num,hitLoc,ignoreSON,activeEffects,source="",vehicleOptions={}){
        let actor=token.actor;

        switch(hitLoc){
            case "hull":

                await this.hullCrits(token,num,hitLoc,ignoreSON,activeEffects,source,vehicleOptions);
                break;
            case "weapon":
                await this.weaponCrits(token,num,hitLoc,ignoreSON,activeEffects,source,vehicleOptions);
                break;
            case "motive":

                await this.motiveCrits(token,num,hitLoc,ignoreSON,activeEffects,source,vehicleOptions);
                break;
            case "turret":

                await this.turretCrits(token,num,hitLoc,ignoreSON,activeEffects,source,vehicleOptions);
                break;
        }
    }
    static async hullCrits(token,num,hitLoc,ignoreSON,activeEffects,source,vehicleOptions){
        let vehicle=token.actor;
        let rolls=await this._critMsg("hull","Hull", num, "",vehicle,source);
        let ae;
        let facing=vehicleOptions.facing;
        let pilot;
        let critEffect;
        let critEffectData;
        let ae2;
        let armor;
        switch(num){
            case 1:
                break;
            case 2:
                break;
            case 3:
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]);
                ae.changes=[{key:`system.crew.bs`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                ae.duration={
                    rounds:1
                };
                activeEffects.push(ae);
                break;
            case 4:

                if(vehicle.getFlag("fortyk","protectpilot")){
                    return;
                }
                if(vehicle.system.crew.pilotID){
                    pilot=game.actors.get(vehicle.system.crew.pilotID);
                    await this._addFatigue(pilot,1);
                    critEffectData={name:"Critical Effect",type:"rangedWeapon"};

                    critEffectData.flags.fortyk={};
                    critEffectData.flags.fortyk.blast=1;
                    critEffectData.system={};
                    critEffectData.system.damageFormula={};
                    critEffectData.system.damageFormula.value="1d10+6";
                    critEffectData.system.damageType={};
                    critEffectData.system.damageType.value="Impact";
                    critEffect=await Item.create(critEffectData, {temporary: true});

                    await FortykRolls.damageRoll(critEffect.system.damageFormula,pilot,critEffect,1, true);
                }

                break;
            case 5:
                let armorRoll=rolls.rolls[0];

                ae={};
                ae.name=`${facing.label} Armor damage`;
                ae.changes=[{key:`system.facings.${facing.path}.armor`,value:-armorRoll,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                ae.flags={fortyk:{repair:"armordmg"}};
                activeEffects.push(ae);
                //reduce facing armor by 1d10
                break;
            case 6:
                if(vehicle.getFlag("fortyk","protectpilot")){
                    return;
                }
                if(vehicle.system.crew.pilotID){
                    pilot=game.actors.get(vehicle.system.crew.pilotID);
                    await this._addFatigue(pilot,1);
                    critEffectData={name:"Critical Effect",type:"rangedWeapon"};

                    critEffectData.flags.fortyk={};
                    critEffectData.flags.fortyk.blast=1;
                    critEffectData.flags.fortyk.flame=true;
                    critEffectData.system={};
                    critEffectData.system.damageFormula={};
                    critEffectData.system.damageFormula.value="1d10+6";
                    critEffectData.system.damageType={};
                    critEffectData.system.damageType.value="Explosive";
                    critEffect=await Item.create(critEffectData, {temporary: true});

                    await FortykRolls.damageRoll(critEffect.system.damageFormula,pilot,critEffect,1, true);
                }
                //if pilot code a damaging hit 1d10+6 explosive +1 fatigue that also tests for agility(0) or set on fire
                break;
            case 7:
                armor=vehicle.system.facings[facing.path].armor;
                armor=Math.ceil(armor/2);
                ae={};
                ae.name=`${facing.label} Armor damage`;
                ae.changes=[{key:`system.facings.${facing.path}.armor`,value:-armor,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                ae.flags={fortyk:{repair:"armordmg"}};
                activeEffects.push(ae);
                //facing loses half armor
                break;
            case 8:
                armor=vehicle.system.facings[facing.path].armor;
                armor=Math.ceil(armor/2);
                ae={};
                ae.name=`${facing.label} Armor damage`;
                ae.changes=[{key:`system.facings.${facing.path}.armor`,value:-armor,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                ae.flags={fortyk:{repair:"armordmg"}};
                activeEffects.push(ae);
                ae2=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                activeEffects.push(ae2);
                // as bove but also set vehicle on fire
                break;
            case 9:
                this.applyDead(token, vehicle, "a hull critical effect!");
                if(vehicle.getFlag("fortyk","protectpilot")){
                    return;
                }
                if(vehicle.system.crew.pilotID){
                    pilot=game.actors.get(vehicle.system.crew.pilotID);
                    await this._addFatigue(pilot,1);
                    critEffectData={name:"Critical Effect",type:"rangedWeapon"};

                    critEffectData.flags.fortyk={};
                    critEffectData.flags.fortyk.blast=1;
                    critEffectData.flags.fortyk.concussive=1;
                    critEffectData.system={};
                    critEffectData.system.damageFormula={};
                    critEffectData.system.damageFormula.value="1d10+6";
                    critEffectData.system.damageType={};
                    critEffectData.system.damageType.value="Explosive";
                    critEffect=await Item.create(critEffectData, {temporary: true});

                    await FortykRolls.damageRoll(critEffect.system.damageFormula,pilot,critEffect,1, true);
                }
                //vehicle explodes set dead pilot takes 1d10+6 explosive with concussive(1)
                break;
            case 10:
                this.applyDead(token, vehicle, "a hull critical effect!");
                if(vehicle.getFlag("fortyk","protectpilot")){
                    return;
                }
                if(vehicle.system.crew.pilotID){
                    pilot=game.actors.get(vehicle.system.crew.pilotID);
                    await this._addFatigue(pilot,1);
                    critEffectData={name:"Critical Effect",type:"rangedWeapon"};

                    critEffectData.flags.fortyk={};
                    critEffectData.flags.fortyk.blast=1;
                    critEffectData.system={};
                    critEffectData.system.damageFormula={};
                    critEffectData.system.damageFormula.value="2d10+18";
                    critEffectData.system.damageType={};
                    critEffectData.system.damageType.value="Explosive";
                    critEffect=await Item.create(critEffectData, {temporary: true});

                    await FortykRolls.damageRoll(critEffect.system.damageFormula,pilot,critEffect,1, true);
                }
                //vehicle explodes set dead, pilot takes 2d10+18
                break;
        }

    }
    static async weaponCrits(token,num,hitLoc,ignoreSON,activeEffects,source,vehicleOptions){
        let vehicle=token.actor;
        let weapon=vehicleOptions.targetWeapon;
        let rolls= await this._critMsg("weapon","Weapon", num, "",vehicle,source);
        if(!weapon){return;}

        let ae;
        let disabledAe;
        let facing=vehicleOptions.facing;
        let pilot;
        let critEffect;
        let critEffectData;
        let ae2;
        switch(num){
            case 1:
                disabledAe= {
                    name: "Weapon Disabled",
                    changes:[
                        {key: "flags.fortyk.disabled", value: true, mode:FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}            
                    ],
                    duration:{
                        rounds:1
                    },
                    transfer:false
                };
                weapon.createEmbeddedDocuments("ActiveEffect",[disabledAe]);
                break;
            case 2:
                await weapon.update({"system.clip.value":0});
                //gun jams
                break;
            case 3:
                let penaltyAe= {
                    name: "Weapon Penalised",
                    changes:[
                        {key: "system.testMod.value", value: -10, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD}            
                    ],
                    duration:{
                        rounds:rolls.rolls[0]
                    },
                    transfer:false
                };
                weapon.createEmbeddedDocuments("ActiveEffect",[penaltyAe]);
                //gun gets -10 for 1d5 rounds
                break;
            case 4:
                //
                break;
            case 5:
                if(weapon.system.state.value==="O"){
                    await weapon.update({"system.state.value":"D"});
                }else if(weapon.system.state.value==="D"){
                    await weapon.update({"system.state.value":"X"});
                }
                //weapon damaged
                break;
            case 6:
                let targettingAe= {
                    name: "Targetting destroyed",
                    changes:[
                        {key: "system.testMod.value", value: -20, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD}            
                    ],
                    transfer:false
                };
                ae.flags={fortyk:{repair:"targetting"}};
                weapon.createEmbeddedDocuments("ActiveEffect",[targettingAe]);
                //weapon gets -20 to hit
                break;
            case 7:
                let explosionAe= {
                    name: "Weapon Explosion",
                    changes:[
                        {key: "flags.fortyk.explosion", value: true, mode:FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}            
                    ],
                    transfer:false
                };
                ae.flags={fortyk:{repair:"explosion"}};
                weapon.createEmbeddedDocuments("ActiveEffect",[explosionAe]);
                //weapon gets flag for potential explosions us ae so its eays to remove
                break;
            case 8:
                await weapon.update({"system.state.value":"X"});
                vehicleOptions.explosions.push({vehicle:vehicle,component:weapon,facing:facing});
                //weapon destroyed
                break;
            case 9:
                await weapon.update({"system.state.value":"X"});
                vehicleOptions.explosions.push({vehicle:vehicle,component:weapon,facing:facing});
                if(vehicle.getFlag("fortyk","protectpilot")){
                    return;
                }
                if(vehicle.system.crew.pilotID){
                    pilot=game.actors.get(vehicle.system.crew.pilotID);
                    await this._addFatigue(pilot,1);
                    critEffectData={name:"Critical Effect",type:"rangedWeapon"};

                    critEffectData.flags.fortyk={};
                    critEffectData.flags.fortyk.blast=1;
                    critEffectData.flags.fortyk.flame=true;
                    critEffectData.system={};
                    critEffectData.system.damageFormula={};
                    critEffectData.system.damageFormula.value="1d10+6";
                    critEffectData.system.damageType={};
                    critEffectData.system.damageType.value="Explosive";
                    critEffect=await Item.create(critEffectData, {temporary: true});

                    await FortykRolls.damageRoll(critEffect.system.damageFormula,pilot,critEffect,1, true);
                }
                //weapon destroyed, pilot take 1d10+6 explosive, 1 fatigue and tets 0 agi or catch fire
                break;
            case 10:
                this.applyDead(token, vehicle, "a weapon critical effect");
                if(vehicle.getFlag("fortyk","protectpilot")){
                    return;
                }
                if(vehicle.system.crew.pilotID){
                    pilot=game.actors.get(vehicle.system.crew.pilotID);
                    await this._addFatigue(pilot,1);
                    critEffectData={name:"Critical Effect",type:"rangedWeapon"};

                    critEffectData.flags.fortyk={};
                    critEffectData.flags.fortyk.blast=1;
                    critEffectData.system={};
                    critEffectData.system.damageFormula={};
                    critEffectData.system.damageFormula.value="2d10+18";
                    critEffectData.system.damageType={};
                    critEffectData.system.damageType.value="Explosive";
                    critEffect=await Item.create(critEffectData, {temporary: true});

                    await FortykRolls.damageRoll(critEffect.system.damageFormula,pilot,critEffect,1, true);
                }
                //vehicle explodes set dead, pilot takes 2d10+18
                break;
        }
    }

    static async motiveCrits(token,num,hitLoc,ignoreSON,activeEffects,source,vehicleOptions){
        let vehicle=token.actor;
        let rolls=await this._critMsg("motive","Motive System", num, "",vehicle,source);
        let tarNumbr=vehicleOptions.tarNumbr;
        let fallen=vehicleOptions.fallen;
        let ae;
        let disabledAe;
        let facing=vehicleOptions.facing;
        let pilot;
        let critEffect;
        let critEffectData;
        let ae2;
        switch(num){
            case 1:
                if(vehicle.system.crew.pilotID){
                    pilot=game.actors.get(vehicle.system.crew.pilotID);
                    await this._addFatigue(pilot,1);
                }

                //test operate or rotate
                let rotateRoll=rolls.tests[0];
                if(!rotateRoll.value){


                    token.document.update({"rotation":Math.floor(Math.random()*360)});

                }
                break;
            case 2:
                disabledAe= {
                    name: "Speed hampered",
                    duration:{
                        rounds:1
                    }
                };
                activeEffects.push(disabledAe);
                //ae that reminds of speed limitation
                break;
            case 3:
                if(vehicle.system.secChar.speed.motive==="D"){return;}
                ae={};

                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);

                if(vehicle.system.secChar.speed.motive==="O"){
                    ae.name="Motive System Impaired";
                    let speedReduction=rolls.rolls[0];
                    ae.changes=[{key:`system.secChar.speed.mod`,value:-speedReduction,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"I",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motiveimpaired"}};
                }else if(vehicle.system.secChar.speed.motive==="I"){
                    ae.name="Motive System Crippled";
                    ae.changes=[{key:`system.secChar.speed.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"C",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motivecrippled"}};
                }else if(vehicle.system.secChar.speed.motive==="C"){
                    ae.name="Motive System Destroyed";
                    ae.changes=[{key:`system.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motivedestroyed"}};

                }

                activeEffects.push(ae);
                //lower speed by 1d10 and add impaired
                break;
            case 4:
                disabledAe= {
                    name: "Driving hampered"
                };
                disabledAe.flags={fortyk:{repair:"motiveimpaired"}};
                activeEffects.push(disabledAe);
                //ad status to remind of operate tests
                break;
            case 5:
                if(vehicle.system.type.value==="Walker"){
                    activeEffects.push(foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                    if(!vehicle.getFlag("core","prone")){
                        fallen[tarNumbr]=true;
                    }

                }
                //code falling over if walker
                break;
            case 6:
                if(vehicle.system.secChar.speed.motive==="D"){return;}
                ae={};

                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.flags={fortyk:{repair:true}};
                if(vehicle.system.secChar.speed.motive==="O"){
                    ae.name="Motive System Impaired";
                    let speedReduction=rolls.rolls[0];
                    ae.changes=[{key:`system.secChar.speed.mod`,value:-speedReduction,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"I",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motiveimpaired"}};
                }else if(vehicle.system.secChar.speed.motive==="I"){
                    ae.name="Motive System Crippled";
                    ae.changes=[{key:`system.secChar.speed.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"C",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motivecrippled"}};
                }else if(vehicle.system.secChar.speed.motive==="C"){
                    ae.name="Motive System Destroyed";
                    ae.changes=[{key:`system.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motivedestroyed"}};
                }

                activeEffects.push(ae);
                //damage the motive system
                break;
            case 7:
                if(vehicle.getFlag("fortyk","protectpilot")){
                    return;
                }
                if(vehicle.system.crew.pilotID){
                    pilot=game.actors.get(vehicle.system.crew.pilotID);
                    await this._addFatigue(pilot,1);
                    critEffectData={name:"Critical Effect",type:"rangedWeapon"};

                    critEffectData.flags.fortyk={};
                    critEffectData.flags.fortyk.blast=1;
                    critEffectData.system={};
                    critEffectData.system.damageFormula={};
                    critEffectData.system.damageFormula.value="1d10";
                    critEffectData.system.damageType={};
                    critEffectData.system.damageType.value="Impact";
                    critEffect=await Item.create(critEffectData, {temporary: true});

                    await FortykRolls.damageRoll(critEffect.system.damageFormula,pilot,critEffect,1, true);
                }

                //pilot takes 1d10 damage and 1 fatigue
                break;
            case 8:
                if(vehicle.system.secChar.speed.motive==="D"){return;}
                ae={};
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.flags={fortyk:{repair:"motivedestroyed"}};
                ae.name="Motive System Destroyed";
                ae.changes=[{key:`system.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                            {key:`system.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                activeEffects.push(ae);
                //destroy motive system
                break;
            case 9:

                ae2=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                activeEffects.push(ae2);
                if(vehicle.system.secChar.speed.motive==="D"){return;}
                ae={};
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.flags={fortyk:{repair:"motivedestroyed"}};
                ae.name="Motive System Destroyed";
                ae.changes=[{key:`system.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                            {key:`system.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                activeEffects.push(ae);
                //destroy motive system +fire
                break;
            case 10:
                if(vehicle.system.type.value==="Walker"){
                    activeEffects.push(foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                    if(!vehicle.getFlag("core","prone")){
                        fallen[tarNumbr]=true;
                    }

                }
                if(vehicle.system.secChar.speed.motive==="D"){return;}
                ae={};
                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.flags={fortyk:{repair:"motivedestroyed"}};
                ae.name="Motive System Destroyed";
                ae.changes=[{key:`system.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                            {key:`system.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                activeEffects.push(ae);

                //destroy motive system+FALLING OVER IF WALKER+flipped over if not
                break;
        }
    }
    static async turretCrits(token,num,hitLoc,ignoreSON,activeEffects,source,vehicleOptions){
        let vehicle=token.actor;
        let weapon=vehicleOptions.targetWeapon;
        let rolls= await this._critMsg("turret","Turret", num, "",vehicle,source);
        if(!weapon){return;}

        let ae;
        let facing=vehicleOptions.facing;
        let pilot;
        let critEffect;
        let critEffectData;
        let ae2;
        let disabledAe;
        switch(num){
            case 1:
                disabledAe= {
                    name: "Weapon Disabled",
                    changes:[
                        {key: "flags.fortyk.disabled", value: true, mode:FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}            
                    ],
                    duration:{
                        rounds:1
                    },
                    transfer:false
                };
                weapon.createEmbeddedDocuments("ActiveEffect",[disabledAe]);
                break;
            case 2:
                await weapon.update({"system.clip.value":0});
                break;
            case 3:
                let penaltyAe= {
                    name: "Weapon Penalised",
                    changes:[
                        {key: "system.testMod.value", value: -10, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD}            
                    ],
                    duration:{
                        rounds:rolls.rolls[0]
                    },
                    transfer:false
                };
                weapon.createEmbeddedDocuments("ActiveEffect",[penaltyAe]);
                break;
            case 4:

                break;
            case 5:
                disabledAe= {
                    name: "Weapon Disabled",
                    changes:[
                        {key: "flags.fortyk.disabled", value: true, mode:FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}            
                    ],

                    transfer:false
                };
                disabledAe.flags={fortyk:{repair:"damagedcomponent"}};
                weapon.createEmbeddedDocuments("ActiveEffect",[disabledAe]);
                break;
            case 6:
                let targettingAe= {
                    name: "Targetting destroyed",
                    changes:[
                        {key: "system.testMod.value", value: -20, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD}            
                    ],
                    transfer:false
                };
                targettingAe.flags={fortyk:{repair:"targetting"}};
                weapon.createEmbeddedDocuments("ActiveEffect",[targettingAe]);
                break;
            case 7:
                let rearAe= {
                    name: "Turret Armor Damaged",
                    changes:[
                        {key: "flags.fortyk.rear", value: true, mode:FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}            
                    ],
                    transfer:false
                };
                weapon.createEmbeddedDocuments("ActiveEffect",[rearAe]);
                break;
            case 8:
                await weapon.update({"system.state.value":"X"});
                ae2=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                activeEffects.push(ae2);
                break;
            case 9:
                await weapon.update({"system.state.value":"X"});
                ae2=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                activeEffects.push(ae2);
                break;
            case 10:

                this.applyDead(token,vehicle,"a turret explosion");
                //vehicle explodes set dead, pilot takes 2d10+18
                break;
        }
    }
    static async thresholdCrits(crossed,hitLoc,tar,activeEffects, vehicleOptions){
        let actor=tar.actor;

        let source="Threshold crit ";


        for(let i=0;i<crossed.length;i++){
            switch(hitLoc){
                case "hull":

                    await this.thresholdHullCrits(crossed[i],tar,activeEffects, source, vehicleOptions);
                    break;
                case "weapon":
                    await this._critMsg("weapon","Weapon", crossed[i], "",actor,source,true);
                    await this.thresholdWeaponCrits(crossed[i],tar,activeEffects, source, vehicleOptions);
                    break;
                case "motive":

                    await this.thresholdMotiveCrits(crossed[i],tar,activeEffects, source, vehicleOptions);
                    break;
                case "turret":
                    await this._critMsg("turret","Turret", crossed[i], "",actor,source,true);
                    await this.thresholdTurretCrits(crossed[i],tar,activeEffects, source, vehicleOptions);
                    break;
            }
        }

    }
    static async thresholdHullCrits(crossed,tar,activeEffects, source, vehicleOptions){

        let vehicle=tar.actor;
        let pilot=game.actors.get(vehicle.system.crew.pilotID);
        let components;
        let size;
        let compRoll;
        let component;
        let ae;
        let rolls=await this._critMsg("hull","Hull", crossed, "",vehicle,source,true);
        let facing=vehicleOptions.facing;
        let rightMes;
        switch(crossed){
            case 1:
                if(pilot){

                    if(pilot.getFlag("core","frenzy")){
                        return;
                    }
                    let toughness=pilot.system.characteristics.t.total;
                    let testTarget=toughness+10;
                    if(vehicle.getFlag("fortyk","motiondampening")){
                        testTarget+=30;
                    }
                    let test=await this.fortykTest("t", "Test", testTarget, pilot, "Resist stun", null, false);
                    let result=test.value;

                    if(!result){
                        ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                        ae.duration={
                            rounds:1
                        };
                        activeEffects.push(ae);
                    }
                }
                break;
            case 2:
                components=[];
                components=components.concat(vehicle.itemTypes.ammunition,vehicle.itemTypes.forceField,vehicle.itemTypes.knightComponent,vehicle.itemTypes.knightCore);
                components=components.filter(component=>(component.system.state!=="X")&&(component.system.state!==0));
                size=components.length;

                compRoll=new Roll(`1d${size}-1`,{});

                await compRoll.evaluate();
                component=components[compRoll._total];
                if(component){
                    let compData=component.system;
                    let compUpdate={};
                    if(component.type==="ammunition"){
                        compUpdate["system.state.value"]="X";
                        rightMes=`${component.name} explodes dealing weapon damage!`;
                        vehicleOptions.explosions.push({vehicle:vehicle,component:component,facing:facing,extraDmg:""});

                    }else if(compData.state.value==="O"){
                        compUpdate["system.state.value"]="D";
                        rightMes=`${component.name} is damaged.`;
                    }else if(compData.state.value==="D"){
                        component.system.state.value="X";
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
                    await component.update(compUpdate);
                }
                break;
            case 3:

                let armorReduction=rolls.rolls[0];


                ae={};
                ae.name=`${facing.label} Armor damage`;
                ae.changes=[{key:`system.facings.${facing.path}.armor`,value:-armorReduction,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                ae.flags={fortyk:{repair:"armordmg"}};
                activeEffects.push(ae);
                break;
            case 4:
                components=[];
                components=components.concat(vehicle.itemTypes.ammunition,vehicle.itemTypes.forceField,vehicle.itemTypes.knightComponent,vehicle.itemTypes.knightCore);
                components=components.filter(component=>(component.system.state!=="X")&&(component.system.state!==0));
                size=components.length;

                compRoll=new Roll(`1d${size}-1`,{});

                await compRoll.evaluate();
                component=components[compRoll._total];
                if(component){
                    let compData=component.system;
                    let compUpdate={};
                    if(component.type==="ammunition"){
                        component.system.state.value="X";
                        compUpdate["system.state.value"]="X";
                        rightMes=`${component.name} explodes dealing weapon damage!`;
                        vehicleOptions.explosions.push({vehicle:vehicle,component:component,facing:facing,extraDmg:""});
                    }else if(compData.state.value==="O"){
                        component.system.state.value="X";
                        compUpdate["system.state.value"]="X";
                        rightMes=`${component.name} is destroyed.`;
                    }else if(compData.state.value==="D"){
                        component.system.state.value="X";
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
                    await component.update(compUpdate);
                }
                break;

        }
        if(rightMes){
            let chatOptions={user: game.user._id,
                             speaker:{vehicle,alias:vehicle.name},
                             content:rightMes,
                             classes:["fortyk"],
                             flavor:`Threshold Crit Effect`,
                             author:vehicle.id};
            await ChatMessage.create(chatOptions,{});

        }

    }
    static async thresholdWeaponCrits(crossed,tar,activeEffects, source, vehicleOptions){
        let weapon=vehicleOptions.targetWeapon;
        if(!weapon){return;}
        let vehicle=tar.actor;
        let facing=vehicleOptions.facing;
        switch(crossed){
            case 1:
                let disabledAe= {
                    name: "Weapon Disabled",
                    changes:[
                        {key: "flags.fortyk.disabled", value: true, mode:FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}            
                    ],
                    duration:{
                        rounds:1
                    },
                    transfer:false
                };
                weapon.createEmbeddedDocuments("ActiveEffect",[disabledAe]);
                break;
            case 2:
                let targetAe= {
                    name: "Targetting Damaged",
                    changes:[
                        {key: "system.testMod.value", value: -20, mode:FORTYK.ACTIVE_EFFECT_MODES.ADD}            
                    ],
                    transfer:false
                };
                targetAe.flags={fortyk:{repair:"targetting"}};
                weapon.createEmbeddedDocuments("ActiveEffect",[targetAe]);
                break;
            case 3:
                await weapon.update({"system.state.value":"D"});
                break;
            case 4:
                await weapon.update({"system.state.value":"X"});
                vehicleOptions.explosions.push({vehicle:vehicle,component:weapon,facing:facing,extraDmg:"2d10"});

                break;

        }

    }
    static async thresholdMotiveCrits(crossed,tar,activeEffects, source, vehicleOptions){

        let vehicle=tar.actor;
        let tarNumbr=vehicleOptions.tarNumbr;
        let fallen=vehicleOptions.fallen;
        let rolls=await this._critMsg("motive","Motive System", crossed, "",vehicle,source,true);
        let vehicleData=vehicle.system;
        let ae={name:"Motive system Damage"};
        let rotateRoll;
        switch(crossed){
            case 1:
                rotateRoll=rolls.tests[0];
                if(!rotateRoll.value){

                    if(vehicle.system.type.value==="Walker"){
                        activeEffects.push(foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                        if(!vehicle.getFlag("core","prone")){
                            fallen[tarNumbr]=true;
                        }

                    }else{
                        tar.document.update({"rotation":Math.floor(Math.random()*360)});
                    }

                }
                break;
            case 2:
                ae.changes=[{key:`system.secChar.speed.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                ae.duration={rounds:1};
                activeEffects.push(ae);

                break;
            case 3:
                if(vehicle.system.secChar.speed.motive==="D"){return;}
                ae={};

                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.flags={fortyk:{repair:true}};
                if(vehicle.system.secChar.speed.motive==="O"){
                    ae.name="Motive System Impaired";
                    let speedReduction=rolls.rolls[0];
                    ae.changes=[{key:`system.secChar.speed.mod`,value:-speedReduction,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"I",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motiveimpaired"}};
                }else if(vehicle.system.secChar.speed.motive==="I"){
                    ae.name="Motive System Crippled";
                    ae.changes=[{key:`system.secChar.speed.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"C",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motivecrippled"}};
                }else if(vehicle.system.secChar.speed.motive==="C"){
                    ae.name="Motive System Destroyed";
                    ae.changes=[{key:`system.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motivedestroyed"}};
                }

                activeEffects.push(ae);
                break;
            case 4:

                rotateRoll=rolls.tests[0];
                if(!rotateRoll.value){

                    if(vehicle.system.type.value==="Walker"){
                        activeEffects.push(foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                        if(!vehicle.getFlag("core","prone")){
                            fallen[tarNumbr]=true;
                        }
                    }else{
                        tar.document.update({"rotation":Math.floor(Math.random()*360)});
                    }

                }
                if(vehicle.system.secChar.speed.motive==="D"){return;}
                ae={};

                ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                ae.flags={fortyk:{repair:true}};
                if(vehicle.system.secChar.speed.motive==="O"||vehicle.system.secChar.speed.motive==="I"){
                    ae.name="Motive System Crippled";
                    ae.changes=[{key:`system.secChar.speed.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"C",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motivecrippled"}};
                }else if(vehicle.system.secChar.speed.motive==="C"){
                    ae.name="Motive System Destroyed";
                    ae.changes=[{key:`system.secChar.speed.multi`,value:"0",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE},
                                {key:`system.secChar.speed.motive`,value:"D",mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM}];
                    ae.flags={fortyk:{repair:"motivedestroyed"}};
                }

                activeEffects.push(ae);
                break;

        }

    }
    static async thresholdTurretCrits(crossed,tar,activeEffects, source, vehicleOptions){
        switch(crossed){
            case 1:
                break;
            case 2:
                break;
            case 3:
                break;
            case 4:
                break;

        }

    }
    static async applyActiveEffect(token,effect,ignoreSON=false){

        if(effect.length>0){
            if(game.user.isGM||token.isOwner){


                let actor;
                if(token instanceof Token){
                    actor=token.actor;
                }else{
                    actor=token;
                }
                let aEs=[];
                for(let index=0; index <effect.length;index++){
                    let dupp=false;
                    let newAe=effect[index];
                    for(let ae of actor.effects){
                        if(!ae.statuses.has("weakened")&&!ae.statuses.has("buff")&&newAe.statuses&&ae.statuses.has(newAe.statuses[0])){
                            dupp=true;
                            let change=false;
                            let upg=false;
                            let changes=ae.changes;
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
                        aEs.push(effect[index]);
                    }
                }
                let effects=await actor.createEmbeddedDocuments("ActiveEffect",aEs);
                /*if(actor.isToken){
                    console.log(actor.token)
                    actor.token._object._refreshEffects();
                }else{
                    let tokens=actor.getActiveTokens();
                    console.log(tokens)
                    for(let i=0;i<tokens.length;i++){
                        let token=tokens[i];
                        token._refreshEffects();
                    }
                }*/
                if (window.EffectCounter) {
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
                let socketOp={type:"applyActiveEffect",package:{token:tokenId,effect:effect}};
                await game.socket.emit("system.fortyk",socketOp);
            }
        }
    }
    static async fallingWalker(vehicle, token){
        await sleep(500);
        let fallAngle=Math.floor(Math.random()*360);
        let facings=vehicle.system.facings;
        let facing=null;
        let split={};
        for(const face in facings){
            let f=facings[face];
            //check for split facing  eg starts at 316 and ends at 45
            if(f.end<f.start){
                split=f;
            }
            if(fallAngle>=f.start&&fallAngle<=f.end){

                facing=f;
            }
        }
        token.document.update({"rotation":fallAngle});
        let fallData={name:"Fall",type:"rangedWeapon"};
        fallData.flags={};
        fallData.flags.fortyk={};
        fallData.flags.fortyk.randomlocation=true;
        fallData.flags.fortyk.setfacing=facing;
        fallData.system={};
        fallData.system.damageFormula={};
        fallData.system.damageFormula.value="2d10";
        fallData.system.damageType={};
        fallData.system.damageType.value="Impact";
        fallData.system.pen={};
        fallData.system.pen.value=99999;
        let fall=await Item.create(fallData, {temporary: true});
        let damageDone=await FortykRolls.damageRoll(fall.system.damageFormula,vehicle,fall,1, true);
        if(vehicle.getFlag("fortyk","protectpilot")){
            return;
        }
        if(vehicle.system.crew.pilotID){
            let pilot=game.actors.get(vehicle.system.crew.pilotID);
            fall.system.damageFormula.value=Math.ceil(damageDone[0]/2).toString();
            await FortykRolls.damageRoll(fall.system.damageFormula,pilot,fall,1, true);
            let testTarget=pilot.system.characteristics.t.total;
            if(vehicle.getFlag("fortyk","motiondampening")){
                testTarget+=30;
            }
            let test=await this.fortykTest("t", "Test", testTarget, pilot, "Resist stun", null, false);
            let result=test.value;

            if(!result){
                let ae=foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                ae.duration={
                    rounds:1
                };
                this.applyActiveEffect(vehicle,[ae]);
                this.applyActiveEffect(pilot,[ae]);
            }


        }



    }

    static async ammoExplosion(vehicle, ammo, facing, extraDmg=""){
        if(vehicle.getFlag("fortyk","casing")){
            let chatCasing={user: game.user._id,
                            speaker:{vehicle,alias:vehicle.name},
                            content:`${vehicle.name} has casing preventing ammunition and wepon explosions!`,
                            flavor:"Casing!",
                            author:vehicle.id};
            await ChatMessage.create(chatCasing,{});
            return;
        }
        if(ammo.getFlag("fortyk","nonexplosive")){
            let chatCasing={user: game.user._id,
                            speaker:{vehicle,alias:vehicle.name},
                            content:`${ammo.name} is non explosive!`,
                            flavor:"Non explosive",
                            author:vehicle.id};
            await ChatMessage.create(chatCasing,{});
            return;
        }
        if(ammo.type==="Ammunition"&&ammo.getFlag("fortyk","nonexplosiveammo")){
            let chatCasing={user: game.user._id,
                            speaker:{vehicle,alias:vehicle.name},
                            content:`${ammo.name} is non explosive!`,
                            flavor:"Non explosive",
                            author:vehicle.id};
            await ChatMessage.create(chatCasing,{});
            return;
        }
        await sleep(500);
        let explosionData={
            name:`${ammo.name} explosion`,
            type:"rangedWeapon",
            system:{},
            flags:{}
        };
        explosionData.flags.fortyk={};
        explosionData.flags.fortyk.randomlocation=true;
        explosionData.flags.fortyk.setfacing=facing;

        explosionData.system.damageFormula={};
        explosionData.system.damageFormula.value=ammo.system.damageFormula.formula;
        if(extraDmg){explosionData.system.damageFormula.value+=`+${extraDmg}`;}
        if(ammo.type==="meleeWeapon"){
            explosionData.system.damageFormula.value=`(${explosionData.system.damageFormula.value})/2`; 
        }
        explosionData.system.damageType={};
        explosionData.system.damageType.value="Explosive";
        explosionData.system.pen={};
        explosionData.system.pen.value=999;
        let explosion=await Item.create(explosionData, {temporary: true});

        await FortykRolls.damageRoll(explosion.system.damageFormula,vehicle,explosion,1, true);
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
                             author:actor.id};
            await ChatMessage.create(chatOptions,{});
            let id=target.id;

            if(actor.getFlag("fortyk","regeneration")&&actor.system.race.value==="Necron"){
                let activeEffect=[foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")])];
                await this.applyActiveEffect(actor,activeEffect);
            }else{
                let activeEffect=[foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("dead")])];

                await this.applyActiveEffect(actor,activeEffect);
                try{
                    let combatant = await game.combat.getCombatantByToken(id);
                    let combatid=combatant.id;
                    let update=[];
                    update.push({"_id":combatid, 'defeated':true});
                    await game.combat.updateEmbeddedDocuments("Combatant",update);
                }catch(err){
                } 
            }


        }else{
            let tokenId=target._id;
            let socketOp={type:"applyDead",package:{token:tokenId,actor:actor,cause:cause}};
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async _addFatigue(actor,newfatigue){

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
            let socketOp={type:"updateValue",package:{token:tokenId,value:newfatigue,path:"system.secChar.fatigue.value"}};
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async _createInjury(actor,injury,injuryAeData){
        if(actor.type!=="npc"){
            let injuryItem=await Item.create({type:"injury",name:injury},{temporary:true});
            //injuryAeData.transfer=true;
            //await injuryItem.createEmbeddedDocuments("ActiveEffect",[injuryAeData]);
            await actor.createEmbeddedDocuments("Item",[foundry.utils.duplicate(injuryItem)]);
        }
    }
    static async knockback(knockback, attackerToken, actorToken, randomAngle=false) {

        knockback=knockback*canvas.dimensions.distancePixels;
        let knockbackCoord=knockbackPoint(attackerToken,actorToken,knockback, randomAngle);

        let collisions=collisionPoint(actorToken,knockbackCoord);

        let smallestCollision=smallestDistance(actorToken,collisions);
        if(smallestCollision){

            actorToken.document.update(smallestCollision);
        }else{
            actorToken.document.update(knockbackCoord);
        }

    }
    /*static ajustCollisionKnockback(token, collisionPoint){
        let tokenx=token.x;
        let tokeny=token.y;
        let pointx=collisionPoint.x;
        let pointy=collisionPoint.y;
        let x=pointx;
        let y=pointy;
        if(pointx>tokenx){
            x-=token.width;
        }
        if(pointy>tokeny){
            y-=token.height;
        }
        return{x:x,y:y}
    }*/
}