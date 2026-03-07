const pack = game.packs.find(p => p.collection === `fortyk.ship-components`);

// Load an external JSON data file which contains data for import
const response = await fetch("systems/fortyk/imports/Spaceship-Weapons.json");
const content = await response.json();
console.log(content);
let datas=[];
for (const [key, value] of Object.entries(content)) {

 let dataModel={};
 dataModel["name"]=key;
 dataModel["type"]="spaceshipWeapon";
 let data={};
 data["power.value"]=value.Power;
 data["space.value"]=value.Space;
 data["type.value"]=value.Type;
 data["description.value"]=value.Note;
 data["type.value"]=value.Type;
 data["range.value"]=value.Range;
 data["strength.value"]=value.Strength;


 dataModel.system=data;
 datas.push(dataModel);

}
console.log(datas);

// Create temporary Item entities which impose structure on the imported data
const items = await Item.create(datas, {temporary: true});
console.log(items);

// Save each temporary Actor into the Compendium pack
for ( let i of items ) {
 await pack.importDocument(i);
 console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
}
