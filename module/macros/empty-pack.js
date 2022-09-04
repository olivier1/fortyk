 const pack = game.packs.find(p => p.collection === `fortyk.skills`);

    let items=pack.index;

    // Save each temporary Actor into the Compendium pack
    items.forEach(async (value, key)=>{
        await pack.delete(key);
    });