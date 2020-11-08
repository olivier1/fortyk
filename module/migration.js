
let upd=async ()=>{
    for ( let a of game.actors.entities ) {

        try {
            let updateData = null;


            updateData={data:{data:null,name:null,size:null,_id:null,permission:null,type:null,folder:null,sort:null,flags:null,img:null,token:null,items:null,effects:null,skillFilter:null}};

            console.log(updateData);
            if ( !isObjectEmpty(updateData) ) {
                console.log(`Migrating Actor entity ${a.name}`);
                await a.update(updateData, {overwrite:true});
            }
        } catch(err) {
            console.error(err);
        }
    }
}
upd();
//const model = game.system.model.Actor[actorData.type];
// actorData.data = filterObject(actorData.data, model);