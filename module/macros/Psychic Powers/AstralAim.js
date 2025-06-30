let actor=scope.power.actor;
let power=scope.power;
var pr=power.system.curPR.value;
let aeData=foundry.utils.duplicate(power.effects.entries().next().value[1]);
if(actor.getFlag("core","Astral Aim Buff"))return ui.notifications.warn("Astral Aim buff already applied");

let effectIds=[];
let rangedWeapons=actor.itemTypes.rangedWeapon;
rangedWeapons=rangedWeapons.concat(actor.itemTypes.ammunition);
for(const rangedWeapon of rangedWeapons){
    let aeData={};
    aeData.name=power.name+" Buff";


    aeData.flags={fortyk:{psy:true, expireafterattack:true}};
    aeData.disabled=false;
    aeData.transfer=false;
    aeData.origin=actor.id;
    aeData.changes=[];
    if(rangedWeapon.getFlag("fortyk","vengeful")){
        aeData.changes.push({key:"flags.fortyk.vengeful",value:-1*Math.ceil(pr/2),mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD});
    }else{
        aeData.changes.push({key:"flags.fortyk.vengeful",value:10-Math.ceil(pr/2),mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM});
    }
    let ae=await rangedWeapon.createEmbeddedDocuments("ActiveEffect",[aeData]);
    effectIds.push(ae[0].uuid);
}



aeData.name=aeData.name+" Buff";
aeData.flags={fortyk:{psy:true, expireafterattack:true}};
aeData.disabled=false;
aeData.origin=actor.uuid;
aeData.statuses = [aeData.name];

let aeInstance=await actor.createEmbeddedDocuments("ActiveEffect",[aeData]);
effectIds.push(aeInstance[0].uuid);
