/* provides functions for doing tests or damage rolls
*/
import {FORTYKTABLES} from "./FortykTables.js";
import {getActorToken} from "./utilities.js";
import {tokenDistance} from "./utilities.js";
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
    static async fortykTest(char, type, target, actor, label, fortykWeapon=null, reroll=false, fireRate="",delayMsg=false){
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
            fireRate:fireRate
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
            }else if(((weapon.data.quality.value==="Good"&&!fortykWeapon.getFlag("fortyk","unreliable"))||fortykWeapon.getFlag("fortyk","reliable"))&&testRoll===100){
                jam=true;
            }else if(testRoll>=96){
                jam=true;
            }else if((fireRate==="full"||fireRate==="semi")&&testRoll>=94){
                jam=true;
            }else if(fortykWeapon.getFlag("fortyk","unreliable")&&weapon.data.quality.value==="Good"&&testRoll>=96){
                jam=true;
            }else if(((!weapon.data.quality.value==="Good"&&fortykWeapon.getFlag("fortyk","unreliable"))||fortykWeapon.getFlag("fortyk","overheats"))&&testRoll>=91){
                jam=true;
            }
        }
        templateOptions["rollResult"]="Roll: "+testRoll.toString();
        templateOptions["target"]="Target: "+target.toString();
        const testResult=roll._total>=0;
        try{
            var charObj=actor.data.data.characteristics[char];
        }catch(err){
            var charObj=undefined;
        }

        if(charObj===undefined){charObj={"uB":0}}
        var testDos=0;
        //calculate degrees of failure and success
        if((testResult&&testRoll<96||testRoll===1)&&!jam){
            testDos=Math.floor(Math.abs(roll._total)/10)+1+Math.ceil(charObj.uB/2);
            //close quarter combat dos bonus
            if((type==="rangedAttack"||type==="meleeAttack")&&actor.getFlag("fortyk","closequarterdiscipline")){
                let attackRange=actor.data.data.secChar.lastHit.attackRange;
                if(attackRange==="melee"||attackRange==="pointBlank"||attackRange==="short"){
                    testDos+=1;
                } 

            }
            //weapon instinct bonus DoS
            if((type==="rangedAttack"||type==="meleeAttack")&&actor.getFlag("fortyk","weaponinstinct")&&fortykWeapon&&weapon.data.type.value==="Exotic"){
                testDos+=1;
            }

            templateOptions["dos"]="with "+testDos.toString()+" degree";
            if(testDos===1){}else{templateOptions["dos"]+="s";}
            templateOptions["dos"]+=" of success!";
            templateOptions["pass"]="Pass!";
            templateOptions["success"]=true;

        }else{
            testDos=Math.floor(Math.abs(roll._total)/10)+1;
            templateOptions["dos"]="with "+testDos.toString()+" degree";
            if(testDos===1){}else{templateOptions["dos"]+="s";}
            templateOptions["dos"]+=" of failure!";
            templateOptions["success"]=false;
            if(jam){
                templateOptions["pass"]="Weapon jammed or overheated!";
            }else if(testRoll>=96){
                templateOptions["pass"]="96+ is an automatic failure!";
            }
            else{
                templateOptions["pass"]="Failure!"; 
            }
        }
        //adamantium faith logic
        if(type==="fear"&&!templateOptions["success"]&&actor.getFlag("fortyk","adfaith")){
            let wpb=actor.data.data.characteristics.wp.bonus;
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
        if(templateOptions["success"]&&(type==="rangedAttack"||type==="meleeAttack"||type==="focuspower"&&(fortykWeapon.data.data.class.value==="Psychic Bolt"||fortykWeapon.data.data.class.value==="Psychic Barrage"||fortykWeapon.data.data.class.value==="Psychic Storm"||fortykWeapon.data.data.class.value==="Psychic Blast"))){
            attack=true;
        }
        //determine number of hits
        let hits=0;
        if(attack){
            hits=1;
            let attackType=actor.data.data.secChar.lastHit.attackType;
            if(type==="meleeAttack"){
                let wsBonus=actor.data.data.characteristics.ws.bonus;
                if(attackType==="swift"){
                    hits+=Math.min(wsBonus,Math.floor((testDos-1)/2))
                }else if(attackType==="lightning"){
                    hits=Math.min(testDos,wsBonus);
                }
                let attackTarget=game.user.targets.first();
                if(attackTarget!==undefined){
                    let horde=attackTarget.actor.data.data.horde.value;
                    if(horde){
                        hits+=Math.floor(testDos/2)
                    }
                }
            }else if(type==="rangedAttack"){
                if(fortykWeapon.getFlag("fortyk","twinlinked")&&testDos>=3){
                    hits++
                }
                let rof=1;
                if(attackType==="semi"){
                    rof=weapon.data.rof[1].value;
                    hits+=Math.min(rof,Math.floor((testDos-1)/2));
                }else if(attackType==="full"){
                    rof=weapon.data.rof[2].value;
                    hits+=Math.min(rof,(testDos));
                }
                if(fortykWeapon.getFlag("fortyk","storm")){
                    hits=hits*2;
                }
            }else if(type==="focuspower"){
                let pr=weapon.data.curPR.value;
                if(fortykWeapon.data.data.class.value==="Psychic Barrage"){
                    hits+=Math.min(pr,Math.floor((testDos-1)/2))
                }else if(fortykWeapon.data.data.class.value==="Psychic Storm"){
                    hits=Math.min(pr,testDos);
                }
            }
            templateOptions["numberHits"]=`The attack scores ${hits} hit`
            if(hits>1){
                templateOptions["numberHits"]+="s."
            }else{
                templateOptions["numberHits"]+="."
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
        if(attack){
            //reverse roll to get hit location
            let inverted=parseInt(secondDigit*10+firstDigit);
            let hitlocation=FORTYKTABLES.hitLocations[inverted];
            if(actor.data.data.secChar.lastHit.attackType==="called"){
                hitlocation=FORTYKTABLES.hitLocations[actor.data.data.secChar.lastHit.called];
            }
            await actor.update({"data.secChar.lastHit.value":hitlocation.name,"data.secChar.lastHit.label":hitlocation.label,"data.secChar.lastHit.dos":testDos});
            let chatOp={user: game.user._id,
                        speaker:{actor,alias:actor.name},
                        content:`Location: ${hitlocation.label}`,
                        classes:["fortyk"],
                        flavor:"Hit location",
                        author:actor.name};
            await ChatMessage.create(chatOp,{});

            //blast
            if((weapon.data.type==="Launcher"||weapon.data.type==="Grenade")&&fortykWeapon.getFlag("fortyk","blast")&&!testResult&&jam){
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
                                author:actor.name};
                await ChatMessage.create(chatFumble,{});
            }else if(fortykWeapon.getFlag("fortyk","blast")&&!testResult){
                let chatScatter={user: game.user._id,
                                 speaker:{actor,alias:actor.name},
                                 content:`The shot goes wild! <img class="fortyk" src="../systems/fortyk/icons/scatter.png">`,
                                 flavor:"Shot Scatters!",
                                 author:actor.name};
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
            }
            //overheats
            if(fortykWeapon.getFlag("fortyk","overheats")&&jam){
                let chatOverheat={user: game.user._id,
                                  speaker:{actor,alias:actor.name},
                                  content:`<div class="fortyk"><p>The weapon overheats!</p> <a class="button overheat" data-actor="${actor._id}"  data-weapon="${weaponid}">Take Damage</a></div>`,
                                  flavor:"Weapon Overheat!",
                                  author:actor.name};
                await ChatMessage.create(chatOverheat,{});
            }
        }
        //if attack has target, check if target has forcefield and do forcefield tests if so
        /*
        if(attack&&game.user.targets.size!==0){
            console.log("hey")
            if(game.user.isGM){
                for(let tar of game.user.targets){
                    let tarActor=tar.actor;
                    let forcefield=tarActor.data.data.secChar.wornGear.forceField.document;
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
            let psykerType=actor.data.data.psykana.psykerType.value;
            let basePR=actor.data.data.psykana.pr.effective;
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
                    let mod=parseInt(actor.data.data.psykana.phenomena.value);
                    let sustain=parseInt(actor.data.data.psykana.pr.sustain);
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
                    if(actor.data.data.race.value==="Ork"){
                        psyFlavor="Perils of the Waaagh!";
                    }
                    await psyRoll.roll();
                    await psyRoll.toMessage({
                        speaker: ChatMessage.getSpeaker({ actor: actor }),
                        flavor: psyFlavor
                    });
                    let phenomResult=parseInt(psyRoll._total);
                    if(phenomResult>100){phenomResult=100};
                    if(phenomResult<1){phenomResult=1};
                    if(phenomResult>75){perils=true};
                    let phenomMessage="";
                    let flavor="";
                    var ork=false;
                    if(actor.data.data.race.value==="Ork"){
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
                                    author:actor.name};
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
                               author:actor.name};
                await ChatMessage.create(chatShock,{}); 
            }else{
                let chatShock={user: game.user._id,
                               speaker:{actor,alias:actor.name},
                               content:"Fear imposes a -10 penalty until the end of the scene!",
                               classes:["fortyk"],
                               flavor:"Shock effect",
                               author:actor.name};
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
        if(perilsResult>100){perilsResult=100};
        let perilsMessage=FORTYKTABLES.perils[perilsResult];
        if(ork){perilsMessage=FORTYKTABLES.eadBang[perilsResult]}
        let chatPhenom={user: game.users.current,
                        speaker:{user: game.users.current},
                        content:perilsMessage,
                        classes:["fortyk"],
                        flavor:perilsFlavor,
                        author:game.users.current
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
        if(forcefield.data.data.broken.value){
            return
        }
        let data=forcefield.data.data;
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
            lastHit=actor.data.data.secChar.lastHit;
        }

        let attackerToken=actor.getActiveTokens()[0];

        let curHit={};
        var hammer=false;
        if(actor.getFlag("fortyk","hammerblow")&&lastHit.attackType==="allout"){

            if(isNaN(parseInt(fortykWeapon.getFlag("fortyk","concussive")))){
                hammer=true;
                await fortykWeapon.setFlag("fortyk","concussive",2);
            }else{
                await fortykWeapon.setFlag("fortyk","concussive",fortykWeapon.getFlag("fortyk","concussive")+2);
            }

            weapon.data.pen.value=parseInt(weapon.data.pen.value)+Math.ceil(actor.data.data.characteristics.s.bonus/2);
        }

        if(targets===null){
            targets=user.targets;
        }
        if(self){

            if(overheat){
                let arm=["rArm","lArm"];
                let rng=Math.floor(Math.random() * 2);
                curHit=game.fortyk.FORTYK.extraHits[arm[rng]][0]; 
            }else{
                curHit=game.fortyk.FORTYK.extraHits["body"][0];
            }
            targets.add(attackerToken);
        }else{


            curHit=lastHit;
        }


        let form=formula.value.toLowerCase();
        //peerless killer
        if(actor.getFlag("fortyk","peerlesskiller")&&lastHit.attackType==="called"){
            form+="+2";
        }
        //scatter weapon logic
        if(fortykWeapon.getFlag("fortyk","scatter")){

            if(targets.size>0){
                let targetIt=targets.values();
                let target=targetIt.next().value;
                let distance=tokenDistance(attackerToken,target);

                if(distance<=2||distance<=2*canvas.dimensions.distance){
                    form+="+3";
                }else if(distance>=parseInt(weapon.data.range.value)/2){
                    form+="-3";
                }
            }

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
        //change formula for tearing weapons 
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
                form=`{`+startstr+`,${dieNum*fortykWeapon.getFlag("fortyk","primitive")}}kl1`+endstr; 
            }else if(fortykWeapon.getFlag("fortyk","proven")){
                form=`{`+startstr+`,${dieNum*fortykWeapon.getFlag("fortyk","proven")}}kh1`+endstr; 
            }


        }
        //change formula for cleanse with fire for flame weapons
        if(actor.getFlag("fortyk","cleansewithfire")&&fortykWeapon.getFlag("fortyk","flame")){
            let wpb=actor.data.data.characteristics.wp.bonus;
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
        //loop for the number of hits
        for(let h=0;h<(hits);h++){
            if(hitNmbr>5){hitNmbr=0}
            if(!self){
                curHit=game.fortyk.FORTYK.extraHits[lastHit.value][hitNmbr];
            }
            //spray and blast weapons always hit the body hit location
            if(fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","spray")){
                curHit.value="body";
                curHit.label="Body";
            }

            //formations and hordes always get hit in the body
            if(targets.size>0){
                let targetIt=targets.values();
                let target=targetIt.next().value;
                let targetData=target.actor.data.data;

                if(targetData.horde.value||targetData.formation.value){
                    curHit.value="body";
                    curHit.label="Body";

                }
            }
            let roll=new Roll(form,actor.data.data);
            let label = weapon.name ? `Rolling ${weapon.name} damage to ${curHit.label}.` : 'damage';
            await roll.roll();
            //calculate righteous for non targetted rolls
            let tenz=0;

            try{
                for ( let r of roll.dice[0].results ) {
                    if(r.active){
                        if(r.result>=tarRighteous){
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
                                    author:actor.name};
                    await ChatMessage.create(jamOptions,{});
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
                    data=tar.actor.data.data; 
                    tarActor=tar.actor;
                    let armorSuit=data.secChar.wornGear.armor.document;
                    let isHordelike=false;
                    if(data.horde.value||data.formation.value){
                        isHordelike=true;
                    }
                    let tarRighteous=righteous;
                    let damageOptions={
                        wpnName:fortykWeapon.name,
                        target:tarActor.name,
                        dmgType:weapon.data.damageType.value,
                        hitLocation:curHit.label,
                        results:[]
                    }
                    let damageTemplate='systems/fortyk/templates/chat/chat-damage.html';
                    let deathwatch=false;
                    var toxic=fortykWeapon.getFlag("fortyk","toxic");
                    if(actor.getFlag("fortyk","deathwatchtraining")){


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

                                let ailmentAmt=Math.ceil(actor.data.data.characteristics.int.bonus/2);
                                if(toxic){
                                    toxic+=ailmentAmt;
                                }else{
                                    toxic=ailmentAmt;
                                }
                            }
                        }

                    }
                    if(fortykWeapon.getFlag("fortyk","daemonbane")){


                        let targetRace=data.race.value;

                        if(targetRace==="Daemon"){
                            tarRighteous-=1;
                        }

                    }
                    let tens=0;
                    let dieResults=[];
                    console.log(roll);
                    let discards=[];
                    try{
                    
                        for ( let r of roll.dice[0].results ) {
                            if(r.discarded){
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
                    if(dieResults.length<=1){
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
                            rollString+=htmlString

                            rollString+="+"
                        }
                        damageString=roll.result.replace(/\s+/g, '')

                        damageString = rollString+damageString.substring(damageString.indexOf("+") + 1);
                    }
                    damageOptions.results.push(`<div class="chat-target flexcol">`)
                    damageOptions.results.push(`Weapon damage roll: ${damageString}`)
                    if(tens){
                        damageOptions.results.push(`<span class="chat-righteous">Righteous Fury!</span>`)
                    }
                       damageOptions.results.push(`</div>`)                         
                    if(!armorSuit){
                        armorSuit=await Item.create({type:"armor",name:"standin"},{temporary:true});
                    }
                    if(!tarActor.getFlag("core","dead")){


                        let wounds=data.secChar.wounds;
                        let curWounds=wounds.value
                        if(newWounds[tarNumbr]===false){
                            newWounds[tarNumbr]=curWounds;
                        }

                        //killers eye

                        if(actor.getFlag("fortyk","killerseye")&&lastHit.attackType==="called"&&(lastHit.dos>=data.characteristics.agi.bonus)){
                            let randomKiller=new Roll("1d5",{});
                            await randomKiller.roll();

                            let killerCrit=randomKiller._total;
                            await this.critEffects(tar,killerCrit,curHit.value,weapon.data.damageType.value,ignoreSON,"Killer's Eye ");
                        }
                        let soak=0;
                        let armor=parseInt(data.characterHitLocations[curHit.value].armor);

                        //check if weapon ignores soak
                        if(!fortykWeapon.getFlag("fortyk","ignoreSoak")){

                            damageOptions.results.push(`<div class="chat-target flexcol">`)

                            let pen=0;
                            //random pen logic
                            if(isNaN(weapon.data.pen.value)){
                                let randomPen=new Roll(weapon.data.pen.value,{});
                                await randomPen.roll();
                             

                                damageOptions.results.push(`Random weapon ${weapon.data.pen.value} penetration: ${randomPen._total}`);
                           
                                pen=randomPen._total;
                            }else{
                                pen=parseInt(weapon.data.pen.value); 
                            }
                            pen+=extraPen;
                            //smite the unholy
                            if(actor.getFlag("fortyk","smitetheunholy")&&tarActor.getFlag("fortyk","fear")&&weapon.type==="meleeWeapon"){
                                if(!isNaN(tarActor.getFlag("fortyk","fear"))){
                                    pen+=parseInt(tarActor.getFlag("fortyk","fear"));
                                    
                                    damageOptions.results.push(`Smite the unholy increases damage and penetration by ${tarActor.getFlag("fortyk","fear")} against the target.`);
                                  
                                }
                            }
                            //razor sharp weapons
                            if(fortykWeapon.getFlag("fortyk","razorsharp")&&lastHit.dos>=3){
                                pen=pen*2;
                              
                                damageOptions.results.push(`Razor Sharp doubles penetration to ${pen}`);
                            }
                            //lance weapons
                            if(fortykWeapon.getFlag("fortyk","lance")){
                                pen=pen*lastHit.dos;

                                damageOptions.results.push(`Lance increases penetration to ${pen}`);
                            }
                            //handle melta weapons
                            if(fortykWeapon.getFlag("fortyk","melta")){
                                let distance=tokenDistance(attackerToken,tar);
                                let shortRange=parseInt(weapon.data.range.value)/2
                                if(distance<=shortRange){
                                    pen=pen*2;

                                    damageOptions.results.push(`Melta range increases penetration to ${pen}`);
                                }
                            }
                            //ignore natural armor weapons
                            if(fortykWeapon.getFlag("fortyk","ignoreNaturalArmor")&&tarActor.getFlag("fortyk","naturalarmor")){
                                pen+=parseInt(tarActor.getFlag("fortyk","naturalarmor"));

                                damageOptions.results.push(`The weapon ignores ${tarActor.getFlag("fortyk","naturalarmor")} natural armor.`);
                            }
                            let maxPen=Math.min(armor,pen);
                            soak=parseInt(data.characterHitLocations[curHit.value].value);
                            //resistant armor
                            if(armorSuit.getFlag("fortyk",weapon.data.damageType.value.toLowerCase())){
                                soak+=Math.ceil(armor*0.5);
                                damageOptions.results.push(`Armor is resistant against this damage type.`);
                            }
                            //warp weapon vs holy armor
                            if(fortykWeapon.getFlag("fortyk","warp")&&!armorSuit.getFlag("fortyk","holy")){
                                maxPen=armor;
                                damageOptions.results.push(`Warp weapon is repelled by warded armor.`);
                            }
                          
                            //handle cover
                            
                            if(!self&&!fortykWeapon.getFlag("fortyk","ignoreCover")&&!fortykWeapon.getFlag("fortyk","spray")&&data.characterHitLocations[curHit.value].cover&&(weapon.type==="rangedWeapon"||weapon.type==="psychicPower")){

                                let cover=parseInt(data.secChar.cover.value);
                                soak=soak+cover;
                                //reduce cover if damage is greater than cover AP
                                if(roll._total>cover&&cover!==0){
                                    let coverDmg=1;
                                    if(actor.getFlag("fortyk","nowheretohide")){
                                        coverDmg+=lastHit.dos;
                                    }
                                    cover=Math.max(0,(cover-coverDmg));
                                    if(cover!==data.secChar.cover.value){
                                        let path="data.secChar.cover.value"
                                        let pack={}
                                        pack[path]=cover;
                                        if(game.user.isGM){
                                            await tarActor.update(pack); 
                                        }else{
                                            //if user isnt GM use socket to have gm update the actor
                                            let tokenId=tar.data._id;
                                            let socketOp={type:"updateValue",package:{token:tokenId,value:cover,path:path}}
                                            await game.socket.emit("system.fortyk",socketOp);
                                        }

                                        damageOptions.results.push(`Cover is lowered by ${coverDmg}`);
                                    }
                                }
                            }
                            
                            if(fortykWeapon.getFlag("fortyk","felling")){
                                let ut=parseInt(tarActor.data.data.characteristics.t.uB);
                                let fel=Math.min(ut,fortykWeapon.getFlag("fortyk","felling"));

                                damageOptions.results.push(`Felling ignores ${fel} unnatural toughness.`);
                                soak-=fel;
                            }
                            soak=soak-maxPen;

                            //sanctified logic
                            let daemonic=tarActor.getFlag("fortyk","daemonic");
                            if(daemonic&&(weapon.type==="psychicPower"||fortykWeapon.getFlag("fortyk","force")||fortykWeapon.getFlag("fortyk","warp")||fortykWeapon.getFlag("fortyk","sanctified")||fortykWeapon.getFlag("fortyk","daemonbane"))){
                                daemonic=parseInt(daemonic);
                                if(!isNaN(daemonic)){
                                    soak-=parseInt(daemonic);

                                    damageOptions.results.push(`The attack ignores ${daemonic} soak from the daemonic trait.`);
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
                            damageOptions.results.push(`Volkite extra damage: ${volkRoll.result}`);
                        }
                        //GRAVITON LOGIC
                        if(fortykWeapon.getFlag("fortyk","graviton")){
                            let gravitonDmg=2*armor;
                            damage+=gravitonDmg;
                            chatDamage+=gravitonDmg;
                            damageOptions.results.push(`Graviton extra damage: ${gravitonDmg}`);
                        }
                        //accurate weapon logic
                        if(fortykWeapon.getFlag("fortyk","accurate")&&lastHit.aim){
                            let distance=tokenDistance(attackerToken,tar);
                            if(distance>10){
                                let accDice=Math.min(fortykWeapon.getFlag("fortyk","accurate"),Math.ceil((lastHit.dos-1)/2));
                                let accForm=accDice+"d10"
                                let accRoll=new Roll(accForm,{});
                                await accRoll.roll();

                                damageOptions.results.push(`Accurate extra damage: ${accRoll.result}`);
                                damage+=accRoll._total;
                                chatDamage+=accRoll._total;
                            }
                        }

                        //logic against swarm enemies
                        if(tarActor.getFlag("fortyk","swarm")&&!(fortykWeapon.getFlag("fortyk","spray")||fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","flame")||fortykWeapon.getFlag("fortyk","scatter"))){
                            damage=Math.ceil(damage/2);

                            damageOptions.results.push(`Swarm enemies take reduced damage against non blast, spray, flame or scatter weapons.`);
                        }
                        damage=damage-soak;
                        //corrosive weapon logic
                        if(fortykWeapon.getFlag("fortyk","corrosive")&&!isHordelike){
                            let corrosiveAmt=new Roll("1d10",{});
                            await corrosiveAmt.roll();
                            let id=randomID(5);
                            damageOptions.results.push(`<a class="popup" data-id="${id}"> Corrosive Weapon armor damage: ${corrosiveAmt._total}. <span class="popuptext" id="${id}">Excess corrosion is transferred to damage.</span</a> `);
                            let corrosiveDamage=0;
                            let newArmor=Math.max(0,(armor-corrosiveAmt._total));
                            corrosiveDamage=Math.abs(Math.min(0,(armor-corrosiveAmt._total)));
                            let corrosiveAmount=-corrosiveAmt._total;
                            let path=`data.characterHitLocations.${curHit.value}.armorMod`
                            let corrodeActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("corrode")]);
                            corrodeActiveEffect.changes=[];
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
                        damageOptions.results.push(`</div>`) 

                        //toxic weapon logic
                        if(damage>0&&!isNaN(parseInt(toxic))&&!tarActor.getFlag("fortyk","stuffofnightmares")&&!tarActor.getFlag("fortyk","undying")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let toxicMod=toxic*10;
                            if(tarActor.getFlag("fortyk","resistance")&&tarActor.getFlag("fortyk","resistance").toLowerCase().includes("toxic")){
                                toxicMod=-10;
                            }
                            let toxicTest=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total-toxicMod),tarActor, `Resist toxic ${toxic}`,null,false,"",true);
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
                        if(damage>0&&fortykWeapon.getFlag("fortyk","shocking")&&!isHordelike){
                           damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let shock=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total),tarActor, "Resist shocking",null,false,"",true);
                            damageOptions.results.push(shock.template);
                            if(!shock.value){
                                let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                stunActiveEffect.transfer=false;
                                stunActiveEffect.duration={

                                    rounds:shock.dos
                                };
                                activeEffects.push(stunActiveEffect);

                                let id=randomID(5);
                                damageOptions.results.push(`<a class="popup" data-id="${id}"> Stunned for ${shock.dos} rounds. <span class="popuptext" id="${id}">${tarActor.name} is stunned for ${shock.dos} rounds and takes 1 fatigue!</span></a>`)

                                let newfatigue=1;
                                this._addFatigue(tarActor,newfatigue);
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        //cryogenic weapon logic
                        if(damage>0&&fortykWeapon.getFlag("fortyk","cryogenic")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let cryo=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total-40),tarActor, "Resist freezing",null,false,"",true);
                            damageOptions.results.push(cryo.template);
                            if(!cryo.value){
                                let cryoRoll=new Roll("1d5",{});
                                await cryoRoll.roll();
                                let cryoDuration=parseInt(cryoRoll.result);
                                let cryoActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("cryogenic")]);
                                cryoActiveEffect.transfer=false;

                                cryoActiveEffect.duration={

                                    rounds:cryoDuration
                                };
                                activeEffects.push(cryoActiveEffect);

                                let id=randomID(5);
                                damageOptions.results.push(`<a class="popup" data-id="${id}"> Freezing for ${cryoRoll._total} rounds. <span class="popuptext" id="${id}">${tarActor.name} is freezing for ${cryoRoll.result} rounds and will take 2d10 toughness damage per round, freezing if reaching 0 toughness!</span></a>`)
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        //hallucinogenic
                        if(!isNaN(parseInt(fortykWeapon.getFlag("fortyk","hallucinogenic")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let halluMod=parseInt(fortykWeapon.getFlag("fortyk","hallucinogenic"))*10;
                            if(armorSuit.getFlag("fortyk","sealed")){
                                halluMod+=20;
                            }
                            let hallu=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total-halluMod),tarActor, "Resist hallucinogenic",null,false,"",true);
                            damageOptions.results.push(hallu.template);
                            if(!hallu.value){
                                let halluActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("hallucinogenic")]);
                                halluActiveEffect.transfer=false;
                                halluActiveEffect.duration={

                                    rounds:hallu.dos
                                };
                                activeEffects.push(halluActiveEffect);
                                let halluRoll=new Roll("1d10",{});
                                await halluRoll.roll();
                                let halluText=FORTYKTABLES.hallucinogenic[halluRoll._total-1];

                                let id=randomID(5);
                                damageOptions.results.push(`<a class="popup" data-id="${id}"> Hallucinating for ${hallu.dos+1} rounds. <span class="popuptext" id="${id}">${halluText}</span></a>`)

                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        //crippling weapon logic
                        if(damage>0&&fortykWeapon.getFlag("fortyk","crippling")&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let crippleActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("crippled")]);
                            crippleActiveEffect.location=curHit;
                            crippleActiveEffect.num=fortykWeapon.getFlag("fortyk","crippling");
                            activeEffects.push(crippleActiveEffect);

                            let id=randomID(5);
                            damageOptions.results.push(`<a class="popup" data-id="${id}"> ${tarActor.name} is crippled. <span class="popuptext" id="${id}">${tarActor.name} is crippled, they take ${fortykWeapon.getFlag("fortyk","crippling")} damage to the ${curHit.label} which ignores all soak, if they ever take more than a half action in a turn. This lasts until they are fully healed or until the end of the encounter.</span></a>`)
                            damageOptions.results.push(`</div>`) 
                        }


                        if(tens&&damage<=0){
                            damage=1;
                        }else if(damage<=0){
                            damage=0;

                        }

                        //NIDITUS WEAPON
                        if((fortykWeapon.getFlag("fortyk","niditus")&&damage)>0){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            if(tarActor.data.data.psykana.pr.value>0){
                                
                                let stun=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total),tarActor, "Resist niditus stun",null,false,"",true);
                                damageOptions.results.push(stun.template);
                                if(!stun.value){
                                    let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                    stunActiveEffect.transfer=false;
                                    stunActiveEffect.duration={

                                        rounds:stun.dos
                                    };
                                    activeEffects.push(stunActiveEffect);

                                    let id=randomID(5);
                                    damageOptions.results.push(`<a class="popup" data-id="${id}"> Stunned for ${stun.dos} rounds. <span class="popuptext" id="${id}">${tarActor.name} is stunned for ${stun.dos} rounds!</span></a>`)
                                    
                                }
                                
                            }
                            if(tarActor.getFlag("fortyk","warpinstability")){
                                let warpinst=await this.fortykTest("wp", "char", (tarActor.data.data.characteristics.wp.total-10),tarActor, "Warp instability niditus",null,false,"",true);
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
                            let fire=await this.fortykTest("agi", "char", tarActor.data.data.characteristics.agi.total,tarActor, "Resist fire",null,false,"",true);
                            damageOptions.results.push(fire.template);
                            if(!fire.value){
                                let fireActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                                activeEffects.push(fireActiveEffect);
                                let id=randomID(5);
                                damageOptions.results.push(`Catches fire!`)
                            }
                            damageOptions.results.push(`</div>`) 
                        } 
                        //snare weapon

                        if(!isNaN(parseInt(fortykWeapon.getFlag("fortyk","snare")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let snareMod=fortykWeapon.getFlag("fortyk","snare")*10;
                            let snare=await this.fortykTest("agi", "char", (tarActor.data.data.characteristics.agi.total-snareMod),tarActor, "Resist snare",null,false,"",true);
                            damageOptions.results.push(snare.template);
                            if(!snare.value){

                                let id=randomID(5);
                                damageOptions.results.push(`<a class="popup" data-id="${id}"> Immobilised. <span class="popuptext" id="${id}">${tar.name} is immobilised. An Immobilised target can attempt no actions other than trying to escape the bonds. As a Full Action, he can make a (-${snareMod}) Strength or Agility test to break free.</span></a>`)

                                let snareActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("snare")]);
                                activeEffects.push(snareActiveEffect);
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        //concussive weapon
                        if(!isNaN(parseInt(fortykWeapon.getFlag("fortyk","concussive")))&&!isHordelike){
                            damageOptions.results.push(`<div class="chat-target flexcol">`)
                            let stunMod=parseInt(fortykWeapon.getFlag("fortyk","concussive"))*10;
                            let stun=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total-stunMod),tarActor, "Resist stun",null,false,"",true);
                            damageOptions.results.push(stun.template);
                            if(!stun.value){

                                let id=randomID(5);
                                damageOptions.results.push(`<a class="popup" data-id="${id}"> Stunned for ${stun.dos} rounds. <span class="popuptext" id="${id}">${tar.name} is stunned for ${stun.dos} rounds!</span></a>`)

                                let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                stunActiveEffect.duration={

                                    rounds:stun.dos
                                };
                                activeEffects.push(stunActiveEffect);
                                if(damage>tarActor.data.data.characteristics.s.bonus){
                                    let proneActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                                    activeEffects.push(proneActiveEffect);


                                    damageOptions.results.push(`Knocked down.`)

                                }
                            }
                            damageOptions.results.push(`</div>`) 
                        }
                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        //deathdealer

                        if(damage>newWounds[tarNumbr]&&actor.getFlag("fortyk","deathdealer")&&(weapon.type.toLowerCase().includes(actor.getFlag("fortyk","deathdealer").toLowerCase()))){
                            damage+=actor.data.data.characteristics.per.bonus;
                            chatDamage+=actor.data.data.characteristics.per.bonus;
                            damageOptions.results.push(`Deathdealer increases critical damage by ${actor.data.data.characteristics.per.bonus}.`);
                        }
                        //peerless killer
                        if(actor.getFlag("fortyk","peerlesskiller")&&lastHit.attackType==="called"){
                            damage+=4;
                            chatDamage+=4;
                            damageOptions.results.push(`Peerless Killer increases critical damage by 4 on called shots.`);
                        }
                        damageOptions.results.push(`</div>`) 

                        // true grit!@!!@
                        if(!data.suddenDeath.value&&!isHordelike&&(damage>0)&&(newWounds[tarNumbr]-damage)<0&&tarActor.getFlag("fortyk","truegrit")){
                            if(newWounds[tarNumbr]>=0){
                                chatDamage=parseInt(newWounds[tarNumbr])+parseInt(Math.max(1,(chatDamage-newWounds[tarNumbr])-data.characteristics.t.bonus));
                                damage=damage-newWounds[tarNumbr];
                                newWounds[tarNumbr]=0;
                            }else{
                                chatDamage=Math.max(1,chatDamage-data.characteristics.t.bonus); 
                            }
                            damage=Math.max(1,damage-data.characteristics.t.bonus);
                            let chatOptions={user: user._id,
                                             speaker:{actor,alias:tarActor.name},
                                             content:"True Grit reduces critical damage!",
                                             classes:["fortyk"],
                                             flavor:`Critical effect`,
                                             author:tarActor.name};
                            messages.push(chatOptions);
                        }
                        //impenetrable armor logic
                        if(armorSuit.getFlag("fortyk","impenetrable")){
                            damage=Math.ceil(damage/2);
                            chatDamage=Math.ceil(damage/2);
                            if(damage>0){
                                let impOptions={user: user._id,
                                                speaker:{actor,alias:tarActor.name},
                                                content:"Impenetrable reduces damage taken by half!",
                                                classes:["fortyk"],
                                                flavor:`${armorSuit.name} is impenetrable!`,
                                                author:tarActor.name};
                                messages.push(impOptions);
                            }

                        }
                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        //process horde damage for different weapon qualities
                        if(data.horde.value&&damage>0){
                            damage=1+magdamage;
                            chatDamage=1+magdamage;
                            if(weapon.data.damageType.value==="Explosive"){
                                damage+=1;
                                chatDamage+=1;
                                damageOptions.results.push(`Explosive adds 1 damage.`);
                            }
                            if(fortykWeapon.getFlag("fortyk","powerfield")){
                                damage+=1;
                                chatDamage+=1;
                                damageOptions.results.push(`Power field adds 1 damage.`);
                            }
                            if(fortykWeapon.getFlag("fortyk","blast")){
                                damage+=fortykWeapon.getFlag("fortyk","blast");
                                chatDamage+=fortykWeapon.getFlag("fortyk","blast");
                                damageOptions.results.push(`Blast adds ${fortykWeapon.getFlag("fortyk","blast")} damage.`);
                            }
                            if(fortykWeapon.getFlag("fortyk","spray")){
                                let additionalHits=parseInt(weapon.data.range.value);
                                additionalHits=Math.ceil(additionalHits/4);
                                let addHits=new Roll("1d5");
                                await addHits.roll();
                                damageOptions.results.push(`Spray adds 1d5 damage: ${addHits.total}.`)
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
                                damageOptions.results.push(`Blast adds 2 damage.`);
                                if(tens){
                                    damageOptions.results.push(`Blast adds ${fortykWeapon.getFlag("fortyk","blast")} further damage on righteous fury.`);
                                    damage+=fortykWeapon.getFlag("fortyk","blast");
                                    chatDamage+=fortykWeapon.getFlag("fortyk","blast");
                                }
                            }
                            if(fortykWeapon.getFlag("fortyk","spray")){
                                damage+=1;
                                chatDamage+=1;
                                damageOptions.results.push(`Spray adds 1 damage.`);
                                if(tens){
                                    damage+=1;
                                    chatDamage+=1;
                                    damageOptions.results.push(`Spray adds 1 extra damage on righteous fury.`);
                                }
                            }
                        }
                        damageOptions.results.push(`</div>`) 
                        damageOptions.results.push(`<div class="chat-target flexcol">`)
                        newWounds[tarNumbr]=newWounds[tarNumbr]-damage;
                        newWounds[tarNumbr]=Math.max(wounds.min,newWounds[tarNumbr]);
                        damageOptions.results.push(`<span>Total Damage: ${chatDamage}.</span>`);
                        if(damage===0){
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

                        //check for righteous fury
                        let crit=await this._righteousFury(actor,label,weapon,curHit,tens,damage,tar,ignoreSON);
                        //apply field practitioner critical
                        if(lastHit.fieldPractice&&damage>0){

                            await this.critEffects(tar,lastHit.fieldPractice,curHit.value,weapon.data.damageType.value,ignoreSON,"Field practice ");
                        }
                        //handle critical effects and death
                        //Xenos Bane Logic #2

                        if(tens&&deathwatch&actor.getFlag("fortyk","xenosbane")&&(actor.data.data.secChar.wounds.value>=curWounds)&&!isHordelike){
                            let banetest=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total),tarActor, `Resist Xenos Bane intant death`,null,false,"",true);

                            if(!banetest.value){
                                this.applyDead(tarActor,actor,"Xenos Bane");
                            }
                        }
                        if((isHordelike)&&newWounds[tarNumbr]<=0){

                            await this.applyDead(tar,actor,`${actor.name}`);

                        }else if(data.suddenDeath.value&&newWounds[tarNumbr]<=0){
                            await this.applyDead(tar,actor`${actor.name}`);

                        }else if(newWounds[tarNumbr]<0&&damage>0){
                            let crit=Math.abs(newWounds[tarNumbr])-1;

                            await this.critEffects(tar,crit+1,curHit.value,weapon.data.damageType.value,ignoreSON);
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
                            if(self){

                                await tarActor.update({"data.secChar.wounds.value":newWounds[tarNumbr]});
                            }else{
                                await tarActor.update({"data.secChar.wounds.value":newWounds[tarNumbr]});
                            }
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
                            flavor:`Haywire Effect ${fortykWeapon.getFlag("fortyk","haywire")}m radius`,
                            author:actor.name};
            await ChatMessage.create(hayOptions,{});
        }
        if(actor.getFlag("fortyk","hammerblow")&&lastHit.attackType==="All Out"){
            if(hammer){
                await fortykWeapon.setFlag("fortyk","concussive",false);
            }else{
                await fortykWeapon.setFlag("fortyk","concussive",fortykWeapon.getFlag("fortyk","concussive")-2);
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
                               author:tarActor.name
                              };
            await ChatMessage.create(damageOptions,{});
        }

    }
    //handles righteous fury
    static async _righteousFury(actor,label,weapon,curHit,tens, damage=1, tar=null, ignoreSON=false){

        var crit=false;
        if(tens>0){
            crit=true;
        }
        if(tar!==null&&(tar.actor.data.data.horde.value||tar.actor.data.data.formation.value)){crit=false}
        //if righteous fury roll the d5 and spew out the crit result
        if(tar!==null&&crit&&tar.actor.data.data.suddenDeath.value){

            this.applyDead(tar,actor,'<span class="chat-righteous">Righteous Fury</span>');
            return true;
        }
        if(crit&&damage>0){

            let rightRoll=new Roll("1d5",actor.data.data);
            await rightRoll.roll();

            let res=rightRoll._total;
            if(tar!==null){
                await this.critEffects(tar,res,curHit.value,weapon.data.damageType.value,ignoreSON,`<span class="chat-righteous">Righteous Fury </span>`);
            }
            return true;
        }else if(crit&&damage<1){
            let chatOptions={user: game.user._id,
                             speaker:{actor,alias:actor.name},
                             content:"Righteous Fury does 1 damage through the soak!",
                             classes:["fortyk"],
                             flavor:`Righteous Fury!`,
                             author:actor.name};
            await ChatMessage.create(chatOptions,{});
            return true;
        }else{
            return false;
        }
    }
    //crit messages
    static async _critMsg(hitLoc,mesHitLoc, mesRes, mesDmgType,actor,source=""){
        let rightMes=FORTYKTABLES.crits[mesDmgType][hitLoc][mesRes-1];
        let testStr=rightMes.match(/(?<=\#)(.*?)(?=\^)/g);

        let tests=[]
        if(testStr!==null){

            for(let i=0;i<testStr.length;i++){

                let testParam=testStr[i].split(";");

                let target=actor.data.data.characteristics[testParam[0]].total+parseInt(testParam[1]);
                let test=await this.fortykTest(testParam[0], "char", (target),actor, testParam[2],null,false,"",true);
                tests.push(test);
            }
            for(let i=0;i<tests.length;i++){

                rightMes=rightMes.replace(/\#.*?\^/,tests[i].template) 
            }
        }
        var txt = document.createElement("textarea");
        txt.innerHTML = rightMes;
        rightMes= txt.value;
        let chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:rightMes,
                         classes:["fortyk"],
                         flavor:`${source}${mesHitLoc}: ${mesRes}, ${mesDmgType} Critical effect`,
                         author:actor.name};
        let critMsg=await ChatMessage.create(chatOptions,{});
        let inlineResults={}
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
                         author:actor.name};
        await ChatMessage.create(chatOptions,{});
    }

    //applies critical results to token/actor
    static async critEffects(token,num,hitLoc,type,ignoreSON,source=""){
        if(game.user.isGM||token.owner){
            let actor=token.actor;
            switch(type){
                case "Energy":
                    await this.energyCrits(actor,num,hitLoc,ignoreSON,source);
                    break;
                case "Explosive":
                    await this.explosiveCrits(actor,num,hitLoc,ignoreSON,source);
                    break;
                case "Impact":
                    await this.impactCrits(actor,num,hitLoc,ignoreSON,source);
                    break;
                case "Rending":
                    await this.rendingCrits(actor,num,hitLoc,ignoreSON,source);
                    break;
            }
        }else{
            //if user isnt GM use socket to have gm update the actor
            let tokenId=token.data._id;
            let socketOp={type:"critEffect",package:{token:tokenId,num:num,hitLoc:hitLoc,type:type,ignoreSON:ignoreSON}}
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async energyCrits(actor,num,hitLoc,ignoreSON,source=""){
        switch(hitLoc){
            case "head":
                await this.energyHeadCrits(actor,num,ignoreSON,source);
                break;
            case "body":
                await this.energyBodyCrits(actor,num,ignoreSON,source);
                break;
            case "lArm":
                await this.energyArmCrits(actor,num,"left",ignoreSON,source);
                break;
            case "rArm":
                await this.energyArmCrits(actor,num,"right",ignoreSON,source);
                break;
            case "lLeg":
                await this.energyLegCrits(actor,num,"left",ignoreSON,source);
                break;
            case "rLeg":
                await this.energyLegCrits(actor,num,"right",ignoreSON,source);
                break;
        }
    }
    static async energyHeadCrits(actor,num,ignoreSON,source=""){
        let actorToken=getActorToken(actor);
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("head","Head", num, "Energy",actor,source);
        switch(num){
            case 1:
                let critActiveEffect1=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")])];
                critActiveEffect1[0].duration={

                    rounds:1
                };
                critActiveEffect1[0].changes=[]
                for(let char in game.fortyk.FORTYK.skillChars){
                    if(char!=="t"){
                        critActiveEffect1[0].changes.push({key:`data.characteristics.${char}.total`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}); 
                    }
                }
                await this.applyActiveEffect(actorToken,critActiveEffect1);
                break;
            case 2:
                let critActiveEffect2=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")])];
                critActiveEffect2[0].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect2);
                break;
            case 3:
                let critActiveEffect3=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")])];
                critActiveEffect3[0].duration={

                    rounds:rolls.rolls[0]

                };

                await this.applyActiveEffect(actorToken,critActiveEffect3);
                break;
            case 4:
                this._addFatigue(actor,2);

                let critActiveEffect4=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")])];
                critActiveEffect4[0].duration={

                    rounds:rolls.rolls[0]

                };
                await this.applyActiveEffect(actorToken,critActiveEffect4);
                break;
            case 5:

                let critActiveEffect5=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")])];
                critActiveEffect5[0].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect5.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect5[1].duration={

                    rounds:1

                };
                critActiveEffect5.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect5[2].changes=[{key:`data.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}]
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Facial scarring"}]);
                await this.applyActiveEffect(actorToken,critActiveEffect5);
                break;
            case 6:

                this._addFatigue(actor,rolls.rolls[0]);

                let critActiveEffect6=[];
                critActiveEffect6.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]));

                critActiveEffect6.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]));
                critActiveEffect6[1].changes=[{key:`data.characteristics.per.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect6.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect6[2].changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Severe facial scarring"}]);
                await this.applyActiveEffect(actorToken,critActiveEffect6);
                break;
            case 7:

                this._addFatigue(actor,rolls.rolls[0]);
                actor.createEmbeddedDocuments("Item",[{name:"Permanently Blinded",type:"injury"}]);
                let critActiveEffect7=[];
                critActiveEffect7.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]));

                critActiveEffect7.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect7[1].changes=[{key:`data.characteristics.fel.value`,value:rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect7);
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
    }
    static async energyBodyCrits(actor,num,ignoreSON,source=""){
        let critActiveEffect=[];
        let tTest=false;
        let agiTest=false;
        let actorToken=getActorToken(actor);
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("body","Body", num, "Energy",actor,source);
        switch(num){
            case 1:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 3:
                this._addFatigue(actor,2);

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:

                this._addFatigue(actor,rolls.rolls[0]);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                agiTest=rolls.tests[0]
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]));
                }
                tTest=rolls.tests[1]
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={

                        rounds:1

                    };
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:

                this._addFatigue(actor,rolls.rolls[0]);

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[1]

                };
                agiTest=rolls.tests[0]
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]));
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:

                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                injury.changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);

                await this._createInjury(actor,"Third degree chest burns.",injury);
                break;
            case 8:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("s")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.s.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                                             {key:`data.characteristics.s.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[2].changes=[{key:`data.characteristics.t.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                                             {key:`data.characteristics.t.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[3].changes=[{key:`data.characteristics.agi.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                                             {key:`data.characteristics.agi.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect[4].changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Fourth degree chest burns."}]);
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an energy body critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy body critical hit");
                break;
        }
    }
    static async energyArmCrits(actor,num,arm,ignoreSON,source=""){
        let critActiveEffect=[];
        let tTest=false;
        let actorToken=getActorToken(actor);

        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return;
        }
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Energy",actor,source);
        switch(num){
            case 1:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                this._addFatigue(actor,1);

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:

                this._addFatigue(actor,rolls.rolls[0]);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={

                    rounds:1

                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 6:

                this._addFatigue(actor,rolls.rolls[0]);

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Lost "+arm+" hand",injury);
                break;
            case 7:

                this._addFatigue(actor,rolls.rolls[0]);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 8:

                this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                if(!tTest.value){

                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:rolls.rolls[1]

                    };
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
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
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:1

                    };
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                }
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an energy arm critical hit");
                break;
        }
    }
    static async energyLegCrits(actor,num,leg,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];
        let tTest=false;

        let injury=null;
        if(num<10&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Energy",actor,source);
        switch(num){
            case 1:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[0].duration={

                    rounds:2

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,1);
                }
                break;
            case 3:
                this._addFatigue(actor,1);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));

                critActiveEffect[1].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect[1].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[0].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                this._addFatigue(actor,1);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[1].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect[1].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                this._addFatigue(actor,2);
                tTest=rolls.tests[0];
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                if(tTest.value){
                    critActiveEffect.push(injury);
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }else{
                    await this._createInjury(actor,"Broken "+leg+" foot",injury);
                }
                break;
            case 7:

                this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:1

                    };
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Broken "+leg+" leg",injury);
                break;
            case 8:

                this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={

                        rounds:1

                    };
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
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
    }
    static async explosiveCrits(actor,num,hitLoc,ignoreSON,source=""){
        switch(hitLoc){
            case "head":
                await this.explosiveHeadCrits(actor,num,ignoreSON,source);
                break;
            case "body":
                await this.explosiveBodyCrits(actor,num,ignoreSON,source);
                break;
            case "lArm":
                await this.explosiveArmCrits(actor,num,"left",ignoreSON,source);
                break;
            case "rArm":
                await this.explosiveArmCrits(actor,num,"right",ignoreSON,source);
                break;
            case "lLeg":
                await this.explosiveLegCrits(actor,num,"left",ignoreSON,source);
                break;
            case "rLeg":
                await this.explosiveLegCrits(actor,num,"right",ignoreSON,source);
                break;
        }
    }
    static async explosiveHeadCrits(actor,num,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];
        let tTest=false;

        let injury=null;
        if(num<6&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("head","Head", num, "Explosive",actor,source);
        switch(num){
            case 1:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]));
                critActiveEffect[1].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                this._addFatigue(actor,2);
                tTest=rolls.tests[0];
                if(!tTest.value){

                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]);
                    injury.changes=[{key:`data.characteristics.per.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    injury.changes.push({key:`data.characteristics.fel.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD});
                    await this._createInjury(actor,"Facial scar",injury);
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 4:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.int.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={

                        rounds:2

                    };
                    critActiveEffect[0].changes[0].value=-1*rolls.rolls[0]-1;
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                injury.changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this._createInjury(actor,"Severe facial scarring",injury);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                await this._createInjury(actor,"Deaf",injury);
                await this.applyActiveEffect(actorToken,critActiveEffect);
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
    }
    static async explosiveBodyCrits(actor,num,ignoreSON,source=""){

        let actorToken=getActorToken(actor);

        let critActiveEffect=[];

        let tTest=false;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("body","Body", num, "Explosive",actor,source);
        switch(num){
            case 1:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await this._addFatigue(actor,rolls.rolls[0]);
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={

                    rounds:1
                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:1
                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 5:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await this._addFatigue(actor,rolls.rolls[0]);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                    critActiveEffect[2].changes=[{key:`data.characteristics.t.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                }
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Severe internal injuries"}]); 
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={

                    rounds:1

                };
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Severe chest scars"}]); 
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[2].duration={

                    rounds:rolls.rolls[0]

                };
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")]));
                }
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Severe chest scars"}]); 
                await this.applyActiveEffect(actorToken,critActiveEffect);
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
    }
    static async explosiveArmCrits(actor,num,arm,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];

        let tTest=false;
        let injury=null;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Explosive",actor,source);
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:1

                    };
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 3:

                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:arm+`hand missing ${rolls.rolls[0]} fingers.`}]); 

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                }
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                    critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Scarred "+arm+" hand"}]); 
                }else{
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" hand",injury);
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));

                await this._addFatigue(actor,rolls.rolls[0]);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                await this.applyActiveEffect(actorToken,critActiveEffect);
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
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:rolls.rolls[1]

                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                    await this.applyActiveEffect(actorToken,critActiveEffect);
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
    }
    static async explosiveLegCrits(actor,num,leg,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];

        let tTest=false;
        let injury=null;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Explosive",actor,source);
        switch(num){
            case 1:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 2:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[1].duration={

                    rounds:rolls.rolls[0]

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                let chatScatter={user: game.user._id,
                                 speaker:{actor,alias:actor.name},
                                 content:`${actor.name} is blown away! <img class="fortyk" src="../systems/fortyk/icons/scatter.png">`,
                                 flavor:"Target is blown away!",
                                 author:actor.name};
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
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[1].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect[1].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                tTest=rolls.tests[0];
                if(!tTest.value){

                    this._addFatigue(actor,rolls.rolls[0]);
                }

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.agi.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:

                this._addFatigue(actor,rolls.rolls[0]);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
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

                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:rolls.rolls[1]

                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    await this.applyActiveEffect(actorToken,critActiveEffect);
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
    }
    static async impactCrits(actor,num,hitLoc,ignoreSON,source=""){
        let actorToken=getActorToken(actor);
        switch(hitLoc){
            case "head":
                await this.impactHeadCrits(actor,num,ignoreSON,source);
                break;
            case "body":
                await this.impactBodyCrits(actor,num,ignoreSON,source);
                break;
            case "lArm":
                await this.impactArmCrits(actor,num,"left",ignoreSON,source);
                break;
            case "rArm":
                await this.impactArmCrits(actor,num,"right",ignoreSON,source);
                break;
            case "lLeg":
                await this.impactLegCrits(actor,num,"left",ignoreSON,source);
                break;
            case "rLeg":
                await this.impactLegCrits(actor,num,"right",ignoreSON,source);
                break;
        }
    }
    static async impactHeadCrits(actor,num,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];
        let tTest=false;
        let agiTest=false;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("head","Head", num, "Impact",actor,source);
        switch(num){
            case 1:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.per.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]));
                critActiveEffect[1].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect[1].changes=[                                       {key:`data.characteristics.int.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={

                        rounds:1

                    }; 
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:1

                    }; 
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 5:
                this._addFatigue(actor,1);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                }; 

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.int.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[1].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
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
    }
    static async impactBodyCrits(actor,num,ignoreSON,source=""){
        let actorToken=getActorToken(actor);


        let critActiveEffect=[];
        let tTest=false;
        let agiTest=false;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("body","Body", num, "Impact",actor,source);
        switch(num){
            case 1:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                this._addFatigue(actor,1);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:2

                };
                tTest=rolls.tests[0];
                if(!tTest.value){

                    this._addFatigue(actor,rolls.rolls[0]);
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:

                this._addFatigue(actor,rolls.rolls[0]);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={

                    rounds:2

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:

                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:rolls.rolls[0]+" ribs broken"}]);

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact body critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact body critical hit");
                break;
        }
    }
    static async impactArmCrits(actor,num,arm,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];

        let tTest=false;
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("lArm",arm+" arm", num, "Impact",actor,source);
        switch(num){
            case 1:
                break;
            case 2:
                this._addFatigue(actor,1);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                tTest=rolls.tests[0];
                if(!tTest.value){

                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                    critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];

                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-1*rolls.rolls[1],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Useless "+arm+" arm"}]);
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                this._addFatigue(actor,1);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                    critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 7:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                await this.applyActiveEffect(actorToken,critActiveEffect);
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

                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:rolls.rolls[1]

                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Useless "+arm+" arm",injury);
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact arm critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact arm critical hit");
                break;
        }
    }
    static async impactLegCrits(actor,num,leg,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];

        let tTest=false;
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Impact",actor,source);
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                critActiveEffect[0].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={

                        rounds:1

                    }; 
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={

                    rounds:1

                }; 
                let base=actor.data.data.secChar.movement.half;
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[2].changes=[{key:`data.secChar.movement.multi`,value:(1/base),mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                this._addFatigue(actor,2);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this._createInjury(actor,"Lost "+leg+" foot",injury);
                }else{
                    critActiveEffect.push(injury);
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 7:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={

                    rounds:2

                }; 
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Useless "+leg+" leg",injury);
                await this.applyActiveEffect(actorToken,critActiveEffect);
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
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);

                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"an impact leg critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"an impact leg critical hit");
                break;
        }
    }
    static async rendingCrits(actor,num,hitLoc,ignoreSON,source=""){
        switch(hitLoc){
            case "head":
                await this.rendingHeadCrits(actor,num,ignoreSON,source);
                break;
            case "body":
                await this.rendingBodyCrits(actor,num,ignoreSON,source);
                break;
            case "lArm":
                await this.rendingArmCrits(actor,num,"left",ignoreSON,source);
                break;
            case "rArm":
                await this.rendingArmCrits(actor,num,"right",ignoreSON,source);
                break;
            case "lLeg":
                await this.rendingLegCrits(actor,num,"left",ignoreSON,source);
                break;
            case "rLeg":
                await this.rendingLegCrits(actor,num,"right",ignoreSON,source);
                break;
        }
    }
    static async rendingHeadCrits(actor,num,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];

        let tTest=false;
        let injury=null;
        if(num<8&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("head","Head", num, "Rending",actor,source);
        switch(num){
            case 1:
                if(parseInt(actor.data.data.characterHitLocations.head.armor)===0){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.ws.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                critActiveEffect[1].duration={

                    rounds:rolls.rolls[0]

                };
                critActiveEffect[1].changes=[                                       {key:`data.characteristics.bs.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")])); 
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[18]));
                critActiveEffect[2].changes=[{key:`data.characterHitLocations.head.armorMod`,value:-99,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.per.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                tTest=rolls.tests[0];
                if(!tTest.value){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                    await this._createInjury(actor,"Lost eye",injury);
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:rolls.rolls[0]

                };
                if(parseInt(actor.data.data.characterHitLocations.head.armor)===0){
                    await actor.createEmbeddedDocuments("Item",[{type:"injury",name:"Lost ear"}]);
                    tTest=rolls.tests[0];
                    if(!tTest.value){
                        critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                        critActiveEffect[1].changes=[                                       {key:`data.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    }
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]));
                }else{
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[18]));
                    critActiveEffect[1].changes=[                                       {key:`data.characterHitLocations.head.armorMod`,value:-99,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:

                this._addFatigue(actor,rolls.rolls[0]);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));

                if(rolls.rolls[1]<=3){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                    await this._createInjury(actor,"Lost eye",injury);
                }else if(rolls.rolls[1]<=7){

                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                    injury.changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[2],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    await this._createInjury(actor,"Lost nose",injury);
                }else if(rolls.rolls[1]<=10){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                    await this._createInjury(actor,"Lost ear",injury);
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:

                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                await this._createInjury(actor,"Permanent blindness",injury);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.fel.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[2].duration={

                    rounds:1

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
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
    }
    static async rendingBodyCrits(actor,num,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];

        let tTest=false;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("body","Body", num, "Rending",actor,source);
        switch(num){
            case 1:
                if(parseInt(actor.data.data.characterHitLocations.body.armor)===0){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:
                this._addFatigue(actor,1);
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:1

                    }; 
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                }; 
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                }; 
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("crippled")]));
                await this.applyActiveEffect(actorToken,critActiveEffect);
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

                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                    critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}]; 
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:1

                    }; 
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending body critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending body critical hit");
                break;
        }
    };
    static async rendingArmCrits(actor,num,arm,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];
        let tTest=false;
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
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
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 4:
                this._addFatigue(actor,2);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                critActiveEffect[1].duration={

                    rounds:rolls.rolls[0]

                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);

                await this._createInjury(actor,"Useless "+arm+" arm",injury);

                await this.applyActiveEffect(actorToken,critActiveEffect);

                break;
            case 6:
                tTest=rolls.tests[0];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                if(!tTest.value){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" hand",injury);
                }else{

                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,arm+` hand maimed, lost ${rolls.rolls[0]} fingers`,injury);
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("s")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.s.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                await this.applyActiveEffect(actorToken,critActiveEffect);
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

                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={

                        rounds:rolls.rolls[0]

                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending arm critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending arm critical hit");
                break;
        }
    };
    static async rendingLegCrits(actor,num,leg,ignoreSON,source=""){
        let actorToken=getActorToken(actor);

        let critActiveEffect=[];

        let tTest=false;
        let agiTest=false;
        let injury=null;
        if(num<9&&!ignoreSON&&actor.getFlag("fortyk","stuffoffnightmares")){
            await this._sON(actor);
            return
        }
        let rolls=await this._critMsg("lLeg",leg+" Leg", num, "Rending",actor,source);
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                agiTest=rolls.tests[0];
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")])); 
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4: 

                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.agi.value`,value:-1*rolls.rolls[0],mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[2].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                tTest=rolls.tests[0];
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                tTest=rolls.tests[0];
                if(!tTest.value){
                    await this._createInjury(actor,"Lost "+leg+" foot",injury);
                }else{
                    critActiveEffect.push(injury);
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={

                    rounds:1

                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                await this.applyActiveEffect(actorToken,critActiveEffect);
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
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));

                    critActiveEffect[1].duration={

                        rounds:rolls.rolls[0]

                    };
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                await this.applyDead(actorToken,actor,"a rending leg critical hit");
                break;
            case 10:
                await this.applyDead(actorToken,actor,"a rending leg critical hit");
                break;
        }
    };
    static async applyActiveEffect(token,effect,ignoreSON=false){
        if(effect.length>0){

            if(game.user.isGM||token.owner){
                let actor=token.actor;
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
                                for(let i=0;i<ae.data.changes.length;i++){

                                    for(let z=0;z<newAe.changes.length;z++){
                                        
                                        if((ae.data.changes[i].key===newAe.changes[z].key)&&ae.data.changes[i].mode===newAe.changes[z].mode){
                                            if(!isNaN(parseInt(newAe.changes[z].value))){
                                                newAe.changes[z].value=parseInt(newAe.changes[z].value)+parseInt(ae.data.changes[i].value);
                                            }else{
                                                newAe.changes[z].value+=ae.data.changes[i].value;
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

                        skip=(await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Iron Jaw")).value;

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
                await actor.createEmbeddedDocuments("ActiveEffect",aEs);
            }else{
                //if user isnt GM use socket to have gm update the actor

                let tokenId=token.data._id;
                let socketOp={type:"applyActiveEffect",package:{token:tokenId,effect:effect}}
                await game.socket.emit("system.fortyk",socketOp);
            }
        }
    };
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
                             author:actor.name};
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

    };
    static async _addFatigue(actor,newfatigue){
        newfatigue=newfatigue+parseInt(actor.data.data.secChar.fatigue.value);
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
        let injuryItem=await Item.create({type:"injury",name:injury},{temporary:true});
        //injuryAeData.transfer=true;

        //await injuryItem.createEmbeddedDocuments("ActiveEffect",[injuryAeData]);
        await actor.createEmbeddedDocuments("Item",[injuryItem.data]);

    };
}