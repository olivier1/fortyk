let actor=scope.power.actor;
let power=scope.power;
var pr=power.system.curPR.value;


let effectIds=[];
let rangedWeapons=actor.itemTypes.rangedWeapon;
rangedWeapons=rangedWeapons.concat(actor.itemTypes.ammunition);
for(const rangedWeapon of rangedWeapons){
    if (rangedWeapon.system.type.value==="Bolt"&&rangedWeapon.getFlag("fortyk","force")){
        let aeData={};
        aeData.name=power.name+" Buff";


        aeData.flags={fortyk:{psy:true}};
        aeData.disabled=false;
        aeData.transfer=false;
        aeData.origin=actor.id;
        aeData.changes=[];
        if(rangedWeapon.getFlag("fortyk","blast")){
            aeData.changes.push({key:"flags.fortyk.blast",value:pr,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD});
        }else{
            aeData.changes.push({key:"flags.fortyk.blast",value:pr,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.CUSTOM});
        }
        let ae=await rangedWeapon.createEmbeddedDocuments("ActiveEffect",[aeData]);
        effectIds.push(ae[0].uuid);
    }

}
if(effectIds.length<1){return;}


let aeData=foundry.utils.duplicate(power.effects.entries().next().value[1]);
aeData.name=aeData.name+" Buff";
aeData.flags={fortyk:{psy:true}};
aeData.disabled=false;
aeData.origin=actor.uuid;
aeData.statuses = [aeData.name];

let aeInstance=await actor.createEmbeddedDocuments("ActiveEffect",[aeData]);
effectIds.push(aeInstance[0].uuid);
await power.setFlag("fortyk","sustained",effectIds);
if(power.system.sustain.value!=="No"){
    let sustained=actor.system.psykana.pr.sustained;
    sustained.push(power.id);
    actor.update({"system.psykana.pr.sustained":sustained});
}