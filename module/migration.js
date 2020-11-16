
let upd=async ()=>{
    for ( let a of game.actors.entities ) {
        console.log(a);
        let weps=[]
        for (let i of a.items){
            if(i.data.type==="rangedWeapon")
            try {
                

              let updateData={};
               
                console.log(i);

                console.log(`Migrating Item entity ${i.name}`);
              await a.updateEmbeddedEntity("OwnedItem",updateData);
                //weps.push(i);

            } catch(err) {
                console.error(err);
            } 
        }
        //console.log(await a.updateEmbeddedEntity("OwnedItem",weps));
    }
}



upd();
//const model = game.system.model.Actor[actorData.type];
// actorData.data = filterObject(actorData.data, model);