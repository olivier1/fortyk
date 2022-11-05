const pack = game.packs.find(p => p.collection === `fortyk.ranged-weapons`);

// Load an external JSON data file which contains data for import
const response = await fetch("systems/fortyk/imports/onlywar-ranged-weapons.json");
const content = await response.json();
console.log(content);
let datas=[];
for(let i=0;i<content.length;i++){
    let imp=content[i];
    let dataModel={};
    dataModel["name"]=imp.name;
    dataModel["type"]="rangedWeapon";
    let data={};
    data.class={"value":imp.class};
    if(isNaN(parseInt(imp.range))){
        console.log(imp.range);
        data.range={"formula":imp.range};
    }else{
        
       data.range={"formula":parseInt(imp.range)}; 
    }
    
    let rof=imp.rof.split("/");
    data.rof={"0":{"value":rof[0]},"1":{"value":rof[1]},"2":{"value":rof[2]}};
    data.damageFormula={"formula":imp.dmg};
    data.pen={"formula":imp.pen};
    data.damageType={"value":imp.type};
    data.clip={"value":imp.clip,"max":imp.clip,"formula":imp.clip};
    data.reload={"value":imp.rld};
    let flags={"fortyk":{}};
    let impFlags=imp.special.split(",");
    for(let y=0; y<impFlags.length;y++){
        let flag=impFlags[y];
        flag=flag.replaceAll(" ","");
        flag=flag.toLowerCase();
        if(flag.indexOf("(")!==-1){
            var regExp = /\(([^)]+)\)/;
            var matches = regExp.exec(flag);

            //matches[1] contains the value between the parentheses
           
            flag=flag.substr(0,flag.indexOf("("));
            flags.fortyk[flag]=parseInt(matches[1]);
        }else{
            flags.fortyk[flag]=true;
        }
    }
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
    dataModel.flags=flags;
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
 