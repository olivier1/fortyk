
let upd=async ()=>{
    for ( let a of game.actors.entities ) {
        let weps=[]
        for (let i of a.items){
            if(i.type==="rangedWeapon")
            try {
                

              let updateData={};
               

                console.log(`Migrating Item entity ${i.name}`);
              await a.updateEmbeddedDocuments("Item",updateData);
                //weps.push(i);

            } catch(err) {
                console.error(err);
            } 
        }
        //console.log(await a.updateEmbeddedDocuments("Item",weps));
    }
}



upd();
//const model = game.system.model.Actor[actorData.type];
// actor.system = filterObject(actor.system, model);