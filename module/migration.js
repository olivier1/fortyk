
let upd=async ()=>{
    for ( let a of game.actors.entities ) {
        console.log(a);
        try {
            let updateData = null;
            if(a.data.type==="dwPC"){
                updateData={data:game.system.model.Actor.dwPC};
            }else if(a.data.type==="dhPC"){
                updateData={data:game.system.model.Actor.dhPC};
            }else if(a.data.type==="npc"){
                updateData={data:game.system.model.Actor.npc};
            }
            if ( !isObjectEmpty(updateData) ) {
                console.log(`Migrating Actor entity ${a.name}`);
                await a.update(updateData, {insertKeys:true,inserValues:false,recursive:true,overwrite:false,enforceTypes: false});
            }
        } catch(err) {
            console.error(err);
        }
    }
}
upd();