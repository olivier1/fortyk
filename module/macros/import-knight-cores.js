const pack = game.packs.find(p => p.collection === `world.knight-cores`);

// Load an external JSON data file which contains data for import
const response = await fetch("systems/fortyk/imports/imperial-knight-cores.json");
const content = await response.json();
console.log(content);
let datas=[];
for(let i=0;i<content.length;i++){
    let imp=content[i];
    let dataModel={};
    dataModel["name"]=imp.mark;
    dataModel["type"]="knightCore";
    let data={};
    
    
    data.space={"value":imp.space};
    data.weight={"value":parseFloat(imp.tonnage)};
    data.speed={"value":imp.speed};
    data.heatCap={"value":imp.heatCap};
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
