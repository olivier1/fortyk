// Import Modules
import { FortyKActor } from "./actor/actor.js";
import { FortyKActorSheet } from "./actor/actor-sheet.js";
import { FortyKItem } from "./item/item.js";
import { FortyKItemSheet } from "./item/item-sheet.js";
import { preloadHandlebarsTemplates} from "./utilities.js";
import {FortykRolls} from "./FortykRolls.js";
import { FortyKNPCSheet} from "./actor/actor-npc-sheet.js";
import {FORTYK} from "./FortykConfig.js";

Hooks.once('init', async function() {

    game.fortyk = {
        FortyKActor,
        FortyKItem
    };

    /**
   * Set an initiative formula for the system
   * @type {String}
   */
    CONFIG.Combat.initiative = {
        formula: "1d10 + @characteristics.agi.bonus + (@characteristics.agi.total / 100)",
        decimals: 2
    };
    //preload handlebars templates
    preloadHandlebarsTemplates();
    // Define custom Entity classes
    CONFIG.Actor.entityClass = FortyKActor;
    CONFIG.Item.entityClass = FortyKItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("fortyk", FortyKActorSheet, { types:["dwPC"], makeDefault: true });
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
    Handlebars.registerHelper("unescape",function(text){
        var doc = new DOMParser().parseFromString(text, "text/html");
        return doc.documentElement.textContent;
    });


});
Hooks.once("setup", function() {






});
//HOOKS
Hooks.once('ready', async function() {


    //SOCKET used to update tokens via the damage scripts
    game.socket.on("system.fortyk",async(data) => {

        if(game.user.isGM){
            if(data.type==="toggleTokenEffect"){
                let id=data.package.token;
                let token=canvas.tokens.get(id);
                let effect=data.package.effect;
                await token.toggleEffect(effect);
            }else if(data.type==="updateValue"){

                let id=data.package.token;
                let value=data.package.value;
                let path=data.package.path;
                let token=canvas.tokens.get(id);
                let actor=token.actor;

                let options={}
                options[path]=value;

                await actor.update(options);

            }else if(data.type==="applyDead"){

                let id=data.package.token;
                let token=canvas.tokens.get(id);
                let effect="icons/svg/skull.svg";
                await token.toggleOverlay(effect);
                try{
                    let combatant = await game.combat.getCombatantByToken(id);

                    let combatid=combatant._id;
                    await game.combat.updateCombatant({
                        '_id':combatid,
                        'defeated':true
                    }) 
                }catch{}

            }
            }
            })

            });
                    //round management effects, when a token's turn starts
                    Hooks.on("updateCombat", async (combat) => {
                        if(game.user.isGM){
                            let token=canvas.tokens.get(combat.current.tokenId);
                            let actor=token.actor;
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
                            //check for fire
                            if(token.data.effects.includes("icons/svg/fire.svg")){
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
                                let flags= duplicate(FORTYK.itemFlags);
                                let fireData={name:"Fire",type:"rangedWeapon"}
                                let fire=await Item.create(fireData, {temporary: true});

                                fire.data.flags.specials=flags;

                                fire.data.data.damageType.value="Energy";
                                fire.data.data.pen.value=99999;
                                await FortykRolls.damageRoll(fire.data.data.damageFormula,actor,fire.data,1, true);
                            }
                            //check for bleeding
                            if(token.data.effects.includes("icons/svg/blood.svg")){
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

                    })
                    Hooks.on("preUpdateActor", (data, updatedData) =>{

                    })
                //add listeners to the chatlog for dice rolls
                Hooks.on('renderChatLog', (log, html, data) => FortykRolls.chatListeners(html));
                //set flags for new weapons and items
                Hooks.on('preCreateOwnedItem', (actor, data,options) =>{
                    if (data.type==="meleeWeapon"||data.type==="rangedWeapon"||data.type==="psychicPower"||data.type==="ammunition"){

                        let flags= duplicate(FORTYK.itemFlags);
                        data.flags={};

                        data.flags.specials=flags;


                    }
                })
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


                })