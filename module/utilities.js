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
        "systems/fortyk/templates/actor/dialogs/spendExp-dialog-parts/psy-rating.html",
        "systems/fortyk/templates/actor/dialogs/spendExp-dialog-parts/psychic-power.html",
        //knight sheet parts
        "systems/fortyk/templates/actor/knightParts/mech-bay.html",
        "systems/fortyk/templates/actor/knightParts/combat.html",
        "systems/fortyk/templates/actor/knightParts/traits.html",
        "systems/fortyk/templates/actor/knightParts/damage-report.html"



        // Item Sheet Partials

    ];

    // Load the template parts
    return loadTemplates(templatePaths);
    
};
export const preLoadHandlebarsPartials= async function() {
    Handlebars.registerPartial('rangedWeapon', `<div class="weapons grid grid-2col">
                <div class="weapon-name">
                    {{#if flags.fortyk.alternateprofiles}}

                    <select class="profile-select" data-id="{{this.id}}">
                        {{selectOptions flags.fortyk.instancedProfiles selected=flags.fortyk.currentprofile valueAttr="uuid" labelAttr="name"}}
                    </select>
                    {{else}}

                    <span>{{this.name}}</span>

                    {{/if}}
                </div>

                <div class="list-item">
                    <span>Attack: </span> 
                    {{#if (greaterThan this.system.clip.value 0)}}
                    {{#if this.flags.fortyk.spray}}
                    <span class="spray-attack rollable button" data-roll-type="sprayAttack" data-item-id="{{this.id}}" data-label="Spray Attack" >Spray</span>
                    {{else}}

                    <span class="ranged-attack rollable button" data-roll-type="rangedAttack" data-target="{{bs}}" data-item-id="{{id}}" data-label="Ranged Attack" data-char="bs">Roll</span>

                    {{/if}}
                    {{else}}
                    <span class="weapon-reload button" data-weapon="{{this.id}}" >Reload</span>
                    {{/if}}
                </div>
                <div class="list-item">
                    <span>Damage: </span> 
                    <a class="damage-roll button" data-label="{{this.name}}" data-formula="{{this.system.damageFormula.value}}" data-weapon="{{this.id}}"> {{this.system.damageFormula.value}}</a>

                </div>
                {{#if this.flags.fortyk.force}}
                <div class="list-item">

                    <a class="force-roll button" data-label="Force"> Force</a>


                </div>
                {{/if}}
                {{#if this.flags.fortyk.maximal}}
                <div class="list-item">
                    <span>Maximal: <input type="checkbox" class="maximal" data-item-id="{{this.id}}"  {{checked this.flags.fortyk.maximalMode}}></span>


                </div>
                {{/if}}
                {{#if this.flags.fortyk.lasModal}}
                <div class="list-item">
                    <span>Las Fire Mode: 
                        <select class="lasMode"  data-item-id="{{this.id}}" data-dtype="Number">
                            {{selectOptions this.FORTYK.lasModes selected=this.flags.fortyk.lasMode valueAttr="key" labelAttr="label"}}
                        </select>
                    </span>


                </div>
                {{/if}}

                {{#unless (contains this.system.class.value "thrown")}}
                <div class="list-item ammo-list">

                    <label>Current Ammo:</label>
                    <select class="weapon-ammo" data-weapon="{{this.id}}" data-previous="{{this.system.ammo._id}}">

                       
                        <option value="">None</option>
                        {{selectOptions this.validAmmos selected=this.system.ammo._id valueAttr="_id" labelAttr="label"}}
                        

                    </select>
                </div>
                {{else}}
                <div class="list-item">
                    <span>Amount: {{this.system.amount.value}}</span> 


                </div>
                {{/unless}}
                <div class="list-item flexrow">
                    <span>Current Clip: </span>

                    <input class="item-text-input" type="text" data-target="system.clip.value"  value="{{this.system.clip.value}}" data-item-id="{{this.id}}" data-dtype="Number">
                    <span> / </span>
                    <span>{{this.system.clip.max}}</span>


                </div>
                <div class="list-item">
                    <span>Range: {{this.system.range.value}}m</span>
                </div>
                <div class="list-item">
                    <span>Penetration: {{this.system.pen.value}}</span>

                </div>
                <div class="list-item">
                    <label>Rate of Fire: {{this.system.rof.[0].value}}/{{this.system.rof.[1].value}}/{{this.system.rof.[2].value}}</label>
                </div>
                <div class="list-item">
                    <span>Reload: {{this.system.reload.value}}</span>

                </div>
                <div class="list-item">
                    <span>Special: 

                        {{#each this.flags.fortyk as |flag key|}}


                        {{#if (checkSpecial this)}}

                        {{#with (lookup ../FORTYK.weaponFlags [key])~}}
                        <a class="item-descr" data-name="{{label}}" data-item-descr="{{description}}" >

                            {{label}}{{/with}}{{#if (isnumber this)}}({{this}}){{/if}}</a>
                        {{/if}}{{/each}}
                    </span>

                </div>
                <div class="list-item">
                    <span>Damage Type: {{this.system.damageType.value}}</span>

                </div>
                <div class="list-item">
                    <span>Weapon Class: {{this.system.class.value}}</span>


                </div>
                <div class="list-item">
                    <span>Weapon Type: {{this.system.type.value}}</span>


                </div>

            </div>`);
    Handlebars.registerPartial('meleeWeapon',`<div class="weapons grid grid-2col">

                <div class="weapon-name">
                    {{#if flags.fortyk.alternateprofiles}}

                    <select class="profile-select" data-id="{{this.id}}">
                        {{selectOptions flags.fortyk.instancedProfiles selected=flags.fortyk.currentprofile valueAttr="uuid" labelAttr="name"}}
                    </select>
                    {{else}}

                    <span>{{this.name}}</span>

                    {{/if}}
                </div>


                <div class="list-item">
                    <span>Attack: </span> 
                    <span class="melee-attack rollable button" data-roll-type="meleeAttack" data-target="{{ws}}" data-item-id="{{this.id}}" data-label="Melee Attack" data-char="ws">Roll</span>
                </div>
                <div class="list-item">
                    <span>Damage: </span>
                    <a class="damage-roll button" data-label="{{this.name}}"data-formula="{{this.system.damageFormula.value}}" data-weapon="{{this.id}}"> {{this.system.damageFormula.value}}</a>
                </div>
                {{#if this.flags.fortyk.force}}
                <div class="list-item">

                    <a class="force-roll button" data-label="Force"> Force</a>


                </div>
                {{/if}}
                <div class="list-item">
                    <span>Reach: {{this.system.range.value}}m</span>
                </div>
                <div class="list-item">
                    <span>Penetration: {{this.system.pen.value}}</span>

                </div>
                <div class="list-item">
                    <span>Special: 

                        {{#each this.flags.fortyk as |flag key|}}

                        {{#if (checkSpecial this)}}

                        {{#with (lookup ../FORTYK.weaponFlags [key])~}}
                        <a class="item-descr" data-name="{{label}}" data-item-descr="{{description}}" >

                            {{label}}{{/with}}{{#if (isnumber this)}}({{this}}){{/if}}</a>
                        {{/if}}{{/each}}
                    </span>

                </div>
                <div class="list-item">
                    <span>Damage Type: {{this.system.damageType.value}}</span>

                </div>
                <div class="list-item">
                    <span>Weapon Class: {{this.system.class.value}}</span>


                </div>
                <div class="list-item">
                    <span>Weapon Type: {{this.system.type.value}}</span>
                </div>

            </div>`);
    return;
};
export const sleep=function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};
//returns an actors token object, not the token document. Will search the active canvas for the current token.
export const getActorToken=function(actor){

    if(actor.token){
        return actor.token._object; 
    }
    let tokens=[];
    if(canvas.tokens.children.length>0){
        tokens=canvas.tokens.children[0].children;
    }

    let t=null;
    for(let token of tokens){
        if(token.actor&&token.actor.id===actor.id){
            t=token;
        }
    }
    return t;
};
export const parseHtmlForInline=function(html){


    let inlineStr=$(html).find(`a.inline-roll.inline-result`);

    let strArray=[];
    for(let i=0;i<inlineStr.length;i++){
        strArray.push(inlineStr[i].text);
    }


    let intArray=[];
    for(let i=0;i<strArray.length;i++){
        intArray.push(parseInt(strArray[i]));
    }
    return intArray;
};
export const tokenDistance=function(token1,token2){
    
    let gridRatio=(canvas.dimensions.distance/canvas.dimensions.size);
    let token1x=token1.x;
    let token1y=token1.y;
    let token2x=token2.x;
    let token2y=token2.y;
    console.log(token1);
    if(token1.w*100>=200){
        if(token2x>token1x){
            token1x+=Math.ceil(token1.w/2);
        }
    }
    if(token1.h*100>=200){
        if(token2y>token1y){
            token1y+=Math.ceil(token1.h/2);
        }
    }
    if(token2.w*100>=200){
        if(token1x>token2x){
            token2x+=Math.ceil(token2.w/2);
        }
    }
    if(token2.h*100>=200){
        if(token1y>token2y){
            token2y+=Math.ceil(token2.h/2);
        }
    }

    if(canvas.scene.grid.type===0){

        let distancePx=Math.sqrt(Math.pow(gridRatio*(token1x-token2x),2)+Math.pow(gridRatio*(token1y-token2y),2)+Math.pow((token1.document.elevation-token2.document.elevation),2));
        console.log(distancePx);
        return distancePx;
    }
    if(canvas.scene.grid.type>=1){
        //convert from pixels to map units
        let xDistance=Math.abs(gridRatio*(token1x-token2x));
        let yDistance=Math.abs(gridRatio*(token1y-token2y));
        //Z DISTANCE IS NOT IN PIXELS
        let zDistance=Math.abs((token1.document.elevation-token2.document.elevation));

        return Math.max(xDistance,yDistance,zDistance); 
    }

};
export const smallestDistance= function(token, points){
    let distances=[];
    console.log(points);
    let pairs={};
    for(let i=0;i<points.length;i++){
        let point=points[i];
        if(point){
            let distance=Math.sqrt(Math.pow((point.x-token.x),2)+Math.pow((point.y-token.y),2));
            distances.push(distance);
            pairs[distance]=point;
        }
        console.log(point);

    }
    console.log(distances);
    if(distances.length>0){
        let min=Math.min(...distances);
        return pairs[min];
        
    }else{return null;}

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
        let skillItem;
        await pack.getDocument(sk._id).then(skill => skillItem = skill);
        skillCollection.push(skillItem);
    }
    let sorted=skillCollection.sort(function compare(a, b) {
        let valueA=a.name;
        let valueB=b.name;
        if (valueA>valueB) {
            return 1;
        }
        if (valueA<valueB) {
            return -1;
        }
        // a must be equal to b
        return 0;
    });
    return sorted;
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
};

