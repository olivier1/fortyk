const pack = game.packs.find(p => p.collection === `fortyk.ranged-weapons`);

let items=pack.index;
let ids=[]
// Save each temporary Actor into the Compendium pack
items.forEach(async (value, key)=>{
    ids.push(key);
});
Item.deleteDocuments(ids,{pack:"fortyk.ranged-weapons"});