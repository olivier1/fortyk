const pack = game.packs.find(p => p.collection === `world.knight-components`);

// Load an external JSON data file which contains data for import
const response = await fetch("systems/fortyk/imports/imperial-knight-components.json");
const content = await response.json();
console.log(content);
let datas=[];
for(let i=0;i<content.length;i++){
    let imp=content[i];
    let dataModel={};
    dataModel["name"]=imp.name;
    dataModel["type"]="knightComponent";
    let data={};
    let type=imp.type;
    switch (type){
        case "Weapon attachment":
            type="other";
            break;
        case "Sensor":
            type="sensor";
            break;
        case "Arm actuator":
            type="arm-actuator";
            break;
        case "Leg actuator":
            type="leg-actuator";
            break;
        case "Plating":
            type="plating";
            break;
        case "Core modification":
            type="core-mod";
            break;
        case "Throne Mechanicum modification":
            type="throne-mod";
            break;
        case "Other":
            type="other";
            break;
    }
    data.type={"value":type}
    data.space={"value":imp.space};
    data.weight={"value":parseFloat(imp.tonnage)};
    let impRarity=imp.rarity;

    switch (impRarity.toLowerCase()){
        case "ubiquitous":
            data.rarity={value:100};
            break;
        case "abundant":
            data.rarity={value:30};
            break;
        case "plentiful":
            data.rarity={value:320};
            break;
        case "common":
            data.rarity={value:10};
            break;
        case "average":
            data.rarity={value:0};
            break;
        case "scarce":
            data.rarity={value:-10};
            break;
        case "rare":
            data.rarity={value:-20};
            break;
        case "very rare":
            data.rarity={value:-30};
            break;
        case "extremely rare":
            data.rarity={value:-40};
            break;
        case "near unique":
            data.rarity={value:-50};
            break;
        case "unique":
            data.rarity={value:-60};
            break;

    }
    if(imp.description){
        data.description={"value":imp.description}
    }
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
