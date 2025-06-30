async function lala(){
    let actor=scope.power.actor;
    let power=scope.power;
    var pr=power.system.curPR.value;
    let targetIds=scope.targets;
    let effectIds=[];
    let actorIds=new Set([]);
    for(const idPair of targetIds){

        let weaponId=idPair.weapon;
        let actorId=idPair.actor;
        actorIds.add(actorId);
        let weapon=await fromUuid(weaponId);
        let aeData={};
        aeData.name=power.name+" Buff";


        aeData.flags={fortyk:{psy:true}};
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
    mindAeData.name=mindAeData.name+" Buff";
    mindAeData.flags={fortyk:{psy:true}};
    mindAeData.disabled=false;
    mindAeData.origin=actor.uuid;
    mindAeData.statuses = [mindAeData.name];
    for(const actorId of actorIds){
        let chosenActor=await fromUuid(actorId);
        let aeInstance=await chosenActor.createEmbeddedDocuments("ActiveEffect",[mindAeData]);
        effectIds.push(aeInstance[0].uuid);
    }
    await power.setFlag("fortyk","sustained",effectIds);
    if(power.system.sustain.value!=="No"){
        let sustained=actor.system.psykana.pr.sustained;
        sustained.push(power.id);
        actor.update({"system.psykana.pr.sustained":sustained});
    } 
}