export const setNestedKey = (obj, path, value) => {
    if (path.length === 1) {
        obj[path] = value;
        return;
    }
    return setNestedKey(obj[path[0]], path.slice(1), value)
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
};
export const isEmpty=function (obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
};
export const getVehicleFacing=function(vehicleToken,attackerToken){



    let attackAngle=getAttackAngle(vehicleToken,attackerToken);


    //adjust for vehicle rotation
    let vehicleRotation=vehicleToken.rotation;
    attackAngle-=vehicleRotation;
    if(attackAngle<0){
        attackAngle=360+attackAngle;
    }
    let facings=vehicleToken.actor.system.facings;
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
/*returns the angle of the line between two tokens with 0 being direct south
@targetToken: the targetted token
@attackerToken: the token initiating the attack
*/
export const getAttackAngle=function (targetToken,attackerToken){
    let attackerx=attackerToken.x+(attackerToken.w/2);//adjust to get middle of token
    let attackery=attackerToken.y+(attackerToken.h/2);//adjust to get middle of token
    let targetx=targetToken.x+(targetToken.w/2);//adjust to get middle of token
    let targety=targetToken.y+(targetToken.h/2);//adjust to get middle of token
    let attackAngle=0;
    if(targetx>=attackerx){
        //is on left of target
        if(targety<attackery){
            //is under target
            attackAngle=Math.round(radToDeg(Math.atan((targetx-attackerx)/(attackery-targety))));
        }else{
            attackAngle=90+Math.round(radToDeg(Math.atan((targety-attackery)/(targetx-attackerx))));
            //is above target
        }
    }else{
        //is on right of target
        if(targety>attackery){
            //is above target
            attackAngle=180+Math.round(radToDeg(Math.atan((attackerx-targetx)/(targety-attackery))));
        }else{
            //is under target
            attackAngle=270+Math.round(radToDeg(Math.atan((attackery-targety)/(attackerx-targetx))));
        }
    }
    return attackAngle;
}
const getKnockbackAngle=function(attackToken, targetToken){
    let attackMid=attackToken;
    let targetMid=targetToken.center;
    let angle=0;
    if(targetMid.x<=attackMid.x){
        //target is left
        if(targetMid.y>attackMid.y){
            console.log("bot left")
            //target is below
            angle=Math.atan((attackMid.x-targetMid.x)/(attackMid.y-targetMid.y));
        }else{
            console.log("top left")
            angle=Math.PI+Math.atan((attackMid.x-targetMid.x)/(attackMid.y-targetMid.y));
            //target is above
        }
    }else{
        //target is right
        if(targetMid.y>attackMid.y){
            console.log("bot right")
            //target is below
            angle=Math.atan((attackMid.x-targetMid.x)/(attackMid.y-targetMid.y));
        }else{
            console.log("top right")
            //targte is above
            angle=Math.PI+Math.atan((attackMid.x-targetMid.x)/(attackMid.y-targetMid.y));
        }
    }
    return angle;
}
export const knockbackPoint=function (knockbackPoint, token2, knockbackDistance,random=false){
    let angle
    let x=token2.x;
    let y=token2.y;
    if(token2.center.x===knockbackPoint.x&&token2.center.y===knockbackPoint.y){
        random=true;
    }
    if(random){
        angle=degToRad(Math.random()*(360));
    }else{
        angle=getKnockbackAngle(knockbackPoint,token2);
    }

    
    console.log(x,y,knockbackDistance,angle)
    x+=knockbackDistance*Math.sin(angle);
    y+=knockbackDistance*Math.cos(angle);
    console.log(x,y)
    return{x:Math.ceil(x),y:Math.ceil(y)}
}
export const collisionPoint= function(token, destination){
    let origin={x:token.x,y:token.y};
    let walls=game.canvas.walls.objects.children;
    let intersections=[];
    for(let i=0;i<walls.length;i++){
        let wall=walls[i];
        if(wall.document.move){
            let workingOr=foundry.utils.duplicate(origin);
            let workingDest=foundry.utils.duplicate(destination);
            //test all 4 corners of the token for collision, adjust the collision point after for top left corner of token
            //top left corner
            intersections.push(lineSegmentIntersection(origin,destination,wall.A,wall.B));
            //top right
            workingOr.x+=token.width;
            workingDest.x+=token.width;
            let topright=lineSegmentIntersection(workingOr,workingDest,wall.A,wall.B)
            if(topright){
                topright.x-=token.width;
                intersections.push(topright)
            }
            //botleft
            workingOr=foundry.utils.duplicate(origin);
            workingDest=foundry.utils.duplicate(destination);
            workingOr.y+=token.height;
            workingDest.y+=token.height;
            let botleft=lineSegmentIntersection(workingOr,workingDest,wall.A,wall.B);
            if(botleft){
                botleft.y-=token.height;
                intersections.push(botleft);
            }
            //botright
            workingOr=foundry.utils.duplicate(origin);
            workingDest=foundry.utils.duplicate(destination);
            workingOr.y+=token.height;
            workingDest.y+=token.height;
            workingOr.x+=token.width;
            workingDest.x+=token.width;
            let botright=lineSegmentIntersection(workingOr,workingDest,wall.A,wall.B);
            if(botright){
                botright.y-=token.height;
                botright.x-=token.width;
                intersections.push(botright);
            }
        }
    }
    return intersections;
}
//
//for looping through items to give them flags
/*
console.log("starting item flag update")
    let actors=game.actors;

    let weaponFlags=foundry.utils.duplicate(game.fortyk.FORTYK.weaponFlags);
    for(let actor of actors){
        let items=actor.items;
        for(let item of items){
            if(item.type==="rangedWeapon"||item.type==="meleeWeapon"||item.type==="psychicPower"||item.type==="ammunition"){
                let mod=foundry.utils.duplicate(item);
                if(mod.flags===undefined){
                    mod=mod;
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
    // Create temporary Item entities which impose structure on the imported data
    const items = await Item.create(content, {temporary: true});
    console.log(items);

    // Save each temporary Actor into the Compendium pack
    for ( let i of items ) {
        await pack.importEntity(i);
        console.log(`Imported Item ${i.name} into Compendium pack ${pack.collection}`);
    }
    */ 



