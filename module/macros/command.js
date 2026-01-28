
let targets=game.scenes.current.tokens;
let actor=game.user.character;
let asuryan=actor.getFlag("fortyk", "majestyofasuryan");
for(let target of targets){
    let targetActor=target.actor;
    let tempMod=10;
    if(game.user.isGM||targetActor.isOwner){
        let update={"system.secChar.tempMod.command":tempMod};
        if(asuryan){
            update["system.secChar.tempMod.asuryan"]=true;
        }
        await targetActor.update(update);
    }else{
        let tokenId=target.id;

        let socketOp={type:"updateValue",package:{token:tokenId,value:tempMod,path:"system.secChar.tempMod.command"}};
        await game.socket.emit("system.fortyk",socketOp);
        if(asuryan){
            let socketOp2={type:"updateValue",package:{token:tokenId,value:true,path:"system.secChar.tempMod.asuryan"}};
            await game.socket.emit("system.fortyk",socketOp2);
        }

    }

}
