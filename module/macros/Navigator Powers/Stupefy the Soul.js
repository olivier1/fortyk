let actor = scope.power.actor;
let power = scope.power;
let actorToken = game.fortyk.getActorToken(actor);
let targetIds = scope.targets;
let targets = canvas.tokens.placeables.filter((token) => targetIds.includes(token.id));
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

    let fatigueroll=new Roll("1d5+4", {});
    await fatigueroll.evaluate();
    let fatigueGain=fatigueroll._total;
    let actorFatigue=parseInt(targetActor.system.secChar.fatigue.value);
    actorFatigue+=fatigueGain;

    let messageStr="";

    messageStr+=`Gains ${fatigueGain} Insanity Points and is driven insane`;

    await targetActor.update({"system.secChar.fatigue.value":actorFatigue});

    let chatOptions = {
        author: game.user._id,
        speaker: { targetActor, alias: targetActor.getName() },
        content: messageStr,
        classes: ["fortyk"],
        flavor: `Stupefy the Soul effect`
    };
    await ChatMessage.create(chatOptions, {});
    if(training==="Adept"){
        let wp=targetActor.system.characteristics.wp.total;
        wp+= parseInt(actor.system.secChar.fearMod)-10;
        let test=await game.fortyk.FortykRolls.fortykTest("wp", "fear", wp, targetActor, "Fear");
    }else if(training==="Master"){
        let wp=targetActor.system.characteristics.wp.total;
        wp+= parseInt(actor.system.secChar.fearMod)-20;
        let test=await game.fortyk.FortykRolls.fortykTest("wp", "fear", wp, targetActor, "Fear");
    }



}