let compendium=game.packs.get("fortyk.wargear-beta");
let wargears=await compendium.getDocuments();
for(const wargear of wargears){
    if(wargear.type.toLowerCase()==="armor"){
        let pen=wargear.system.ap;
        let newPen=foundry.utils.duplicate(pen);
        newPen.head.value=Math.ceil(2.5*newPen.head.value);
        newPen.body.value=Math.ceil(2.5*newPen.body.value);
        newPen.lArm.value=Math.ceil(2.5*newPen.lArm.value);
        newPen.rArm.value=Math.ceil(2.5*newPen.rArm.value);
        newPen.lLeg.value=Math.ceil(2.5*newPen.lLeg.value);
        newPen.rLeg.value=Math.ceil(2.5*newPen.rLeg.value);
        await wargear.update({"system.ap":newPen});
    }
}