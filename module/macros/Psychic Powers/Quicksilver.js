let actor=scope.power.actor;
let power=scope.power;
var pr=parseInt(power.system.curPR.value);
let range = power.system.range.value;
let actorToken = game.fortyk.getActorToken(actor);
let targetIds=scope.targets;
let targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));
let aeData=foundry.utils.duplicate(power.effects.entries().next().value[1]);
let combat=game.combats.active;
if(!combat)return;
aeData.name=aeData.name+" Buff";
aeData.flags={fortyk:{psy:true,range: range, casterTokenId: actorToken.id}};
aeData.disabled=false;
aeData.origin=actor.uuid;
aeData.statuses = [aeData.name];
let effectIds=[];
let originalInitiatives=[];
for(const target of targets){
    const combatant=target.combatant;
    if(!combatant)continue;
    const targetActor=target.actor;
    let aeInstance=await targetActor.createEmbeddedDocuments("ActiveEffect",[aeData]);
    console.log(aeInstance);
    effectIds.push(aeInstance[0].uuid);
    let initiative=parseFloat(combatant.initiative);
    originalInitiatives.push({id:combatant.id,init:initiative});
    let newInit=initiative+pr;
    console.log(initiative, pr, newInit)
    await combat.setInitiative(combatant.id,newInit);
}
console.log(originalInitiatives, effectIds, power, actor);


await power.setFlag("fortyk","initmods",originalInitiatives);

await power.setFlag("fortyk", "sustainedrange", range);
await power.setFlag("fortyk","sustained",effectIds);
if(power.system.sustain.value!=="No"){
    let sustained=actor.system.psykana.pr.sustained;
    sustained.push(power.id);
    actor.update({"system.psykana.pr.sustained":sustained});
}