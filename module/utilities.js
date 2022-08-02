export const preloadHandlebarsTemplates = async function() {

    // Define template paths to load
    const templatePaths = [

        // Actor Sheet Partials
        "systems/fortyk/templates/actor/actor-main.html",
        "systems/fortyk/templates/actor/actorDH-main.html",
        "systems/fortyk/templates/actor/actorDH-gear.html",
        "systems/fortyk/templates/actor/actorOW-main.html",
        "systems/fortyk/templates/actor/actor-skills.html",
        "systems/fortyk/templates/actor/actor-tnt.html",
        "systems/fortyk/templates/actor/actor-exp.html",
        "systems/fortyk/templates/actor/actor-combat.html",
        "systems/fortyk/templates/actor/actor-gear.html",
        "systems/fortyk/templates/actor/actor-corruption.html",
        "systems/fortyk/templates/actor/actor-psykana.html",
        "systems/fortyk/templates/actor/actor-background.html",    
        "systems/fortyk/templates/item/item-header.html",
        //spend exp dialog parts
        "systems/fortyk/templates/actor/dialogs/spendExp-dialog-parts/custom.html",
        "systems/fortyk/templates/actor/dialogs/spendExp-dialog-parts/characteristic.html",
        "systems/fortyk/templates/actor/dialogs/spendExp-dialog-parts/skill.html",
        "systems/fortyk/templates/actor/dialogs/spendExp-dialog-parts/talent.html",
        "systems/fortyk/templates/actor/dialogs/spendExp-dialog-parts/newSkill.html",
        "systems/fortyk/templates/actor/dialogs/spendExp-dialog-parts/signature-wargear.html",
        //knight sheet parts
        "systems/fortyk/templates/actor/knightParts/mech-bay.html",
        "systems/fortyk/templates/actor/knightParts/combat.html",
        "systems/fortyk/templates/actor/knightParts/traits.html",
        "systems/fortyk/templates/actor/knightParts/melee-weapon-template.html",
        "systems/fortyk/templates/actor/knightParts/ranged-weapon-template.html"



        // Item Sheet Partials

    ];

    // Load the template parts
    return loadTemplates(templatePaths);
};
export const sleep=function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//returns an actors token object, not the token document. Will search the active canvas for the current token.
export const getActorToken=function(actor){
    if(actor.token!==null){
        return actor.token._object; 
    }
    let tokens=[];
    if(canvas.tokens.children.length>0){
        tokens=canvas.tokens.children[0].children;
    }

    let t=null;
    for(let token of tokens){
        if(token.data.actorId===actor.data._id){
            t=token;
        }
    }
    return t;
}
export const parseHtmlForInline=function(html){
  let inlineStr=$(html).find(`a.inline-roll.inline-result`).text();
    let resultArray=inlineStr.split(' ');
    resultArray.shift();
    let intArray=[];
    for(let i=0;i<resultArray.length;i++){
        intArray.push(parseInt(resultArray[i]));
    }
    return intArray;
}
export const tokenDistance=function(token1,token2){
    let gridRatio=canvas.dimensions.distance/canvas.dimensions.size;
    let token1x=token1.data.x;
    let token1y=token1.data.y;
    let token2x=token2.data.x;
    let token2y=token2.data.y;
    if(token1.data.width>=2){
        if(token2x>token1x){
            token1x+=Math.ceil(token1.data.width/2)*100;
        }
    }
    if(token1.data.height>=2){
        if(token2y>token1y){
            token1y+=Math.ceil(token1.data.height/2)*100;
        }
    }
    if(token2.data.width>=2){
        if(token1x>token2x){
            token2x+=Math.ceil(token2.data.width/2)*100;
        }
    }
    if(token2.data.height>=2){
        if(token1y>token2y){
            token2y+=Math.ceil(token2.data.height/2)*100;
        }
    }
    if(canvas.scene.data.gridType===0){
        let distancePx=Math.sqrt((Math.pow(token1x-token2x),2)+Math.pow((token1y-token2y),2)+Math.pow((token1.data.elevation-token2.data.elevation),2))
        return distancePx*gridRatio
    }
    if(canvas.scene.data.gridType>=1){

        let xDistance=Math.abs(gridRatio*(token1x-token2x));
        let yDistance=Math.abs(gridRatio*(token1y-token2y));
        let zDistance=Math.abs(gridRatio*(token1.data.elevation-token2.data.elevation));
        
        return Math.max(xDistance,yDistance,zDistance); 
    }

}
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
        await pack.getDocument(sk._id).then(skill => skillItem = skill);
        skillCollection.push(skillItem.data);
    }
    return skillCollection;
};
export const objectByString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

