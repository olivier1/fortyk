export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
      "systems/fortyk/templates/actor/actor-main.html",
   "systems/fortyk/templates/actor/actor-skills.html",
    "systems/fortyk/templates/actor/actor-tnt.html",
    "systems/fortyk/templates/actor/actor-exp.html",
    "systems/fortyk/templates/actor/actor-combat.html",
      "systems/fortyk/templates/actor/actor-gear.html",
      "systems/fortyk/templates/actor/actor-corruption.html",
      "systems/fortyk/templates/actor/actor-psykana.html",
      "system/fortyk/templates/item/item-header.html"
      

    // Item Sheet Partials
   
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};
export const getSkills= async function(){
    let skillCollection=[];
    const pack = game.packs.find(p => p.collection == "fortyk.skills");
    let skills = [];
    await pack.getIndex().then(index => skills = index);
    for (let sk of skills)
    {
        let skillItem = undefined;
        await pack.getEntity(sk._id).then(skill => skillItem = skill);
        skillCollection.push(skillItem.data);
    }
    return skillCollection;
};

//import data packs
// Reference a Compendium pack by it's callection ID




/* this is already uploaded should probably put this into a utilities script sheet or something
    const pack = game.packs.find(p => p.collection === `fortyk.skills`);

    // Load an external JSON data file which contains data for import
    const response = await fetch("systems/fortyk/imports/skills.json");
    const content = await response.json();
    console.log(content);
    // Create temporary Actor entities which impose structure on the imported data
    const items = await Item.create(content, {temporary: true});
    console.log(items);

    // Save each temporary Actor into the Compendium pack
    for ( let i of items ) {
        await pack.importEntity(i);
        console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
    }
    */ 



