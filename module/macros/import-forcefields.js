const pack = game.packs.find(p => p.collection === `fortyk.forcefields`);

// Load an external JSON data file which contains data for import
const response = await fetch("systems/fortyk/imports/forcefields.json");
const content = await response.json();
let datas=[];
for(let i=0;i<content.length;i++){
    let imp=content[i];
    let dataModel={};
    dataModel["name"]=imp.Item;
    dataModel["type"]="forceField";
    let data={};
    data.rating={"value":imp.Rating};
    data.weight={"value":parseFloat(imp.Weight)};
    let impRarity=imp.Rarity;

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
    if(imp.Description){
        data.description={"value":imp.Description}
    }
    dataModel.system=data;
    datas.push(dataModel);

}

// Create temporary Item entities which impose structure on the imported data
const items = await Item.create(datas, {temporary: true});

// Save each temporary Actor into the Compendium pack
for ( let i of items ) {
    await pack.importDocument(i);
    console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
}
