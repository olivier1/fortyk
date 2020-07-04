export const preloadHandlebarsTemplates = async function() {

    // Define template paths to load
    const templatePaths = [

        // Actor Sheet Partials
        "systems/fortyk/templates/actor/actor-main.html",
        "systems/fortyk/templates/actor/actor-skills.html",
        "systems/fortyk/templates/actor/actor-tnt.html",
        "systems/fortyk/templates/actor/actor-exp.html",
        "systems/fortyk/templates/actor/actor-combat.html",
        "systems/fortyk/templates/actor/actor-gear.html",
        "systems/fortyk/templates/actor/actor-corruption.html",
        "systems/fortyk/templates/actor/actor-psykana.html",
        "systems/fortyk/templates/item/item-header.html"
        


        // Item Sheet Partials

    ];

    // Load the template parts
    return loadTemplates(templatePaths);
};



export const getItem= function(actor, name){
    for(let item of actor.items){
        if(item.name===name){
            return item;
        }
    }
    return null;
};

export const getSkills= async function(){
    let skillCollection=[];
    const pack = game.packs.find(p => p.collection == "fortyk.skills");
    let skills = [];
    await pack.getIndex().then(index => skills = index);
    for (let sk of skills)
    {
        let skillItem = undefined;
        await pack.getEntity(sk._id).then(skill => skillItem = skill);
        skillCollection.push(skillItem.data);
    }
    return skillCollection;
};

export const makeRangeArray=function (upperBounds, values) {
    var rangeArray = new Array(upperBounds[upperBounds.length-1]);

    var idx = 0;
    for (var i=0; i < rangeArray.length; i++) {
        if (i > upperBounds[idx]) {
            idx++;
        }
        rangeArray[i] = values[idx];
    }
    return rangeArray;
}
export const isEmpty=function (obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
//for looping through items to give them flags
/* 
       
       if (itemData.type==="meleeWeapon"||itemData.type==="rangedWeapon"||itemData.type==="psychicPower"){
            
            if(isEmpty(data.flags)){
                let specials=duplicate(FORTYK.itemFlags);
                console.log(specials);
                this.update({"flags.specials":specials});
            }
        }*/

//import data packs
// Reference a Compendium pack by it's callection ID




/* this is already uploaded should probably put this into a utilities script sheet or something
    const pack = game.packs.find(p => p.collection === `fortyk.skills`);

    // Load an external JSON data file which contains data for import
    const response = await fetch("systems/fortyk/imports/skills.json");
    const content = await response.json();
    console.log(content);
    // Create temporary Actor entities which impose structure on the imported data
    const items = await Item.create(content, {temporary: true});
    console.log(items);

    // Save each temporary Actor into the Compendium pack
    for ( let i of items ) {
        await pack.importEntity(i);
        console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
    }
    */ 



