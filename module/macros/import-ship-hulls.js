const pack = game.packs.find(p => p.collection === `fortyk.ship-hulls`);

// Load an external JSON data file which contains data for import
const response = await fetch("systems/fortyk/imports/Ships.json");
const content = await response.json();
console.log(content);
let datas=[];
for (const [key, value] of Object.entries(content)) {
    
    let dataModel={};
    dataModel["name"]=key;
    dataModel["type"]="spaceship";
    let data={};
    data["class.value"]=value.Category;
    data["hull.value"]=key;
    data["speed.value"]=value.Speed;
    data["manoeuvrability.value"]=value.Manoeuvrability;
    data["detection.value"]=value.Detection;
    data["hullIntegrity.value"]=value["Hull Integrity"];
    data["hullIntegrity.max"]=value["Hull Integrity"];
    data["space.max"]=value.Space;
    data["weaponCapacity.dorsal"]=value["Dorsal (front, sides)"];
    data["weaponCapacity.prow"]=value["Prow (Front)"];
    data["weaponCapacity.keel"]=value["Keel (all)"];
    data["weaponCapacity.port"]=value["Port (side)"];
    data["weaponCapacity.starboard"]=value["Starboard (side)"];
    data["cargo.max"]=value["Base Cargo Space"];
    data["data.supplies"]=value["Supply Capacity"];
    data["data.suppliesMax"]=value["Supply Capacity"];
    data["cargo.fuel"]=value["Fuel Capacity"];
    data["cargo.fuelMax"]=value["Fuel Capacity"];
    data["cargo.trade"]=value["Trade Capacity"];
    
    dataModel.system=data;
    datas.push(dataModel);
}


// Create temporary Item entities which impose structure on the imported data
const actors = await Actor.create(datas, {temporary: true});

// Save each temporary Actor into the Compendium pack
for ( let i of actors ) {
    await pack.importDocument(i);
    console.log(`Imported Actor${i.name} into Compendium pack ${pack.collection}`);
}
