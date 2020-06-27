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
    static async fortykTest(char, type, target, actor, label, weapon=null, reroll=false){
        //cap target at 100 or floor at 1
        if(target>100){
            target=100;
        }else if(target<1){
            target=1;
        }

        let roll=new Roll("1d100ms<@tar",{tar:target});
        roll.roll();

        let template='systems/fortyk/templates/chat/chat-test.html';
        var templateOptions={
            title:"",
            rollResult:"",
            target:"",
            pass:"",
            dos:"",
            success:false,
            reroll:reroll

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

        templateOptions["rollResult"]="Roll: "+testRoll.toString();
        templateOptions["target"]="Target: "+target.toString();
        const rollResult=target-testRoll;
        const testResult=rollResult>=0;
        const charObj=actor.data.data.characteristics[char];
        var testDos=0;
        //calculate degrees of failure and success
        if(testResult&&testRoll<96||testRoll===1){

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
            if(testRoll>=96){
                templateOptions["pass"]="96+ is an automatic failure!"
            }else{
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
        ChatMessage.create(chatOptions,{});


        if(type==="focuspower"||type==="rangedAttack"||type==="meleeAttack"){

            //reverse roll to get hit location
            let firstDigit=Math.floor(testRoll/10);

            let secondDigit=testRoll-firstDigit*10;

            let inverted=parseInt(secondDigit*10+firstDigit);

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
            ChatMessage.create(chatOp,{});


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
                    psyRoll.toMessage({
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
                    ChatMessage.create(chatPhenom,{});
                }
                if(perils){
                    let mod=0;


                    let perilsRoll=new Roll("1d100+@mod",{mod:mod});
                    perilsRoll.roll();
                    perilsRoll.toMessage({
                        speaker: ChatMessage.getSpeaker({ actor: actor }),
                        flavor: "Perils of the Warp!!"
                    });
                    let perilsResult=parseInt(perilsRoll._total);
                    if(perilsResult>100){perilsResult=100};

                    let perilsMessage=FORTYKTABLES.perils[perilsResult];
                    let chatPhenom={user: game.user._id,
                                    speaker:{actor,alias:actor.name},
                                    content:perilsMessage,
                                    classes:["fortyk"],
                                    flavor:"Perils of the Warp!!",
                                    author:actor.name};
                    ChatMessage.create(chatPhenom,{});
                }
            } 

        }else if(type==="fear"&&!templateOptions["success"]){
           
            //generating insanity when degrees of failure are high enough
            if(testDos>=3){
                let insanityRoll=new Roll("1d5");
                insanityRoll.roll();
                insanityRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: actor }),
                    flavor: "Rolling insanity for 3+ Degrees of failure"
                });
            }
            let fearRoll=new Roll("1d100 +@mod",{mod:testDos*10});
            fearRoll.roll();
            fearRoll.toMessage({
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
            ChatMessage.create(chatShock,{});
        }


    }


    //handles damage rolls and applies damage to the target, generates critical effects, doesnt do any status effects yet
    static async damageRoll(formula,actor,weapon,hits=1,righteous=10){

        var lastHit=actor.data.data.secChar.lastHit;
        let targets=game.users.current.targets;


        var form=formula.value;
        if(weapon !== null){


            if(weapon.type==="meleeWeapon"){
                form+="+"+actor.data.data.characteristics.s.bonus
            }
        }
        var hitNmbr=0;
        var curHit=FORTYK.extraHits[lastHit.value][0];
        //loop for the number of hits
        for(let h=0;h<(hits);h++){
            if(hitNmbr>5){hitNmbr=0}
            curHit=FORTYK.extraHits[lastHit.value][hitNmbr];
            var roll=new Roll(form,actor.data.data);
            let label = weapon.name ? `Rolling ${weapon.name} damage.` : 'damage';

            roll.roll();
            //check for righteous fury
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
            if(crit){
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

                var chatOptions={user: game.user._id,
                                 speaker:{actor,alias:actor.name},
                                 content:rightMes,
                                 classes:["fortyk"],
                                 flavor:`${mesHitLoc}: ${mesRes}, ${mesDmgType} Critical effect`,
                                 author:actor.name};
                await ChatMessage.create(chatOptions,{});

            }
            if(targets.size!==0){
                //if there are targets apply damage to all of them
                for (let tar of targets){
                   
                    let data=tar.actor.data.data;
                    let wounds=getProperty(data,"secChar.wounds");

                    let armor=parseInt(data.characterHitLocations[curHit.value].armor);
                    //handle cover
                    if(data.characterHitLocations[curHit.value].cover&&(weapon.type==="rangedWeapon"||weapon.type==="psychicPower")){
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

                    let newWounds=wounds.value;
                    // true grit!@!!@
                    if((wounds.value-damage)<0&&tar.actor.data.flags["truegrit"]){
                        if(newWounds>0){
                           
                            damage=damage-newWounds;
                            newWounds=0;
                        }
                        
                        damage=Math.max(1,damage-data.characteristics.t.bonus);

                        var chatOptions={user: game.user._id,
                                         speaker:{actor,alias:tar.actor.name},
                                         content:"True Grit reduces critical damage!",
                                         classes:["fortyk"],
                                         flavor:`Critical effect`,
                                         author:tar.actor.name};
                        await ChatMessage.create(chatOptions,{});
                    }
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
                    if(newWounds<0){
                        let crit=Math.abs(newWounds)-1;
                        let rightMes=FORTYKTABLES.crits[weapon.data.damageType.value][curHit.value][crit];

                        let mesDmgType=weapon.data.damageType.value;
                        let mesRes=crit+1;
                        let mesHitLoc=curHit.label;

                        var chatOptions={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:rightMes,
                                         classes:["fortyk"],
                                         flavor:`${mesHitLoc}: ${mesRes}, ${mesDmgType} Critical effect`,
                                         author:actor.name};
                        await ChatMessage.create(chatOptions,{});


                    }
                }
            }else{

            }
            hitNmbr++;
        }

    }
    //handles test rerolls
    static async _onReroll(event){
        event.preventDefault();

        const dataset=event.currentTarget.dataset;

        const actor=game.actors.get(dataset["actor"]);
        const char=dataset["char"];
        const type=dataset["rollType"];

        var target=dataset["target"];
        const label=dataset["label"];


        new Dialog({
            title: `${label} Reroll`,
            content: `<p><label>Modifier:</label> <input type="text" name="modifier" value="0" autofocus/></p>`,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (el) => {
                        let bonus = Number($(el).find('input[name="modifier"]').val());

                        target=parseInt(target)+parseInt(bonus);
                        FortykRolls.fortykTest(char, type, target, actor, label,null , true);
                    }
                }
            },
            default: "submit",


            width:100}
                  ).render(true);
    }
    //activate chatlisteners
    static chatListeners(html){
        html.on("click",".reroll", this._onReroll.bind(this));

    }

}
