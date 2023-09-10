let actor=scope.power.actor;
let power=scope.power;
let healing=Math.ceil(power.system.curPR.value/2);
let targetIds=scope.targets;
let targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));
for(const target of targets){
    let chatFirstAid={user: game.users.current,
                      speaker:{user: game.users.current},
                      content:"",
                      classes:["fortyk"],
                      flavor:`Endurance healing on ${target.name}`,
                      author:game.users.current
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
