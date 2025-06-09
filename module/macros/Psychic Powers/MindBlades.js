let actor=scope.power.actor;
let power=scope.power;
var pr=power.system.curPR.value;
let targetIds=scope.targets;
let targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));
let vetFunction=function(event){
    let input=event.currentTarget;
    let checks=$('input[type=checkbox]:checked').length;
    if (checks > pr) {
        input.checked = false;
    }    
};

let content=``;
for(const target of targets){
    let tarActor=target.actor;
    content+=`<div class="flexcol" style="border-style:grooved"<label>${tarActor.name}</label>`;
    let weapons=[];
    weapons=weapons.concat(tarActor.itemTypes.meleeWeapon,tarActor.itemTypes.rangedWeapon,tarActor.itemTypes.ammunition);
    for(const weapon of weapons){
        content+=`<div><input class="weaponchkbox" type="checkbox" data-owner="${tarActor.uuid}" value="${weapon.uuid}"/> <span>${weapon.name}</span></div>`;
    }
    content+=`</div>`;
}

new Dialog({
    title: "Choose weapons",
    content: content,
    buttons: {
        submit: {
            label: 'OK',
            callback: async(html) => {
                let selectedCheckboxes=html.find('.weaponchkbox:checked');
                let actorIds=new Set([]);
                let effectIds=[];
                for(let i=0;i<selectedCheckboxes.length;i++){
                    let checkbox=selectedCheckboxes[i];
                    let weaponId=checkbox.value;
                    let actorId=checkbox.dataset.owner;
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
        }
    },
    render: (html)=>{
        html.find('.weaponchkbox').change(vetFunction.bind(this));  
    },
    default: "submit",


    width:100}
          ).render(true);











