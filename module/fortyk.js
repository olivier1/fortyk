// Import Modules
import { FortyKActor } from "./actor/actor.js";
import { ActorDialogs } from "./actor/actor-dialogs.js";
import  FortyKDWActorSheet from "./actor/actorDW-sheet.js";
import { FortyKDHActorSheet } from "./actor/actorDH-sheet.js";
import { FortyKOWActorSheet } from "./actor/actorOW-sheet.js";
import { FortyKOWComradeSheet } from "./actor/comradeOW-sheet.js";
import { FortyKOWRegimentSheet } from "./actor/regimentOW-sheet.js";
import { FortyKSpaceshipSheet } from "./actor/spaceship-sheet.js";
import { FortyKVehicleSheet } from "./actor/vehicle-sheet.js";
import { FortyKKnightHouseSheet } from "./actor/knightHouse-sheet.js";
import { FortyKKnightSheet } from "./actor/knight-sheet.js";
import { FortyKItem } from "./item/item.js";
import { FortyKItemSheet } from "./item/item-sheet.js";
import { FortyKActiveEffect } from "./activeEffect/activeEffect.js";
import { FortyKActiveEffectConfig } from "./activeEffect/activeEffectConfig.js";
import { preloadHandlebarsTemplates } from "./utilities.js";
import { parseHtmlForInline } from "./utilities.js";
import { FortykRolls } from "./FortykRolls.js";
import { FortykRollDialogs } from "./FortykRollDialogs.js";
import { FortyKNPCSheet} from "./actor/actor-npc-sheet.js";
import { FORTYK } from "./FortykConfig.js";
import { _getInitiativeFormula } from "./combat.js";
import {FORTYKTABLES} from "./FortykTables.js";
import { registerSystemSettings} from "./settings.js"
import {ActiveEffectDialog} from "./dialog/activeEffect-dialog.js";
import {FortyKCards} from "./card/card.js";
Hooks.once('init', async function() {
    game.fortyk = {
        FortyKActor,
        FortyKItem,
        FortykRolls,
        FORTYK,
        FORTYKTABLES
    };
    //make a map with the indexes of the various status effects
    game.fortyk.FORTYK.StatusEffectsIndex=(function(){
        let statusMap= new Map(); 
        for(let i=0;i<FORTYK.StatusEffects.length;i++){
            statusMap.set(game.fortyk.FORTYK.StatusEffects[i].id,i)
        }
        return statusMap;
    })();
    //make an object that is used to reset status flags on tokens, this wouldnt need to be done if adding active effects to a token would trigger createAtiveEffect
    game.fortyk.FORTYK.StatusFlags=(function(){
        let statusFlags={}; 
        for(let i=0;i<FORTYK.StatusEffects.length;i++){
            statusFlags[FORTYK.StatusEffects[i].id]=false;
        }
        return statusFlags;
    })();
    /**
       * Set an initiative formula for the system
       * @type {String}
       */
    CONFIG.Combat.initiative = {
        formula: "1d10 + @characteristics.agi.bonus + @secChar.initiative.value + (@characteristics.agi.total / 100)",
        decimals: 2
    };
    Combatant.prototype._getInitiativeFormula = _getInitiativeFormula;
    //set custom system status effects
    CONFIG.statusEffects=FORTYK.StatusEffects;
    //set default font
    CONFIG.fontDefinitions["CaslonAntique"]={editor:true,fonts:[]};
    CONFIG.defaultFontFamily="CaslonAntique";
    //preload handlebars templates
    preloadHandlebarsTemplates();
    // Define custom Entity classes
    CONFIG.Actor.documentClass = FortyKActor;
    CONFIG.Item.documentClass = FortyKItem;
    //CONFIG.ActiveEffect.entityClass = FortyKActiveEffect;
    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("fortyk", FortyKDWActorSheet, { label:"Deathwatch Sheet",types:["dwPC"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKDHActorSheet, { label:"Dark Heresy Sheet",types:["dhPC"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKOWActorSheet, { label:"Only War Sheet",types:["owPC"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKOWComradeSheet, { label:"Only War Comrade Sheet",types:["owComrade"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKOWRegimentSheet, { label:"Only War Regiment Sheet",types:["owRegiment"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKSpaceshipSheet, { label:"Spaceship Sheet",types:["spaceship"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKNPCSheet, {label:"NPC Sheet", types: ["npc"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKVehicleSheet, { label:"Vehicle Sheet",types:["vehicle"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKKnightSheet, { label:"Imperial Knight Sheet",types:["vehicle"], makeDefault: false });
    Actors.registerSheet("fortyk", FortyKKnightHouseSheet, { label:"Knight House Sheet",types:["knightHouse"], makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("fortyk", FortyKItemSheet, { makeDefault: true });
    //setup handcards
    CONFIG.Cards.documentClass=FortyKCards;
    //register system settings
    registerSystemSettings();

    // Handlebars helpers
    Handlebars.registerHelper('concat', function() {
        var outStr = '';
        for (var arg in arguments) {
            if (typeof arguments[arg] != 'object') {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });
    Handlebars.registerHelper('toLowerCase', function(str) {
        return str.toLowerCase();
    });
    Handlebars.registerHelper('isdefined', function (value) {
        return value !== undefined;
    });
    Handlebars.registerHelper('isnumber', function (value) {
        return !isNaN(parseInt(value));
    });
    Handlebars.registerHelper('compareString', function (str1, str2="") {
        if(typeof str2!=="string"){
            str2="";
        }
        return str1===str2;
    });
    Handlebars.registerHelper('length', function (array) {
        try{
            if(array.length>0){
                return true;
            }else{
                return false;
            }
        }catch(err){
            return false;
        }
    });
    Handlebars.registerHelper("debug", function(optionalValue) {
        console.log("Current Context");
        console.log("====================");
        console.log(this);
        if (optionalValue) {
            console.log("Value");
            console.log("====================");
            console.log(optionalValue);
        }
    });
    Handlebars.registerHelper("contains", function(str1, str2) {
        if(str1===undefined){return false};
        if(str1===null){return false};
        if(!str1){return false};
        if(str2===""){
            return true;
        }else{
            return str1.toLowerCase().includes(str2.toString().toLowerCase());
        }
    });
    Handlebars.registerHelper("greaterThan", function(num1,num2){

        return num1>num2;
    });
    Handlebars.registerHelper("equals", function(num1,num2){
        return num1==num2;
    });
    Handlebars.registerHelper("checkSpecial",function(spec){
        let bool=false;
        if(typeof spec==='number'){
            bool=true;
        }else{bool=spec}
        return bool;
    });
    Handlebars.registerHelper("unescape",function(text){
        var doc = new DOMParser().parseFromString(text, "text/html");
        return doc.documentElement.textContent;
    });
});
Hooks.once("setup", function() {
});
//HOOKS
Hooks.once('ready', async function() {
    //change dice so nice setting
    game.settings.set("dice-so-nice","enabledSimultaneousRollForMessage",false);
    //search for vehicles with pilots to assign them their stats
    let vehicles=Array.from(game.actors.values()).filter(actor=>actor.type==="vehicle");
    for(let i=0;i<vehicles.length;i++){
        let vehicle=vehicles[i];
        vehicle.preparePilot();
    }
    //SOCKET used to update actors via the damage scripts
    game.socket.on("system.fortyk",async(data) => {
        if(data.type==="cardSplash"){
            var options = {
                width: "auto",
                height: "800"
            };
            let img=data.package.img;
            let title=data.package.title;
            let dlg = new Dialog({
                title: title,
                content: `<img src="${img}"  width="auto" height="700">`,
                buttons: {
                    submit: {
                        label: "OK",
                        callback: null
                    }
                },
                default: "submit",
            }, options);
            dlg.render(true); 
        }
        if(data.type==="renderSheets"){
            let actors=data.package.actors;

            for(let i=0;i<actors.length;i++){
                let actor=await game.actors.get(actors[i]);
                if(actor){
                    let apps=actor.apps;
                    Object.values(apps).forEach(app => {
                        app.render(true);
                    }); 
                }

            }
        }

        if(game.user.isGM){
            let id="";
            let actor=null;
            let token=null;
            let targetIds=null;
            let value=0;
            let targets=null;
            let hits=null;
            switch(data.type){
                case "damageRoll":
                    let user=await game.users.get(data.package.user);
                    let formula=await data.package.formula;
                    actor=await game.actors.get(data.package.actor);
                    let fortykWeapon=actor.getEmbeddedDocument("Item",data.package.fortykWeapon);
                    if(!fortykWeapon.system.isPrepared){
                        fortykWeapon.prepareData();
                    }
                    targetIds=data.package.targets;
                    let lastHit=data.package.lastHit;
                    hits=data.package.hits;
                    let magdamage=data.package.magdmg;
                    let extraPen=data.package.pen;
                    targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));
                    targets=new Set(targets);
                    FortykRolls.damageRoll(formula,actor,fortykWeapon,hits, false, false,magdamage,extraPen, user, lastHit, targets);
                    break;
                case "reportDamage":
                    let targetId=data.package.target;
                    let target=canvas.tokens.get(targetId);

                    let targetActor=target.actor;
                    let damage=data.package.damage;
                    FortykRolls.reportDamage(targetActor,damage);
                    break;
                case "applyActiveEffect":
                    id=data.package.token;
                    token=canvas.tokens.get(id);
                    let aeffect=data.package.effect;
                    await FortykRolls.applyActiveEffect(token,aeffect);
                    break;
                case "updateValue":
                    id=data.package.token;
                    value=data.package.value;
                    console.log(value)
                    let parsedValue=parseFloat(value);
                    if(!isNaN(parsedValue)){
                        value=parsedValue;
                    }
                    let path=data.package.path;
                    token=canvas.tokens.get(id);
                    actor=token.actor;
                    let options={}
                    options[path]=value;
                    await actor.update(options);
                    break;
                case "forcefieldRoll":
                    targetIds=data.package.targets;
                    hits=data.package.hits
                    targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));

                    targets=new Set(targets);
                    for(let tar of targets){
                        let tarActor=tar.actor;
                        let forcefield=tarActor.system.secChar.wornGear.forceField.document;
                        if(forcefield){
                            FortykRolls.fortykForcefieldTest(forcefield,tarActor,hits);
                        }
                    }
                    break;
                case "critEffect":
                    id=data.package.token;
                    token=canvas.tokens.get(id);
                    await FortykRolls.critEffects(token,data.package.num,data.package.hitLoc,data.package.type,data.package.ignoreSON);
                    break;
                case "applyDead":
                    id=data.package.token;
                    token=canvas.tokens.get(id);
                    actor=data.package.actor;
                    let cause=data.package.cause;
                    FortykRolls.applyDead(token,actor,cause);
                    break;
                case "perilsRoll":
                    let ork=data.package.ork;
                    FortykRolls.perilsOfTheWarp(ork);
                    break;

            }
        }
    })
});
//round management effects, when a token's turn starts
Hooks.on("updateCombat", async (combat) => {

    if(game.user.isGM){
        game.user.updateTokenTargets();
        let token=canvas.tokens.get(combat.current.tokenId);
        if(token===undefined){return}
        let actor=token.actor;
        //PAN CAMERA TO ACTIVE TOKEN
        canvas.animatePan({x:token.x,y:token.y});
        const currentWindows = Object.values(ui.windows);

        for (let window of currentWindows) {
            if (window.actor) window.close()
        }
        if(actor.type==="npc"){

            actor.sheet.render(true);

        }
        var dead={};
        for(let activeEffect of actor.effects){

            if(activeEffect.duration.rounds!==null){

                let remaining=Math.ceil(activeEffect.duration.remaining);
                if(remaining<1){remaining=0}
                let content="";
                if(activeEffect.label!=="Evasion"){
                    if(remaining===0){
                        content=`${activeEffect.label} expires.`;
                    }else{
                        content=`${activeEffect.label} has ${remaining} rounds remaining.`;
                    }

                    let activeEffectOptions={user: game.user._id,
                                             speaker:{actor,alias:actor.name},
                                             content:content,
                                             classes:["fortyk"],
                                             flavor:`${activeEffect.label} duration.`,
                                             author:actor.name};
                    await ChatMessage.create(activeEffectOptions,{});
                }
                if(activeEffect.duration.remaining<=0){
                    await activeEffect.delete({});
                }


            }
            //check for flags
            if(activeEffect.flags.core){

                if(activeEffect.flags.core.statusId==="unconscious"){
                    dead=activeEffect;
                }
                //check for fire
                if(activeEffect.flags.core.statusId==="fire"){

                    if(actor.type!=="vehicle"){
                        let onFireOptions={user: game.user._id,
                                           speaker:{actor,alias:actor.name},
                                           content:"On round start, test willpower to act, suffer 1 level of fatigue and take 1d10 damage ignoring armor.",
                                           classes:["fortyk"],
                                           flavor:`On Fire!`,
                                           author:actor.name};
                        await ChatMessage.create(onFireOptions,{});
                        await FortykRolls.fortykTest("wp", "char", actor.system.characteristics.wp.total,actor, "On Fire! Panic");
                        let fatigue=parseInt(actor.system.secChar.fatigue.value)+1;
                        await actor.update({"system.secChar.fatigue.value":fatigue});
                        let fireData={name:"Fire",type:"rangedWeapon"}
                        let fire=await Item.create(fireData, {temporary: true});
                        fire.flags.fortyk={};
                        fire.system.damageType.value="Energy";
                        fire.system.pen.value=99999;
                        await FortykRolls.damageRoll(fire.system.damageFormula,actor,fire,1, true);
                    }else{
                        if(actor.getFlag("fortyk","superheavy")){
                            let heat=parseInt(actor.system.knight.heat.value)+1;
                            await actor.update({"system.knight.heat.value":heat});
                            let onFireOptions={user: game.user._id,
                                               speaker:{actor,alias:actor.name},
                                               content:"On round start, gain 1 heat.",
                                               classes:["fortyk"],
                                               flavor:`On Fire!`,
                                               author:actor.name};
                            await ChatMessage.create(onFireOptions,{});
                        }else{

                            let duration=activeEffect.getFlag("fortyk","vehicleFireExplosionTimer");
                            console.log(duration)
                            if(duration===undefined){
                                duration=0;
                            }
                            let fireForm=`1d10+${duration}`;
                            let fireRoll=new Roll(fireForm,{});
                            await fireRoll.evaluate({async: false});
                            fireRoll.toMessage({flavor:"Testing for explosion"});
                            let result=fireRoll._total; 
                            if(result>=10){
                                let onFireOptions={user: game.user._id,
                                                   speaker:{actor,alias:actor.name},
                                                   content:"The vehicle explodes!",
                                                   classes:["fortyk"],
                                                   flavor:`On Fire!`,
                                                   author:actor.name};
                                await ChatMessage.create(onFireOptions,{}); 
                                let activeEffect=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("dead")])];
                                await FortykRolls.applyActiveEffect(actor,activeEffect);

                            }
                            duration++;
                            console.log(await activeEffect.setFlag("fortyk","vehicleFireExplosionTimer",duration));
                        }
                    }
                }
                //check for bleeding
                if(activeEffect.flags.core.statusId==="bleeding"){
                    let bleed=true;
                    if(actor.getFlag("fortyk","diehard")){
                        let diehrd= await FortykRolls.fortykTest("wp", "char", actor.system.characteristics.wp.total,actor, "Die Hard");
                        if(diehrd.value){
                            bleed=false;
                            let dieHardOptions={user: game.user._id,
                                                speaker:{actor,alias:actor.name},
                                                content:"Resisted bleeding fatigue.",
                                                classes:["fortyk"],
                                                flavor:`Bleeding`,
                                                author:actor.name};
                            await ChatMessage.create(dieHardOptions,{});

                        }
                    }
                    if(bleed){
                        let bleedStack=1;
                        let flavor
                        if(bleedStack===1){
                            flavor=`Blood loss`
                        }else{
                            flavor=`Blood loss`
                        }
                        let bleedingOptions={user: game.user._id,
                                             speaker:{actor,alias:actor.name},
                                             content:`On round start gain ${bleedStack} fatigue.`,
                                             classes:["fortyk"],
                                             flavor:flavor,
                                             author:actor.name};
                        await ChatMessage.create(bleedingOptions,{});
                        let fatigue=parseInt(actor.system.secChar.fatigue.value)+bleedStack;
                        await actor.update({"system.secChar.fatigue.value":fatigue});
                    }
                }
                //check for cryo
                if(activeEffect.flags.core.statusId==="cryogenic"){
                    let cryoContent=`<span>On round start, take [[2d10]]  toughness damage!</span>`;
                    let cryoOptions={user: game.user._id,
                                     speaker:{actor,alias:actor.name},
                                     content:cryoContent,
                                     classes:["fortyk"],
                                     flavor:`Freezing`,
                                     author:actor.name};
                    let cryoMsg=await ChatMessage.create(cryoOptions,{});
                    let inlineResults=parseHtmlForInline(cryoMsg.content);
                    let tDmg=inlineResults[0];
                    let ae=[]
                    ae.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                    ae[0].changes=[{key:`system.characteristics.t.value`,value:-1*tDmg,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                    await FortykRolls.applyActiveEffect(token,ae);
                }
            }
        }
        //check for regeneration
        if(actor.getFlag("fortyk","regeneration")){
            let regenAmt=parseInt(actor.getFlag("fortyk","regeneration"));
            if(actor.system.race.value==="Necron"&&actor.getFlag("core","unconscious")){
                let reanimation= await FortykRolls.fortykTest("t", "char", actor.system.characteristics.t.total,actor, "Reanimation protocol");

                if(reanimation.value){

                    let reanimationOptions={user: game.user._id,
                                            speaker:{actor,alias:actor.name},
                                            content:`${actor.name} rises from the dead!`,
                                            classes:["fortyk"],
                                            flavor:`Reanimation protocol`,
                                            author:actor.name};
                    await ChatMessage.create(reanimationOptions,{});
                    await dead.delete();
                    await actor.update({"system.secChar.wounds.value":regenAmt});

                }else if((!reanimation.value)&&reanimation.dos>=3){
                    let reanimationOptions={user: game.user._id,
                                            speaker:{actor,alias:actor.name},
                                            content:`${actor.name} is recalled away!`,
                                            classes:["fortyk"],
                                            flavor:`Reanimation protocol`,
                                            author:actor.name};
                    await ChatMessage.create(reanimationOptions,{});
                    await dead.delete();
                    let activeEffect=[duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("dead")])];
                    await FortykRolls.applyActiveEffect(actor,activeEffect);
                }
            }else{
                let regen=await FortykRolls.fortykTest("t", "char", actor.system.characteristics.t.total,actor, "Regeneration");
                if(regen.value){
                    let maxWounds=actor.system.secChar.wounds.max;
                    let currWounds=actor.system.secChar.wounds.value;
                    currWounds=Math.min(maxWounds,currWounds+regenAmt);
                    await actor.update({"system.secChar.wounds.value":currWounds});
                }
            }

        }
    }
})
Hooks.on("preDeleteCombat", async (combat,options,id) =>{
    let combatants=combat.combatants;
    combatants.forEach(async (combatant)=>{
        let actor=combatant.actor;
        for(let activeEffect of actor.effects){
            if(activeEffect.label==="Evasion"){
                await activeEffect.delete({});
            }
            if(activeEffect.duration.type!=="none"){
                await activeEffect.delete({});
            }
        }
    })
    for(let index = 0; index < combat.combatants.length; index++){

    }
})
Hooks.on("preUpdateActor", (data, updatedData) =>{
})
//add listeners to the chatlog for dice rolls
Hooks.on('renderChatLog', (log, html, data) => FortykRollDialogs.chatListeners(html));
//add listeners to dialogs to allow searching and the like
Hooks.on('renderDialog', (dialog, html, data) => ActorDialogs.chatListeners(html));
Hooks.on('preCreateItem', (actor, data,options) =>{
});
//set flags on the actor when adding an active effect if it should activate a flag
Hooks.on('createActiveEffect',async (ae,options,id)=>{
    if(game.user.isGM){
        let actor=ae.parent;
        if(ae.flags.core){
            let flag=ae.flags.core.statusId;
            if(flag){
                await actor.setFlag("core",flag,true);
            } 
        }
    }
});
//unset flags on the actor when removing an active effect if it had a flag
Hooks.on('deleteActiveEffect',async (ae,options,id)=>{
    if(game.user.isGM){
        let actor=ae.parent;
        if(ae.flags.core){
            let flag=ae.flags.core.statusId;
            if(flag){
                await actor.setFlag("core",flag,false);
            }
        }
    }
});
/**
     * Add the mane active effects button to actor sheets
     */
Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) =>{
    if(game.user.isGM){
        let button={}
        button.class="custom";
        button.icon="fas fa-asterisk";
        button.label="Manage AEs";
        button.onclick=async ()=>{
            let actor=sheet.actor;
            if(sheet.token){
                actor=sheet.token.actor;
            }

            var options = {
                id:"aeDialog"
            };
            var d=new ActiveEffectDialog({
                title: "Active Effects",
                actor:actor,
                buttons:{
                    button:{
                        label:"Ok",
                        callback: async html => {
                            sheet.actor.dialog=undefined;
                        }
                    },
                },
                close:function(){
                    sheet.actor.dialog=undefined;
                }
            },options).render(true)
            sheet.actor.dialog=d;

        }
        let close=buttons.pop();
        buttons.push(button);
        buttons.push(close);
    }
})
Hooks.on("preCreateActor", (createData) =>{
})
Hooks.on("createToken", async (document, data, options, userId) =>{
    if(game.user.isGM){
        //modify token dimensions if scene ratio isnt 1
        let gridRatio=canvas.dimensions.distance;
        let newHeight=Math.max(0.1,document.height/gridRatio);
        let newWidth=Math.max(0.1,document.width/gridRatio);
        if(newHeight!==document.height||newWidth!==document.width){
            await document.update({"_id":randomID(6),"height":newHeight,"width":newWidth});
        }
    }

});
Hooks.on('preUpdateToken',async (scene,token,changes,diff,id)=>{
    let effects=null;
    let data=null;
    if(changes.actorData!==undefined){
        effects=changes.actorData.effects;
        data=changes.actorData;
    }else{
        effects=changes.effects;
        data=changes;
    }
    if(effects){
        let flags={core:duplicate(game.fortyk.FORTYK.StatusFlags)};
        effects.forEach((effect)=>{
            flags.core[`${effect.flags.core.statusId}`]=true;
        });
        data.flags=flags;
    }
    let fullToken=await canvas.tokens.get(token._id);
    let tokenActor=fullToken.actor;
    try{
        let newFatigue=system.secChar.fatigue.value;
        if(newFatigue>=tokenActor.system.secChar.fatigue.max*2){
            await game.fortyk.FortykRolls.applyDead(fullToken,tokenActor,"fatigue");
        }else if(!tokenActor.getFlag("core","frenzy")&&!tokenActor.getFlag("core","unconscious")&&newFatigue>=tokenActor.system.secChar.fatigue.max){
            let effect=[];
            effect.push(duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")]));
            let chatUnconscious={user: game.user._id,
                                 speaker:{tokenActor,alias:tokenActor.name},
                                 content:`${tokenActor.name} falls unconscious from fatigue!`,
                                 classes:["fortyk"],
                                 flavor:`Fatigue pass out`,
                                 author:tokenActor.name};
            await ChatMessage.create(chatUnconscious,{});
            await game.fortyk.FortykRolls.applyActiveEffect(fullToken,effect);
        }
    }catch(err){}
    // Apply changes in Actor size to Token width/height
    let newSize= 0;
    let wounds=false;
    try{
        wounds=system.secChar.wounds.value;
    }catch(err){
        wounds=false;
    }
    let size=false;
    try{
        size=system.secChar.size.value; 
    }catch(err){
        size=false;
    }
    if(wounds&&(tokenActor.system.horde.value||tokenActor.system.formation.value)||size){
        if(tokenActor.system.horde.value||tokenActor.system.formation.value){
            newSize= system.secChar.wounds.value;
            if(newSize<0){newSize=0}
        }else{
            newSize= system.secChar.size.value;
        }
        if ( (!tokenActor.system.horde.value&&!tokenActor.system.formation.value&&newSize && (newSize !== tokenActor.system.secChar.size.value))||((tokenActor.system.horde.value||tokenActor.system.formation.value)&&newSize!==undefined && (newSize !== tokenActor.system.secChar.wounds.value)) ) {
            let size= 0;
            if(tokenActor.system.horde.value||tokenActor.system.formation.value){
                size= FORTYKTABLES.hordeSizes[newSize];
                //modify token dimensions if scene ratio isnt 1
                let gridRatio=canvas.dimensions.distance;
                size=Math.max(1,size/gridRatio);

            }else{
                size= game.fortyk.FORTYK.size[newSize].size;
            }
            if ( tokenActor.isToken ) tokenActor.token.update({height: size, width: size});
            else if ( !data["token.width"] && !hasProperty(data, "token.width") ) {
                data["token.height"] = size;
                data["token.width"] = size;
            }
        }
    }
});
//drag ruler integration
Hooks.once("dragRuler.ready", (Speedprovider) => {
    class FortykSpeedProvider extends Speedprovider{
        get colors(){
            return[{id:"half",default:0xADD8E6,name:"Half Move"},
                   {id:"full",default:0x191970,name:"Full Move"},
                   {id:"charge",default:0xFFA500,name:"Charge Move"},
                   {id:"run",default:0xFFFF00,name:"Run"}]
        }
        getRanges(token){
            let movement;
            let ranges;
            if(token.actor.type==="spaceship"){
                ranges=[];
            }else if(token.actor.type==="vehicle"){
                movement=token.actor.system.secChar.speed;
                if(token.actor.getFlag("fortyk","enhancedmotivesystem")){
                    ranges=[
                        {range:movement.tactical*2,color:"full"},
                        {range:movement.tactical*3,color:"run"}]
                }else if(token.actor.getFlag("fortyk","ponderous")){
                    ranges=[
                        {range:movement.tactical/2,color:"full"},
                        {range:movement.tactical,color:"run"}]
                }else{
                    ranges=[
                        {range:movement.tactical,color:"full"},
                        {range:movement.tactical*2,color:"run"}]
                }

            }else{
                movement=token.actor.system.secChar.movement;
                ranges=[
                    {range:movement.half,color:"half"},
                    {range:movement.full,color:"full"},
                    {range:movement.charge,color:"charge"},
                    {range:movement.run,color:"run"}]
            }
            return ranges;
        }

    }
    dragRuler.registerSystem("fortyk", FortykSpeedProvider);
})
Hooks.once("enhancedTerrainLayer.ready", (RuleProvider) => {
    class FortykSystemRuleProvider extends RuleProvider {
        calculateCombinedCost(terrain, options) {
            if(terrain.length===0){
                return 1;
            }


            let cost=terrain[0].cost;
            if(!cost){cost=1}
            let token=options.token;
            let actor
            if(token){
                actor=token.actor;
            }

            if(actor&&(actor.getFlag("fortyk","jump")||actor.getFlag("fortyk","crawler")||actor.getFlag("fortyk","hoverer")||actor.getFlag("fortyk","flyer")||actor.getFlag("fortyk","skimmer"))){
                cost=1;
            }
            return cost;
        }
    }
    enhancedTerrainLayer.registerSystem("fortyk", FortykSystemRuleProvider);
});