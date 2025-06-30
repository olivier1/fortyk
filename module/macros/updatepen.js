let compendium=game.packs.get("fortyk.wargear-beta");
let wargears=await compendium.getDocuments();
for(const wargear of wargears){
    if(wargear.type.toLowerCase()==="mod"){
        
        
        await wargear.update({"system.isOneUse":true});
    }
}
let compendium=game.packs.get("fortyk.fortyk-actors");
let actors=game.actors;
for(const actor of actors){
    if(actor.type.toLowerCase()==="npc"){
        if(!actor.prototypeToken.actorLink){
            await actor.update({"prototypeToken.appendNumber":true});
        }
        
        
    }
}
