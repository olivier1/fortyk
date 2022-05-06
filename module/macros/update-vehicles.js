let actors=game.actors;
for(let value of actors.values()){
    if(value.type==="vehicle"){
        let upd={"data.facings.front.start":315,"data.facings.rSide.end":134,"data.facings.rear.start":135,"data.facings.lSide.end":314}
        await value.update(upd)
    }
}