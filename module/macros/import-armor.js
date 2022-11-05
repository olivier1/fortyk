const pack = game.packs.find(p => p.collection === `fortyk.armor`);

// Load an external JSON data file which contains data for import
const response = await fetch("systems/fortyk/imports/armor.json");
const content = await response.json();
console.log(content);
let datas=[];
for(let i=0;i<content.length;i++){
    let imp=content[i];
    let dataModel={};
    dataModel["name"]=imp.Item;
    dataModel["type"]="armor";
    let data={};
    data.weight={"value":parseFloat(imp.Weight)};
    data.maxAgi={"value":imp.maxAg};
    let locations=imp.Locations.toLowerCase();
    let ap=imp.AP;
    let dataAp={};
    if(locations==="all"){
        dataAp.head={"value":ap}; 
        dataAp.body={"value":ap}; 
        dataAp.lArm={"value":ap}; 
        dataAp.rArm={"value":ap}; 
        dataAp.lLeg={"value":ap}; 
        dataAp.rLeg={"value":ap}; 
    }else{
        if(locations.indexOf("head")!==-1){
            dataAp.head={"value":ap}; 
        }
        if(locations.indexOf("body")!==-1){
            dataAp.body={"value":ap}; 
        }
        if(locations.indexOf("arms")!==-1){
            dataAp.lArm={"value":ap}; 
            dataAp.rArm={"value":ap}; 
        }
        if(locations.indexOf("legs")!==-1){
            dataAp.lLeg={"value":ap}; 
            dataAp.rLeg={"value":ap}; 
        }
    }
    data.ap=dataAp;
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
console.log(datas);

// Create temporary Item entities which impose structure on the imported data
const items = await Item.create(datas, {temporary: true});
console.log(items);

// Save each temporary Actor into the Compendium pack
for ( let i of items ) {
    await pack.importDocument(i);
    console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
}
