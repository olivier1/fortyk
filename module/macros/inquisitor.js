const tableGender = game.tables.find(t => t.name === "Inquisitor-Gender");
await tableGender.draw();

const tableAge = game.tables.find(t => t.name === "Inquisitor-Age");
await tableAge.draw();
const tableOrdo = game.tables.find(t => t.name === "Inquisitor-Ordo");
let ordo=await tableOrdo.draw();

let titleRoll=new Roll("1d3");
await titleRoll.evaluate();
await titleRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: "Rolling for number of titles."
});
let titles=titleRoll._total
const tableTitle = game.tables.find(t => t.name === "Inquisitor-Title");
await tableTitle.drawMany(titles);

const tablePhilo = game.tables.find(t => t.name === "Inquisitor-Philosophy");
await tablePhilo.draw();

let methoRoll=new Roll("1d3");
await methoRoll.evaluate();
await methoRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: "Rolling for number of Methodologies."
});
let methos=methoRoll._total
const tableMetho = game.tables.find(t => t.name === "Inquisitor-Methodology");
await tableMetho.drawMany(methos);


let ordoText=ordo.results[0].text
let psyMod=0;
if(ordoText.includes("Malleus")){
    psyMod=20;
}
const tablePsy = game.tables.find(t => t.name === "Inquisitor-Psychic-Ability");
await tablePsy.draw({roll:new Roll(`1d100+${psyMod}`)});

let quirkRoll=new Roll("1d3");
await quirkRoll.evaluate();
await quirkRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: "Rolling for number of quirks."
});
let quirks=quirkRoll._total
const tableQuirk = game.tables.find(t => t.name === "Inquisitor-Quirks");
await tableQuirk.drawMany(quirks);

let resourceRoll=new Roll("1d6");
await resourceRoll.evaluate();
await resourceRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: "Rolling for number of resources."
});
let resources=resourceRoll._total
const tableResource = game.tables.find(t => t.name === "Inquisitor-Resources");
await tableResource.drawMany(resources);