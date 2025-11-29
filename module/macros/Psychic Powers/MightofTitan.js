let actor=scope.power.actor;
let power=scope.power;
var pr=power.system.curPR.value;
let aeData=foundry.utils.duplicate(power.effects.entries().next().value[1]);
if(actor.getFlag("core","Might of Titan Buff"))return ui.notifications.warn("Might of Titan buff already applied");
aeData.name=aeData.name;
aeData.flags={fortyk:{psy:true, expireafterattack:true}};
aeData.disabled=false;
aeData.origin=actor.uuid;
aeData.statuses = [aeData.name];

let aeInstance=await actor.createEmbeddedDocuments("ActiveEffect",[aeData]);
