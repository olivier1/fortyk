/* provides functions for doing tests or damage rolls, will eventually take into account talents and special qualities but not yet
*/
import {FORTYKTABLES} from "./FortykTables.js"
import {FORTYK} from "./FortykConfig.js"
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


        const testRoll=roll.dice[0].rolls[0].roll;
        //check for jams
        let jam=false;
        console.log(testRoll)
        console.log(type);
        if(type==="rangedAttack"){
            console.log("hey");
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
        const rollResult=target-testRoll;
        const testResult=rollResult>=0;
        const charObj=actor.data.data.characteristics[char];
        var testDos=0;
        console.log(jam);
        //calculate degrees of failure and success
        if((testResult&&testRoll<96||testRoll===1)&&!jam){

            testDos=Math.floor(Math.abs(roll._result)/10)+1+charObj.uB;
            templateOptions["dos"]="with "+testDos.toString()+" degree";
            if(testDos===1){}else{templateOptions["dos"]+="s";}
            templateOptions["dos"]+=" of success!";
            templateOptions["pass"]="Pass!";
            templateOptions["success"]=true;
        }else{

            testDos=Math.floor(Math.abs(roll._result)/10)+1;
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

            if(!push&&(firstDigit===secondDigit)){
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
                let chatPhenom={user: game.user._id,
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
        }


    }


    //handles damage rolls and applies damage to the target, generates critical effects, doesnt do any status effects yet
    static async damageRoll(formula,actor,weapon,hits=1,righteous=10,curHit){

        let lastHit=actor.data.data.secChar.lastHit;
        let targets=game.users.current.targets;


        let form=formula.value;
        //change formula for tearing weapons
        if(weapon.flags.specials.tearing.value){
            let dPos = form.indexOf('d');
            let dieNum = form.substr(0,dPos);
            let newNum=parseInt(dieNum)+1;
            form=form.slice(dPos)
            form=newNum+form;
            let afterD=dPos+3;
            let startstr=form.slice(0,afterD);
            let endstr=form.slice(afterD);
            form=startstr+"dl1"+endstr;

        }
        let hitNmbr=0;

        //loop for the number of hits
        for(let h=0;h<(hits);h++){
            if(hitNmbr>5){hitNmbr=0}
            curHit=FORTYK.extraHits[lastHit.value][hitNmbr];
            let roll=new Roll(form,actor.data.data);
            let label = weapon.name ? `Rolling ${weapon.name} damage.` : 'damage';

            roll.roll();


            if(targets.size!==0){

                //if there are targets apply damage to all of them
                for (let tar of targets){
                    let data=tar.actor.data.data;
                   

                    let wounds=getProperty(data,"secChar.wounds");

                    let armor=parseInt(data.characterHitLocations[curHit.value].armor);
                    //handle cover
                    if(!weapon.flags.specials.spray.value&&data.characterHitLocations[curHit.value].cover&&(weapon.type==="rangedWeapon"||weapon.type==="psychicPower")){
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
                                    tar.actor.update(pack);
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
                    let pen=parseInt(weapon.data.pen.value);

                    let maxPen=Math.min(armor,pen);

                    let soak=parseInt(data.characterHitLocations[curHit.value].value);

                    soak=soak-maxPen;

                    let damage=roll._total-soak;
                    //check for righteous fury
                    let crit=this.righteousFury(roll,righteous,actor,label,weapon,curHit,damage);

                    if(crit.promiseValue&&damage<=0){
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
                    // true grit!@!!@
                    if((damage>0)&&(wounds.value-damage)<0&&tar.actor.data.flags["truegrit"]){
                        if(newWounds>0){

                            damage=damage-newWounds;
                            newWounds=0;
                        }

                        damage=Math.max(1,damage-data.characteristics.t.bonus);

                        let chatOptions={user: game.user._id,
                                         speaker:{actor,alias:tar.actor.name},
                                         content:"True Grit reduces critical damage!",
                                         classes:["fortyk"],
                                         flavor:`Critical effect`,
                                         author:tar.actor.name};
                        await ChatMessage.create(chatOptions,{});
                    }
                    //report damage dealt to gm
                    let damageOptions={user: game.user._id,
                                       speaker:{actor,alias:actor.name},
                                       content:`Attack did ${damage} damage.`,
                                       classes:["fortyk"],
                                       flavor:`No damage`,
                                       author:actor.name,
                                       whisper:ChatMessage.getWhisperRecipients("GM"),
                                       blind:true};
                    await ChatMessage.create(damageOptions,{});

                    newWounds=newWounds-damage;
                    newWounds=Math.max(wounds.min,newWounds);

                    //update wounds
                    if(game.user.isGM){
                       
                 
                            
                            tar.actor.update({"data.secChar.wounds.value":newWounds});
                     

                    }else{
                        //if user isnt GM use socket to have gm update the actor
                        let tokenId=tar.data._id;
                        let socketOp={type:"updateValue",package:{token:tokenId,value:newWounds,path:"data.secChar.wounds.value"}}

                        game.socket.emit("system.fortyk",socketOp);
                    }

                    //handle critical effects
                    if(newWounds<0&&damage>0){
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


                    }
                }
            }else{
                this.righteousFury(roll,righteous,actor,label,weapon,lastHit);
            }
            hitNmbr++;
        }

    }
    //handles righteous fury
    static async righteousFury(roll,righteous,actor,label,weapon,curHit, damage=1){

        var crit=false;
        for ( let r of roll.dice[0].rolls ) {
            if(r.roll>=righteous){
                crit=true;

            }

        }

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            flavor: label
        });
        //if righteous fury roll the d5 and spew out the crit result
        if(crit&&damage>0){
            let rightRoll=new Roll("1d5",actor.data.data);
            await rightRoll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: "Righteous Fury!"
            });
            let res=rightRoll.dice[0].rolls[0].roll-1;


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
        }else if(crit){
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

        const weapon=actor.getEmbeddedEntity("OwnedItem",dataset["weapon"]);
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

        const weapon=duplicate(actor.getEmbeddedEntity("OwnedItem",dataset["weapon"]));
        const formula=weapon.data.damageFormula;
        weapon.data.pen.value=0;
        let arm=["rArm","lArm"];
        let rng=Math.floor(Math.random() * 2);

        await this.damageRoll(formula,actor,weapon,1,10,arm[rng],true);


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
                    }

                }
            },
            default: "submit",


            width:100}
                  ).render(true);

    }
    //handles the melee attack dialog WHEW
    static async callMeleeAttackDialog(testChar, testType, testTarget, actor, testLabel, item){

        let template="systems/fortyk/templates/actor/dialogs/melee-attack-dialog.html"
        let templateOptions={};

        templateOptions["modifiers"]=actor.data.data.secChar.attacks;
        templateOptions["size"]=FORTYK.size;

        let renderedTemplate= await renderTemplate(template,templateOptions);

        new Dialog({
            title: `${item.name} Melee Attack Test.`,
            classes:"fortky",
            content: renderedTemplate,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (html) => {
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
    static async callRangedAttackDialog(testChar, testType, testTarget, actor, testLabel, item){
        let template="systems/fortyk/templates/actor/dialogs/ranged-attack-dialog.html"
        let templateOptions={};

        templateOptions["modifiers"]=actor.data.data.secChar.attacks;
        templateOptions["size"]=FORTYK.size;
        templateOptions["modifiers"].standard=item.data.attackMods.single;
        templateOptions["modifiers"].semi=item.data.attackMods.semi;
        templateOptions["modifiers"].full=item.data.attackMods.full;
        templateOptions["modifiers"].suppressive=item.data.attackMods.suppressive;


        for (let [key, rng] of Object.entries(templateOptions.modifiers.range)){
            let wepMod=item.data.attackMods.range[key];
            templateOptions.modifiers.range[key]=Math.max(wepMod,rng);
        }
        //set flags for rate of fire
        let curAmmo=parseInt(item.data.clip.value);
        let consump=parseInt(item.data.clip.consumption);
        let rofSingle=parseInt(item.data.rof[0].value);
        let rofSemi=parseInt(item.data.rof[1].value);
        if(isNaN(rofSingle)){
            rofSingle=1;
        }
        let rofFull=parseInt(item.data.rof[2].value);
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
        }
        let renderedTemplate= await renderTemplate(template,templateOptions);

        new Dialog({
            title: `${item.name} Ranged Attack Test.`,
            classes:"fortky",
            content: renderedTemplate,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (html) => {

                        const attackTypeBonus = Number($(html).find('input[name="attack-type"]:checked').val());
                        let guarded = Number($(html).find('input[name="guarded"]:checked').val());
                        const aimBonus = Number($(html).find('input[name="aim-type"]:checked').val());
                        const rangeBonus = Number($(html).find('input[name="distance"]:checked').val());

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
                        let attackType=html.find('input[name=attack-type]:checked')[0].attributes["type"].value;
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

                        let weapon=duplicate(item);
                        weapon.data.clip.value=curAmmo-rof;
                        actor.updateEmbeddedEntity("OwnedItem",weapon);
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
                        FortykRolls.fortykTest(testChar, testType, testTarget, actor, testLabel, item, false, attackType);
                    }

                }
            },
            default: "submit",


            width:400}
                  ).render(true);

    }
    static async callFocusPowerDialog(testChar, testType, testTarget, actor, testLabel, item){
        let template="systems/fortyk/templates/actor/dialogs/psychic-power-attack-dialog.html"
        let templateOptions={};

        templateOptions["modifiers"]=actor.data.data.secChar.attacks;
        templateOptions["size"]=FORTYK.size;

        let renderedTemplate= await renderTemplate(template,templateOptions);

        new Dialog({
            title: `${item.name} Melee Attack Test.`,
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
