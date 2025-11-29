let actor=scope.power.actor;
let power=scope.power;
var pr=power.system.curPR.value;
let range = power.system.range.value;
let actorToken = game.fortyk.getActorToken(actor);
let targetIds=scope.targets;
let targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));
let maxInit=0;
let combat=game.combats.active;
if(!combat)return;
for(const target of targets){
    const combatant=target.combatant;
    if(combatant.initiative>maxInit){
        maxInit=combatant.initiative;
    }
}
let aeData=foundry.utils.duplicate(power.effects.entries().next().value[1]);
aeData.name=aeData.name;
aeData.flags={fortyk:{psy:true, range: range, casterTokenId: actorToken.id}};
aeData.disabled=false;
aeData.origin=actor.uuid;
aeData.statuses = [aeData.name];
let effectIds=[];
let originalInitiatives=[];

for(const target of targets){
    const combatant=target.combatant;
    const targetActor=target.actor;
    let aeInstance=await targetActor.createEmbeddedDocuments("ActiveEffect",[aeData]);
    effectIds.push(aeInstance[0].uuid);
    if(combatant.initiative<maxInit){
        originalInitiatives.push({id:combatant.id,init:combatant.initiative});
        await combat.setInitiative(combatant.id,maxInit);
    }
}

await power.setFlag("fortyk","initmods",originalInitiatives);

if(power.system.sustain.value!=="No"){
    await power.setFlag("fortyk","sustained",effectIds);

    await power.setFlag("fortyk", "sustainedrange", range);

}