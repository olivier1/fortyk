let actor=scope.power.actor;
let power=scope.power;
var pr=power.system.curPR.value;
let targetIds=scope.targets;
let targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));
let vetFunction=function(event){
    let input=event.currentTarget;
    let checks=$('input[type=checkbox]:checked.weaponchkbox').length;
    console.log(pr,checks);
    if (checks > pr) {
        input.checked = false;
    }    
};
var actorToken = game.fortyk.getActorToken(actor);
console.log(actorToken)
let content=``;
for(const target of targets){
    let tarActor=target.actor;
    content+=`<div class="flexcol" style="border-style:grooved"<label>${tarActor.name}</label>`;
    let weapons=[];
    weapons=weapons.concat(tarActor.itemTypes.meleeWeapon,tarActor.itemTypes.rangedWeapon);
    for(const weapon of weapons){
        content+=`<div><input class="weaponchkbox" type="checkbox" data-owner="${tarActor.uuid}" value="${weapon.uuid}"/> <span>${weapon.name}</span></div>`;
    }
    content+=`</div>`;
}

new Dialog({
    title: `Choose up to ${pr} weapons`,
    content: content,
    buttons: {
        submit: {
            label: 'OK',
            callback: async(html) => {
                let selectedCheckboxes=html.find('.weaponchkbox:checked');
                let actorIds=new Set([]);
                let effectIds=[];
                let ids=[];
                let range = power.system.range.value;

                for(const box of selectedCheckboxes){
                    let weaponId=box.value;
                    let actorId=box.dataset.owner;
                    ids.push({actor:actorId,weapon:weaponId});
                }
                if(game.user.isGM){
                    for(const idPair of ids){

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
                    mindAeData.flags={fortyk:{psy:true,range: range, casterTokenId: actorToken.id}};
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
                }else{
                    let socketOp={type:"psyMacro",package:{powerId:power.id, macroId:"PyZOh263Cn3o1b5Z", actorId:actor.uuid, targetIds:ids}};
                    await game.socket.emit("system.fortyk",socketOp);
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