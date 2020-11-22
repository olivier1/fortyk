/* provides functions for doing tests or damage rolls
*/
import {FORTYKTABLES} from "./FortykTables.js";
import {getActorToken} from "./utilities.js";
import {tokenDistance} from "./utilities.js";
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
    static async fortykTest(char, type, target, actor, label, fortykWeapon=null, reroll=false, fireRate=""){
        //cap target at 100 or floor at 1
        if(target>100){
            target=100;
        }else if(target<1){
            target=1;
        }
        let roll=new Roll("1d100ms<@tar",{tar:target});
        roll.roll();
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
            templateOptions["actor"]=actor._id;
            templateOptions["char"]=char;
            templateOptions["type"]=type;
            templateOptions["targetNumber"]=target;
            templateOptions["label"]=label;
        }
        //prepare chat output
        if(reroll){
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
        var charObj=actor.data.data.characteristics[char];
        if(charObj===undefined){charObj={"uB":0}}
        var testDos=0;
        //calculate degrees of failure and success
        if((testResult&&testRoll<96||testRoll===1)&&!jam){
            testDos=Math.floor(Math.abs(roll._total)/10)+1+Math.ceil(charObj.uB/2);
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
        //give the chat object options and stuff
        let renderedTemplate= await renderTemplate(template,templateOptions);
        var chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:renderedTemplate,
                         classes:["fortyk"],
                         roll:roll,
                         author:actor.name};
        await ChatMessage.create(chatOptions,{});
        let firstDigit=Math.floor(testRoll/10);
        let secondDigit=testRoll-firstDigit*10;
        let inverted=parseInt(secondDigit*10+firstDigit);
        //determine hitlocation if the attack is a success
        if(templateOptions["success"]&&(type==="focuspower"||type==="rangedAttack"||type==="meleeAttack")){
            //reverse roll to get hit location
            let hitlocation=FORTYKTABLES.hitLocations[inverted];
            actor.data.data.secChar.lastHit.value=hitlocation.name;
            actor.data.data.secChar.lastHit.label=hitlocation.label;
            actor.data.data.secChar.lastHit.dos=testDos;
            let chatOp={user: game.user._id,
                        speaker:{actor,alias:actor.name},
                        content:`Location: ${hitlocation.label}`,
                        classes:["fortyk"],
                        flavor:"Hit location",
                        author:actor.name};
            await ChatMessage.create(chatOp,{});
        }
        //special traits
        if((type==="focuspower"||type==="rangedAttack"||type==="meleeAttack")){
            //blast
            if((weapon.data.type==="Launcher"||weapon.data.type==="Grenade")&&fortykWeapon.getFlag("fortyk","blast")&&!testResult&&jam){
                let fumbleRoll=new Roll("1d10");
                fumbleRoll.roll();
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
                distanceRoll.roll();
                await distanceRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for scatter distance."
                });
                let directionRoll=new Roll("1d10");
                directionRoll.roll();
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
        //logic for psychic phenomena and perils of the warp
        if(type==="focuspower"){
            let psykerType=actor.data.data.psykana.psykerType.value;
            let basePR=actor.data.data.psykana.pr.effective;
            let powerPR=weapon.data.curPR.value;
            let push=false;
            let phenom=false;
            let perils=false;
            if(powerPR>basePR){push=true}
            if(!push&&(firstDigit===secondDigit||testRoll===100)){
                phenom=true;
            }else if(push&&(psykerType==="bound")&&(firstDigit!==secondDigit)){
                phenom=true;
            }else if(push&&(psykerType!=="bound")){
                phenom=true;
            }
            if(phenom){
                let mod=0;
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
                psyRoll.roll();
                await psyRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Psychic Phenomena!"
                });
                let phenomResult=parseInt(psyRoll._total);
                if(phenomResult>100){phenomResult=100};
                if(phenomResult>75){perils=true};
                let phenomMessage=FORTYKTABLES.psychicPhenomena[phenomResult];
                let chatPhenom={user: game.user._id,
                                speaker:{actor,alias:actor.name},
                                content:phenomMessage,
                                classes:["fortyk"],
                                flavor:"Psychic Phenomenom!",
                                author:actor.name};
                await ChatMessage.create(chatPhenom,{});
            }
            if(perils){
                let mod=0;
                let perilsRoll=new Roll("1d100+@mod",{mod:mod});
                perilsRoll.roll();
                await perilsRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Perils of the Warp!!",
                    blind: true
                });
                let perilsResult=parseInt(perilsRoll._total);
                if(perilsResult>100){perilsResult=100};
                let perilsMessage=FORTYKTABLES.perils[perilsResult];
                let chatPhenom={user: ChatMessage.getWhisperRecipients("GM"),
                                speaker:{actor,alias:actor.name},
                                content:perilsMessage,
                                classes:["fortyk"],
                                flavor:"Perils of the Warp!!",
                                author:actor.name,
                                whisper:ChatMessage.getWhisperRecipients("GM"),
                                blind:true
                               };
                await ChatMessage.create(chatPhenom,{});
            }
        } 
        else if(type==="fear"&&!templateOptions["success"]){
            //generating insanity when degrees of failure are high enough
            if(testDos>=3){
                let insanityRoll=new Roll("1d5");
                insanityRoll.roll();
                await insanityRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling insanity for 3+ Degrees of failure"
                });
            }
            let fearRoll=new Roll("1d100 +@mod",{mod:testDos*10});
            fearRoll.roll();
            await fearRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: "Shock Roll!"
            });
            let shockMes="";
            let fearCap=0;
            if(actor.data.flags["atsknf"]){
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
        }else if(type==="forcefield"&&testRoll<=char){
            let chatOverload={user: game.user._id,
                              speaker:{actor,alias:actor.name},
                              content:"The forcefield overloads and needs to be repaired!",
                              classes:["fortyk"],
                              flavor:"Gear malfunction",
                              author:actor.name};
            await ChatMessage.create(chatOverload,{});
        }
        let result={}
        result.dos=testDos;
        result.value=templateOptions["success"];
        return result;
    }
    //handles damage rolls and applies damage to the target, generates critical effects, doesnt do any status effects yet
    static async damageRoll(formula,actor,fortykWeapon,hits=1, self=false, overheat=false){
        let weapon=duplicate(fortykWeapon);
        let righteous=10;
        if(fortykWeapon.getFlag("fortyk","vengeful")){
            righteous=fortykWeapon.getFlag("fortyk","vengeful");
        }
        let lastHit=actor.data.data.secChar.lastHit;

        let attackerToken=actor.getActiveTokens()[0];
        let targets=[];
        let curHit={};
        var hammer=false;
        if(actor.getFlag("fortyk","hammerblow")&&lastHit.attackType==="All Out"){

            if(!fortykWeapon.getFlag("fortyk","concussive")>=0){
                hammer=true;
                await fortykWeapon.setFlag("fortyk","concussive",2);
            }else{
                await fortykWeapon.setFlag("fortyk","concussive",fortykWeapon.getFlag("fortyk","concussive")+2);
            }

            weapon.data.pen.value=parseInt(weapon.data.pen.value)+Math.ceil(actor.data.data.characteristics.s.bonus/2);
        }
        if(self){
            if(overheat){
                let arm=["rArm","lArm"];
                let rng=Math.floor(Math.random() * 2);
                curHit=game.fortyk.FORTYK.extraHits[arm[rng]][0]; 
            }else{
                curHit=game.fortyk.FORTYK.extraHits["body"][0];
            }
            targets.push(attackerToken);
        }else{
            targets=game.users.current.targets;
            curHit=actor.data.data.secChar.lastHit;
        }
        if(actor.getFlag("fortyk","deathwatchtraining")){
            if(!self&&targets.size!==0){
                let target=targets.values().next().value;
                let targetRace=target.actor.data.data.race.value;
                let forRaces=actor.data.flags.deathwatchtraining;
                if(forRaces.includes(targetRace)){
                    righteous-=1;
                }
            }
        }
        //spray and blast weapons always hit the body hit location
        if(fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","spray")){
            curHit=game.fortyk.FORTYK.extraHits["body"][0];
        }
        let form=formula.value.toLowerCase();
        //change formula for tearing weapons
        if(fortykWeapon.getFlag("fortyk","tearing")){
            let dPos = form.indexOf('d');
            let dieNum = form.substr(0,dPos);
            let newNum=parseInt(dieNum)+1;
            form=form.slice(dPos);
            form=newNum+form;
            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);
            form=startstr+"dl1"+endstr;
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
        //calculate horde bonus damage
        if(actor.data.data.horde.value){
            let hordeDmgBonus=Math.min(2,Math.floor(actor.data.data.secChar.wounds.value/10));
            if(actor.getFlag("fortyk","overwhelming")&&weapon.type==="meleeWeapon"&&actor.data.data.secChar.wounds.value>=20){
                hordeDmgBonus+=1;
            }
            let dPos = form.indexOf('d');
            let dieNum = form.substr(0,dPos);
            let newNum=parseInt(dieNum)+hordeDmgBonus;
            form=form.slice(dPos);
            form=newNum+form;
        }
        let hitNmbr=0;
        //loop for the number of hits
        for(let h=0;h<(hits);h++){
            if(hitNmbr>5){hitNmbr=0}
            if(!self){
                curHit=game.fortyk.FORTYK.extraHits[lastHit.value][hitNmbr];
            }
            let roll=new Roll(form,actor.data.data);
            let label = weapon.name ? `Rolling ${weapon.name} damage.` : 'damage';
            roll.roll();
            let min=1;
            let max=10;
            if(fortykWeapon.getFlag("fortyk","primitive")){
                max=fortykWeapon.getFlag("fortyk","primitive");
            }
            if(fortykWeapon.getFlag("fortyk","proven")){
                min=fortykWeapon.getFlag("fortyk","proven");
            }
            let tens=0;
            for ( let r of roll.dice[0].results ) {
                if(r.active){
                    if(r.result>=righteous){
                        tens+=1;
                    }
                }
                r.result=Math.min(max,r.result);
                r.result=Math.max(min,r.result);
            }
            //HAYWIRE TABLE ROLL
            if(fortykWeapon.getFlag("fortyk","haywire")){
                let hayRoll=new Roll("1d5",{});
                hayRoll.roll();
                let hayText=FORTYKTABLES.haywire[hayRoll._total-1];
                let hayOptions={user: game.user._id,
                                speaker:{actor,alias:actor.name},
                                content:hayText,
                                classes:["fortyk"],
                                flavor:`Haywire Effect ${fortykWeapon.getFlag("fortyk","haywire")}m radius`,
                                author:actor.name};
                await ChatMessage.create(hayOptions,{});
            }
            //handle spray weapon jams
            if(fortykWeapon.getFlag("fortyk","spray")&&weapon.type==="rangedWeapon"){
                let jam=false;
                for ( let r of roll.dice[0].rolls ) {
                    if(r.roll===9){
                        jam=true;
                    }
                }
                if(jam){
                    let jamOptions={user: game.user._id,
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
                //if there are targets apply damage to all of them
                for (let tar of targets){
                    let activeEffects=[];
                    let data={};
                    let tarActor={};
                    data=tar.actor.data.data; 
                    tarActor=tar.actor;
                    let wounds=getProperty(data,"secChar.wounds");
                    let soak=0;
                    let armor=parseInt(data.characterHitLocations[curHit.value].armor);
                    //check if weapon ignores soak
                    if(!fortykWeapon.getFlag("fortyk","ignoreSoak")){
                        let armor=parseInt(data.characterHitLocations[curHit.value].armor);
                        //handle cover
                        if(!self&&!fortykWeapon.getFlag("fortyk","spray")&&data.characterHitLocations[curHit.value].cover&&(weapon.type==="rangedWeapon"||weapon.type==="psychicPower")){
                            let cover=parseInt(data.secChar.cover.value);
                            armor=armor+cover;
                            //reduce cover if damage is greater than cover AP
                            if(roll._total>cover&&cover!==0){
                                cover=Math.max(0,(cover-1));
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
                                    let mesHitLoc=curHit.label;
                                    let chatOptions={user: game.user._id,
                                                     speaker:{actor,alias:actor.name},
                                                     content:"Cover is lowered by 1",
                                                     classes:["fortyk"],
                                                     flavor:`${mesHitLoc}: damaged cover`,
                                                     author:actor.name};
                                    await ChatMessage.create(chatOptions,{});
                                }
                            }
                        }
                        let pen=0;
                        //random pen logic
                        if(isNaN(weapon.data.pen.value)){
                            let randomPen=new Roll(weapon.data.pen.value,{});
                            randomPen.roll();
                            await randomPen.toMessage({
                                speaker: ChatMessage.getSpeaker({ actor: actor }),
                                flavor: "Rolling random weapon penetration."
                            });
                            pen=randomPen._total;
                        }else{
                            pen=parseInt(weapon.data.pen.value); 
                        }
                        //smite the unholy
                        if(actor.getFlag("fortyk","smitetheunholy")&&tarActor.getFlag("fortyk","fear")&&weapon.type==="meleeWeapon"){
                            if(!isNaN(tarActor.getFlag("fortyk","fear"))){
                                pen+=parseInt(tarActor.getFlag("fortyk","fear"));
                                let smiteOptions={user: game.user._id,
                                                  speaker:{actor,alias:actor.name},
                                                  content:`Smite the unholy increases damage and penetration by ${tarActor.getFlag("fortyk","fear")} against the target.`,
                                                  classes:["fortyk"],
                                                  flavor:"Smite the unholy",
                                                  author:actor.name};
                                await ChatMessage.create(smiteOptions,{});
                            }
                        }
                        if(fortykWeapon.getFlag("fortyk","razorsharp")&&actor.data.data.secChar.lastHit.dos>=3){
                            pen=pen*2;
                            let razorOptions={user: game.user._id,
                                              speaker:{actor,alias:actor.name},
                                              content:`Razor Sharp doubles penetration to ${pen}`,
                                              classes:["fortyk"],
                                              flavor:"Razor Sharp",
                                              author:actor.name};
                            await ChatMessage.create(razorOptions,{});
                        }
                        //handle melta weapons
                        if(fortykWeapon.getFlag("fortyk","melta")){
                            let distance=tokenDistance(attackerToken,tar);
                            let shortRange=parseInt(weapon.data.range.value)/2
                            if(distance<=shortRange){
                                pen=pen*2;
                                let meltaOptions={user: game.user._id,
                                                  speaker:{actor,alias:actor.name},
                                                  content:`Melta range increases penetration to ${pen}`,
                                                  classes:["fortyk"],
                                                  flavor:"Melta Range",
                                                  author:actor.name};
                                await ChatMessage.create(meltaOptions,{});
                            }
                        }
                        let maxPen=Math.min(armor,pen);
                        soak=parseInt(data.characterHitLocations[curHit.value].value);
                        if(fortykWeapon.getFlag("fortyk","felling")){
                            let ut=parseInt(tarActor.data.data.characteristics.t.uB);
                            let fel=Math.min(ut,fortykWeapon.getFlag("fortyk","felling"));
                            let fellingOptions={user: game.user._id,
                                                speaker:{actor,alias:actor.name},
                                                content:`Felling ignores ${fel} unnatural toughness.`,
                                                classes:["fortyk"],
                                                flavor:"Felling",
                                                author:actor.name};
                            await ChatMessage.create(fellingOptions,{});
                            soak-=fel;
                        }
                        soak=soak-maxPen;
                        //sanctified logic
                        let daemonic=tarActor.getFlag("fortyk","daemonic");
                        if((fortykWeapon.getFlag("fortyk","sanctified")||fortykWeapon.getFlag("fortyk","daemonbane"))&&daemonic){
                            if(!isNaN(daemonic)){
                                soak-=parseInt(daemonic);
                                let sanctifiedOptions={user: game.user._id,
                                                       speaker:{actor,alias:actor.name},
                                                       content:`Sanctified ignores ${daemonic} soak from the daemonic trait.`,
                                                       classes:["fortyk"],
                                                       flavor:"Sanctified",
                                                       author:actor.name};
                                await ChatMessage.create(sanctifiedOptions,{});
                            }
                        }
                    }
                    let damage=roll._total;
                    //damage part of smite the unholy
                    if(actor.getFlag("fortyk","smitetheunholy")&&tarActor.getFlag("fortyk","fear")&&weapon.type==="meleeWeapon"){
                        if(!isNaN(tarActor.getFlag("fortyk","fear"))){
                            damage+=parseInt(tarActor.getFlag("fortyk","fear"));
                        }
                    }
                    //volkite logic
                    if(fortykWeapon.getFlag("fortyk","volkite")&&tens>0){
                        let volkRoll=new Roll(tens+"d10",{});
                        volkRoll.roll();
                        await volkRoll.toMessage({
                            speaker: ChatMessage.getSpeaker({ actor: actor }),
                            flavor: "Rolling volkite weapon bonus damage."
                        });
                        damage+=volkRoll._total;
                    }
                    if(fortykWeapon.getFlag("fortyk","graviton")){
                        let gravitonDmg=2*armor;
                        damage+=gravitonDmg;
                        let gravitonOptions={user: game.user._id,
                                             speaker:{actor,alias:actor.name},
                                             content:`Graviton Extra Damage ${gravitonDmg}`,
                                             classes:["fortyk"],
                                             flavor:"Graviton Damage",
                                             author:actor.name};
                        await ChatMessage.create(gravitonOptions,{});
                    }
                    //accurate weapon logic
                    if(fortykWeapon.getFlag("fortyk","accurate")&&actor.data.data.secChar.lastHit.aim){
                        let distance=tokenDistance(attackerToken,tar);
                        if(distance>parseInt(weapon.data.range.value)/4){
                            let accDice=Math.min(fortykWeapon.getFlag("fortyk","accurate"),Math.ceil((actor.data.data.secChar.lastHit.dos-1)/2));
                            let accForm=accDice+"d10"
                            let accRoll=new Roll(accForm,{});
                            accRoll.roll();
                            await accRoll.toMessage({
                                speaker: ChatMessage.getSpeaker({ actor: actor }),
                                flavor: "Rolling accurate weapon bonus damage."
                            });
                            damage+=accRoll._total;
                        }
                    }
                    //scatter weapon logic
                    if(fortykWeapon.getFlag("fortyk","scatter")){
                        let distance=tokenDistance(attackerToken,tar);
                        if(distance<=2||distance<=2*canvas.dimensions.distance){
                            damage+=3;
                        }else if(distance<=parseInt(weapon.data.range.value)/2){
                            damage-=3
                        }
                    }
                    //logic against swarm enemies
                    if(tarActor.getFlag("fortyk","swarm")&&!(fortykWeapon.getFlag("fortyk","spray")||fortykWeapon.getFlag("fortyk","blast")||fortykWeapon.getFlag("fortyk","flame")||fortykWeapon.getFlag("fortyk","scatter"))){
                        damage=Math.ceil(damage/2);
                        let swarmOptions={user: game.user._id,
                                          speaker:{actor,alias:actor.name},
                                          content:`Swarm enemies take reduced damage against non blast, spray, flame or scatter weapons.`,
                                          classes:["fortyk"],
                                          flavor:"Swarm",
                                          author:actor.name};
                        await ChatMessage.create(swarmOptions,{});
                    }
                    damage=damage-soak;
                    //corrosive weapon logic
                    if(fortykWeapon.getFlag("fortyk","corrosive")){
                        let corrosiveAmt=new Roll("1d10",{});
                        corrosiveAmt.roll();
                        await corrosiveAmt.toMessage({
                            speaker: ChatMessage.getSpeaker({ actor: actor }),
                            flavor: "Rolling Corrosive Weapon armor damage. Excess corrosion is transferred to damage."
                        });
                        let corrosiveDamage=0;
                        let newArmor=Math.max(0,(armor-corrosiveAmt._total));
                        corrosiveDamage=Math.abs(Math.min(0,(armor-corrosiveAmt._total)));
                        let path=`data.characterHitLocations.${curHit.value}.armor`
                        let corrodeActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("corrode")]);
                        corrodeActiveEffect.changes=[];
                        let changes={key:path,value:newArmor,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE};
                        corrodeActiveEffect.changes.push(changes);
                        activeEffects.push(corrodeActiveEffect);
                        if(damage<=0){
                            damage=corrosiveDamage;
                        }else{
                            damage+=corrosiveDamage;
                        }
                    }
                    //toxic weapon logic
                    if(damage>0&&fortykWeapon.getFlag("fortyk","toxic")){
                        let toxicMod=fortykWeapon.getFlag("fortyk","toxic")*10;
                        let toxic=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total-toxicMod),tarActor, "Resist toxic");
                        if(!toxic.value){
                            let toxicDmg=new Roll("1d10",{});
                            toxicDmg.roll();
                            await toxicDmg.toMessage({
                                speaker: ChatMessage.getSpeaker({ actor: actor }),
                                flavor: "Rolling Toxic Weapon bonus damage."
                            });
                            damage+=toxicDmg._total;
                        }
                    }
                    //shocking weapon logic
                    if(damage>0&&fortykWeapon.getFlag("fortyk","shocking")){
                        let shock=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total),tarActor, "Resist shocking");
                        if(!shock.value){
                            let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                            stunActiveEffect.transfer=false;
                            stunActiveEffect.duration={
                                combat:game.combats.active.data._id,
                                rounds:shock.dos,
                                startRound:game.combats.active.current.round
                            };
                            activeEffects.push(stunActiveEffect);
                            let shockingOptions={user: game.user._id,
                                                 speaker:{tarActor,alias:tarActor.name},
                                                 content:`${tarActor.name} is stunned for ${shock.dos} rounds and takes 1 fatigue!`,
                                                 classes:["fortyk"],
                                                 flavor:`Shocking`,
                                                 author:actor.name};
                            await ChatMessage.create(shockingOptions,{});
                            let newfatigue=1;
                            this._addFatigue(tarActor,newfatigue);
                        }
                    }
                    //crippling weapon logic
                    if(damage>0&&fortykWeapon.getFlag("fortyk","crippling")){
                        let crippleActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("crippled")]);
                        crippleActiveEffect.location=curHit;
                        crippleActiveEffect.num=fortykWeapon.getFlag("fortyk","crippling");
                        activeEffects.push(crippleActiveEffect);
                        let crippleOptions={user: game.user._id,
                                            speaker:{tarActor,alias:tarActor.name},
                                            content:`${tarActor.name} is crippled, they take ${fortykWeapon.getFlag("fortyk","crippling")} damage to the ${curHit.label} which ignores all soak, if they ever take more than a half action in a turn. This lasts until they are fully healed or until the end of the encounter.`,
                                            classes:["fortyk"],
                                            flavor:`Crippled`,
                                            author:actor.name};
                        await ChatMessage.create(crippleOptions,{});
                    }
                    //generate roll message
                    await roll.toMessage({
                        speaker: ChatMessage.getSpeaker({ actor: actor }),
                        flavor: label
                    });
                    //check for righteous fury
                    let crit=await this._righteousFury(actor,label,weapon,curHit,tens,damage,tar);
                    if(crit&&damage<=0){
                        damage=1;
                    }else if(damage<=0){
                        damage=0;
                        let chatOptions={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:"Damage is fully absorbed.",
                                         classes:["fortyk"],
                                         flavor:`No damage`,
                                         author:actor.name};
                        await ChatMessage.create(chatOptions,{});
                    }
                    let newWounds=wounds.value;
                    //NIDITUS WEAPON
                    if((fortykWeapon.getFlag("fortyk","niditus")&&damage)>0){
                        if(tarActor.data.data.psykana.pr.value>0){
                            let stun=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total),tarActor, "Resist niditus stun");
                            if(!stun.value){
                                let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                                stunActiveEffect.transfer=false;
                                stunActiveEffect.duration={
                                    combat:game.combats.active.data._id,
                                    rounds:stun.dos,
                                    startRound:game.combats.active.current.round
                                };
                                activeEffects.push(stunActiveEffect);
                                let shockingOptions={user: game.user._id,
                                                     speaker:{tarActor,alias:tarActor.name},
                                                     content:`${tarActor.name} is stunned for ${stun.dos} rounds!`,
                                                     classes:["fortyk"],
                                                     flavor:`Niditus`,
                                                     author:actor.name};
                                await ChatMessage.create(shockingOptions,{});
                            }
                        }
                        if(tarActor.getFlag("fortyk","warpinstability")){
                            let warpinst=await this.fortykTest("wp", "char", (tarActor.data.data.characteristics.wp.total-10),tarActor, "Warp instability niditus");
                            if(!warpinst.value){
                                let warpdmg=warpinst.dos;
                                if(warpdmg>newWounds){
                                    let banishOptions={user: game.user._id,
                                                       speaker:{actor,alias:actor.name},
                                                       content:`${actor.name} is banished to the warp!`,
                                                       classes:["fortyk"],
                                                       flavor:`Banishment`,
                                                       author:actor.name};
                                    await ChatMessage.create(banishOptions,{});
                                    await this.applyDead(tar,actor);
                                    return;
                                }else{
                                    damage+=warpdmg;
                                }
                            }
                        }
                    }
                    //deathdealer
                    if(damage>newWounds&&actor.getFlag("fortyk","deathdealer")&&(weapon.type.toLowerCase().includes(actor.getFlag("fortyk","deathdealer")))){
                        damage+=actor.data.data.characteristics.per.bonus;
                        let deathDealerOptions={user: game.user._id,
                                                speaker:{actor,alias:actor.name},
                                                content:`Deathdealer increases criritcal damage by ${actor.data.data.characteristics.per.bonus}.`,
                                                classes:["fortyk"],
                                                flavor:`Deathdealer`,
                                                author:actor.name};
                        await ChatMessage.create(deathDealerOptions,{});
                    }
                    let chatDamage=damage;
                    // true grit!@!!@
                    if(!data.suddenDeath.value&&!data.horde.value&&(damage>0)&&(wounds.value-damage)<0&&tarActor.getFlag("fortyk","truegrit")){
                        if(newWounds>=0){
                            chatDamage=newWounds+Math.max(1,chatDamage-data.characteristics.t.bonus);
                            damage=damage-newWounds;
                            newWounds=0;
                        }else{
                            chatDamage=Math.max(1,chatDamage-data.characteristics.t.bonus); 
                        }
                        damage=Math.max(1,damage-data.characteristics.t.bonus);
                        let chatOptions={user: game.user._id,
                                         speaker:{actor,alias:tarActor.name},
                                         content:"True Grit reduces critical damage!",
                                         classes:["fortyk"],
                                         flavor:`Critical effect`,
                                         author:tarActor.name};
                        await ChatMessage.create(chatOptions,{});
                    }
                    //process horde damage for different weapon qualities
                    if(data.horde.value&&damage>0){
                        damage=1;
                        chatDamage=1;
                        if(weapon.data.damageType.value==="Explosive"){
                            damage+=1;
                            chatDamage+=1;
                        }
                        if(fortykWeapon.getFlag("fortyk","powerfield")){
                            damage+=1;
                            chatDamage+=1;
                        }
                        if(fortykWeapon.getFlag("fortyk","blast")){
                            damage+=fortykWeapon.getFlag("fortyk","blast");
                            chatDamage+=fortykWeapon.getFlag("fortyk","blast");
                        }
                        if(fortykWeapon.getFlag("fortyk","spray")){
                            let additionalHits=parseInt(weapon.data.range.value);
                            additionalHits=Math.ceil(additionalHits/4);
                            let addHits=new Roll("1d5");
                            addHits.roll();
                            await addHits.toMessage({
                                speaker: ChatMessage.getSpeaker({ actor: actor }),
                                flavor: "Rolling additional hits for spray weapon."
                            });
                            additionalHits+=addHits.total;
                            damage+=additionalHits;
                            cahatDamage+=additionalHits;
                        }
                    }
                    //report damage dealt to gm and the target's owner
                    let user_ids = Object.entries(tarActor.data.permission).filter(p=> p[0] !== `default` && p[1] === 3).map(p=>p[0]);
                    for(let user of user_ids)
                    {
                        let recipient=[user];
                        let damageOptions={user: game.users.get(user),
                                           speaker:{actor,alias:actor.name},
                                           content:`Attack did ${chatDamage} damage.`,
                                           classes:["fortyk"],
                                           flavor:`Damage done`,
                                           author:actor.name,
                                           whisper:recipient};
                        await ChatMessage.create(damageOptions,{});
                    }
                    newWounds=newWounds-damage;
                    newWounds=Math.max(wounds.min,newWounds);
                    //update wounds
                    if(game.user.isGM||tar.owner){
                        if(self){
                            await tar.update({"data.secChar.wounds.value":newWounds});
                        }else{
                            await tarActor.update({"data.secChar.wounds.value":newWounds});
                        }
                    }else{
                        //if user isnt GM use socket to have gm update the actor
                        let tokenId=tar.data._id;
                        let socketOp={type:"updateValue",package:{token:tokenId,value:newWounds,path:"data.secChar.wounds.value"}}
                        await game.socket.emit("system.fortyk",socketOp);
                    }
                    //handle critical effects
                    if(data.horde.value&&newWounds<=0){
                        this.applyDead(tar,actor);
                    }else if(data.suddenDeath.value&&newWounds<=0){
                        this.applyDead(tar,actor);
                    }else if(newWounds<0&&damage>0){
                        let crit=Math.abs(newWounds)-1;
                        let rightMes=FORTYKTABLES.crits[weapon.data.damageType.value][curHit.value][crit];
                        let mesDmgType=weapon.data.damageType.value;
                        let mesRes=crit+1;
                        let mesHitLoc=curHit.label;
                        let chatOptions={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:rightMes,
                                         classes:["fortyk"],
                                         flavor:`${mesHitLoc}: ${mesRes}, ${mesDmgType} Critical effect`,
                                         author:actor.name};
                        await ChatMessage.create(chatOptions,{});
                        await this.critEffects(tar,mesRes,curHit.value,mesDmgType);
                    }
                    //flame weapon
                    if(fortykWeapon.getFlag("fortyk","flame")&&!data.horde.value){
                        let fire=await this.fortykTest("agi", "char", tarActor.data.data.characteristics.agi.total,tarActor, "Resist fire");
                        if(!fire.value){
                            let fireActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]);
                            activeEffects.push(fireActiveEffect);
                        }
                    } 
                    //snare weapon
                    if(fortykWeapon.getFlag("fortyk","snare")>=0){
                        let snareMod=fortykWeapon.getFlag("fortyk","snare")*10;
                        let snare=await this.fortykTest("agi", "char", (tarActor.data.data.characteristics.agi.total-snareMod),tarActor, "Resist snare");
                        if(!snare.value){
                            let chatSnare={user: game.user._id,
                                           speaker:{actor,alias:actor.name},
                                           content:`${tar.name} is immobilised. An Immobilised target can attempt no actions other than trying to escape the bonds. As a Full Action, he can make a (-${snareMod}) Strength or Agility test to break free.`,
                                           classes:["fortyk"],
                                           flavor:`Snare Immobilise`,
                                           author:actor.name};
                            await ChatMessage.create(chatSnare,{});
                            let snareActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("snare")]);
                            activeEffects.push(snareActiveEffect);
                        }
                    }
                    //concussive weapon
                    if(fortykWeapon.getFlag("fortyk","concussive")>=0){
                        let stunMod=parseInt(fortykWeapon.getFlag("fortyk","concussive"))*10;
                        let stun=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total-stunMod),tarActor, "Resist stun");
                        if(!stun.value){
                            let chatStun={user: game.user._id,
                                          speaker:{actor,alias:actor.name},
                                          content:`${tar.name} is stunned for ${stun.dos} rounds!`,
                                          classes:["fortyk"],
                                          flavor:`Concussive Stun`,
                                          author:actor.name};
                            await ChatMessage.create(chatStun,{});
                            let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]);
                            stunActiveEffect.duration={
                                combat:game.combats.active.data._id,
                                rounds:stun.dos,
                                startRound:game.combats.active.current.round
                            };
                            activeEffects.push(stunActiveEffect);
                            if(damage>tarActor.data.data.characteristics.s.bonus){
                                let proneActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]);
                                activeEffects.push(proneActiveEffect);
                                let chatKnockdown={user: game.user._id,
                                                   speaker:{actor,alias:actor.name},
                                                   content:`${tar.name} is knocked down.`,
                                                   classes:["fortyk"],
                                                   flavor:`Concussive Knockdown`,
                                                   author:actor.name};
                                await ChatMessage.create(chatKnockdown,{});
                            }
                        }
                    }
                    this.applyActiveEffect(tar,activeEffects);
                }
            }else{
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: label
                });
                this._righteousFury(actor,label,weapon,lastHit,tens);
            }
            hitNmbr++;
        }
        if(actor.getFlag("fortyk","hammerblow")&&lastHit.attackType==="All Out"){
            if(hammer){
                await fortykWeapon.setFlag("fortyk","concussive",false);
            }else{
                await fortykWeapon.setFlag("fortyk","concussive",fortykWeapon.getFlag("fortyk","concussive")-2);
            }


        }
    }
    //handles righteous fury
    static async _righteousFury(actor,label,weapon,curHit,tens, damage=1, tar=null){
        var crit=false;
        if(tens>0){
            crit=true;
        }
        if(tar!==null&&tar.actor.data.data.horde.value){crit=false}
        //if righteous fury roll the d5 and spew out the crit result
        if(crit&&damage>0){
            let rightRoll=new Roll("1d5",actor.data.data);
            await rightRoll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: "Righteous Fury!"
            });
            let res=rightRoll._total-1;
            let rightMes=FORTYKTABLES.crits[weapon.data.damageType.value][curHit.value][res];
            let mesDmgType=weapon.data.damageType.value;
            let mesRes=res+1;
            let mesHitLoc=curHit.label;
            let chatOptions={user: game.user._id,
                             speaker:{actor,alias:actor.name},
                             content:rightMes,
                             classes:["fortyk"],
                             flavor:`${mesHitLoc}: ${mesRes}, ${mesDmgType} Critical effect`,
                             author:actor.name};
            await ChatMessage.create(chatOptions,{});
            if(tar!==null){
                await this.critEffects(tar,mesRes,curHit.value,weapon.data.damageType.value);
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
    //applies critical results to token/actor
    static async critEffects(token,num,hitLoc,type){
        if(game.user.isGM||token.owner){
            let actor=token.actor;
            switch(type){
                case "Energy":
                    await this.energyCrits(actor,num,hitLoc);
                    break;
                case "Explosive":
                    await this.explosiveCrits(actor,num,hitLoc);
                    break;
                case "Impact":
                    await this.impactCrits(actor,num,hitLoc);
                    break;
                case "Rending":
                    await this.rendingCrits(actor,num,hitLoc);
                    break;
            }
        }else{
            //if user isnt GM use socket to have gm update the actor
            let tokenId=token.data._id;
            let socketOp={type:"critEffect",package:{token:tokenId,num:num,hitLoc:hitLoc,type:type}}
            await game.socket.emit("system.fortyk",socketOp);
        }
    }
    static async energyCrits(actor,num,hitLoc){
        switch(hitLoc){
            case "head":
                await this.energyHeadCrits(actor,num);
                break;
            case "body":
                await this.energyBodyCrits(actor,num);
                break;
            case "lArm":
                await this.energyArmCrits(actor,num,"left");
                break;
            case "rArm":
                await this.energyArmCrits(actor,num,"right");
                break;
            case "lLeg":
                await this.energyLegCrits(actor,num,"left");
                break;
            case "rLeg":
                await this.energyLegCrits(actor,num,"right");
                break;
        }
    }
    static async energyHeadCrits(actor,num){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        switch(num){
            case 1:
                let critActiveEffect1=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")])];
                critActiveEffect1[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect1[0].changes=[]
                for(let char in game.fortyk.FORTYK.skillChars){
                    if(char!=="t"){
                        critActiveEffect1[0].changes.push({key:`data.characteristics.${char}.total`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}); 
                    }
                }
                this.applyActiveEffect(actorToken,critActiveEffect1);
                break;
            case 2:
                let critActiveEffect2=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")])];
                critActiveEffect2[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect2);
                break;
            case 3:
                let critActiveEffect3=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")])];
                critActiveEffect3[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                await new Roll("1d5").roll().toMessage({flavor:"Deaf duration."});
                this.applyActiveEffect(actorToken,critActiveEffect3);
                break;
            case 4:
                this._addFatigue(actor,2);
                let blindRoll4=new Roll("1d5");
                await blindRoll4.roll().toMessage({flavor:"Blind duration."});
                let critActiveEffect4=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")])];
                critActiveEffect4[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:blindRoll4._total,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect4);
                break;
            case 5:
                let blindRoll5=new Roll("1d10");
                await blindRoll5.roll().toMessage({flavor:"Blind duration."});
                let critActiveEffect5=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")])];
                critActiveEffect5[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:blindRoll5._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect5.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect5[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect5.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect5[2].changes=[{key:`data.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}]
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Facial scarring"});
                this.applyActiveEffect(actorToken,critActiveEffect5);
                break;
            case 6:
                let fatRoll6=new Roll("1d5");
                await fatRoll6.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,fatRoll6._total);
                let blindRoll6=new Roll("1d10");
                await blindRoll6.roll().toMessage({flavor:"Blind duration."});
                let critActiveEffect6=[];
                critActiveEffect6.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]));
                let critPerRoll=new Roll("1d5");
                critPerRoll.roll().toMessage({flavor:"Perception and Fellowship damage."});
                critActiveEffect6.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]));
                critActiveEffect6[1].changes=[{key:`data.characteristics.per.value`,value:-1*critPerRoll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect6.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect6[2].changes=[{key:`data.characteristics.fel.value`,value:-1*critPerRoll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Severe facial scarring"});
                this.applyActiveEffect(actorToken,critActiveEffect6);
                break;
            case 7:
                let fatRoll7=new Roll("1d10");
                await fatRoll7.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,fatRoll7._total);
                actor.createEmbeddedEntity("OwnedItem",{name:"Permanently Blinded",type:"injury"});
                let critActiveEffect7=[];
                critActiveEffect7.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]));
                let felRoll7=new Roll("1d10");
                await felRoll7.roll().toMessage({flavor:"New fellowship amount"});
                critActiveEffect7.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect7[1].changes=[{key:`data.characteristics.fel.value`,value:felRoll7._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect7);
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Blind"});
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Tremendous facial scarring"});
                break;
            case 8:
                
                this.applyDead(actorToken,actor);
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async energyBodyCrits(actor,num){
        let critActiveEffect=[];
        let tTest=false;
        let agiTest=false;
        let d5Roll=new Roll('1d5');
        let d10Roll=new Roll('1d10');
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        switch(num){
            case 1:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist prone");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 3:
                this._addFatigue(actor,2);
                await d5Roll.roll().toMessage({flavor:"Toughness damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*d5Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                await d10Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d10Roll._total);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                agiTest=await this.fortykTest("agi", "char", (actor.data.data.characteristics.agi.total),actor, "Resist fire");
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]));
                }
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    };
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d5Roll._total);
                await d10Roll.roll().toMessage({flavor:"Stun duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                agiTest=await this.fortykTest("agi", "char", (actor.data.data.characteristics.agi.total),actor, "Resist fire");
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fire")]));
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                await d10Roll.roll().toMessage({flavor:"Toughness damage."});
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]);
                injury.changes=[{key:`data.characteristics.t.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                let d10Roll2=new Roll("2d10");
                await d10Roll2.roll().toMessage({flavor:"Stun duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll2._total,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);

                await this._createInjury(actor,"Third degree chest burns.",injury);
                break;
            case 8:
                d10Roll.alter(2,0);
                await d10Roll.roll().toMessage({flavor:"Stun duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[27]));
                critActiveEffect[1].changes=[{key:`data.characteristics.s.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                                             {key:`data.characteristics.s.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[2].changes=[{key:`data.characteristics.t.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                                             {key:`data.characteristics.t.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[3].changes=[{key:`data.characteristics.agi.value`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY},
                                             {key:`data.characteristics.agi.advance`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.MULTIPLY}];
                d5Roll.alter(2,0);
                await d5Roll.roll().toMessage({flavor:"Fellowship damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect[4].changes=[{key:`data.characteristics.fel.value`,value:-1*d5Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Fourth degree chest burns."});
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async energyArmCrits(actor,num,arm){
        let critActiveEffect=[];
        let tTest=false;
        let d5Roll=new Roll('1d5');
        let d10Roll=new Roll('1d10');
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let injury=null;
        switch(num){
            case 1:
                await d5Roll.roll().toMessage({flavor:"Penalty duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d5Roll._total,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                this._addFatigue(actor,1);
                await d5Roll.roll().toMessage({flavor:"Penalty duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d5Roll._total,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d5Roll._total);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                await d10Roll.roll().toMessage({flavor:"Penalty duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 6:
                await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d5Roll._total);
                await d5Roll.reroll().toMessage({flavor:"Characteristic damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-1*d5Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-1*d5Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Lost "+arm+" hand",injury);
                break;
            case 7:
                await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d5Roll._total);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                break;
            case 8:
                await d10Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d10Roll._total);
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun");
                if(!tTest.value){
                    await d5Roll.roll().toMessage({flavor:"Stun duration."});
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:d5Roll._total,
                        startRound:game.combats.active.current.round
                    };
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Lost "+arm+" arm",injury);
                break;
            case 9:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist death");
                if(!tTest.value){
                    this.applyDead(actorToken,actor);
                    return;
                }else{
                    await d10Roll.roll().toMessage({flavor:"Fatigue amount."});
                    this._addFatigue(actor,d10Roll._total);
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    };
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                }
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async energyLegCrits(actor,num,leg){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let tTest=false;
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let injury=null;
        switch(num){
            case 1:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:2,
                    startRound:game.combats.active.current.round
                };
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist fatigue");
                if(!tTest.value){
                    this._addFatigue(actor,1);
                }
                break;
            case 3:
                this._addFatigue(actor,1);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                await d10Roll.roll().toMessage({flavor:"Movement penalty duration."});
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
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
                d10Roll.alter(2,0);
                await d10Roll.roll().toMessage({flavor:"Leg injury duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect[0].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                this._addFatigue(actor,2);
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist lost foot");
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
                await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d5Roll._total);
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    };
                    await this.applyActiveEffect(actorToken,critActiveEffect);
                }
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Broken "+leg+" leg",injury);
                break;
            case 8:
                await d10Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d10Roll._total);
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun");
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    };
                }
                await this.applyActiveEffect(actorToken,critActiveEffect);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Lost "+leg+" leg",injury);
                break;
            case 9:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun");
                if(!tTest.value){
                    this.applyDead(actorToken,actor);
                }else{
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                }
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async explosiveCrits(actor,num,hitLoc){
        switch(hitLoc){
            case "head":
                await this.explosiveHeadCrits(actor,num);
                break;
            case "body":
                await this.explosiveBodyCrits(actor,num);
                break;
            case "lArm":
                await this.explosiveArmCrits(actor,num,"left");
                break;
            case "rArm":
                await this.explosiveArmCrits(actor,num,"right");
                break;
            case "lLeg":
                await this.explosiveLegCrits(actor,num,"left");
                break;
            case "rLeg":
                await this.explosiveLegCrits(actor,num,"right");
                break;
        }
    }
    static async explosiveHeadCrits(actor,num){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let tTest=false;
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let injury=null;
        switch(num){
            case 1:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                this._addFatigue(actor,2);
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist characteristic damage");
                if(!tTest.value){
                    await d10Roll.roll().toMessage({flavor:"Characteristic damage."});
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]);
                    injury.changes=[{key:`data.characteristics.per.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    injury.changes.push({key:`data.characteristics.fel.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD});
                    await this._createInjury(actor,"Facial scar",injury);
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 4:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await d10Roll.roll().toMessage({flavor:"Intelligence damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.int.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist additional characteristic damage and stun");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={
                        combat:game.combats.active.data._id,
                        rounds:2,
                        startRound:game.combats.active.current.round
                    };
                    critActiveEffect[0].changes[0].value=-1*d10Roll._total-1;
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                await d5Roll.roll().toMessage({flavor:"Fellowship damage."});
                await d10Roll.roll().toMessage({flavor:"Stun duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                injury.changes=[{key:`data.characteristics.fel.value`,value:-1*d5Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await this._createInjury(actor,"Severe facial scarring",injury);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                await this._createInjury(actor,"Deaf",injury);
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                this.applyDead(actorToken,actor);
                break;
            case 7:
                this.applyDead(actorToken,actor);
                break;
            case 8:
                this.applyDead(actorToken,actor);
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async explosiveBodyCrits(actor,num){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        switch(num){
            case 1:
                await d5Roll.roll().toMessage({flavor:"Knockback distance."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                await d5Roll.roll().toMessage({flavor:"Knockback distance and fatigue."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await this._addFatigue(actor,d5Roll._total);
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                await d5Roll.roll().toMessage({flavor:"Knockback distance."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist blood loss and stun");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 5:
                await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await this._addFatigue(actor,d5Roll._total);
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist blood loss and toughness damage");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                    critActiveEffect[2].changes=[{key:`data.characteristics.t.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                }
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Severe internal injuries"}); 
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Severe chest scars"}); 
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                await d10Roll.roll().toMessage({flavor:"Stun duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[2].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist unconsciousness");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")]));
                }
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Severe chest scars"}); 
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:
                this.applyDead(actorToken,actor);
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async explosiveArmCrits(actor,num,arm){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        let injury=null;
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    };
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 3:
                await d5Roll.roll().toMessage({flavor:"Finger tips removed"});
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:arm+`hand missing ${d5Roll._total} fingers.`}); 
                await d10Roll.roll().toMessage({flavor:"Weapon skill damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                await d10Roll.reroll().toMessage({flavor:"Ballistic skill damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist blood loss");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                }
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total+10),actor, "Resist lost hand");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                    critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Scarred "+arm+" hand"}); 
                }else{
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" hand",injury);
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                await this._addFatigue(actor,d5Roll._total);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total+10),actor, "Resist death");
                if(tTest.value){
                    this.applyDead(actorToken,actor);
                }else{
                    await d10Roll.roll().toMessage({flavor:"Fatigue amount."});
                    await this._addFatigue(actor,d10Roll._total);
                    await d10Roll.reroll().toMessage({flavor:"Stun duration."});
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:d10Roll._total,
                        startRound:game.combats.active.current.round
                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 8:
                this.applyDead(actorToken,actor);
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async explosiveLegCrits(actor,num,leg){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        let injury=null;
        switch(num){
            case 1:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total+10),actor, "Resist prone");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 2:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await d5Roll.roll().toMessage({flavor:"Movement penalty duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:d5Roll._total,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                d10Roll.alter(2,0);
                await d10Roll.roll().toMessage({flavor:"Agility damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.agi.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                let chatScatter={user: game.user._id,
                                 speaker:{actor,alias:actor.name},
                                 content:`${actor.name} is blown away! <img class="fortyk" src="../systems/fortyk/icons/scatter.png">`,
                                 flavor:"Target is blown away!",
                                 author:actor.name};
                await ChatMessage.create(chatScatter,{});
                let distanceRoll=new Roll("1d5");
                distanceRoll.roll();
                await distanceRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for scatter distance."
                });
                let directionRoll=new Roll("1d10");
                directionRoll.roll();
                await directionRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for scatter direction."
                });
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await d10Roll.roll().toMessage({flavor:"Movement penalty duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect[1].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total-10),actor, "Resist fatigue");
                if(!tTest.value){
                    await d5Roll.roll().toMessage({flavor:"Fatigue amount."})
                    this._addFatigue(actor,d5Roll._total);
                }
                let agilityRoll=new Roll("1d5");
                agilityRoll.roll().toMessage({flavor:"Agility damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.agi.value`,value:-1*agilityRoll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                await d10Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d10Roll._total);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist lost foot");
                if(!tTest.value){
                    await this._createInjury(actor,"Lost "+leg+" foot",injury);
                }else{
                    await this._createInjury(actor,"Useless "+leg+" leg",injury);
                }
                break;
            case 7:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist death");
                if(!tTest.value){
                    this.applyDead(actorToken,actor);
                }else{
                    await d10Roll.roll().toMessage({flavor:"Fatigue amount."});
                    this._addFatigue(actor,d10Roll._total);
                    await d10Roll.reroll().toMessage({flavor:"Stun duration."});
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:d10Roll._total,
                        startRound:game.combats.active.current.round
                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 8:
                this.applyDead(actorToken,actor);
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async impactCrits(actor,num,hitLoc){
        let actorToken=actor.token;
        switch(hitLoc){
            case "head":
                await this.impactHeadCrits(actor,num);
                break;
            case "body":
                await this.impactBodyCrits(actor,num);
                break;
            case "lArm":
                await this.impactArmCrits(actor,num,"left");
                break;
            case "rArm":
                await this.impactArmCrits(actor,num,"right");
                break;
            case "lLeg":
                await this.impactLegCrits(actor,num,"left");
                break;
            case "rLeg":
                await this.impactLegCrits(actor,num,"right");
                break;
        }
    }
    static async impactHeadCrits(actor,num){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        let agiTest=false;
        switch(num){
            case 1:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist fatigue");
                if(!tTest.value){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:
                await d5Roll.roll().toMessage({flavor:"Characteristic damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("per")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d5Roll._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.per.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:d5Roll._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect[1].changes=[                                       {key:`data.characteristics.int.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    }; 
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun and prone");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    }; 
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 5:
                this._addFatigue(actor,1);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                }; 
                await d5Roll.roll().toMessage({flavor:"Knockback distance."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("int")]));
                critActiveEffect[1].changes=[                                       {key:`data.characteristics.int.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                await d5Roll.roll().toMessage({flavor:"Knockback distance."});
                await d5Roll.reroll().toMessage({flavor:"Stun duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d5Roll._total,
                    startRound:game.combats.active.current.round
                };
                agiTest=await this.fortykTest("agi", "char", (actor.data.data.characteristics.agi.total),actor, "Resist prone");
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                await d10Roll.roll().toMessage({flavor:"Stun duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                await d10Roll.reroll().toMessage({flavor:"Movement penalty duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[1].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:
                this.applyDead(actorToken,actor);
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async impactBodyCrits(actor,num){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        let agiTest=false;
        switch(num){
            case 1:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("weakened")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 2:
                this._addFatigue(actor,1);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                await d10Roll.roll().toMessage({flavor:"Toughness damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                agiTest=await this.fortykTest("agi", "char", (actor.data.data.characteristics.agi.total),actor, "Resist prone");
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:2,
                    startRound:game.combats.active.current.round
                };
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist fatigue");
                if(!tTest.value){
                    await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                    this._addFatigue(actor,d5Roll._total);
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                await d5Roll.roll().toMessage({flavor:"Knockback distance."});
                await d5Roll.reroll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d5Roll._total);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:2,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                await d5Roll.roll().toMessage({flavor:"Number of rib broken."});
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:d5Roll._total+" ribs broken"});
                await d5Roll.reroll().toMessage({flavor:"Toughness damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.t.value`,value:-1*d5Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:
                await d10Roll.roll().toMessage({flavor:"Toughness damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.t.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async impactArmCrits(actor,num,arm){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        let injury=null;
        switch(num){
            case 1:
                break;
            case 2:
                this._addFatigue(actor,1);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                await d10Roll.roll().toMessage({flavor:"Item damage."});
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist fatigue");
                if(!tTest.value){
                    await d10Roll.roll().toMessage({flavor:"Weapon skill damage."});
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                    critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    await d10Roll.reroll().toMessage({flavor:"Ballistic skill damage."});
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Useless "+arm+" arm"});
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                this._addFatigue(actor,1);
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist characteristic damage");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                    critActiveEffect[0].changes=[{key:`data.characteristics.ws.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.bs.value`,value:-2,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 7:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist death");
                if(!tTest.value){
                    this.applyDead(actorToken,actor);
                }else{
                    await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                    this._addFatigue(actor,d5Roll._total);;
                    await d10Roll.roll().toMessage({flavor:"Stun duration."});
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:d10Roll._total,
                        startRound:game.combats.active.current.round
                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Useless "+arm+" arm",injury);
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async impactLegCrits(actor,num,leg){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        let injury=null;
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                await d10Roll.roll().toMessage({flavor:"Movement speed duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect[0].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun and prone");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[1].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    }; 
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await d10Roll.roll().toMessage({flavor:"Agility damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                d10Roll.alter(2,0);
                await d10Roll.roll().toMessage({flavor:"Agility damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                }; 
                let base=actor.data.data.secChar.movement.half;
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[2].changes=[{key:`data.secChar.movement.multi`,value:(1/base),mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                this._addFatigue(actor,2);
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist lost foot");
                if(!tTest.value){
                    await this._createInjury(actor,"Lost "+leg+" foot",injury);
                }else{
                    critActiveEffect.push(injury);
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 7:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:2,
                    startRound:game.combats.active.current.round
                }; 
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                await this._createInjury(actor,"Useless "+leg+" leg",injury);
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist death");
                if(!tTest.value){
                    this.applyDead(actorToken,actor);
                }else{
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    await d5Roll.roll().toMessage({flavor:"Agility damage."});
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1*d5Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async rendingCrits(actor,num,hitLoc){
        switch(hitLoc){
            case "head":
                await this.rendingHeadCrits(actor,num);
                break;
            case "body":
                await this.rendingBodyCrits(actor,num);
                break;
            case "lArm":
                await this.rendingArmCrits(actor,num,"left");
                break;
            case "rArm":
                await this.rendingArmCrits(actor,num,"right");
                break;
            case "lLeg":
                await this.rendingLegCrits(actor,num,"left");
                break;
            case "rLeg":
                await this.rendingLegCrits(actor,num,"right");
                break;
        }
    }
    static async rendingHeadCrits(actor,num){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        let injury=null;
        switch(num){
            case 1:
                if(parseInt(actor.data.data.characterHitLocations.head.armor)===0){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:
                await d10Roll.roll().toMessage({flavor:"Characteristic damage duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("ws")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.ws.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bs")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect[1].changes=[                                       {key:`data.characteristics.bs.value`,value:-10,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist bleeding");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")])); 
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[18]));
                critActiveEffect[2].changes=[                                       {key:`data.characterHitLocations.head.armor`,value:0,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                await d10Roll.roll().toMessage({flavor:"Perception damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.per.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total+20),actor, "Resist lost eye");
                if(!tTest.value){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                    await this._createInjury(actor,"Lost eye",injury);
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                await d5Roll.roll().toMessage({flavor:"Stun duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:d5Roll._total,
                    startRound:game.combats.active.current.round
                };
                if(parseInt(actor.data.data.characterHitLocations.head.armor)===0){
                    await actor.createEmbeddedEntity("OwnedItem",{type:"injury",name:"Lost ear"});
                    tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist fellowship damage");
                    if(!tTest.value){
                        critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                        critActiveEffect[1].changes=[                                       {key:`data.characteristics.fel.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    }
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]));
                }else{
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[18]));
                    critActiveEffect[1].changes=[                                       {key:`data.characterHitLocations.head.armor`,value:0,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                await d5Roll.roll().toMessage({flavor:"Fatigue amount."});
                this._addFatigue(actor,d5Roll._total);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                await d10Roll.roll().toMessage({flavor:"Part lost."});
                if(d10Roll._total<=3){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                    await this._createInjury(actor,"Lost eye",injury);
                }else if(d10Roll._total<=7){
                    await d10Roll.reroll().toMessage({flavor:"Fellowship damage."});
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]);
                    injury.changes=[                                       {key:`data.characteristics.fel.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    await this._createInjury(actor,"Lost nose",injury);
                }else if(d10Roll._total<=10){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("deaf")]);
                    await this._createInjury(actor,"Lost ear",injury);
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                await d10Roll.roll().toMessage({flavor:"Fellowship damage."});
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("blind")]);
                await this._createInjury(actor,"Permanent blindness",injury);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("fel")]));
                critActiveEffect[0].changes=[                                       {key:`data.characteristics.fel.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[2].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:
                this.applyDead(actorToken,actor);
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    }
    static async rendingBodyCrits(actor,num){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        switch(num){
            case 1:
                if(parseInt(actor.data.data.characterHitLocations.body.armor)===0){
                    this._addFatigue(actor,1);
                }
                break;
            case 2:
                this._addFatigue(actor,1);
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist stun");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    }; 
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                }; 
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist bleeding");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                }; 
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                d10Roll.roll().toMessage({flavor:"Toughness damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.t.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                d10Roll.roll().toMessage({flavor:"Toughness damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.t.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                d5Roll.roll().toMessage({flavor:"Toughness damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*d5Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("crippled")]));
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist death");
                if(!tTest.value){
                    this.applyDead(actorToken,actor);
                }else{
                    d10Roll.roll().toMessage({flavor:"Toughness damage."});
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                    critActiveEffect[0].changes=[{key:`data.characteristics.t.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}]; 
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:1,
                        startRound:game.combats.active.current.round
                    }; 
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    };
    static async rendingArmCrits(actor,num,arm){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }  
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        let injury=null;
        switch(num){
            case 1:
                break;
            case 2:
                this._addFatigue(actor,1);
                break;
            case 3:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist blood loss");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 4:
                this._addFatigue(actor,2);
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                await d10Roll.roll().toMessage({flavor:"Useless arm duration."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]));
                critActiveEffect[1].duration={
                    combat:game.combats.active.data._id,
                    rounds:d10Roll._total,
                    startRound:game.combats.active.current.round
                };
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist lost hand");
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                if(!tTest.value){
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" hand",injury);
                }else{
                    d5Roll.roll().toMessage({flavor:"Number of fingers lost."});
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,arm+` hand maimed, lost ${d5Roll._total} fingers`,injury);
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                d10Roll.roll().toMessage({flavor:"Strength damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[27]));
                critActiveEffect[0].changes=[{key:`data.characteristics.s.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                await this._createInjury(actor,"Useless "+arm+" arm",injury);
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist death");
                if(!tTest.value){
                    this.applyDead(actorToken,actor);
                }else{
                    d10Roll.roll().toMessage({flavor:"Stun duration."});
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    critActiveEffect[0].duration={
                        combat:game.combats.active.data._id,
                        rounds:d10Roll._total,
                        startRound:game.combats.active.current.round
                    };
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("arm")]);
                    await this._createInjury(actor,"Lost "+arm+" arm",injury);
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    };
    static async rendingLegCrits(actor,num,leg){
        let actorToken=actor.token;
        if(!actor.isToken){                    actorToken=getActorToken(actor);                 }
        let critActiveEffect=[];
        let d5Roll=new Roll("1d5");
        let d10Roll=new Roll("1d10");
        let tTest=false;
        let agiTest=false;
        let injury=null;
        switch(num){
            case 1:
                this._addFatigue(actor,1);
                break;
            case 2:
                agiTest=await this.fortykTest("agi", "char", (actor.data.data.characteristics.agi.total),actor, "Resist prone and bleed");
                if(!agiTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")])); 
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 3:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                await d5Roll.roll().toMessage({flavor:"Agility damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1*d5Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 4: 
                await d10Roll.roll().toMessage({flavor:"Agility damage."});
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                critActiveEffect[0].changes=[{key:`data.characteristics.agi.value`,value:-1*d10Roll._total,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]));
                critActiveEffect[2].changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 5:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist agility damage");
                if(!tTest.value){
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("agi")]));
                    critActiveEffect[1].changes=[{key:`data.characteristics.agi.value`,value:-1,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 6:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist lost foot");
                if(!tTest.value){
                    await this._createInjury(actor,"Lost "+leg+" foot",injury);
                }else{
                    critActiveEffect.push(injury);
                }
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 7:
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                critActiveEffect[0].duration={
                    combat:game.combats.active.data._id,
                    rounds:1,
                    startRound:game.combats.active.current.round
                };
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("prone")]));
                critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                this.applyActiveEffect(actorToken,critActiveEffect);
                break;
            case 8:
                tTest=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Resist death");
                if(!tTest.value){
                    this.applyDead(actorToken,actor);
                }else{
                    injury=duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("leg")]);
                    injury.changes=[{key:`data.secChar.movement.multi`,value:0.5,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE}];
                    await this._createInjury(actor,"Lost "+leg+" leg",injury);
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("bleeding")]));
                    critActiveEffect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("stunned")]));
                    await d10Roll.roll().toMessage({flavor:"Stun duration."})
                    critActiveEffect[1].duration={
                        combat:game.combats.active.data._id,
                        rounds:d10Roll._total,
                        startRound:game.combats.active.current.round
                    };
                    this.applyActiveEffect(actorToken,critActiveEffect);
                }
                break;
            case 9:
                this.applyDead(actorToken,actor);
                break;
            case 10:
                this.applyDead(actorToken,actor);
                break;
        }
    };
    static async applyActiveEffect(token,effect){
        if(effect.length>0){

            if(game.user.isGM||token.owner){
                let actor=token.actor;
                for(let index=0; index <effect.length;index++){
                    let dupp=false;
                    for(let ae of actor.effects){
                        if(ae.data.flags.core.statusId===effect[index].flags.core.statusId){
                            dupp=true;
                            let change=false;
                            let upg=false;
                            for(let i=0;i<ae.data.changes.length;i++){
                                if(ae.data.changes[i].key===effect[index].changes[0].key){
                                    ae.data.changes[i].value+=effect[index].changes[0].value;
                                    upg=true;
                                    change=true;
                                }
                            }
                            if(effect[index].duration&&(effect[index].duration.rounds>ae.duration.remaining)){
                                ae.data.duration.rounds=effect[index].duration.rounds;
                                ae.data.duration.startRound=effect[index].duration.startRound;
                                change=true;
                            }
                            if(effect[index].changes!==undefined&&!upg){ae.data.changes.push(effect[index].changes[0])}
                            if(change){ae.update(ae.data);}
                        }
                    }
                    let ironJaw=false;
                    if(effect[index].id==="stunned"&&actor.getFlag("fortyk","ironjaw")){
                        ironJaw=await this.fortykTest("t", "char", (actor.data.data.characteristics.t.total),actor, "Iron Jaw").value;
                    }
                    if(!dupp&&!ironJaw){
                        await actor.createEmbeddedEntity("ActiveEffect",effect[index]);
                    }
                }
            }else{
                //if user isnt GM use socket to have gm update the actor

                let tokenId=token.data._id;
                let socketOp={type:"applyActiveEffect",package:{token:tokenId,effect:effect}}
                await game.socket.emit("system.fortyk",socketOp);
            }
        }
    };
    static async applyDead(target,actor){
        if(target.data.overlayEffect===undefined||target.data.overlayEffect===null||!target.data.overlayEffect.includes("icons/svg/skull.svg")){
            let msg=target.name+" is killed!";
            let chatOptions={user: game.user._id,
                             speaker:{actor,alias:actor.name},
                             content:msg,
                             classes:["fortyk"],
                             flavor:`Death Report`,
                             author:actor.name};
            await ChatMessage.create(chatOptions,{});
            if(game.user.isGM||target.owner){
                let id=target.data._id;
                let effect="icons/svg/skull.svg";
                await target.toggleOverlay(effect);
                try{
                    let combatant = await game.combat.getCombatantByToken(id);
                    let combatid=combatant._id;
                    await game.combat.updateCombatant({
                        '_id':combatid,
                        'defeated':true
                    }) 
                }catch(err){}
            }else{
                let tokenId=target.data._id;
                let socketOp={type:"applyDead",package:{token:tokenId}}
                await game.socket.emit("system.fortyk",socketOp);
            }
        }
    };
    static async _addFatigue(actor,newfatigue){
        newfatigue=newfatigue+actor.data.data.secChar.fatigue.value;
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
        let injuryItem=await Item.create({type:"injury",name:injury});
        injuryAeData.transfer=true;
        await injuryItem.createEmbeddedEntity("ActiveEffect",injuryAeData);
        await actor.createEmbeddedEntity("OwnedItem",injuryItem.data);
    };
}