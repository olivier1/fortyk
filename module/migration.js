
let upd=async ()=>{
    for ( let a of game.actors.entities ) {
        
        try {
            let updateData = null;
            if(a.data.type==="dwPC"){
              
                updateData={data:mergeObject(a.data,game.system.model.Actor.dwPC,true,true,false,true,false,false)};
            }else if(a.data.type==="dhPC"){
                updateData={data:mergeObject(a.data,game.system.model.Actor.dhPC,true,true,false,true,false,false)};
               // updateData={data:diffObject(a.data,game.system.model.Actor.dhPC)};
            }else if(a.data.type==="npc"){
                updateData={data:mergeObject(a.data,game.system.model.Actor.npc,true,true,false,true,false,false)};
               // updateData={data:diffObject(a.data,game.system.model.Actor.npc)};
            }
            if ( !isObjectEmpty(updateData) ) {
                console.log(`Migrating Actor entity ${a.name}`);
                await a.update(updateData, {diff:false});
            }
        } catch(err) {
            console.error(err);
        }
    }
}
upd();