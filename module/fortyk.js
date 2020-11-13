// Import Modules
import { FortyKActor } from "./actor/actor.js";
import { ActorDialogs } from "./actor/actor-dialogs.js";
import FortyKDWActorSheet from "./actor/actorDW-sheet.js";
import { FortyKDHActorSheet } from "./actor/actorDH-sheet.js";
import { FortyKItem } from "./item/item.js";
import { FortyKItemSheet } from "./item/item-sheet.js";
import { FortyKActiveEffect } from "./activeEffect/activeEffect.js";
import { FortyKActiveEffectConfig } from "./activeEffect/activeEffectConfig.js";
import { preloadHandlebarsTemplates } from "./utilities.js";
import { FortykRolls } from "./FortykRolls.js";
import { FortykRollDialogs } from "./FortykRollDialogs.js";
import { FortyKNPCSheet} from "./actor/actor-npc-sheet.js";
import { FORTYK } from "./FortykConfig.js";
import { _getInitiativeFormula } from "./combat.js";
Hooks.once('init', async function() {
    game.fortyk = {
        FortyKActor,
        FortyKItem,
        FortykRolls,
        FORTYK
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
        formula: "1d10 + @characteristics.agi.bonus + (@characteristics.agi.total / 100)",
        decimals: 2
    };
    Combat.prototype._getInitiativeFormula = _getInitiativeFormula;
    //set custom system status effects
    CONFIG.statusEffects=FORTYK.StatusEffects;
    //set default font
    CONFIG.fontFamilies.push("CaslonAntique");
    CONFIG.defaultFontFamily="CaslonAntique";
    //preload handlebars templates
    preloadHandlebarsTemplates();
    // Define custom Entity classes
    CONFIG.Actor.entityClass = FortyKActor;
    CONFIG.Item.entityClass = FortyKItem;
    //CONFIG.ActiveEffect.entityClass = FortyKActiveEffect;
    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("fortyk", FortyKDWActorSheet, { types:["dwPC"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKDHActorSheet, { types:["dhPC"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKNPCSheet, { types: ["npc"], makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("fortyk", FortyKItemSheet, { makeDefault: true });
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
    Handlebars.registerHelper('compareString', function (str1, str2="") {
        if(typeof str2!=="string"){
            str2="";
        }
        return str1===str2;
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
        if(str2===""){
            return true;
        }else{
            return str1.toLowerCase().includes(str2.toLowerCase());
        }
    });
    Handlebars.registerHelper("greaterThan", function(num1,num2){
        return num1>num2;
    });
    Handlebars.registerHelper("equals", function(num1,num2){
        return num1==num2;
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
    //SOCKET used to update actors via the damage scripts
    game.socket.on("system.fortyk",async(data) => {
        if(game.user.isGM){
            let id="";
            let actor=null;
            let token=null;
            let value=0;
            switch(data.type){
                case "applyActiveEffect":
                    id=data.package.token;
                    token=canvas.tokens.get(id);

                    let aeffect=data.package.effect;
                    FortykRolls.applyActiveEffect(token,aeffect);
                    break;
                case "updateValue":
                    id=data.package.token;
                    value=data.package.value;
                    let path=data.package.path;
                    token=canvas.tokens.get(id);
                    actor=token.actor;
                    let options={}
                    options[path]=value;
                    await actor.update(options);
                    break;
                case "critEffect":
                    id=data.package.token;
                    token=canvas.tokens.get(id);
                    FortykRolls.critEffects(token,data.package.num,data.package.hitLoc,data.package.type);
                    break;
                case "applyDead":
                    id=data.package.token;
                    token=canvas.tokens.get(id);
                    let effect="icons/svg/skull.svg";
                    await token.toggleOverlay(effect);
                    try{
                        let combatant = await game.combat.getCombatantByToken(id);
                        let combatid=combatant._id;
                        await game.combat.updateCombatant({
                            '_id':combatid,
                            'defeated':true
                        }) 
                    }catch(err){}
                    break;
            }
        }
    })
});
//round management effects, when a token's turn starts
Hooks.on("updateCombat", async (combat) => {
    if(game.user.isGM){
        let token=canvas.tokens.get(combat.current.tokenId);
        if(token===undefined){return}
        let actor=token.actor;
        //PAN CAMERA TO ACTIVE TOKEN
        canvas.animatePan({x:token.x,y:token.y});
        for(let activeEffect of actor.effects){
            if(activeEffect.duration.type!=="none"){
                let remaining=Math.ceil(activeEffect.duration.remaining);
                if(remaining<0){remaining=0}
                let activeEffectOptions={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:`${activeEffect.data.label} has ${remaining} turns remaining.`,
                                         classes:["fortyk"],
                                         flavor:`${activeEffect.data.label} duration.`,
                                         author:actor.name};
                await ChatMessage.create(activeEffectOptions,{});
                if(activeEffect.duration.remaining<=0){
                    activeEffect.delete({});
                }
            }
            //check for fire
            if(activeEffect.data.flags.core.statusId==="fire"){
                let onFireOptions={user: game.user._id,
                                   speaker:{actor,alias:actor.name},
                                   content:"On round start, test willpower to act, suffer 1 level of fatigue and take 1d10 damage ignoring armor.",
                                   classes:["fortyk"],
                                   flavor:`On Fire!`,
                                   author:actor.name};
                await ChatMessage.create(onFireOptions,{});
                await FortykRolls.fortykTest("wp", "char", actor.data.data.characteristics.wp.total,actor, "On Fire! Panic");
                let fatigue=parseInt(actor.data.data.secChar.fatigue.value)+1;
                await actor.update({"data.secChar.fatigue.value":fatigue});
                let flags= duplicate(game.fortyk.FORTYK.itemFlags);
                let fireData={name:"Fire",type:"rangedWeapon"}
                let fire=await Item.create(fireData, {temporary: true});
                fire.data.flags.specials=flags;
                fire.data.data.damageType.value="Energy";
                fire.data.data.pen.value=99999;
                await FortykRolls.damageRoll(fire.data.data.damageFormula,actor,fire.data,1, true);
            }
            //check for bleeding
            if(activeEffect.data.flags.core.statusId==="bleeding"){
                let bleed=true;
                if(actor.getFlag("fortyk","diehard")){
                    let diehrd= await FortykRolls.fortykTest("wp", "char", actor.data.data.characteristics.wp.total,actor, "Die Hard");
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
                    let bleedingOptions={user: game.user._id,
                                         speaker:{actor,alias:actor.name},
                                         content:"On round start gain 1 fatigue per stack of bleeding",
                                         classes:["fortyk"],
                                         flavor:`Bleeding`,
                                         author:actor.name};
                    await ChatMessage.create(bleedingOptions,{});
                    let fatigue=parseInt(actor.data.data.secChar.fatigue.value)+1;
                    await actor.update({"data.secChar.fatigue.value":fatigue});
                }
            }
        }
        //check for regeneration
        if(actor.getFlag("fortyk","regeneration")){
            let regen=await FortykRolls.fortykTest("t", "char", actor.data.data.characteristics.t.total,actor, "Regeneration Test");
            if(regen.value){
                let regenAmt=parseInt(actor.getFlag("fortyk","regeneration"));
                let maxWounds=actor.data.data.secChar.wounds.max;
                let currWounds=actor.data.data.secChar.wounds.value;
                currWounds=Math.min(maxWounds,currWounds+regenAmt);
                await actor.update({"data.secChar.wounds.value":currWounds});
            }
        }
    }
})
Hooks.on("preDeleteCombat", async (combat,options,id) =>{
    for(let index = 0; index < combat.combatants.length; index++){
        let actor=combat.combatants[index].actor;
        for(let activeEffect of actor.effects){
            if(activeEffect.duration.type!=="none"){
                await activeEffect.delete({});
            }
        }
    }
})
Hooks.on("preUpdateActor", (data, updatedData) =>{
})
//add listeners to the chatlog for dice rolls
Hooks.on('renderChatLog', (log, html, data) => FortykRollDialogs.chatListeners(html));
//add listeners to dialogs to allow searching and the like
Hooks.on('renderDialog', (dialog, html, data) => ActorDialogs.chatListeners(html));
//set flags for new weapons and items
Hooks.on('preCreateOwnedItem', (actor, data,options) =>{
    if (data.type==="meleeWeapon"||data.type==="rangedWeapon"||data.type==="psychicPower"||data.type==="ammunition"){
        let flags= duplicate(game.fortyk.FORTYK.itemFlags);
        data.flags={};
        data.flags.specials=flags;
    }
});
//set flags on the actor when adding an active effect if it should activate a flag
Hooks.on('createActiveEffect',async (actor,ae,options,id)=>{
    if(game.user.isGM){
        let flag=ae.flags.core.statusId;
        if(flag){
            await actor.setFlag("core",flag,true);
        }
    }

});
//unset flags on the actor when removing an active effect if it had a flag
Hooks.on('deleteActiveEffect',async (actor,ae,options,id)=>{
    if(game.user.isGM){
        let flag=ae.flags.core.statusId;
        if(flag){
            await actor.setFlag("core",flag,false);
        }
    }
});
/**
 * Set default values for new actors' tokens
 */
Hooks.on("preCreateActor", (createData) =>{
    // Set wounds, fatigue, and display name visibility
    mergeObject(createData,
                {"token.bar1" :{"attribute" : "secChar.wounds"},                 // Default Bar 1 to Wounds
                 "token.bar2" :{"attribute" : "secChar.fatigue"},               // Default Bar 2 to Fatigue
                 "token.displayName" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display name to be on owner hover
                 "token.displayBars" : CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display bars to be always on
                 "token.disposition" : CONST.TOKEN_DISPOSITIONS.NEUTRAL,         // Default disposition to neutral
                 "token.name" : createData.name                                       // Set token name to actor name
                })
    // Default characters to HasVision = true and Link Data = true
    if (createData.type !== "npc")
    {
        createData.token.vision = true;
        createData.token.actorLink = true;
    }
})
Hooks.on("preCreateToken", (createData) =>{
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

    
   
    try{
        let newFatigue=data.data.secChar.fatigue.value;
        let fullToken=await canvas.tokens.get(token._id);
        let tokenActor=fullToken.actor;
        if(newFatigue>=tokenActor.data.data.secChar.fatigue.max*2){
            
            
            let chatDead={user: game.user._id,
                          speaker:{tokenActor,alias:tokenActor.name},
                          content:`${tokenActor.name} dies from fatigue!`,
                          classes:["fortyk"],
                          flavor:`Fatigue death`,
                          author:tokenActor.name};
            await ChatMessage.create(chatDead,{});
            await game.fortyk.FortykRolls.applyDead(fullToken,tokenActor);
        }else if(!tokenActor.getFlag("core","frenzy")&&!tokenActor.getFlag("core","unconscious")&&newFatigue>=tokenActor.data.data.secChar.fatigue.max){
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
    

});