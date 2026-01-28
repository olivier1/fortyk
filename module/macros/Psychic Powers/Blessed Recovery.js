let actor=scope.power.actor;
let power=scope.power;
var pr=power.system.curPR.value;
let narthForm=`${pr}d5`;
let narthRoll=new Roll(narthForm,{});
await narthRoll.evaluate({async: false});
narthRoll.toMessage({flavor:"Rolling Blessed Recovery"});
let healing=Math.ceil(power.system.curPR.value);
healing+=narthRoll._total;

let targetIds=scope.targets;
let targets=game.scenes.current.tokens.filter(token=>targetIds.includes(token.id));
for(const target of targets){
    let chatFirstAid={author: game.users.current,
                      speaker:{user: game.users.current},
                      content:"",
                      classes:["fortyk"],
                      flavor:`Blessed Recovery on ${target.name}`
                     }
    chatFirstAid.content=`${actor.name} successfully healed ${target.name} for ${healing} wounds!`;
    let targetActor=target.actor;
    let tarWounds=targetActor.system.secChar.wounds.value;
    tarWounds=Math.min(tarWounds+healing,targetActor.system.secChar.wounds.max);
    if(game.user.isGM||targetActor.isOwner){
        await targetActor.update({"system.secChar.wounds.value":tarWounds});
    }else{
        let tokenId=target.id;

        let socketOp={type:"updateValue",package:{token:tokenId,value:tarWounds,path:"system.secChar.wounds.value"}}
        await game.socket.emit("system.fortyk",socketOp);
    }
    await ChatMessage.create(chatFirstAid,{});
}
