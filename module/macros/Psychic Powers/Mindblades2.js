
let actor=scope.power.actor;
let power=scope.power;
var pr=power.system.curPR.value;
let targetIds=scope.targets;
let effectIds=[];
let actorIds=new Set([]);
let range = power.system.range.value;
let actorToken = game.fortyk.getActorToken(actor);
console.log(targetIds);
for(const idPair of targetIds){

    let weaponId=idPair.weapon;
    let actorId=idPair.actor;
    actorIds.add(actorId);
    let weapon=await fromUuid(weaponId);
    let aeData={};
    aeData.name=power.name;


    aeData.flags={fortyk:{psy:true,range: range, casterTokenId: actorToken.id}};
    aeData.disabled=false;
    aeData.transfer=false;
    aeData.origin=actorId;
    aeData.changes=[];
    if(weapon.getFlag("fortyk","razorsharp")){
        aeData.changes.push({key:"flags.fortyk.shredding",value:true,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM});
    }else{
        aeData.changes.push({key:"flags.fortyk.razorsharp",value:true,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM});
    }
    let ae=await weapon.createEmbeddedDocuments("ActiveEffect",[aeData]);
    effectIds.push(ae[0].uuid);
}
let mindAeData=foundry.utils.duplicate(power.effects.entries().next().value[1]);
mindAeData.name=mindAeData.name;
mindAeData.flags={fortyk:{psy:true, range: range, casterTokenId: actorToken.id}};
mindAeData.disabled=false;
mindAeData.origin=actor.uuid;
mindAeData.statuses = [mindAeData.name];
for(const actorId of actorIds){
    let chosenActor=await fromUuid(actorId);
    let aeInstance=await chosenActor.createEmbeddedDocuments("ActiveEffect",[mindAeData]);
    effectIds.push(aeInstance[0].uuid);
}

if(power.system.sustain.value!=="No"){
    await power.setFlag("fortyk","sustained",effectIds);
    await power.setFlag("fortyk", "sustainedrange", range);

}
