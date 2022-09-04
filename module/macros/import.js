 const pack = game.packs.find(p => p.collection === `fortyk.skills`);

    // Load an external JSON data file which contains data for import
    const response = await fetch("systems/fortyk/imports/skills.json");
    const content = await response.json();
    console.log(content);
    // Create temporary Item entities which impose structure on the imported data
    const items = await Item.create(content, {temporary: true});
    console.log(items);

    // Save each temporary Actor into the Compendium pack
    for ( let i of items ) {
        await pack.importEntity(i);
        console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
    }