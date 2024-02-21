game.actors.forEach(function(actor){
    let items=actor.items;
    items.forEach(function(item){
        if(item.system.state){
            if(item.system.state.value===""){
                item.update({"system.state.value":"O"});
                console.log(`Updating: ${item.name}`)
            }
        }
    })

})
let componentPack=game.packs.get("fortyk.knight-components");
let components=await componentPack.getDocuments();
components.forEach(function(item){
    if(item.system.state){
        if(item.system.state.value===""){
            item.update({"system.state.value":"O"});
            console.log(`Updating: ${item.name}`)
        }
    }
})