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
import { preLoadHandlebarsPartials } from "./utilities.js";
import { parseHtmlForInline } from "./utilities.js";
import { FortykRolls } from "./FortykRolls.js";
import { FortykRollDialogs } from "./FortykRollDialogs.js";
import { FortyKNPCSheet} from "./actor/actor-npc-sheet.js";
import { FORTYK } from "./FortykConfig.js";
import { _getInitiativeFormula } from "./combat.js";
import {FORTYKTABLES} from "./FortykTables.js";
import { registerSystemSettings} from "./settings.js";
import {ActiveEffectDialog} from "./dialog/activeEffect-dialog.js";
import {FortyKCards} from "./card/card.js";
import {FortykTemplate} from "./measuredTemplate/template.js";
import {objectByString} from "./utilities.js";
Hooks.once('init', async function() {
    game.fortyk = {
        FortyKActor,
        FortyKItem,
        FortykRolls,
        FORTYK,
        FORTYKTABLES,
        FortykTemplate
    };
    //make a map with the indexes of the various status effects
    game.fortyk.FORTYK.StatusEffectsIndex=(function(){
        let statusMap= new Map(); 
        for(let i=0;i<FORTYK.StatusEffects.length;i++){
            statusMap.set(game.fortyk.FORTYK.StatusEffects[i].id,i);
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
    CONFIG.MeasuredTemplate.defaults.angle = 30; 
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
    preLoadHandlebarsPartials();
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
    Handlebars.registerHelper("threshold",function(text){
        if(text==="secondthresholddmg"){return true}
        if(text==="thirdthresholddmg"){return true}
        if(text==="fourththresholddmg"){return true}
        if(text==="criticaldmg"){return true}
        return false;
    });
});
Hooks.once("setup", function() {
});
//HOOKS
Hooks.once('ready', async function() {
    //change dice so nice setting
    try{
        //game.settings.set("dice-so-nice","enabledSimultaneousRollForMessage",false);
    }catch(err){

    }
    if(window.EffectCounter){
        CounterTypes.setDefaultType("icons/svg/daze.svg","statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/net.svg","statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/blind.svg","statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/deaf.svg","statuscounter.countdown_round");
        CounterTypes.setDefaultType("systems/fortyk/icons/cryo.png","statuscounter.countdown_round");
        CounterTypes.setDefaultType("systems/fortyk/icons/spiral.png","statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/upgrade.svg","statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/downgrade.svg","statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/target.svg","statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/eye.svg","statuscounter.countdown_round");


    }
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
        let actors
        if(data.type==="prepActors"){
            actors=data.package.actors;
            for(let i=0; i<actors.length; i++){
                let actor=fromUuidSync(actors[i]);
                actor._initialize();
                if(actor){
                    let apps=actor.apps;
                    Object.values(apps).forEach(app => {
                        app.render(true,{focus:false});
                    }); 
                }
            }
        }
        if(data.type==="renderSheets"){
            actors=data.package.actors;

            for(let i=0;i<actors.length;i++){
                let actor=await game.actors.get(actors[i]);
                if(actor){
                    let apps=actor.apps;
                    Object.values(apps).forEach(app => {
                        app.render(true,{focus:false});
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
            let user;
            let formula;
            let fortykWeapon;
            let lastHit;
            let magdamage;
            let extraPen;
            let rerollNum;
            switch(data.type){
                case "damageRoll":
                    user=await game.users.get(data.package.user);
                    formula=await data.package.formula;
                    actor=await game.actors.get(data.package.actor);
                    fortykWeapon=actor.getEmbeddedDocument("Item",data.package.fortykWeapon);
                    if(!fortykWeapon.system.isPrepared){
                        fortykWeapon.prepareData();
                    }
                    targetIds=data.package.targets;
                    lastHit=data.package.lastHit;
                    hits=data.package.hits;
                    magdamage=data.package.magdmg;
                    extraPen=data.package.pen;
                    rerollNum=data.package.rerollNum;
                    targets=game.canvas.tokens.children[0].children.filter(token=>targetIds.includes(token.id));
                    targets=new Set(targets);

                    FortykRolls.damageRoll(formula,actor,fortykWeapon,hits, false, false,magdamage,extraPen,rerollNum, user, lastHit, targets);
                    break;
                case "blastDamageRoll":
                    user=await game.users.get(data.package.user);
                    formula=await data.package.formula;
                    actor=await game.actors.get(data.package.actor);
                    fortykWeapon=actor.getEmbeddedDocument("Item",data.package.fortykWeapon);
                    if(!fortykWeapon.system.isPrepared){
                        fortykWeapon.prepareData();
                    }
                    targetIds=data.package.targets;
                    lastHit=data.package.lastHit;
                    hits=data.package.hits;
                    magdamage=data.package.magdmg;
                    extraPen=data.package.pen;
                    rerollNum=data.package.rerollNum;
                    for(let i=0; i<targetIds.length;i++){
                        let curTargets=targetIds[i].targets;
                        fortykWeapon.template=targetIds[i].template;
                        let targetNames="";
                        let targetTokens=game.canvas.tokens.children[0].children.filter(token=>curTargets.includes(token.id));
                        let targetSet=new Set(targetTokens);
                        for(let j=0; j<targetTokens.length;j++){
                            let token=targetTokens[j];
                            if(j===targetTokens.length-1){

                                targetNames+=token.name;
                            }else if(j===targetTokens.length-2){
                                targetNames+=token.name+" and "
                            }else{
                                targetNames+=token.name+", " 
                            }
                        }
                        if(curTargets.length!==0){

                            game.user.updateTokenTargets(curTargets);

                            let chatBlast2={user: game.user._id,
                                            speaker:{actor,alias:actor.name},
                                            content:`Template #${i+1} hits `+targetNames,
                                            classes:["fortyk"],
                                            flavor:`Blast Weapon Damage`,
                                            author:actor.id};
                            await ChatMessage.create(chatBlast2,{});
                            await FortykRolls.damageRoll(formula,actor,fortykWeapon,hits, false, false,magdamage,extraPen,rerollNum, user, lastHit, targetSet); 
                            //clean templates after
                            let scene=game.scenes.active;
                            let templates=scene.templates;
                            for(const template of templates){
                                if(template.isOwner){

                                    await template.delete()
                                }
                            }
                        }





                    }
                    game.user.updateTokenTargets()



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
                case "setFlag":
                    let flag=data.package.flag;
                    let scope=data.package.scope;
                    id=data.package.token;
                    value=data.package.value;
                    token=canvas.tokens.get(id);
                    actor=token.actor;
                    actor.setFlag(scope,flag,value);
                    break;
                case "psyBuff":
                    FortyKItem.applyPsyBuffs(data.package.actorId,data.package.powerId,data.package.targetIds);
                    break;
                case "cancelPsyBuff":
                    FortyKItem.cancelPsyBuffs(data.package.actorId, data.package.powerId);
                    break;
                case "psyMacro":
                    FortyKItem.executePsyMacro(data.package.powerId, data.package.macroId, data.package.actorId, data.package.targetIds);
                case "updateLoans":
                    let loaned=data.package.loans;
                    let update=data.package.update;
                    for(let i=0;i<loaned.length;i++){
                        let knight=await game.actors.get(loaned[i].knightId);
                        let update1=foundry.utils.duplicate(update);
                        update1["_id"]=loaned[i].itemId;

                        try{
                            await knight.updateEmbeddedDocuments("Item",[update1]);
                        }catch(err){

                        }

                    }
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
                    let actorId=data.package.actorId;
                    actor=game.actors.get(actorId);
                    FortykRolls.perilsOfTheWarp(actor,ork);
                    break;
                case "rotateShield":
                    
                    
                  
                   
                    
                    id=data.package.tokenId;
                    token=canvas.tokens.get(id);
                    console.log(token)
                    let rotation=parseInt(data.package.angle);
                    let lightId=await tokenAttacher.getAllAttachedElementsByTypeOfToken(token, "AmbientLight")[0];
                    console.log(lightId);
                    let lightObj=game.canvas.lighting.get(lightId);
                    console.log(lightObj);
                    let lightData=foundry.utils.duplicate(lightObj.document);

                    tokenAttacher.detachElementFromToken(lightObj, token, true);
                    lightObj.document.delete();

                    let tokenRotation=token.document.rotation;
                    
                    console.log(rotation,tokenRotation)
                    rotation+=tokenRotation;
                    lightData.rotation=rotation;
                    console.log(rotation,lightData.rotation)
                    let newLights=await game.canvas.scene.createEmbeddedDocuments("AmbientLight",[lightData]);

                    let newLight=newLights[0];
                    await tokenAttacher.attachElementToToken(newLight, token, true);
                    break;

            }
        }
    })
});
//round management effects, when a token's turn starts
Hooks.on("updateCombat", async (combat) => {

    if(game.user.isGM){
        game.user.updateTokenTargets();
        game.user.broadcastActivity({targets:[]});
        //previous combatant stuff
        try{
            let previousToken=canvas.tokens.get(combat.previous.tokenId);
            let previousActor=previousToken.actor;
            let tempMod=previousActor.system.secChar.tempMod.value;
            if(tempMod){
                previousActor.update({"system.secChar.tempMod.value":0}); 
            }  
        }catch (err){

        }

        //current combatant stuff
        let token=canvas.tokens.get(combat.current.tokenId);
        if(token===undefined){return}
        let actor=token.actor;
        //PAN CAMERA TO ACTIVE TOKEN
        await canvas.animatePan({x:token.x,y:token.y});
        const currentWindows = Object.values(ui.windows);

        for (let window of currentWindows) {

            if (window.actor) await window.close()
        }
        if(actor.type==="npc"){

            await actor.sheet.render(true);

        }
        if(actor.getFlag("fortyk","hardtargetEvasion")){
            await actor.setFlag("fortyk","hardtargetEvasion",false);
        }
        if(actor.type!=="vehicle"&&actor.system.psykana.pr.sustain>0){
            let sustainedIds=actor.system.psykana.pr.sustained;

            let content="<span>Sustaining the following Powers: </span>"
            for(let i=0;i<sustainedIds.length;i++){
                let powerId=sustainedIds[i];
                let power=actor.getEmbeddedDocument("Item",powerId);;
                content+=`<p>${power.name} as a ${power.system.sustain.value} </p>`;

            }
            let sustainedPowersOptions={user: game.user._id,
                                        speaker:{actor,alias:actor.name},
                                        content:content,
                                        classes:["fortyk"],
                                        flavor:`Sustained Psychic Powers`,
                                        author:actor.id};
            await ChatMessage.create(sustainedPowersOptions,{});
        }
        var dead={};
        let aeTime=async function (activeEffect, actor) {
            if(activeEffect.duration.rounds!==null){

                let remaining=Math.ceil(activeEffect.duration.remaining);
                remaining??=Math.ceil((activeEffect.duration.rounds+activeEffect.duration.startRound)-combat.round);
                
                if(remaining<1){remaining=0}
                let content="";

                if(activeEffect.label!=="Evasion"){

                    if(remaining===0){
                        content=`${activeEffect.name}, affecting ${activeEffect.parent.name} expires.`;
                    }else{
                        content=`${activeEffect.name}, affecting ${activeEffect.parent.name} has ${remaining} rounds remaining.`;
                    }
                    let activeEffectOptions={user: game.user._id,
                                             speaker:{actor,alias:actor.name},
                                             content:content,
                                             classes:["fortyk"],
                                             flavor:`${activeEffect.name} duration.`,
                                             author:actor.id};
                    await ChatMessage.create(activeEffectOptions,{});
                }
                try{
                    if(remaining<=0){
                        await activeEffect.delete({});
                    } 
                }catch (err){

                }



            }
        }

        for(let activeEffect of actor.effects){


            aeTime(activeEffect, actor);
            //check for flags
            if(activeEffect.statuses){

                if(activeEffect.statuses.has("unconscious")){
                    dead=activeEffect;
                }
                //check for fire
                if(activeEffect.statuses.has("fire")){

                    if(actor.type!=="vehicle"){
                        let onFireOptions={user: game.user._id,
                                           speaker:{actor,alias:actor.name},
                                           content:"On round start, test willpower to act, suffer 1 level of fatigue and take 1d10 damage ignoring armor.",
                                           classes:["fortyk"],
                                           flavor:`On Fire!`,
                                           author:actor.id};
                        await ChatMessage.create(onFireOptions,{});
                        if(!(actor.getFlag("core","frenzy")||actor.getFlag("fortyk","fearless")||actor.getFlag("fortyk","frombeyond"))){
                            let wp=actor.system.characteristics.wp.total;
                            if(actor.getFlag("fortyk","resistance")?.toLowerCase().includes("fear")){
                               wp+=10;
                               }
                               await FortykRolls.fortykTest("wp", "char", wp,actor, "On Fire! Panic");
                               }

                               let fatigue=parseInt(actor.system.secChar.fatigue.value)+1;
                               await actor.update({"system.secChar.fatigue.value":fatigue});
                            let fireData={name:"Fire",type:"rangedWeapon"}
                            let fire=await Item.create(fireData, {temporary: true});
                            fire.flags.fortyk={};
                            fire.system.damageType.value="Energy";
                            fire.system.pen.value=99999;
                            await FortykRolls.damageRoll(fire.system.damageFormula,actor,fire,1, true);
                        }else{
                            if(actor.getFlag("fortyk","firedamage")){
                                actor.setFlag("fortyk","firedamage",actor.getFlag("fortyk","firedamage")+6);
                            }else{
                                actor.setFlag("fortyk","firedamage",6);
                            }
                            if(actor.getFlag("fortyk","superheavy")&&!actor.getFlag("fortyk","platinginsulation")){
                                let heat=parseInt(actor.system.knight.heat.value)+1;
                                await actor.update({"system.knight.heat.value":heat});
                                let onFireOptions={user: game.user._id,
                                                   speaker:{actor,alias:actor.name},
                                                   content:"On round start, gain 1 heat.",
                                                   classes:["fortyk"],
                                                   flavor:`On Fire!`,
                                                   author:actor.id};
                                await ChatMessage.create(onFireOptions,{});
                            }else{

                                let duration=activeEffect.getFlag("fortyk","vehicleFireExplosionTimer");

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
                                                       author:actor.id};
                                    await ChatMessage.create(onFireOptions,{}); 
                                    let activeEffect=[foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("dead")])];
                                    await FortykRolls.applyActiveEffect(actor,activeEffect);

                                }
                                duration++;
                                await activeEffect.setFlag("fortyk","vehicleFireExplosionTimer",duration);
                            }
                        }
                    }
                    //check for purifying flames
                    if(activeEffect.statuses.has("purifyingflame")){

                        if(actor.type!=="vehicle"){
                            let onFireOptions={user: game.user._id,
                                               speaker:{actor,alias:actor.name},
                                               content:"On round start, test willpower to act, suffer 1 level of fatigue and take 1d10 damage ignoring armor.",
                                               classes:["fortyk"],
                                               flavor:`On Fire!`,
                                               author:actor.id};
                            await ChatMessage.create(onFireOptions,{});
                            await FortykRolls.fortykTest("wp", "char", actor.system.characteristics.wp.total,actor, "On Fire! Panic");
                            //let fatigue=parseInt(actor.system.secChar.fatigue.value)+1;
                            //await actor.update({"system.secChar.fatigue.value":fatigue});
                            let fireData={name:"Purifying Fire",type:"rangedWeapon"}
                            let fire=await Item.create(fireData, {temporary: true});
                            fire.flags.fortyk={"ignoreSoak":true};
                            fire.system.damageType.value="Energy";
                            fire.system.pen.value=0;
                            fire.system.damageFormula.value=activeEffect.flags.fortyk.damageString;
                            await FortykRolls.damageRoll(fire.system.damageFormula,actor,fire,1, true);
                        }else{
                            if(actor.getFlag("fortyk","firedamage")){
                                actor.setFlag("fortyk","firedamage",actor.getFlag("fortyk","firedamage")+6);
                            }else{
                                actor.setFlag("fortyk","firedamage",6);
                            }
                            if(actor.getFlag("fortyk","superheavy")&&!actor.getFlag("fortyk","platinginsulation")){
                                let heat=parseInt(actor.system.knight.heat.value)+1;
                                await actor.update({"system.knight.heat.value":heat});
                                let onFireOptions={user: game.user._id,
                                                   speaker:{actor,alias:actor.name},
                                                   content:"On round start, gain 1 heat.",
                                                   classes:["fortyk"],
                                                   flavor:`On Fire!`,
                                                   author:actor.id};
                                await ChatMessage.create(onFireOptions,{});
                            }else{

                                let duration=activeEffect.getFlag("fortyk","vehicleFireExplosionTimer");

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
                                                       author:actor.id};
                                    await ChatMessage.create(onFireOptions,{}); 
                                    let activeEffect=[foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("dead")])];
                                    await FortykRolls.applyActiveEffect(actor,activeEffect);

                                }
                                duration++;
                                await activeEffect.setFlag("fortyk","vehicleFireExplosionTimer",duration);
                            }
                        }
                    }
                    //check for bleeding
                    if(activeEffect.statuses.has("bleeding")){
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
                                                    author:actor.id};
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
                                                 author:actor.id};
                            await ChatMessage.create(bleedingOptions,{});
                            let fatigue=parseInt(actor.system.secChar.fatigue.value)+bleedStack;
                            await actor.update({"system.secChar.fatigue.value":fatigue});
                        }
                    }
                    //check for cryo
                    if(activeEffect.statuses.has("cryogenic")){
                        let cryoContent=`<span>On round start, take [[2d10]]  toughness damage!</span>`;
                        let cryoOptions={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:cryoContent,
                                         classes:["fortyk"],
                                         flavor:`Freezing`,
                                         author:actor.id};
                        let cryoMsg=await ChatMessage.create(cryoOptions,{});
                        let inlineResults=parseHtmlForInline(cryoMsg.content);
                        let tDmg=inlineResults[0];
                        let ae=[]
                        ae.push(foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]));
                        ae[0].changes=[{key:`system.characteristics.t.value`,value:-1*tDmg,mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}];
                        await FortykRolls.applyActiveEffect(token,ae);
                    }
                }
            }
            for (let item of actor.items){
                for(let ae of item.effects){
                    aeTime(ae,actor);
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
                                                author:actor.id};
                        await ChatMessage.create(reanimationOptions,{});
                        await dead.delete();
                        await actor.update({"system.secChar.wounds.value":regenAmt});

                    }else if((!reanimation.value)&&reanimation.dos>=3){
                        let reanimationOptions={user: game.user._id,
                                                speaker:{actor,alias:actor.name},
                                                content:`${actor.name} is recalled away!`,
                                                classes:["fortyk"],
                                                flavor:`Reanimation protocol`,
                                                author:actor.id};
                        await ChatMessage.create(reanimationOptions,{});
                        await dead.delete();
                        let activeEffect=[foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("dead")])];
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
            //frigus core
            if(actor.getFlag("fortyk","friguscore")){
                let heat=parseInt(actor.system.knight.heat.value);
                if(heat>0){
                    await actor.update({"system.knight.heat.value":heat-1});
                    let frigusOptions={user: game.user._id,
                                       speaker:{actor,alias:actor.name},
                                       content:"On round start, lose 1 heat.",
                                       classes:["fortyk"],
                                       flavor:`Frigus Core`,
                                       author:actor.id};
                    await ChatMessage.create(frigusOptions,{});
                }

            }
            if(actor.getFlag("fortyk","evadeMod")){
                await actor.setFlag("fortyk","evadeMod",false);
            }
        }
    })
    Hooks.on("preDeleteCombat", async (combat,options,id) =>{
        let combatants=combat.combatants;
        combatants.forEach(async (combatant)=>{
            let actor=combatant.actor;
            let tempMod=actor.system.secChar.tempMod.value;
            if(tempMod){
                await actor.update({"system.secChar.tempMod.value":0}); 
            }
            for(let activeEffect of actor.effects){
                if(activeEffect.label==="Evasion"){
                    await activeEffect.delete({});
                }
                if(activeEffect.duration.type!=="none"){
                    await activeEffect.delete({});
                }
            }
            if(actor.getFlag("fortyk","evadeMod")){
                await actor.setFlag("fortyk","evadeMod",false);
            }
            if(actor.getFlag("core","evasion")){
                await actor.setFlag("core","evasion",false);
            }
            if(actor.getFlag("fortyk","versatile")){
                await actor.setFlag("fortyk","versatile",false);
            }
            await actor.update({"system.secChar.lastHit.type":null});
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
    //add listeners to compendiums for knight sheet interaction
    Hooks.on('renderCompendium', (compendium, html, data)=>{
        let knightComponentSlot=function(component){
            let componentType=component.type;
            if(componentType==="meleeWeapon"){
                return ".melee-slot";
            }
            if(componentType==="rangedWeapon"){
                let weaponClass=component.system.class.value;
                if(weaponClass==="Titanic Ranged Weapon"){
                    return ".ranged-slot";
                }else if(weaponClass==="Titanic Artillery Weapon"){
                    return ".artillery-slot";
                }else{
                    return ".auxiliary-slot";
                }
            }
            if(componentType==="knightCore"){
                return ".core-slot";
            }
            if(componentType==="knightArmor"){
                return ".armor-slot";
            }
            if(componentType==="knightStructure"){
                return ".structure-slot";
            }
            if(componentType==="forceField"){
                return ".forceField-slot";
            }
            if(componentType==="knightComponent"){
                let componentSubType=component.system.type.value;
                if(componentSubType==="other"){
                    return ".other-slot";
                }
                if(componentSubType==="core-mod"){
                    return ".core-mod-slot";
                }
                if(componentSubType==="throne-mod"){
                    return ".throne-mod-slot";
                }
                if(componentSubType==="plating"){
                    return ".plating-slot";
                }
                if(componentSubType==="sensor"){
                    return ".sensor-slot";
                }
                if(componentSubType==="gyro"){
                    return ".gyro-slot";
                }
                if(componentSubType==="arm-actuator"){
                    return ".arm-actuator-slot";
                }
                if(componentSubType==="leg-actuator"){
                    return ".leg-actuator-slot";
                }
            }
            if(componentType==="ammunition"){
                return ".other-slot";
            }
            return false;
        }
        let onDragComponent=async function(event){


            let compendiumId=compendium.id.replace("compendium-","");

            let compendiumObj=await game.packs.get(compendiumId);
            let transfer={}
            transfer.compendium=true;
            transfer.compendiumId=compendiumId;
            transfer.componentId=event.target.dataset["entryId"];

            let item=await compendiumObj.getDocument(event.target.dataset["entryId"]);
            let type=knightComponentSlot(item);
            event.target.attributes["name"]=type;
            let validSlots= document.querySelectorAll(type);
            validSlots.forEach(function(item) {
                item.classList.add("highlight-slot");
            });
            //let transferString=JSON.stringify(transfer);
            //console.log(transferString)
            // event.dataTransfer.setData("text1", transferString);
            //event.dataTransfer.effectAllowed="copy";
        }
        let onStopDragComponent=function(event){
            if(compendium.id.indexOf("knight")===-1){
                return
            }
            let type=event.target.attributes["name"];
            let validSlots= document.querySelectorAll(type);
            validSlots.forEach(function(item) {
                item.classList.remove("highlight-slot");
            });
        }



        html.find('.directory-item').each((i, li) => {

            li.addEventListener("dragstart", onDragComponent.bind(compendium), false);
            li.addEventListener("dragend", onStopDragComponent.bind(compendium), false);
            //li.addEventListener("dragover", this._onDragOverSlot.bind(compendium), false);

        });
    })

    Hooks.on('preCreateItem', (actor, data,options) =>{
    });
    //set flags on the actor when adding an active effect if it should activate a flag
    Hooks.on('createActiveEffect',async (ae,options,id)=>{
        if(game.user.isGM){
            let actor=ae.parent;
            ae.statuses.forEach(async function (value1, value2,ae){
                let flag=value1;
                await actor.setFlag("core",flag,true); 
            })
        }
    });
    //unset flags on the actor when removing an active effect if it had a flag
    Hooks.on('deleteActiveEffect',async (ae,options,id)=>{
        if(game.user.isGM){
            let actor=ae.parent;

            ae.statuses.forEach(async function (value1, value2,ae){
                let flag=value1;

                await actor.setFlag("core",flag,false);

            })
        }
    });
    /**
     * Add the manage active effects button to actor sheets
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
    Hooks.on("preCreateToken", async (document, data, options, userId) =>{

        if(game.user.isGM){
            //modify token dimensions if scene ratio isnt 1
            let gridRatio=canvas.dimensions.distance;
            let newHeight=Math.max(0.1,document.height/gridRatio);
            let newWidth=Math.max(0.1,document.width/gridRatio);
            if(newHeight!==document.height||newWidth!==document.width){
                await document.updateSource({"height":newHeight,"width":newWidth});

            }
        }

    });

    Hooks.on('preUpdateToken',async (scene,token,changes,diff,id)=>{
        /*
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
        let flags={core:foundry.utils.duplicate(game.fortyk.FORTYK.StatusFlags)};
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
            effect.push(foundry.utils.duplicate(game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("unconscious")]));
            let chatUnconscious={user: game.user._id,
                                 speaker:{tokenActor,alias:tokenActor.name},
                                 content:`${tokenActor.name} falls unconscious from fatigue!`,
                                 classes:["fortyk"],
                                 flavor:`Fatigue pass out`,
                                 author:tokenActor.id};
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
            else if ( !data["token.width"] && !foundry.utils.hasProperty(data, "token.width") ) {
                data["token.height"] = size;
                data["token.width"] = size;
            }
        }
    }*/
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
    Hooks.on("simple-calendar-date-time-change",async (dateData)=>{
        
        if(!SimpleCalendar.api.isPrimaryGM()){return}
        let timeElapsed=dateData.diff;
        let houses=game.actors.filter(function(actor){return actor.type==="knightHouse"});
        
        houses.forEach(async function(house){
            let currentRepairIds=house.system.repairBays.current;
            currentRepairIds.forEach(async function(repairId){
                let repair=house.getEmbeddedDocument("Item",repairId);
                if(!repair){return}
                let time=repair.system.time.value;
                if(time>timeElapsed){
                    repair.update({"system.time.value":time-timeElapsed});
                }else{
                    let knight=game.actors.get(repair.system.knight.value);
                    let wounds=repair.system.repairs.wounds;
                    let repairEntries=repair.system.repairs.entries;
                    if(wounds){
                        await knight.update({"system.secChar.wounds.value":knight.system.secChar.wounds.value+wounds});
                    }
                    repairEntries.forEach(async function(entry){
                        let type=entry.type;
                        let uuid=entry.uuid;
                        let item=fromUuidSync(uuid);
                        if(!item){return}
                        if(type==="damagedionshield"||type==="destroyedionshield"||type==="damagedcomponent"){
                            await item.update({"system.state.value":"O"});
                        }else if(type==="install/removecomponent"){
                            let path=item.system.path;

                            let data=knight.system;
                            let house=await game.actors.get(data.knight.house);
                            //if the knight is linked to a house update the house inventory
                            if(house){
                                let component=await house.getEmbeddedDocument("Item",item.system.originalId);
                                if(component){
                                    let amtTaken=component.system.amount.taken;
                                    let newAmt=amtTaken-1;


                                    var componentUpdate={};

                                    if(item.system.state.value==="X"||item.system.state.value===0){
                                        let amt=parseInt(component.system.amount.value);
                                        componentUpdate["system.amount.value"]=amt-1;
                                    }
                                    componentUpdate["system.amount.taken"]=newAmt;
                                    let loans=component.system.loaned;
                                    console.log(loans)
                                    let newLoans=loans.filter(loan=>loan.knightId!==knight.id&&item.id!==loan.itemId);
                                    componentUpdate["system.loaned"]=newLoans;
                                    await component.update(componentUpdate);
                                }

                            }



                            let update={};
                            if(path.indexOf("components")!==-1){
                                var array=objectByString(knight,path).filter(function(id){return id!==item.id});




                                update[path]=array;
                            }else{
                                update[path]="";  
                            }



                            await knight.update(update);

                            await knight.deleteEmbeddedDocuments("Item",[item.id]);
                        }else if(type==="refittitanicweapon"){
                            let data=knight.system;
                            let chassis=await knight.getEmbeddedDocument("Item",data.knight.chassis);
                            let path=item.system.path;
                            //if the knight is linked to a house update the house inventory
                            if(house){
                                let component=await house.getEmbeddedDocument("Item",item.system.originalId);
                                let amtTaken=component.system.amount.taken;
                                let newAmt=amtTaken-1;
                                let componentUpdate={};
                                if(item.system.state.value==="X"||item.system.state.value===0){
                                    let amt=parseInt(component.system.amount.value);
                                    componentUpdate["system.amount.value"]=amt-1;
                                }
                                componentUpdate["system.amount.taken"]=newAmt;
                                let loans=component.system.loaned;
                                let newLoans=loans.filter(loan=>loan.knightId!==knight.id&&loan.itemId!==item.id);
                                componentUpdate["system.loaned"]=newLoans;
                                await component.update(componentUpdate);
                            }

                            let array=objectByString(chassis,path).map(function(id){if(id===item.id){return ""}});
                            console.log(array)

                            let chassisUpdate={};
                            chassisUpdate[path]=array;


                            await chassis.update(chassisUpdate);

                            await knight.deleteEmbeddedDocuments("Item",[item.id]);


                        }else if(type==="damagedcore"){
                            let quality=item.system.quality.value;
                            let maxInt=game.fortyk.FORTYK.coreIntegrities[quality];
                            await item.update({"system.state.value":maxInt});




                        }else if(type==="firedamage"){
                            await knight.setFlag("fortyk","firedamage",0);
                        }else if(type==="armordmg"){
                            let armorDmgIds=entry.effectIds;
                            armorDmgIds.forEach(async function(effectId){
                                let armorEffect=fromUuidSync(effectId);
                                await armorEffect.delete();
                            })
                        }else{
                            await item.delete();
                        }

                    });
                    SimpleCalendar.api.removeNote(repair.system.calendar.noteId);
                    

                    let queue=house.system.repairBays.queue;
                    let newCurrent=currentRepairIds.filter(function(id){return id!==repairId});
                    console.log(newCurrent)
                    if(queue.length>0){
                        newCurrent.push(queue.pop());
                        let newCurrentRepairId=newCurrent[newCurrent.length-1];
                        let newCurrentRepair=house.getEmbeddedDocument("Item",newCurrentRepairId);
                        let time=newCurrentRepair.system.time.value;
                        let calendar=SimpleCalendar.api.getCurrentCalendar();
                        let currentTime=SimpleCalendar.api.timestamp(calendar.id);

                        let noteTime=currentTime+time;

                        let formattedTime=SimpleCalendar.api.timestampToDate(noteTime,calendar.id);

                        let note=await SimpleCalendar.api.addNote(newCurrentRepair.name, repair.system.description.value, formattedTime, formattedTime, true, false, ["Repairs"], calendar.id, '', ["default"], [game.user.id]);
                        await newCurrentRepair.update({"system.calendar.noteId":note.id});
                    }
                    let chatMsg={user: game.user._id,
                                 speaker:{house,alias:game.user.character.name},
                                 content:repair.system.description.value,
                                 classes:["fortyk"],
                                 flavor:`Repair entry for ${knight.name} has completed successfully`,
                                 author:game.user.character.id};
                    await ChatMessage.create(chatMsg,{});
                    await house.update({"system.repairBays.current":newCurrent,"system.repairBays.queue":queue});
                    await repair.delete();
                }
            });
        });
    });
    Hooks.once("enhancedTerrainLayer.ready", (RuleProvider) => {
        class FortykSystemRuleProvider extends RuleProvider {
            calculateCombinedCost(terrain, options) {
                if(terrain.length===0){
                    return 1;
                }


                let cost=terrain[0].cost;
                if(!cost){cost=1;}
                let token=options.token;
                let actor;
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