export const setNestedKey = (obj, path, value) => {
    if (path.length === 1) {
        obj[path] = value
        return
    }
    return setNestedKey(obj[path[0]], path.slice(1), value)
}
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
export const getVehicleFacing=function(vehicleToken,attackerToken){
    //determine quadrant
    let attackerx=attackerToken.data.x+(attackerToken.data.width/2)*100;//adjust to get middle of token
    let attackery=attackerToken.data.y+(attackerToken.data.height/2)*100;//adjust to get middle of token
    let vehiclex=vehicleToken.data.x+(vehicleToken.data.width/2)*100;//adjust to get middle of token
    let vehicley=vehicleToken.data.y+(vehicleToken.data.height/2)*100;//adjust to get middle of token
   
    let attackAngle=0;
   
    if(vehiclex>=attackerx){
        //is on left of vehicle
        if(vehicley<attackery){
            //is under vehicle
            attackAngle=Math.round(radToDeg(Math.atan((vehiclex-attackerx)/(attackery-vehicley))));
        }else{
            attackAngle=90+Math.round(radToDeg(Math.atan((vehicley-attackery)/(vehiclex-attackerx))));
            //is above vehicle
        }
    }else{
        //is on right of vehicle
        if(vehicley>attackery){
            //is above vehicle
            attackAngle=180+Math.round(radToDeg(Math.atan((attackerx-vehiclex)/(vehicley-attackery))));
        }else{
            //is under vehicle
            attackAngle=270+Math.round(radToDeg(Math.atan((attackery-vehicley)/(attackerx-vehiclex))));
        }
    }
    //adjust for vehicle rotation
    let vehicleRotation=vehicleToken.data.rotation;
    
    attackAngle-=vehicleRotation;
    if(attackAngle<0){
        attackAngle=360+attackAngle;
    }
    let facings=vehicleToken.actor.data.data.facings;
    let facing=null;
    let split={};
    for(const face in facings){
        let f=facings[face];
        //check for split facing  eg starts at 316 and ends at 45
        if(f.end<f.start){
            split=f;
        }
        if(attackAngle>=f.start&&attackAngle<=f.end){
          
            facing=f;
        }
    }
    //if facing is none of the facings it must be in the split facing
    if(facing===null){
        facing=split;
    }
    return facing;
}
export const degToRad=function (degrees) {
  return degrees * (Math.PI / 180);
};

export const radToDeg=function (rad) {
  return rad / (Math.PI / 180);
};
//
//for looping through items to give them flags
/*
console.log("starting item flag update")
    let actors=game.actors;

    let weaponFlags=duplicate(game.fortyk.FORTYK.weaponFlags);
    for(let actor of actors){
        let items=actor.items;
        for(let item of items){
            if(item.type==="rangedWeapon"||item.type==="meleeWeapon"||item.type==="psychicPower"||item.type==="ammunition"){
                let mod=duplicate(item);
                if(mod.flags===undefined){
                    mod=mod.data;
                }   
                let update=false;
                console.log(mod);
                if(mod.flags.specials===undefined){
                    update=true;
                    mod.flags.specials={}
                }
                for (let [key, spec] of Object.entries(weaponFlags)){
                    if(mod.flags.specials[key]===undefined){
                        update=true;
                        mod.flags.specials[key]=spec;
                    }
                } 
                if(update){
                    console.log(await actor.updateEmbeddedDocuments("Item",mod));
                }

            }

        }
    }

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



