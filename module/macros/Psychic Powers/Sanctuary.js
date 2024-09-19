let actor=scope.power.actor;
let power=scope.power;
let targetIds=scope.targets;
let targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));

console.log(this,actor,scope)


let actorPR=actor.system.psykana.pr.effective;
let powerPR=power.system.curPR.value;
let adjustment=actorPR-powerPR;
let actorId=actor.uuid;

let normalShieldData={name:"Sanctuary Shield",
                      type:"forceField",
                      flags:{
                          fortyk:{
                              sanctuary:true,
                              adjustment:adjustment,
                              origin:actorId
                          }
                      }};
let daemonShieldData={name:"Sanctuary Shield(Daemon)",
                      type:"forceField",
                      flags:{
                          fortyk:{
                              sanctuaryDaemon:true,
                              adjustment:adjustment,
                              origin:actorId
                          }
                      }};
let ae=power.effects.entries().next().value[1];
console.log(ae)
let aeData=foundry.utils.duplicate(ae);

aeData.name=ae.name+" Buff"


aeData.flags={fortyk:{psy:true}};
aeData.disabled=false;
aeData.origin=actorId;
let itemUuIds=[]
for(let i=0; i<targets.length;i++){
    let target=targets[i];

    let targetActor=target.actor;
    let items=await targetActor.createEmbeddedDocuments("Item",[normalShieldData, daemonShieldData]);
    let effect= await targetActor.createEmbeddedDocuments("ActiveEffect",[aeData]);
    itemUuIds.push(effect[0].uuid);
    for(let j=0; j<items.length;j++){
        let item=items[j];
        let itemuuid=await item.uuid

        itemUuIds.push(itemuuid);
    }

}



await power.setFlag("fortyk","sustained",itemUuIds);
if(power.system.sustain.value!=="No"){
    let sustained=actor.system.psykana.pr.sustained;
    sustained.push(power.id);
    actor.update({"system.psykana.pr.sustained":sustained});
}