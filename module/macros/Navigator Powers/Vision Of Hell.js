let actor = scope.power.actor;
let power = scope.power;
let actorToken = game.fortyk.getActorToken(actor);
let targetIds = scope.targets;
let targets = game.scenes.current.tokens.filter((token) => targetIds.includes(token.id));
let aeData = foundry.utils.duplicate(
    game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("hallucinogenic")]
);
let casterTestFlag=actor.getFlag("fortyk", "lasttest");
let casterDos=casterTestFlag.dos;
let training=power.system.training.value;
let halluTable=game.fortyk.FORTYKTABLES.hallucinogenic;
aeData.flags={"fortyk":{}};
for (const target of targets) {


    
  
    let halluRoll = new Roll("1d10", {});
    await halluRoll.evaluate();
    let halluText = halluTable[halluRoll._total - 1];
    aeData.flags.fortyk.startofround=halluText;
    //implement insanity gain and perma duration for master

    let insanityRollString="0";


    const targetActor = target.actor;
    let infinite=false;
    if(training==="Adept"){
        insanityRollString="1d3";
    }else if(training==="Master"){
        if(targetActor.system.secChar.fate.max){
            insanityRollString="1d5+1";
        }else{
            infinite=true;
        }

    }
    let insanityRoll=new Roll(insanityRollString, {});
    await insanityRoll.evaluate();
    let insanityGain=insanityRoll._total;
    let actorInsanity=parseInt(targetActor.system.secChar.insanity.value);
    
    
    let messageStr="";
    if(insanityGain){
        messageStr+=`Gains ${insanity} Insanity Points and is driven insane`;
        insanityGain+=actorInsanity;
        await targetActor.update({"system.secChar.insanity.value":insanityGain});
    }else{
        messageStr+=`Is driven insane`;
    }
    if(infinite){
        messageStr+=` forever! <br> Insanity Effect: <br>`+halluText;
    }else{
        let targetTestFlag=targetActor.getFlag("fortyk","lasttest");
        let targetTestPass=targetTestFlag.success;
        let targetDos=targetTestFlag.dos;
        let duration=casterDos;
        if(targetTestPass){
            duration-=targetDos;
        }else{
            duration+=targetDos;
        }
        messageStr+=` for ${duration} rounds! <br> Insanity Effect: <br>`+halluText;
        aeData.duration = {
            rounds: duration
        };
    }
    let chatOptions = {
                    author: game.user._id,
                    speaker: { targetActor, alias: targetActor.getName() },
                    content: messageStr,
                    classes: ["fortyk"],
                    flavor: `Vision of Hell effect`
                };
                await ChatMessage.create(chatOptions, {});
    let aeInstance = await targetActor.createEmbeddedDocuments("ActiveEffect", [aeData]);
    console.log(aeInstance);

}
