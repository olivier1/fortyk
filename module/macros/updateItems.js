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
let componentPack=game.packs.get("fortyk.wargear-beta");
let components=await componentPack.getDocuments();
components.forEach(function(item){
    if( item.flags){
        if(!item.flags.fortyk){
            item.update({"flags.fortyk":{}});
        }
    }else{
        item.update({"flags.fortyk":{}});
    }
})