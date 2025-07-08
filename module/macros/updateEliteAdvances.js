let componentPack=game.packs.get("fortyk.elite-advances");
let components=await componentPack.getDocuments();
components.forEach(function(item){
    var flag = item.system.flag;
    if(flag){
        console.log(`Updating: ${item.name}...`);
        item.update({"system.flagId":flag,
                     "system.flag":null});
        console.log("Success!");
    }

})

let actors=game.actors;
for(const actor of actors){
    let eliteAdvances=actor.itemTypes.eliteAdvance;
    for(const eliteAdvance of eliteAdvances){
        var flag = eliteAdvance.system.flag;
        if(flag){
            console.log(`Updating: ${eliteAdvance.name} of ${actor.name}...`);
            eliteAdvance.update({"system.flagId":flag,
                                 "system.flag":null});
            console.log("Success!");
        }
    }
}
components.forEach(function(item){
    var flag = item.system.flag;
    if(flag){
        console.log(`Updating: ${item.name}...`);
        item.update({"system.flagId":flag,
                     "system.flag":null});
        console.log("Success!");
    }

})