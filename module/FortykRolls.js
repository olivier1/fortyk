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
    static async fortykTest(char, type, target, actor, label, weapon=null, reroll=false, fireRate=""){
        //cap target at 100 or floor at 1
        if(target>100){
            target=100;
        }else if(target<1){
            target=1;
        }

        let roll=new Roll("1d100ms<@tar",{tar:target});
        roll.roll();

        let weaponid=""
        if(weapon===null){

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

            }else if(((weapon.data.quality.value==="Good"&&!weapon.flags.specials.unreliable.value)||weapon.flags.specials.reliable.value)&&testRoll===100){
                jam=true;
            }else if(testRoll>=96){
                jam=true;
            }else if((fireRate==="full"||fireRate==="semi")&&testRoll>=94){
                jam=true;
            }else if(weapon.flags.specials.unreliable.value&&weapon.data.quality.value==="Good"&&testRoll>=96){
                jam=true;
            }else if(((!weapon.data.quality.value==="Good"&&weapon.flags.specials.unreliable.value)||weapon.flags.specials.overheats.value)&&testRoll>=91){
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
            if((weapon.data.type==="Launcher"||weapon.data.type==="Grenade")&&weapon.flags.specials.blast.value&&!testResult&&jam){
                let fumbleRoll=new Roll("1d10");
                fumbleRoll.roll();
                await fumbleRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling for fumble."
                });
                let content="";
                let fumbleResult=fumbleRoll.dice[0].rolls[0].roll;
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
            }else if(weapon.flags.specials.blast.value&&!testResult){
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
            if(weapon.flags.specials.overheats.value&&jam){
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
                flavor: "Fear Roll!"
            });
            let shockMes="";
            let fearCap=0;

            if(actor.data.flags["atsknf"]){

                fearCap=Math.max(100,parseInt(fearRoll._total));

                shockMes=FORTYKTABLES.atsknf[fearCap];
            }else{
                fearCap=Math.max(171,parseInt(fearRoll._total));
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
    static async damageRoll(formula,actor,weapon,hits=1, self=false, overheat=false){
        let righteous=10;

        if(weapon.flags.specials.vengeful.value){
            righteous=weapon.flags.specials.vengeful.num;
        }

        let lastHit=actor.data.data.secChar.lastHit;
        let attackerToken=getActorToken(actor);
        let targets=[];
        let curHit={};

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
        if(weapon.flags.specials.blast.value||weapon.flags.specials.spray.value){
            curHit=game.fortyk.FORTYK.extraHits["body"][0];
        }
        let form=formula.value.toLowerCase();
        //change formula for tearing weapons
        if(weapon.flags.specials.tearing.value){
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
            if(weapon.flags.specials.primitive.value){
                max=weapon.flags.specials.primitive.num;
            }
            if(weapon.flags.specials.proven.value){
                min=weapon.flags.specials.proven.num;
            }
            let tens=0;

            for ( let r of roll.dice[0].results ) {
                if(r.active){
                    if(r.result>=righteous){
                        tens+=1;
                    }
                }

                r.roll=Math.min(max,r.roll);
                r.roll=Math.max(min,r.roll);

            }

            //HAYWIRE TABLE ROLL
            if(weapon.flags.specials.haywire.value){
                let hayRoll=new Roll("1d5",{});

                hayRoll.roll();


                let hayText=FORTYKTABLES.haywire[hayRoll._total-1];
                let hayOptions={user: game.user._id,
                                speaker:{actor,alias:actor.name},
                                content:hayText,
                                classes:["fortyk"],
                                flavor:`Haywire Effect ${weapon.flags.specials.haywire.num}m radius`,
                                author:actor.name};
                await ChatMessage.create(hayOptions,{});
            }
            //handle spray weapon jams

            if(weapon.flags.specials.spray.value&&weapon.type==="rangedWeapon"){
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
                    console.log(tar);
                    data=tar.actor.data.data; 
                    tarActor=tar.actor;


                    let wounds=getProperty(data,"secChar.wounds");
                    let soak=0;

                    let armor=parseInt(data.characterHitLocations[curHit.value].armor);

                    //check if weapon ignores soak

                    if(!weapon.flags.specials.ignoreSoak.value){
                        let armor=parseInt(data.characterHitLocations[curHit.value].armor);
                        //handle cover
                        if(!self&&!weapon.flags.specials.spray.value&&data.characterHitLocations[curHit.value].cover&&(weapon.type==="rangedWeapon"||weapon.type==="psychicPower")){
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

                                        game.socket.emit("system.fortyk",socketOp);
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
                        if(weapon.flags.specials.razorsharp.value&&actor.data.data.secChar.lastHit.dos>=3){
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

                        if(weapon.flags.specials.melta.value){


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

                        if(weapon.flags.specials.felling.value){
                            let ut=parseInt(tarActor.data.data.characteristics.t.uB);
                            let fel=Math.min(ut,weapon.flags.specials.felling.num);
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
                    }

                    let damage=roll._total;
                    //volkite logic
                    if(weapon.flags.specials.volkite.value&&tens>0){

                        let volkRoll=new Roll(tens+"d10",{});

                        volkRoll.roll();
                        await volkRoll.toMessage({
                            speaker: ChatMessage.getSpeaker({ actor: actor }),
                            flavor: "Rolling volkite weapon bonus damage."
                        });
                        damage+=volkRoll._total;
                    }

                    if(weapon.flags.specials.graviton.value){
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
                    if(weapon.flags.specials.accurate.value&&actor.data.data.secChar.lastHit.aim){
                        let distance=tokenDistance(attackerToken,tar);
                        if(distance>parseInt(weapon.data.range.value)/4){
                            let accDice=Math.min(weapon.flags.specials.accurate.num,Math.ceil((actor.data.data.secChar.lastHit.dos-1)/2));

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
                    if(weapon.flags.specials.scatter.value){
                        let distance=tokenDistance(attackerToken,tar);
                        if(distance<=2||distance<=2*canvas.dimensions.distance){
                            damage+=3;
                        }else if(distance>parseInt(weapon.data.range.value)/2){
                            damage-=3
                        }
                    }
                    //logic against swarm enemies
                    if(tarActor.getFlag("fortyk","swarm")&&!(weapon.flags.specials.spray.value||weapon.flags.specials.blast.value||weapon.flags.specials.flame.value||weapon.flags.specials.scatter.value)){
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
                    let chatDamage=damage;
                    if(chatDamage<0){chatDamage=0}
                    //corrosive weapon logic
                    if(weapon.flags.specials.corrosive.value){
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
                        let corrodeActiveEffect=game.fortyk.FORTYK.StatusEffects[9];
                        corrodeActiveEffect.changes=[];
                        let changes={key:path,value:newArmor,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.OVERRIDE};
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

                    //toxic weapon logic
                    if(damage>0&&weapon.flags.specials.toxic.value){
                        let toxicMod=weapon.flags.specials.toxic.num*10;

                        let toxic=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total-toxicMod),tarActor, "Resist Toxic");
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
                    if(damage>0&&weapon.flags.specials.shocking.value){
                        let shock=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total),tarActor, "Resist Shocking");
                        if(!shock.value){
                            let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[3]);
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
                            let newfatigue=tarActor.data.data.secChar.fatigue.value+1;
                            if(game.user.isGM||tar.owner){

                                await tarActor.update({"data.secChar.fatigue.value":newfatigue});






                            }else{
                                //if user isnt GM use socket to have gm update the actor
                                let tokenId=tar.data._id;
                                let socketOp={type:"updateValue",package:{token:tokenId,value:newfatigue,path:"data.secChar.fatigue.value"}}

                                game.socket.emit("system.fortyk",socketOp);
                            }
                        }

                    }
                    //crippling weapon logic
                    if(damage>0&&weapon.flags.specials.crippling.value){
                        let crippleActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[18]);
                        crippleActiveEffect.location=curHit;
                        crippleActiveEffect.num=weapon.flags.specials.crippling.num;

                        activeEffects.push(crippleActiveEffect);
                        let crippleOptions={user: game.user._id,
                                            speaker:{tarActor,alias:tarActor.name},
                                            content:`${tarActor.name} is crippled, they take ${weapon.flags.specials.crippling.num} damage to the ${curHit.label} which ignores all soak, if they ever take more than a half action in a turn. This lasts until they are fully healed or until the end of the encounter.`,
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

                    let crit=await this.righteousFury(actor,label,weapon,curHit,tens,damage,data);

                    if(crit&&damage<=0){
                        damage=1;
                        chatDamage=1;
                    }else if(damage<=0){
                        damage=0;
                        chatDamage=0;
                        let chatOptions={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:"Damage is fully absorbed.",
                                         classes:["fortyk"],
                                         flavor:`No damage`,
                                         author:actor.name};
                        await ChatMessage.create(chatOptions,{});
                    }


                    let newWounds=wounds.value;




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
                    //
                    //
                    //process horde damage for different weapon qualities
                    if(data.horde.value&&damage>0){
                        damage=1;
                        chatDamage=1;
                        if(weapon.data.damageType.value==="Explosive"){
                            damage+=1;
                            chatDamage+=1;
                        }
                        if(weapon.flags.specials.powerfield.value){
                            damage+=1;
                            chatDamage+=1;
                        }
                        if(weapon.flags.specials.blast.value){
                            damage+=weapon.flags.specials.blast.num;
                            chatDamage+=weapon.flags.specials.blast.num;
                        }
                        if(weapon.flags.specials.spray.value){
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

                        game.socket.emit("system.fortyk",socketOp);
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
                        this.critEffects(tar,crit,mesHitLoc,mesDmgType);
                        let chatOptions={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:rightMes,
                                         classes:["fortyk"],
                                         flavor:`${mesHitLoc}: ${mesRes}, ${mesDmgType} Critical effect`,
                                         author:actor.name};
                        await ChatMessage.create(chatOptions,{});


                    }
                    if(weapon.flags.specials.flame.value&&!data.horde.value){
                        let fire=await this.fortykTest("agi", "char", tarActor.data.data.characteristics.agi.total,tarActor, "Resist Fire");

                        if(!fire.value){
                            let fireActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[8]);

                            activeEffects.push(fireActiveEffect);

                        }
                    } 
                    if(weapon.flags.specials.snare.value){
                        let snareMod=weapon.flags.specials.snare.num*10;
                        let snare=await this.fortykTest("agi", "char", (tarActor.data.data.characteristics.agi.total-snareMod),tarActor, "Resist Snare");
                        if(!snare.value){
                            let chatSnare={user: game.user._id,
                                           speaker:{actor,alias:actor.name},
                                           content:`${tar.name} is immobilised. An Immobilised target can attempt no actions other than trying to escape the bonds. As a Full Action, he can make a (-${snareMod}) Strength or Agility test to break free.`,
                                           classes:["fortyk"],
                                           flavor:`Snare Immobilise`,
                                           author:actor.name};
                            await ChatMessage.create(chatSnare,{});
                            let snareActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[5]);

                            activeEffects.push(snareActiveEffect);
                        }
                    }
                    if(weapon.flags.specials.concussive.value){

                        let stunMod=parseInt(weapon.flags.specials.concussive.num)*10;
                        let stun=await this.fortykTest("t", "char", (tarActor.data.data.characteristics.t.total-stunMod),tarActor, "Resist Stun");
                        if(!stun.value){
                            let chatStun={user: game.user._id,
                                          speaker:{actor,alias:actor.name},
                                          content:`${tar.name} is stunned for ${stun.dos} rounds!`,
                                          classes:["fortyk"],
                                          flavor:`Concussive Stun`,
                                          author:actor.name};
                            await ChatMessage.create(chatStun,{});

                            let stunActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[3]);
                            stunActiveEffect.duration={
                                combat:game.combats.active.data._id,
                                rounds:stun.dos,
                                startRound:game.combats.active.current.round
                            };



                            activeEffects.push(stunActiveEffect);

                            if(damage>tarActor.data.data.characteristics.s.bonus){
                                let proneActiveEffect=duplicate(game.fortyk.FORTYK.StatusEffects[4]);

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
                    this.applyActiveEffect(tarActor,activeEffects);

                }
            }else{
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: label
                });

                this.righteousFury(actor,label,weapon,lastHit,tens);
            }
            hitNmbr++;
        }

    }
    //handles righteous fury
    static async righteousFury(actor,label,weapon,curHit,tens, damage=1, tarData=null){

        var crit=false;
        if(tens>0){
            crit=true;
        }

        if(tarData!==null&&tarData.horde.value){crit=false}

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
    static async critEffects(tar,num,hitLoc,type){

    }

    static async applyActiveEffect(actor,effect){

        if(effect.length>0){
            if(game.user.isGM||actor.owner){

                for(let index=0; index <effect.length;index++){
                    let dupp=false;
                    for(let ae of actor.effects){
                        console.log(ae,effect[index]);
                        if(ae.data.flags.core.statusId===effect[index].flags.core.statusId){
                            dupp=true;
                            if(effect[index].flags.core.statusId==="corrode"){
                                let upg=false;
                                for(let i=0;i<ae.data.changes.length;i++){
                                    if(ae.data.changes[i].key===effect[index].changes[0].key){
                                        ae.data.changes[i].value=effect[index].changes[0].value;
                                        upg=true;
                                    }
                                }
                                if(!upg){ae.data.changes.push(effect[index].changes[0])}
                                ae.update(ae.data);
                            }
                        }
                    }
                    if(!dupp){
                        await actor.createEmbeddedEntity("ActiveEffect",effect[index]);
                    }


                }


            }else{
                //if user isnt GM use socket to have gm update the actor
                let actorId=actor.data._id;
                let socketOp={type:"applyActiveEffect",package:{actor:actorId,effect:effect}}

                game.socket.emit("system.fortyk",socketOp);
            }

        }




    }
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

                game.socket.emit("system.fortyk",socketOp);

            }
        }



    }


}
