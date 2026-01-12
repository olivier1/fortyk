function stripHtml(html)
{
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}
let actorPack=game.packs.get("fortyk.deathwatch-talents");
let packActors=await actorPack.getDocuments();
packActors.forEach(function(actor){
    let description=actor.system.description.value;
    let strip=stripHtml(description);
    actor.update({"system.description.value":strip});
    console.log(`Updated ${actor.name}`);
});


