
export async function migrate(sysVer){
    if(!game.user.isGM)return;
    if(foundry.utils.isNewerVersion(sysVer,"3.3.1")){
        
    }else if(foundry.utils.isNewerVersion(sysVer,"3.3")){
        
        if(!game.user.getFlag("fortyk","3-3-xMigration")){
            console.log("Starting system migration for 3.3.x...");
            
            let actors= game.actors;
            console.log(actors)
            for(const actor of actors){
                let updates=[];
                let items=actor.items;
                for(const item of items){
                    if( item.flags){
                        if(!item.flags.fortyk){
                            console.log(`Updating ${item.name} of ${actor.name}.`);
                            updates.push({_id:item.id,"flags.fortyk":{}});
                           
                            console.log(`Success!`);
                        }
                    }else{
                        console.log(`Updating ${item.name} of ${actor.name}.`);
                        updates.push({_id:item.id,"flags.fortyk":{}});
                        console.log(`Success!`);
                    }
                }
                await Item.updateDocuments(updates, {parent: actor});
            }
            console.log(`Update complete.`);
            game.user.setFlag("fortyk","3-3-xMigration", true);
        }
    }
}

