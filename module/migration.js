
let upd=async ()=>{
    for ( let a of game.actors.entities ) {
        for (let i of a.items){
            if(i.data.type==="rangedWeapon")
            try {
                let updateData = null;


                updateData={"flags.specials.lasModal": {
                    value: false,
                    label: "Las Modal",
                    mode:0,
                    description: "The standard las weapon has a variable setting option, allowing it to fire higher-powered bursts. It may be set to overcharge mode, dealing +1 damage, but using two shots worth of ammunition per shot fired. Further, the weapon may be set to overload mode, dealing +2 damage and gaining +2 penetration. In this case, it uses four shots of ammunition per shot fired, loses Reliable, and gains Unreliable."
                }};

                console.log(updateData);

                console.log(`Migrating Item entity ${i.name}`);
                await i.update(updateData);

            } catch(err) {
                console.error(err);
            } 
        }
    }
}



upd();
//const model = game.system.model.Actor[actorData.type];
// actorData.data = filterObject(actorData.data, model);