let pack1=await game.packs.get("fortyk.talent-core-dh2");
let pack2=await game.packs.get("fortyk.talents-enemies-within");
let pack3=await game.packs.get("fortyk.talents-enemies-without");
let pack4=await game.packs.get("fortyk.talents-enemies-beyond");
let pack5=await game.packs.get("fortyk.talents-ow-core");
let pack6=await game.packs.get("fortyk.talents-hammer-of-the-emperor");
let pack7=await game.packs.get("fortyk.talents-shield-of-humanity");
let pack8=await game.packs.get("fortyk.custom-talents");
let pack9=await game.packs.get("fortyk.elite-advances");
let pack10=await game.packs.get("fortyk.psychic-powers");

let items=await pack1.getDocuments();
items=items.concat(await pack2.getDocuments(), await pack3.getDocuments(), await pack4.getDocuments(), await pack5.getDocuments(), await pack6.getDocuments(), await pack7.getDocuments(), await pack8.getDocuments(), await pack9.getDocuments(), await pack10.getDocuments());

for(const item of items){
    let reqString;
    if(item.type==="psychicPower"){
        reqString=item.system.reqs.value;
    }else if(item.type==="eliteAdvance"){
        reqString=item.system.requirements;
    }else if(item.type==="talentntrait"){
        reqString=item.system.prereqs.value;
    }
    reqString=reqString.trim();
    if(reqString===""||reqString.toLowerCase()==="none"||reqString.toLowerCase()==="n/a"){
        console.log(`${item.name} has no prerequirements!`);
        continue;
    }else{
        console.log(`${item.name} requires: ${reqString}`);
        console.log(item.getFlag("fortyk","requirements"));
    }
    console.log(`--------------------------------------------------------`)
    
}


let pack1=await game.packs.get("fortyk.talent-core-dh2");
let pack2=await game.packs.get("fortyk.talents-enemies-within");
let pack3=await game.packs.get("fortyk.talents-enemies-without");
let pack4=await game.packs.get("fortyk.talents-enemies-beyond");
let pack5=await game.packs.get("fortyk.talents-ow-core");
let pack6=await game.packs.get("fortyk.talents-hammer-of-the-emperor");
let pack7=await game.packs.get("fortyk.talents-shield-of-humanity");
let pack8=await game.packs.get("fortyk.custom-talents");
let pack9=await game.packs.get("fortyk.elite-advances");
let pack10=await game.packs.get("fortyk.psychic-powers");

let items=await pack1.getDocuments();
items=items.concat(await pack2.getDocuments(), await pack3.getDocuments(), await pack4.getDocuments(), await pack5.getDocuments(), await pack6.getDocuments(), await pack7.getDocuments(), await pack8.getDocuments(), await pack9.getDocuments(), await pack10.getDocuments());

for(const item of items){
    let requirements=item.getFlag("fortyk", "requirements");
    if(requirements){
        requirements.cybernetics={
            number:0,
            limbs:0,
            name:""
        }
        console.log(`Updating ${item.name}...`);
        await item.setFlag("fortyk", "requirements", requirements);
        console.log("Success!");
    }else{
        console.log(`Skipping ${item.name}`)
    }
    console.log(`--------------------------------------------------------`)
    
}