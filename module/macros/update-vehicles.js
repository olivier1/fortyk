let actors=game.actors;
for(let value of actors.values()){
    if(value.type==="vehicle"){
        let upd={"system.facings.front.start":315,"system.facings.rSide.end":134,"system.facings.rear.start":135,"system.facings.lSide.end":314}
        await value.update(upd)
    }
}