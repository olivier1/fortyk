// Import Modules
import { FortyKActor } from "./actor/actor.js";
import { ActorDialogs } from "./actor/actor-dialogs.js";
import { FortyKToken } from "./token/fortykToken.js";
import { FortyKRuler } from "./ruler/fortykRuler.js";
import FortyKDWActorSheet from "./actor/actorDW-sheet.js";
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
import { FortyKNPCSheet } from "./actor/actor-npc-sheet.js";
import { FORTYK } from "./FortykConfig.js";
import { _getInitiativeFormula } from "./combat.js";
import { FORTYKTABLES } from "./FortykTables.js";
import { registerSystemSettings } from "./settings.js";
import { ActiveEffectDialog } from "./dialog/activeEffect-dialog.js";
import { FortyKCards } from "./card/card.js";
import { FortykTemplate } from "./measuredTemplate/template.js";
import { objectByString } from "./utilities.js";
import { migrate } from "./migration.js";
import { tokenDistance } from "./utilities.js";
import { getActorToken } from "./utilities.js";
import { sleep } from "./utilities.js";
import { turnOffActorAuras } from "./utilities.js";
import { applySceneAuras } from "./utilities.js";

function manageColorScheme() {
    const colorScheme=game.settings.get("fortyk","colorScheme");
    const colorSchemes=FORTYK.colorSchemes;
    const schemeString=colorSchemes[colorScheme];
    switch (schemeString){
        case "Default":   
            break;
        case "Cyan":
            document.documentElement.style.setProperty('--terminal-primary', '#23D5D5');
            document.documentElement.style.setProperty('--terminal-secondary', '#39AAAA');
            document.documentElement.style.setProperty('--terminal-dim', '#395555');
            document.documentElement.style.setProperty('--terminal-text', '#5bc7c7');
            document.documentElement.style.setProperty('--terminal-warning', '#cccc00');
            document.documentElement.style.setProperty('--terminal-success', 'royalblue');
            document.documentElement.style.setProperty('--terminal-error', 'orange');
            document.documentElement.style.setProperty('--terminal-border', '#23D5D5');
            document.documentElement.style.setProperty('--terminal-glow', '0 0 2px #00FFFF, 0 0 4px #00FFFF, 0 0 6px #00FFFF');
            document.documentElement.style.setProperty('--terminal-innerglow', 'inset 0 0 2px #00FFFF, inset 0 0 4px #00FFFF, inset 0 0 6px #009900');
            document.documentElement.style.setProperty('--terminal-error-glow', '0 0 2px orange, 0 0 4px orange, 0 0 6px orange');
            document.documentElement.style.setProperty('--terminal-text-shadow', '0 0 1px #00FFFF');
            document.documentElement.style.setProperty('--terminal-border-image', 'url("../assets/emptyslate-cyan.png")');
            document.documentElement.style.setProperty('--terminal-delete-icon', 'url("../icons/deleteicon-orange.png")');
            document.documentElement.style.setProperty('--terminal-edit-icon', 'url("../icons/editicon-blue.png")');
            document.documentElement.style.setProperty('--terminal-imp-eagle', 'url("../icons/impeagleSCAN-cyan.webp")');
            
            break;
        case "Red":
            document.documentElement.style.setProperty('--terminal-primary', '#E73121');
            document.documentElement.style.setProperty('--terminal-secondary', '#F15D49');
            document.documentElement.style.setProperty('--terminal-dim', '#8B190A');
            document.documentElement.style.setProperty('--terminal-text', '#ff6557');
            document.documentElement.style.setProperty('--terminal-warning', '#cccc00');
            document.documentElement.style.setProperty('--terminal-success', 'royalblue');
            document.documentElement.style.setProperty('--terminal-error', 'orange');
            document.documentElement.style.setProperty('--terminal-border', '#E73121');
            document.documentElement.style.setProperty('--terminal-glow', '0 0 2px #E73121, 0 0 4px #E73121, 0 0 6px #E73121');
            document.documentElement.style.setProperty('--terminal-innerglow', 'inset 0 0 2px #E73121, inset 0 0 4px #E73121, inset 0 0 6px #E73121');
            document.documentElement.style.setProperty('--terminal-error-glow', '0 0 2px orange, 0 0 4px orange, 0 0 6px orange');
            document.documentElement.style.setProperty('--terminal-text-shadow', '0 0 1px #E73121');
            document.documentElement.style.setProperty('--terminal-border-image', 'url("../assets/emptyslate-red.png")');
            document.documentElement.style.setProperty('--terminal-delete-icon', 'url("../icons/deleteicon-orange.png")');
            document.documentElement.style.setProperty('--terminal-edit-icon', 'url("../icons/editicon-blue.png")');
            document.documentElement.style.setProperty('--terminal-imp-eagle', 'url("../icons/impeagleSCAN-red.webp")');
            break;
        case "White":
            document.documentElement.style.setProperty('--terminal-primary', '#DBDBC3');
            document.documentElement.style.setProperty('--terminal-secondary', '#8A8A7B');
            document.documentElement.style.setProperty('--terminal-dim', '#4A4A31');
            document.documentElement.style.setProperty('--terminal-text', '#DBDBC3');
            document.documentElement.style.setProperty('--terminal-warning', '#cccc00');
            document.documentElement.style.setProperty('--terminal-success', 'green');
            document.documentElement.style.setProperty('--terminal-error', 'red');
            document.documentElement.style.setProperty('--terminal-border', '#DBDBC3');
            document.documentElement.style.setProperty('--terminal-glow', '0 0 2px #DBDBC3, 0 0 4px #DBDBC3, 0 0 6px #DBDBC3');
            document.documentElement.style.setProperty('--terminal-innerglow', 'inset 0 0 2px #DBDBC3, inset 0 0 4px #DBDBC3, inset 0 0 6px #DBDBC3');
            document.documentElement.style.setProperty('--terminal-error-glow', '0 0 2px red, 0 0 4px red, 0 0 6px red');
            document.documentElement.style.setProperty('--terminal-text-shadow', '0 0 1px #DBDBC3');
            document.documentElement.style.setProperty('--terminal-border-image', 'url("../assets/emptyslate-white.png")');
            document.documentElement.style.setProperty('--terminal-delete-icon', 'url("../icons/deleteicon-red.png")');
            document.documentElement.style.setProperty('--terminal-edit-icon', 'url("../icons/editicon-gold.png")');
            document.documentElement.style.setProperty('--terminal-imp-eagle', 'url("../icons/impeagleSCAN-white.webp")');
            break;
        case "Green w/ RG Colorblind":
            document.documentElement.style.setProperty('--terminal-error', 'orange');
            document.documentElement.style.setProperty('--terminal-error-glow', '0 0 2px orange, 0 0 4px orange, 0 0 6px orange');
            document.documentElement.style.setProperty('--terminal-delete-icon', 'url("../icons/deleteicon-orange.png")');
            document.documentElement.style.setProperty('--terminal-edit-icon', 'url("../icons/editicon-blue.png")');
            break; 
    }



    

}

Hooks.once("init", async function () {
    game.fortyk = {
        FortyKActor,
        FortyKItem,
        FortykRolls,
        FORTYK,
        FORTYKTABLES,
        FortykTemplate,
        getActorToken
    };
    //make a map with the indexes of the various status effects
    game.fortyk.FORTYK.StatusEffectsIndex = (function () {
        let statusMap = new Map();
        for (let i = 0; i < FORTYK.StatusEffects.length; i++) {
            statusMap.set(game.fortyk.FORTYK.StatusEffects[i].id, i);
        }
        return statusMap;
    })();
    //make an object that is used to reset status flags on tokens, this wouldnt need to be done if adding active effects to a token would trigger createAtiveEffect
    game.fortyk.FORTYK.StatusFlags = (function () {
        let statusFlags = {};
        for (let i = 0; i < FORTYK.StatusEffects.length; i++) {
            statusFlags[FORTYK.StatusEffects[i].id] = false;
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
    CONFIG.statusEffects = FORTYK.StatusEffects;
    //set default font
    CONFIG.fontDefinitions["CaslonAntique"] = { editor: true, fonts: [] };
    CONFIG.defaultFontFamily = "CaslonAntique";
    //preload handlebars templates
    preloadHandlebarsTemplates();
    preLoadHandlebarsPartials();
    // Define custom Entity classes
    CONFIG.Actor.documentClass = FortyKActor;
    CONFIG.Item.documentClass = FortyKItem;
    CONFIG.Canvas.rulerClass = FortyKRuler;
    CONFIG.Token.documentClass = FortyKToken;
    //CONFIG.ActiveEffect.entityClass = FortyKActiveEffect;
    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("fortyk", FortyKDWActorSheet, {
        label: "Deathwatch Sheet",
        types: ["dwPC"],
        makeDefault: true
    });
    Actors.registerSheet("fortyk", FortyKOWComradeSheet, {
        label: "Only War Comrade Sheet",
        types: ["owComrade"],
        makeDefault: true
    });
    Actors.registerSheet("fortyk", FortyKOWRegimentSheet, {
        label: "Only War Regiment Sheet",
        types: ["owRegiment"],
        makeDefault: true
    });
    Actors.registerSheet("fortyk", FortyKSpaceshipSheet, {
        label: "Spaceship Sheet",
        types: ["spaceship"],
        makeDefault: true
    });
    Actors.registerSheet("fortyk", FortyKNPCSheet, { label: "NPC Sheet", types: ["npc"], makeDefault: true });
    Actors.registerSheet("fortyk", FortyKVehicleSheet, {
        label: "Vehicle Sheet",
        types: ["vehicle"],
        makeDefault: true
    });
    Actors.registerSheet("fortyk", FortyKKnightSheet, {
        label: "Imperial Knight Sheet",
        types: ["vehicle"],
        makeDefault: false
    });
    Actors.registerSheet("fortyk", FortyKKnightHouseSheet, {
        label: "Knight House Sheet",
        types: ["knightHouse"],
        makeDefault: true
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("fortyk", FortyKItemSheet, { makeDefault: true });
    //setup handcards
    CONFIG.Cards.documentClass = FortyKCards;

    //register system settings
    registerSystemSettings();
    manageColorScheme();
    // Handlebars helpers
    Handlebars.registerHelper("concat", function () {
        var outStr = "";
        for (var arg in arguments) {
            if (typeof arguments[arg] != "object") {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });
    Handlebars.registerHelper("toLowerCase", function (str) {
        return str.toLowerCase();
    });
    Handlebars.registerHelper("isdefined", function (value) {
        return value !== undefined;
    });
    Handlebars.registerHelper("isnumber", function (value) {
        return !isNaN(parseInt(value));
    });
    Handlebars.registerHelper("compareString", function (str1, str2 = "") {
        if (typeof str2 !== "string") {
            str2 = "";
        }
        return str1 === str2;
    });
    Handlebars.registerHelper("length", function (array) {
        try {
            if (array.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        }
    });
    Handlebars.registerHelper("debug", function (optionalValue) {
        console.log("Current Context");
        console.log("====================");
        console.log(this);
        if (optionalValue) {
            console.log("Value");
            console.log("====================");
            console.log(optionalValue);
        }
    });
    Handlebars.registerHelper("contains", function (str1, str2) {
        if (str1 === undefined) {
            return false;
        }
        if (str1 === null) {
            return false;
        }
        if (!str1) {
            return false;
        }
        if (str2 === "") {
            return true;
        } else {
            return str1.toLowerCase().includes(str2.toString().toLowerCase());
        }
    });
    Handlebars.registerHelper("greaterThan", function (num1, num2) {
        return num1 > num2;
    });
    Handlebars.registerHelper("equals", function (num1, num2) {
        return num1 == num2;
    });
    Handlebars.registerHelper("checkSpecial", function (spec) {
        let bool = false;
        if (typeof spec === "number") {
            bool = true;
        } else {
            bool = spec;
        }
        return bool;
    });
    Handlebars.registerHelper("unescape", function (text) {
        var doc = new DOMParser().parseFromString(text, "text/html");
        console.log(doc.documentElement.textContent);
        return doc.documentElement.textContent;
    });
    Handlebars.registerHelper("threshold", function (text) {
        if (text === "secondthresholddmg") {
            return true;
        }
        if (text === "thirdthresholddmg") {
            return true;
        }
        if (text === "fourththresholddmg") {
            return true;
        }
        if (text === "criticaldmg") {
            return true;
        }
        return false;
    });
});
Hooks.once("setup", async function () {
    let systemVer = game.system.version;
    await migrate(systemVer);
});
//HOOKS
Hooks.once("ready", async function () {
    //change dice so nice setting
    try {
        //game.settings.set("dice-so-nice","enabledSimultaneousRollForMessage",false);
    } catch (err) {}
    if (window.EffectCounter) {
        CounterTypes.setDefaultType("icons/svg/daze.svg", "statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/net.svg", "statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/blind.svg", "statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/deaf.svg", "statuscounter.countdown_round");
        CounterTypes.setDefaultType("systems/fortyk/icons/cryo.png", "statuscounter.countdown_round");
        CounterTypes.setDefaultType("systems/fortyk/icons/spiral.png", "statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/upgrade.svg", "statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/downgrade.svg", "statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/target.svg", "statuscounter.countdown_round");
        CounterTypes.setDefaultType("icons/svg/eye.svg", "statuscounter.countdown_round");
    }
    //search for vehicles with pilots to assign them their stats
    let vehicles = Array.from(game.actors.values()).filter((actor) => actor.type === "vehicle");
    for (let i = 0; i < vehicles.length; i++) {
        let vehicle = vehicles[i];
        vehicle.preparePilot();
    }
    //for actors with psychic buffs, we need to re prepare them once all the actors have been prepared
    //prevents infinite loops when two psyker buff each other
    let actors = game.actors.values();
    /*for (let actor of actors) {
        if (actor.system.postEffects) {
            actor.prepareData();
        }
    }*/
    //SOCKET used to update actors via the damage scripts
    game.socket.on("system.fortyk", async (data) => {
        if (data.type === "cardSplash") {
            var options = {
                width: "auto",
                height: "800"
            };
            let img = data.package.img;
            let title = data.package.title;
            let dlg = new Dialog(
                {
                    title: title,
                    content: `<img src="${img}"  width="auto" height="700">`,
                    buttons: {
                        submit: {
                            label: "OK",
                            callback: null
                        }
                    },
                    default: "submit"
                },
                options
            );
            dlg.render(true);
        }
        let actors;
        if (data.type === "prepActors") {
            actors = data.package.actors;
            for (let i = 0; i < actors.length; i++) {
                let actor = fromUuidSync(actors[i]);
                actor._initialize();
                if (actor) {
                    let apps = actor.apps;
                    Object.values(apps).forEach((app) => {
                        app.render(true, { focus: false });
                    });
                }
            }
        }
        if (data.type === "renderSheets") {
            actors = data.package.actors;

            for (let i = 0; i < actors.length; i++) {
                let actor = await game.actors.get(actors[i]);
                if (actor) {
                    let apps = actor.apps;
                    Object.values(apps).forEach((app) => {
                        app.render(true, { focus: false });
                    });
                }
            }
        }
        if (data.type === "removeTarget") {
            if (game.user.id !== data.package.user) return;
            let token = canvas.tokens.get(data.package.token);
            token.setTarget(false, { releaseOthers: false });
        }

        if (game.user.isGM) {
            let id = "";
            let actor = null;
            let token = null;
            let targetIds = null;
            let value = 0;
            let targets = null;
            let hits = null;
            let user;
            let formula;
            let fortykWeapon;
            let lastHit;
            let magdamage;
            let extraPen;
            let rerollNum;
            let update;
            switch (data.type) {
                case "damageRoll":
                    user = await game.users.get(data.package.user);
                    formula = data.package.formula;
                    actor = await game.actors.get(data.package.actor);
                    fortykWeapon = actor.getEmbeddedDocument("Item", data.package.fortykWeapon);
                    if (!fortykWeapon.system.isPrepared) {
                        fortykWeapon.prepareData();
                    }
                    targetIds = data.package.targets;
                    lastHit = data.package.lastHit;
                    hits = data.package.hits;
                    magdamage = data.package.magdmg;
                    extraPen = data.package.pen;
                    rerollNum = data.package.rerollNum;
                    targets = game.scenes.current.tokens.filter((token) => targetIds.includes(token.id));
                    targets = new Set(targets);

                    await FortykRolls.damageRoll(
                        formula,
                        actor,
                        fortykWeapon,
                        hits,
                        false,
                        false,
                        magdamage,
                        extraPen,
                        rerollNum,
                        user,
                        lastHit,
                        targets
                    );
                    actor.deleteAfterAttackEffects();
                    break;
                case "blastDamageRoll":
                    user = await game.users.get(data.package.user);
                    formula = data.package.formula;
                    actor = await game.actors.get(data.package.actor);
                    fortykWeapon = actor.getEmbeddedDocument("Item", data.package.fortykWeapon);
                    if (!fortykWeapon.system.isPrepared) {
                        fortykWeapon.prepareData();
                    }
                    targetIds = data.package.targets;
                    lastHit = data.package.lastHit;
                    hits = data.package.hits;
                    magdamage = data.package.magdmg;
                    extraPen = data.package.pen;
                    rerollNum = data.package.rerollNum;
                    for (let i = 0; i < targetIds.length; i++) {
                        let curTargets = targetIds[i].targets;
                        fortykWeapon.template = targetIds[i].template;
                        let targetNames = "";
                        let targetTokens = game.scenes.current.tokens.filter((token) =>
                                                                                          curTargets.includes(token.id)
                                                                                         );
                        let targetSet = new Set(targetTokens);
                        for (let j = 0; j < targetTokens.length; j++) {
                            let token = targetTokens[j];
                            if (j === targetTokens.length - 1) {
                                targetNames += token.name;
                            } else if (j === targetTokens.length - 2) {
                                targetNames += token.name + " and ";
                            } else {
                                targetNames += token.name + ", ";
                            }
                        }
                        if (curTargets.length !== 0) {
                            game.user.updateTokenTargets(curTargets);

                            let chatBlast2 = {
                                author: game.user._id,
                                speaker: { actor, alias: actor.getName() },
                                content: `Template #${i + 1} hits ` + targetNames,
                                classes: ["fortyk"],
                                flavor: `Blast Weapon Damage`
                            };
                            await ChatMessage.create(chatBlast2, {});
                            await FortykRolls.damageRoll(
                                formula,
                                actor,
                                fortykWeapon,
                                hits,
                                false,
                                false,
                                magdamage,
                                extraPen,
                                rerollNum,
                                user,
                                lastHit,
                                targetSet
                            );

                            //clean templates after
                            let scene = game.scenes.active;
                            let templates = scene.templates;
                            for (const template of templates) {
                                if (template.isOwner) {
                                    await template.delete();
                                }
                            }
                        }
                    }
                    actor.deleteAfterAttackEffects();
                    game.user.updateTokenTargets();

                    break;
                case "settestflag":
                    let success = data.package.success;
                    let dos = data.package.dos;
                    let testObj = { success: success, dos: dos };
                    actor = await fromUuid(data.package.actor);
                    actor.setFlag("fortyk", "lasttest", testObj);
                    break;
                case "damageWithJSONWeapon":
                    user = await game.users.get(data.package.user);
                    formula = { value: data.package.formula };
                    actor = await game.actors.get(data.package.actor);
                    let weaponObj = JSON.parse(data.package.fortykWeapon);
                    fortykWeapon = await new Item(weaponObj, { temporary: true });
                    targetIds = data.package.targets;
                    lastHit = data.package.lastHit;
                    hits = data.package.hits;
                    targets = game.scenes.current.tokens.filter((token) => targetIds.includes(token.id));
                    targets = new Set(targets);

                    await FortykRolls.damageRoll(
                        formula,
                        actor,
                        fortykWeapon,
                        hits,
                        false,
                        false,
                        0,
                        0,
                        0,
                        user,
                        lastHit,
                        targets
                    );
                    actor.deleteAfterAttackEffects();
                    break;
                case "reportDamage":
                    let targetId = data.package.target;
                    let target = canvas.tokens.get(targetId);

                    let targetActor = target.actor;
                    let damage = data.package.damage;
                    FortykRolls.reportDamage(targetActor, damage);
                    break;
                case "applyActiveEffect":
                    id = data.package.token;
                    token = canvas.tokens.get(id);
                    let aeffect = data.package.effect;

                    await FortykRolls.applyActiveEffect(token, aeffect);
                    break;
                case "updateValue":
                    id = data.package.token;
                    value = data.package.value;

                    let parsedValue = parseFloat(value);
                    if (!isNaN(parsedValue)) {
                        value = parsedValue;
                    }
                    let path = data.package.path;
                    token = canvas.tokens.get(id);
                    actor = token.actor;
                    let options = {};
                    options[path] = value;
                    await actor.update(options);
                    break;
                case "updateMessage":
                    let messageId = data.package.message;
                    update = data.package.update;
                    let message = game.messages.get(messageId);
                    message.update(update);
                    break;
                case "setFlag":
                    let flag = data.package.flag;
                    let scope = data.package.scope;
                    id = data.package.token;
                    value = data.package.value;
                    token = canvas.tokens.get(id);
                    actor = token.actor;
                    actor.setFlag(scope, flag, value);
                    break;
                case "psyBuff":
                    FortyKItem.applyPsyBuffs(data.package.actorId, data.package.powerId, data.package.targetIds);
                    break;
                case "aura":
                    FortyKItem.applyAura(data.package.actorId, data.package.powerId);
                    break;
                case "cancelPsyBuff":
                    FortyKItem.cancelPsyBuffs(data.package.actorId, data.package.powerId);
                    break;
                case "psyMacro":
                    FortyKItem.executePsyMacro(
                        data.package.powerId,
                        data.package.macroId,
                        data.package.actorId,
                        data.package.targetIds
                    );
                    break;
                case "updateLoans":
                    let loaned = data.package.loans;
                    update = data.package.update;
                    for (let i = 0; i < loaned.length; i++) {
                        let knight = await game.actors.get(loaned[i].knightId);
                        let update1 = foundry.utils.duplicate(update);
                        update1["_id"] = loaned[i].itemId;

                        try {
                            await knight.updateEmbeddedDocuments("Item", [update1]);
                        } catch (err) {}
                    }
                    break;
                case "forcefieldRoll":
                    targetIds = data.package.targets;
                    hits = data.package.hits;
                    targets = game.scenes.current.tokens.filter((token) => targetIds.includes(token.id));

                    targets = new Set(targets);
                    for (let tar of targets) {
                        let tarActor = tar.actor;
                        let forcefield = tarActor.system.secChar.wornGear.forceField.document;
                        if (forcefield) {
                            FortykRolls.fortykForcefieldTest(forcefield, tarActor, hits);
                        }
                    }
                    break;
                case "critEffect":
                    id = data.package.token;
                    token = canvas.tokens.get(id);
                    await FortykRolls.critEffects(
                        token,
                        data.package.num,
                        data.package.hitLoc,
                        data.package.type,
                        data.package.ignoreSON
                    );
                    break;

                case "applyDead":
                    id = data.package.token;
                    token = canvas.tokens.get(id);
                    actor = data.package.actor;
                    let cause = data.package.cause;
                    FortykRolls.applyDead(token, actor, null, cause);
                    break;
                case "perilsRoll":
                    let ork = data.package.ork;
                    let actorId = data.package.actorId;
                    actor = game.actors.get(actorId);
                    FortykRolls.perilsOfTheWarp(actor, ork);
                    break;
                case "rotateShield":
                    id = data.package.tokenId;
                    token = canvas.tokens.get(id);
                    let rotation = parseInt(data.package.angle);
                    let lightId = await tokenAttacher.getAllAttachedElementsByTypeOfToken(token, "AmbientLight")[0];

                    let lightObj = game.canvas.lighting.get(lightId);

                    let lightData = foundry.utils.duplicate(lightObj.document);

                    tokenAttacher.detachElementFromToken(lightObj, token, true);
                    lightObj.document.delete();

                    let tokenRotation = token.document.rotation;

                    rotation += tokenRotation;
                    lightData.rotation = rotation;
                    let newLights = await game.canvas.scene.createEmbeddedDocuments("AmbientLight", [lightData]);

                    let newLight = newLights[0];
                    await tokenAttacher.attachElementToToken(newLight, token, true);
                    break;
            }
        }
    });
});
//handle start of combat effects
Hooks.on("combatStart", (combat, updateData) => {
    if (game.user.isGM) {
        let enemyFears = [];
        let pcFears = [];
        let combatants = combat.combatants;
        for (const combatant of combatants) {
            let actor = combatant.actor;
            let token = combatant.token;
            if (actor.getFlag("fortyk", "fear")) {
                if (token.disposition === -1) {
                    enemyFears.push({ name: actor.getName(), fear: actor.getFlag("fortyk", "fear"), token: token });
                } else if (token.disposition === 1) {
                    pcFears.push({ name: actor.getName(), fear: actor.getFlag("fortyk", "fear") });
                }
            }
            if (actor.getFlag("fortyk", "sanguinethirst")) {
                actor.setFlag("fortyk", "butchercounter", 0);
            }
        }
        if (enemyFears.length > 0) {
            let chosenFear = { name: "", fear: -1 };
            for (const fear of enemyFears) {
                if (fear.fear > chosenFear.fear) {
                    chosenFear = fear;
                }
            }
            let content = `${chosenFear.name} causes fear! Test against fear(${chosenFear.fear})!`;
            let fearOptions = {
                author: game.user._id,
                speaker: { alias: "Fear" },
                content: content,
                classes: ["fortyk"],
                flavor: `Enemy Fear Rating`
            };
            ChatMessage.create(fearOptions, {});
            let bubble = new ChatBubbles();
            bubble.broadcast(chosenFear.token, content, { pan: true });
        }
        if (pcFears.length > 0) {
            let chosenFear = { name: "", fear: -1 };
            for (const fear of pcFears) {
                if (fear.fear > chosenFear.fear) {
                    chosenFear = fear;
                }
            }
            let fearOptions = {
                author: game.user._id,
                speaker: { alias: "Fear" },
                content: `${chosenFear.name} causes fear! Test against fear(${chosenFear.fear})!`,
                classes: ["fortyk"],
                flavor: `Friendly Fear Rating`
            };
            ChatMessage.create(fearOptions, {});
        }
    }
});
//round management effects, when a token's turn starts
Hooks.on("updateCombat", async (combat) => {
    game.user.updateTokenTargets();
    game.user.broadcastActivity({ targets: [] });
    //current combatant stuff
    let token = canvas.tokens.get(combat.current.tokenId);
    if (token === undefined) {
        return;
    }
    let actor = token.actor;
    //PAN CAMERA TO ACTIVE TOKEN
    await canvas.animatePan({ x: token.x, y: token.y });
    if (game.user.isGM) {
        //previous combatant stuff
        try {
            let previousToken = canvas.tokens.get(combat.previous.tokenId);
            let previousActor = previousToken.actor;
            let tempMod = previousActor.system.secChar.tempMod.value;
            if (tempMod) {
                previousActor.update({ "system.secChar.tempMod.value": 0 });
            }
        } catch (err) {}

        const currentWindows = Object.values(ui.windows);

        for (let window of currentWindows) {
            if (window.actor) await window.close();
        }
        if (actor.type === "npc") {
            await actor.sheet.render(true);
        }
        if (actor.getFlag("fortyk", "hardtargetEvasion")) {
            await actor.setFlag("fortyk", "hardtargetEvasion", false);
        }
        if (actor.getFlag("fortyk", "tidesoftime")) {
            if (combat.round % 2 === 0) {
                let content = "I have an extra half action this round!";
                let tidesOptions = {
                    author: game.user._id,
                    speaker: ChatMessage.getSpeaker({ token: token }),
                    content: content,
                    classes: ["fortyk"],
                    flavor: `Tides of Time`
                };
                await ChatMessage.create(tidesOptions, {});
                let bubble = new ChatBubbles();
                bubble.broadcast(token, content);
                actor.setFlag("fortyk", "tidesreaction", false);
            } else {
                let content = "I have an extra reaction this round!";
                let tidesOptions = {
                    author: game.user._id,
                    speaker: ChatMessage.getSpeaker({ token: token }),
                    content: content,
                    classes: ["fortyk"],
                    flavor: `Tides of Time`
                };
                await ChatMessage.create(tidesOptions, {});
                let bubble = new ChatBubbles();
                bubble.broadcast(token, content);
                actor.setFlag("fortyk", "tidesreaction", true);
            }
        }
        if (actor.type !== "vehicle" && actor.system.psykana.pr.sustained.length > 0) {
            let sustainedIds = actor.system.psykana.pr.sustained;

            let content = "<span>Sustaining the following Powers: </span>";
            let count = 0;
            for (let i = 0; i < sustainedIds.length; i++) {
                let powerId = sustainedIds[i];
                let power = actor.getEmbeddedDocument("Item", powerId);
                if (power) {
                    content += `<p>${power.name} as a ${power.system.sustain.value} </p>`;
                    count++;
                }
            }
            if (count) {
                let sustainedPowersOptions = {
                    author: game.user._id,
                    speaker: ChatMessage.getSpeaker({ token: token }),
                    content: content,
                    classes: ["fortyk"],
                    flavor: `Sustained Psychic Powers`
                };
                await ChatMessage.create(sustainedPowersOptions, {});
                let bubble = new ChatBubbles();
                bubble.broadcast(token, content);
            }
        }
        var dead = {};
        let aeTime = async function (activeEffect, actor) {
            if (activeEffect.duration.rounds !== null && !activeEffect.disabled) {
                let remaining = Math.ceil(activeEffect.duration.rounds);
                if (remaining < 1) {
                    remaining = 0;
                }
                let content = "";

                if (activeEffect.name !== "Evasion") {
                    if (remaining === 0) {
                        content = `${activeEffect.name}, affecting ${activeEffect.parent.name} expires.`;
                    } else {
                        let rounds = "round";
                        if (remaining !== 1) {
                            rounds += "s";
                        }
                        content = `${activeEffect.name}, affecting ${activeEffect.parent.name} has ${remaining} ${rounds} remaining.`;
                    }
                    let activeEffectOptions = {
                        author: game.user._id,
                        speaker: { actor, alias: actor.getName() },
                        content: content,
                        classes: ["fortyk"],
                        flavor: `${activeEffect.name} duration.`
                    };
                    await ChatMessage.create(activeEffectOptions, {});
                }
                try {
                    if (remaining <= 0) {
                        await activeEffect.delete({});
                        return true;
                    } else {
                        remaining--;
                        await activeEffect.update({ "duration.rounds": remaining });
                        return false;
                    }
                } catch (err) {
                    return false;
                }
            } else {
                return false;
            }
        };

        for (let activeEffect of actor.effects) {
            let expired = await aeTime(activeEffect, actor);
            if (expired) continue;
            //check for flags
            if (activeEffect.getFlag("fortyk", "startofround")) {
                let startofRoundOptions = {
                    author: game.user._id,
                    speaker: { actor, alias: actor.getName() },
                    content: activeEffect.getFlag("fortyk", "startofround"),
                    classes: ["fortyk"],
                    flavor: `Start of round effect`
                };
                await ChatMessage.create(startofRoundOptions, {});
            }
            if (activeEffect.statuses) {
                if (activeEffect.statuses.has("unconscious")) {
                    dead = activeEffect;
                }
                if (activeEffect.statuses.has("crippled")) {
                    let crippled = activeEffect.getFlag("fortyk", "crippling");

                    let crippledOptions = {
                        author: game.user._id,
                        speaker: { actor, alias: actor.getName() },
                        content: `${actor.getName()} will take ${crippled.num} rending damage ignoring any damage reduction to the ${crippled.location.label} should he take more than a half action.`,
                        classes: ["fortyk"],
                        flavor: `Crippled!`
                    };
                    await ChatMessage.create(crippledOptions, {});
                }
                //check for fire
                if (activeEffect.statuses.has("fire")) {
                    if (actor.type !== "vehicle") {
                        let onFireOptions = {
                            author: game.user._id,
                            speaker: { actor, alias: actor.getName() },
                            content:
                            "On round start, test willpower to act, suffer 1 level of fatigue and take 1d10 damage ignoring armor.",
                            classes: ["fortyk"],
                            flavor: `On Fire!`
                        };
                        await ChatMessage.create(onFireOptions, {});
                        if (
                            !(
                                actor.getFlag("core", "frenzy") ||
                                actor.getFlag("fortyk", "fearless") ||
                                actor.getFlag("fortyk", "frombeyond")
                            )
                        ) {
                            let wp = actor.system.characteristics.wp.total;
                            if (actor.getFlag("fortyk", "resistance")?.toLowerCase().includes("fear")) {
                                wp += 10;
                            }
                            await FortykRolls.fortykTest("wp", "char", wp, actor, "On Fire! Panic");
                        }

                        let fatigue = parseInt(actor.system.secChar.fatigue.value) + 1;
                        await actor.update({ "system.secChar.fatigue.value": fatigue });
                        let fireData = { name: "Fire", type: "rangedWeapon" };
                        let fire = await new Item(fireData, { temporary: true });
                        fire.flags.fortyk = {};
                        fire.system.damageType.value = "Energy";
                        fire.system.pen.value = 99999;
                        await FortykRolls.damageRoll(fire.system.damageFormula, actor, fire, 1, true);
                    } else {
                        if (actor.getFlag("fortyk", "firedamage")) {
                            actor.setFlag("fortyk", "firedamage", actor.getFlag("fortyk", "firedamage") + 6);
                        } else {
                            actor.setFlag("fortyk", "firedamage", 6);
                        }
                        if (actor.getFlag("fortyk", "superheavy") && !actor.getFlag("fortyk", "platinginsulation")) {
                            let heat = parseInt(actor.system.knight.heat.value) + 1;
                            await actor.update({ "system.knight.heat.value": heat });
                            let onFireOptions = {
                                author: game.user._id,
                                speaker: { actor, alias: actor.getName() },
                                content: "On round start, gain 1 heat.",
                                classes: ["fortyk"],
                                flavor: `On Fire!`
                            };
                            await ChatMessage.create(onFireOptions, {});
                        } else {
                            let duration = activeEffect.getFlag("fortyk", "vehicleFireExplosionTimer");

                            if (duration === undefined) {
                                duration = 0;
                            }
                            let fireForm = `1d10+${duration}`;
                            let fireRoll = new Roll(fireForm, {});
                            await fireRoll.evaluate({ async: false });
                            fireRoll.toMessage({ flavor: "Testing for explosion" });
                            let result = fireRoll._total;
                            if (result >= 10) {
                                let onFireOptions = {
                                    author: game.user._id,
                                    speaker: { actor, alias: actor.getName() },
                                    content: "The vehicle explodes!",
                                    classes: ["fortyk"],
                                    flavor: `On Fire!`
                                };
                                await ChatMessage.create(onFireOptions, {});
                                let activeEffect = [
                                    foundry.utils.duplicate(
                                        game.fortyk.FORTYK.StatusEffects[
                                            game.fortyk.FORTYK.StatusEffectsIndex.get("dead")
                                        ]
                                    )
                                ];
                                await FortykRolls.applyActiveEffect(actor, activeEffect);
                            }
                            duration++;
                            await activeEffect.setFlag("fortyk", "vehicleFireExplosionTimer", duration);
                        }
                    }
                }
                //check for purifying flames
                if (activeEffect.statuses.has("purifyingflame")) {
                    if (actor.type !== "vehicle") {
                        let onFireOptions = {
                            author: game.user._id,
                            speaker: { actor, alias: actor.getName() },
                            content:
                            "On round start, test willpower to act, suffer 1 level of fatigue and take 1d10 damage ignoring armor. Deamons do not mitigate this damage and take additional damage equal to PR.",
                            classes: ["fortyk"],
                            flavor: `On Fire!`
                        };
                        await ChatMessage.create(onFireOptions, {});
                        await FortykRolls.fortykTest(
                            "wp",
                            "char",
                            actor.system.characteristics.wp.total,
                            actor,
                            "On Fire! Panic"
                        );
                        //let fatigue=parseInt(actor.system.secChar.fatigue.value)+1;
                        //await actor.update({"system.secChar.fatigue.value":fatigue});
                        let fireData = { name: "Purifying Fire", type: "rangedWeapon" };
                        let fire = await Item.create(fireData, { temporary: true });

                        fire.system.damageType.value = "Energy";
                        fire.system.pen.value = 99999;
                        if (actor.getFlag("fortyk", "daemonic")) {
                            fire.flags.fortyk = { ignoreSoak: true };
                            fire.system.damageFormula.value = activeEffect.flags.fortyk.damageString;
                        } else {
                            fire.system.damageFormula.value = "1d10";
                        }

                        await FortykRolls.damageRoll(fire.system.damageFormula, actor, fire, 1, true);
                        if (activeEffect.flags.fortyk.iconofburningflame) {
                            let pr = activeEffect.flags.fortyk.pr;
                            let burningIconOptions = {
                                author: game.user._id,
                                speaker: { actor, alias: actor.getName() },
                                content: `The Icon makes the purifying fire roar in a purging blaze! All daemons within ${pr}m must pass a willpower test or take ${pr} damage ignoring mitigation and become affected by purifying flames!`,
                                classes: ["fortyk"],
                                flavor: `Icon of Burning Flame`
                            };
                            await ChatMessage.create(burningIconOptions, {});

                            await FortykRollDialogs.soulBlaze(actor, pr, true);
                        }
                    } else {
                        if (actor.getFlag("fortyk", "firedamage")) {
                            actor.setFlag("fortyk", "firedamage", actor.getFlag("fortyk", "firedamage") + 6);
                        } else {
                            actor.setFlag("fortyk", "firedamage", 6);
                        }
                        if (actor.getFlag("fortyk", "superheavy") && !actor.getFlag("fortyk", "platinginsulation")) {
                            let heat = parseInt(actor.system.knight.heat.value) + 1;
                            await actor.update({ "system.knight.heat.value": heat });
                            let onFireOptions = {
                                author: game.user._id,
                                speaker: { actor, alias: actor.getName() },
                                content: "On round start, gain 1 heat.",
                                classes: ["fortyk"],
                                flavor: `On Fire!`
                            };
                            await ChatMessage.create(onFireOptions, {});
                        } else {
                            let duration = activeEffect.getFlag("fortyk", "vehicleFireExplosionTimer");

                            if (duration === undefined) {
                                duration = 0;
                            }
                            let fireForm = `1d10+${duration}`;
                            let fireRoll = new Roll(fireForm, {});
                            await fireRoll.evaluate({ async: false });
                            fireRoll.toMessage({ flavor: "Testing for explosion" });
                            let result = fireRoll._total;
                            if (result >= 10) {
                                let onFireOptions = {
                                    author: game.user._id,
                                    speaker: { actor, alias: actor.getName() },
                                    content: "The vehicle explodes!",
                                    classes: ["fortyk"],
                                    flavor: `On Fire!`
                                };
                                await ChatMessage.create(onFireOptions, {});
                                let activeEffect = [
                                    foundry.utils.duplicate(
                                        game.fortyk.FORTYK.StatusEffects[
                                            game.fortyk.FORTYK.StatusEffectsIndex.get("dead")
                                        ]
                                    )
                                ];
                                await FortykRolls.applyActiveEffect(actor, activeEffect);
                            }
                            duration++;
                            await activeEffect.setFlag("fortyk", "vehicleFireExplosionTimer", duration);
                        }
                    }
                }
                //check for bleeding
                if (activeEffect.statuses.has("bleeding")) {
                    let bleed = true;
                    if (actor.getFlag("fortyk", "diehard")) {
                        let diehrd = await FortykRolls.fortykTest(
                            "wp",
                            "char",
                            actor.system.characteristics.wp.total,
                            actor,
                            "Die Hard"
                        );
                        if (diehrd.value) {
                            bleed = false;
                            let dieHardOptions = {
                                author: game.user._id,
                                speaker: { actor, alias: actor.getName() },
                                content: "Resisted bleeding fatigue.",
                                classes: ["fortyk"],
                                flavor: `Bleeding`
                            };
                            await ChatMessage.create(dieHardOptions, {});
                        }
                    }
                    if (bleed) {
                        let bleedStack = 1;
                        let flavor;
                        if (bleedStack === 1) {
                            flavor = `Blood loss`;
                        } else {
                            flavor = `Blood loss`;
                        }
                        let bleedingOptions = {
                            author: game.user._id,
                            speaker: { actor, alias: actor.getName() },
                            content: `On round start gain ${bleedStack} fatigue.`,
                            classes: ["fortyk"],
                            flavor: flavor
                        };
                        await ChatMessage.create(bleedingOptions, {});
                        let fatigue = parseInt(actor.system.secChar.fatigue.value) + bleedStack;
                        await actor.update({ "system.secChar.fatigue.value": fatigue });
                    }
                }
                //check for cryo
                if (activeEffect.statuses.has("cryogenic")) {
                    let cryoContent = `<span>On round start, take [[2d10]]  toughness damage!</span>`;
                    let cryoOptions = {
                        author: game.user._id,
                        speaker: { actor, alias: actor.getName() },
                        content: cryoContent,
                        classes: ["fortyk"],
                        flavor: `Freezing`
                    };
                    let cryoMsg = await ChatMessage.create(cryoOptions, {});
                    let inlineResults = parseHtmlForInline(cryoMsg.content);
                    let tDmg = inlineResults[0];
                    let ae = [];
                    ae.push(
                        foundry.utils.duplicate(
                            game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("t")]
                        )
                    );
                    ae[0].changes = [
                        {
                            key: `system.characteristics.t.value`,
                            value: -1 * tDmg,
                            mode: game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD
                        }
                    ];
                    await FortykRolls.applyActiveEffect(token, ae);
                }
            }
        }
        for (let item of actor.items) {
            for (let ae of item.effects) {
                aeTime(ae, actor);
            }
        }
        //check for regeneration
        if (actor.getFlag("fortyk", "regeneration")) {
            let regenAmt = parseInt(actor.getFlag("fortyk", "regeneration"));
            if (actor.system.race.value === "Necron" && actor.getFlag("core", "unconscious")) {
                let reanimation = await FortykRolls.fortykTest(
                    "t",
                    "char",
                    actor.system.characteristics.t.total,
                    actor,
                    "Reanimation protocol"
                );

                if (reanimation.value) {
                    let reanimationOptions = {
                        author: game.user._id,
                        speaker: { actor, alias: actor.getName() },
                        content: `${actor.getName()} rises from the dead!`,
                        classes: ["fortyk"],
                        flavor: `Reanimation protocol`
                    };
                    await ChatMessage.create(reanimationOptions, {});
                    await dead.delete();
                    await actor.update({ "system.secChar.wounds.value": regenAmt });
                } else if (!reanimation.value && reanimation.dos >= 3) {
                    let reanimationOptions = {
                        author: game.user._id,
                        speaker: { actor, alias: actor.getName() },
                        content: `${actor.getName()} is recalled away!`,
                        classes: ["fortyk"],
                        flavor: `Reanimation protocol`
                    };
                    await ChatMessage.create(reanimationOptions, {});
                    await dead.delete();
                    let activeEffect = [
                        foundry.utils.duplicate(
                            game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("dead")]
                        )
                    ];
                    await FortykRolls.applyActiveEffect(actor, activeEffect);
                }
            } else {
                let regen = await FortykRolls.fortykTest(
                    "t",
                    "char",
                    actor.system.characteristics.t.total,
                    actor,
                    "Regeneration"
                );
                if (regen.value) {
                    let maxWounds = actor.system.secChar.wounds.max;
                    let currWounds = actor.system.secChar.wounds.value;
                    currWounds = Math.min(maxWounds, currWounds + regenAmt);
                    await actor.update({ "system.secChar.wounds.value": currWounds });
                }
            }
        }
        //frigus core
        if (actor.getFlag("fortyk", "friguscore")) {
            let heat = parseInt(actor.system.knight.heat.value);
            if (heat > 0) {
                await actor.update({ "system.knight.heat.value": heat - 1 });
                let frigusOptions = {
                    author: game.user._id,
                    speaker: { actor, alias: actor.getName() },
                    content: "On round start, lose 1 heat.",
                    classes: ["fortyk"],
                    flavor: `Frigus Core`
                };
                await ChatMessage.create(frigusOptions, {});
            }
        }
        if (actor.getFlag("fortyk", "evadeMod")) {
            await actor.setFlag("fortyk", "evadeMod", false);
        }
    }
});
Hooks.on("preDeleteCombat", async (combat, options, id) => {
    let combatants = combat.combatants;
    let scene = game.scenes.current;
    combatants.forEach(async (combatant) => {
        let actor = combatant.actor;
        let tempMod = actor.system.secChar.tempMod.value;
        if (tempMod) {
            await actor.update({ "system.secChar.tempMod.value": 0 });
        }

        let powers = actor.itemTypes.psychicPower;
        for (let power of powers) {
            if (power.getFlag("fortyk", "sustained")) {
                await FortyKItem.cancelPsyBuffs(actor.uuid, power.id);
            }
        }
        for (let activeEffect of actor.effects) {
            if (activeEffect.name === "Evasion") {
                await activeEffect.delete();
            }
            if (activeEffect.duration.type !== "none") {
                await activeEffect.delete();
            }
            if (activeEffect.getFlag("fortyk", "temp")) {
                await activeEffect.delete();
            }
        }
        if (actor.getFlag("fortyk", "evadeMod")) {
            await actor.setFlag("fortyk", "evadeMod", false);
        }
        if (actor.getFlag("fortyk", "butchercounter")) {
            await actor.setFlag("fortyk", "butchercounter", 0);
        }
        if (actor.getFlag("core", "evasion")) {
            await actor.setFlag("core", "evasion", false);
        }
        if (actor.getFlag("fortyk", "versatile")) {
            await actor.setFlag("fortyk", "versatile", false);
        }
        await actor.update({ "system.secChar.lastHit.type": null });
    });
    //game.scene.setFlag("fortyk", "activeAuras",[]);
});
Hooks.on("preUpdateActor", (data, updatedData) => {});
//add listeners to the chatlog for dice rolls
Hooks.on("renderChatLog", (log, html, data) => {
    console.log(log,html,data)
    FortykRollDialogs.chatListeners(log);
    });
//add listeners to dialogs to allow searching and the like
Hooks.on("renderDialog", (dialog, html, data) => ActorDialogs.chatListeners(html));
//add listeners to compendiums for knight sheet interaction
Hooks.on("renderCompendium", (compendium, html, data) => {
    let knightComponentSlot = function (component) {
        let componentType = component.type;
        if (componentType === "meleeWeapon") {
            return ".melee-slot";
        }
        if (componentType === "rangedWeapon") {
            let weaponClass = component.system.class.value;
            if (weaponClass === "Titanic Ranged Weapon") {
                return ".ranged-slot";
            } else if (weaponClass === "Titanic Artillery Weapon") {
                return ".artillery-slot";
            } else {
                return ".auxiliary-slot";
            }
        }
        if (componentType === "knightCore") {
            return ".core-slot";
        }
        if (componentType === "knightArmor") {
            return ".armor-slot";
        }
        if (componentType === "knightStructure") {
            return ".structure-slot";
        }
        if (componentType === "forceField") {
            return ".forceField-slot";
        }
        if (componentType === "knightComponent") {
            let componentSubType = component.system.type.value;
            if (componentSubType === "other") {
                return ".other-slot";
            }
            if (componentSubType === "core-mod") {
                return ".core-mod-slot";
            }
            if (componentSubType === "throne-mod") {
                return ".throne-mod-slot";
            }
            if (componentSubType === "plating") {
                return ".plating-slot";
            }
            if (componentSubType === "sensor") {
                return ".sensor-slot";
            }
            if (componentSubType === "gyro") {
                return ".gyro-slot";
            }
            if (componentSubType === "arm-actuator") {
                return ".arm-actuator-slot";
            }
            if (componentSubType === "leg-actuator") {
                return ".leg-actuator-slot";
            }
        }
        if (componentType === "ammunition") {
            return ".other-slot";
        }
        return false;
    };
    let onDragComponent = async function (event) {
        let compendiumId = compendium.id.replace("compendium-", "");

        let compendiumObj = await game.packs.get(compendiumId);
        let transfer = {};
        transfer.compendium = true;
        transfer.compendiumId = compendiumId;
        transfer.componentId = event.target.dataset["entryId"];

        let item = await compendiumObj.getDocument(event.target.dataset["entryId"]);
        let type = knightComponentSlot(item);
        event.target.attributes["name"] = type;
        let validSlots = document.querySelectorAll(type);
        validSlots.forEach(function (item) {
            item.classList.add("highlight-slot");
        });
        //let transferString=JSON.stringify(transfer);
        //console.log(transferString)
        // event.dataTransfer.setData("text1", transferString);
        //event.dataTransfer.effectAllowed="copy";
    };
    let onStopDragComponent = function (event) {
        if (compendium.id.indexOf("knight") === -1) {
            return;
        }
        let type = event.target.attributes["name"];
        let validSlots = document.querySelectorAll(type);
        validSlots.forEach(function (item) {
            item.classList.remove("highlight-slot");
        });
    };

    $(html).find(".directory-item").each((i, li) => {
        li.addEventListener("dragstart", onDragComponent.bind(compendium), false);
        li.addEventListener("dragend", onStopDragComponent.bind(compendium), false);
        //li.addEventListener("dragover", this._onDragOverSlot.bind(compendium), false);
    });
});

Hooks.on("preCreateItem", (actor, data, options) => {});
//set flags on the actor when adding an active effect if it should activate a flag
Hooks.on("createActiveEffect", async (ae, options, id) => {
    if (game.user.isGM) {
        let actor = ae.parent;
        ae.statuses.forEach(async function (value1, value2) {
            let flag = value1;
            if (flag === "evasion") {
                await actor.setFlag("core", flag, ae.flags.fortyk.evasion);
            } else {
                await actor.setFlag("core", flag, true);
            }
            let statuses = actor.statuses;
            statuses.add(flag);
            actor.update({ statuses: statuses });
        });
    }
});
//unset flags on the actor when removing an active effect if it had a flag
Hooks.on("deleteActiveEffect", async (ae, options, id) => {
    if (game.user.isGM) {
        let actor = ae.parent;

        ae.statuses.forEach(async function (value1, value2, ae) {
            let flag = value1;

            await actor.setFlag("core", flag, false);
            let statuses = actor.statuses;
            statuses.delete(flag);
            actor.update({ statuses: statuses });
        });
    }
});
/**
 * Add the manage active effects button to actor sheets
 */
Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
    if (game.user.isGM) {
        let button = {};
        button.class = "custom";
        button.icon = "fas fa-asterisk";
        button.label = "Manage AEs";
        button.onclick = async () => {
            let actor = sheet.actor;
            if (sheet.token) {
                actor = sheet.token.actor;
            }

            var options = {
                id: "aeDialog"
            };
            var d = new ActiveEffectDialog(
                {
                    title: "Active Effects",
                    actor: actor,
                    buttons: {
                        button: {
                            label: "Ok",
                            callback: async (html) => {
                                sheet.actor.dialog = undefined;
                            }
                        }
                    },
                    close: function () {
                        sheet.actor.dialog = undefined;
                    }
                },
                options
            ).render(true);
            sheet.actor.dialog = d;
        };
        let close = buttons.pop();
        buttons.push(button);
        buttons.push(close);
    }
});
Hooks.on("preCreateActor", (createData) => {});
Hooks.on("preDeleteToken", async (tokenDocument, options, userId) => {
    if (!game.user.isGM) return;
});
Hooks.on("preCreateToken", async (document, data, options, userId) => {
    if (!game.user.isGM) return;
    //modify token dimensions if scene ratio isnt 1
    let gridRatio = canvas.dimensions.distance;
    let newHeight = Math.max(0.1, document.height / gridRatio);
    let newWidth = Math.max(0.1, document.width / gridRatio);
    if (newHeight !== document.height || newWidth !== document.width) {
        await document.updateSource({ height: newHeight, width: newWidth });
    }
});
Hooks.on("createToken", async (tokenDocument, options, userId) => {
    if (!game.user.isGM) return;
    let actor = tokenDocument.actor;
    if (actor.getFlag("core", "dead")) return;
    let tokenObject = tokenDocument.object;
    tokenObject.x = tokenDocument.x;
    tokenObject.y = tokenDocument.y;
    let tnts = actor.itemTypes.talentntrait;

    tnts=tnts.concat(actor.itemTypes.wargear);
    let scene = game.scenes.current;
    let activeAuras = scene.getFlag("fortyk", "activeAuras");
    if (!activeAuras) activeAuras = [];
    for (let talent of tnts) {
        if (talent.system.isAura.value) {
            let auraBuffs = talent.getFlag("fortyk", "sustained");
            if (auraBuffs) {
                for (let buffId of auraBuffs) {
                    let auraBuff = await fromUuid(buffId);
                    if (auraBuff) {
                        await auraBuff.delete();
                    }
                }
            }

            activeAuras.push(talent.uuid);

            let auraType = talent.system.isAura.auraType;
            let targets;
            let tokens = game.scenes.current.tokens;

            switch (auraType) {
                case "friendly":
                    tokens = tokens.filter((token) => token.disposition === tokenDocument.disposition);
                    break;
                case "hostile":
                    tokens = tokens.filter((token) => token.disposition !== tokenDocument.disposition);
                    break;
            }
            if (talent.system.isAura.notSelf) {
                tokens = tokens.filter((token) => token.id !== tokenDocument.id);
            }

            let reqFlags=talent.system.isAura.reqFlags.split(",");
            let negReqFlags=talent.system.isAura.negReqFlags.split(",");
            tokens = tokens.filter((token) => {
                let targetActor=token.actor;
                let skip=false;
                for(let reqFlag of reqFlags){
                    reqFlag=reqFlag.trim();
                    if(reqFlag==="")continue;
                    if(!targetActor.getFlag("fortyk",reqFlag))skip=true;
                }
                return !skip;
            });
            tokens = tokens.filter((token) => {
                let targetActor=token.actor;
                let skip=false;
                for(let negReqFlag of negReqFlags){
                    negReqFlag=negReqFlag.trim();
                    if(negReqFlag==="")continue;
                    if(targetActor.getFlag("fortyk",negReqFlag))skip=true;
                }
                return !skip;
            });
            let los = talent.system.isAura.los;
            if (los) {
                tokens = tokens.filter((token) => {
                    const collision = CONFIG.Canvas.polygonBackends["sight"].testCollision(
                        tokenObject.center,
                        token._object.center,
                        { mode: "any", type: "sight" }
                    );
                    return !collision;
                });
            }
            let range = parseInt(talent.system.isAura.range);

            targets = tokens.filter((token) => !token.actor.getFlag("core", talent._source.name));
            targets = targets.filter((token) => range >= tokenDistance(token, tokenObject));



            let ae = talent.effects.entries().next().value[1];
            let aeData = foundry.utils.duplicate(ae);

            aeData.name = talent._source.name;

            aeData.flags = {
                fortyk: { aura: true, los: los, range: range, casterTokenId: tokenDocument.id }
            };

            aeData.disabled = false;
            aeData.origin = talent.uuid;
            aeData.statuses = [ae.name];

            let effectUuIds = [];
            for (let i = 0; i < targets.length; i++) {
                let target = targets[i];

                let targetActor = target.actor;
                let render = false;

                let effect = await targetActor.createEmbeddedDocuments("ActiveEffect", [aeData], { render: render });

                let ae = effect[0];
                let effectuuid = await ae.uuid;

                effectUuIds.push(effectuuid);
            }

            await talent.setFlag("fortyk", "sustained", effectUuIds);
            await talent.setFlag("fortyk", "sustainedrange", range);
        }
    }
    scene.setFlag("fortyk", "activeAuras", activeAuras);
});

Hooks.on("moveToken", async (token, options) => {


    if (!game.user.isGM) return;

    let tokenDocument = token.document;
    let scene = game.scenes.current;
    let actor = token.actor;
    let aes = actor.effects;
    for (const ae of aes) {
        if (!ae) continue;
        if (ae.getFlag("fortyk", "psy") || ae.getFlag("fortyk", "aura")) {
            let range = parseInt(ae.getFlag("fortyk", "range"));
            let casterId = ae.getFlag("fortyk", "casterTokenId");
            let casterToken = game.scenes.current.tokens.find((child) => child.id === casterId);
            if(!casterToken){
                await ae.delete();
                continue;
            }
            let distance = tokenDistance(token, casterToken);
            if (distance > range) {
                await ae.delete();
                continue;
            }
            let los = ae.getFlag("fortyk", "los");
            if (los) {
                const collision = CONFIG.Canvas.polygonBackends["sight"].testCollision(
                    token.center,
                    casterToken.center,
                    { mode: "any", type: "sight" }
                );
                if (collision) {
                    await ae.delete();
                }
            }
        }
    }
    let psyPowers = actor.itemTypes.psychicPower;
    for (const power of psyPowers) {
        if (power.getFlag("fortyk", "sustained")) {
            let range = parseInt(power.getFlag("fortyk", "sustainedrange"));
            let buffs = power.getFlag("fortyk", "sustained");
            if (!buffs) continue;
            for (const buffId of buffs) {
                let buff = await fromUuid(buffId);
                if (buff) {
                    let parent = buff.parent;
                    if (parent instanceof Item) {
                        parent = parent.actor;
                    }
                    let buffTarget = getActorToken(parent);
                    let distance = tokenDistance(buffTarget, token);
                    if (distance > range) {
                        await buff.delete();
                        continue;
                    }
                    let los = buff.getFlag("fortyk", "los");
                    if (los) {
                        const collision = CONFIG.Canvas.polygonBackends["sight"].testCollision(
                            token.center,
                            buffTarget.center,
                            { mode: "any", type: "sight" }
                        );
                        if (collision) {
                            await buff.delete();
                        }
                    }
                }
            }
        }
    }
    let tnts = actor.itemTypes.talentntrait;
    tnts = tnts.concat(actor.itemTypes.wargear);
    for (const talent of tnts) {
        if (talent.system.isAura.value) {
            let range = parseInt(talent.system.isAura.range);
            let buffs = talent.getFlag("fortyk", "sustained");
            if (!buffs) continue;
            for (const buffId of buffs) {
                let buff = await fromUuid(buffId);
                if (buff) {
                    let parent = buff.parent;
                    if (parent instanceof Item) {
                        parent = parent.actor;
                    }
                    let buffTarget = getActorToken(parent);
                    let distance = tokenDistance(buffTarget, token);
                    if (distance > range) {
                        await buff.delete();
                    }
                    let los = buff.getFlag("fortyk", "los");
                    if (los) {
                        const collision = CONFIG.Canvas.polygonBackends["sight"].testCollision(
                            token.center,
                            buffTarget.center,
                            { mode: "any", type: "sight" }
                        );
                        if (collision) {
                            await buff.delete();
                        }
                    }
                }
            }
        }
    }
    let auras = scene.getFlag("fortyk", "activeAuras");
    if (!auras) auras = [];
    auras=auras.filter((aura)=>{
        let instance= fromUuidSync(aura);
        if(instance){
            return true;
        }else{
            return false;
        }
    });
    await scene.setFlag("fortyk", "activeAuras", auras);
    await applySceneAuras(auras, token);

});

Hooks.on("updateToken", async (token, diff, options, id) => {
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
            let chatUnconscious={author: game.user._id,
                                 speaker:{tokenActor,alias:tokenactor.getName()},
                                 content:`${tokenactor.getName()} falls unconscious from fatigue!`,
                                 classes:["fortyk"],
                                 flavor:`Fatigue pass out`};
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
    class FortykSpeedProvider extends Speedprovider {
        get colors() {
            return [
                { id: "half", default: 0xadd8e6, name: "Half Move" },
                { id: "full", default: 0x191970, name: "Full Move" },
                { id: "charge", default: 0xffa500, name: "Charge Move" },
                { id: "run", default: 0xffff00, name: "Run" }
            ];
        }
        getRanges(token) {
            let movement;
            let ranges;
            if (token.actor.type === "spaceship") {
                ranges = [];
            } else if (token.actor.type === "vehicle") {
                movement = token.actor.system.secChar.speed;
                if (token.actor.getFlag("fortyk", "enhancedmotivesystem")) {
                    ranges = [
                        { range: movement.tactical * 2, color: "full" },
                        { range: movement.tactical * 3, color: "run" }
                    ];
                } else if (token.actor.getFlag("fortyk", "ponderous")) {
                    ranges = [
                        { range: movement.tactical / 2, color: "full" },
                        { range: movement.tactical, color: "run" }
                    ];
                } else {
                    ranges = [
                        { range: movement.tactical, color: "full" },
                        { range: movement.tactical * 2, color: "run" }
                    ];
                }
            } else {
                movement = token.actor.system.secChar.movement;
                ranges = [
                    { range: movement.half, color: "half" },
                    { range: movement.full, color: "full" },
                    { range: movement.charge, color: "charge" },
                    { range: movement.run, color: "run" }
                ];
            }
            return ranges;
        }
    }
    dragRuler.registerSystem("fortyk", FortykSpeedProvider);
});
Hooks.on("simple-calendar-date-time-change", async (dateData) => {
    if (!SimpleCalendar.api.isPrimaryGM()) {
        return;
    }
    let timeElapsed = dateData.diff;
    let houses = game.actors.filter(function (actor) {
        return actor.type === "knightHouse";
    });

    houses.forEach(async function (house) {
        let currentRepairIds = house.system.repairBays.current;
        currentRepairIds.forEach(async function (repairId) {
            let repair = house.getEmbeddedDocument("Item", repairId);
            if (!repair) {
                return;
            }
            let time = repair.system.time.value;
            if (time > timeElapsed) {
                repair.update({ "system.time.value": time - timeElapsed });
            } else {
                let knight = game.actors.get(repair.system.knight.value);
                let wounds = repair.system.repairs.wounds;
                let repairEntries = repair.system.repairs.entries;
                if (wounds) {
                    await knight.update({ "system.secChar.wounds.value": knight.system.secChar.wounds.value + wounds });
                }
                repairEntries.forEach(async function (entry) {
                    let type = entry.type;
                    let uuid = entry.uuid;
                    let item = fromUuidSync(uuid);
                    if (!item) {
                        return;
                    }
                    if (type === "damagedionshield" || type === "destroyedionshield" || type === "damagedcomponent") {
                        await item.update({ "system.state.value": "O" });
                    } else if (type === "install/removecomponent") {
                        let path = item.system.path;

                        let data = knight.system;
                        let house = await game.actors.get(data.knight.house);
                        //if the knight is linked to a house update the house inventory
                        if (house) {
                            let component = await house.getEmbeddedDocument("Item", item.system.originalId);
                            if (component) {
                                let amtTaken = component.system.amount.taken;
                                let newAmt = amtTaken - 1;

                                var componentUpdate = {};

                                if (item.system.state.value === "X" || item.system.state.value === 0) {
                                    let amt = parseInt(component.system.amount.value);
                                    componentUpdate["system.amount.value"] = amt - 1;
                                }
                                componentUpdate["system.amount.taken"] = newAmt;
                                let loans = component.system.loaned;

                                let newLoans = loans.filter(
                                    (loan) => loan.knightId !== knight.id && item.id !== loan.itemId
                                );
                                componentUpdate["system.loaned"] = newLoans;
                                await component.update(componentUpdate);
                            }
                        }

                        let update = {};
                        if (path.indexOf("components") !== -1) {
                            var array = objectByString(knight, path).filter(function (id) {
                                return id !== item.id;
                            });

                            update[path] = array;
                        } else {
                            update[path] = "";
                        }

                        await knight.update(update);

                        await knight.deleteEmbeddedDocuments("Item", [item.id]);
                    } else if (type === "refittitanicweapon") {
                        let data = knight.system;
                        let chassis = await knight.getEmbeddedDocument("Item", data.knight.chassis);
                        let path = item.system.path;
                        //if the knight is linked to a house update the house inventory
                        if (house) {
                            let component = await house.getEmbeddedDocument("Item", item.system.originalId);
                            let amtTaken = component.system.amount.taken;
                            let newAmt = amtTaken - 1;
                            let componentUpdate = {};
                            if (item.system.state.value === "X" || item.system.state.value === 0) {
                                let amt = parseInt(component.system.amount.value);
                                componentUpdate["system.amount.value"] = amt - 1;
                            }
                            componentUpdate["system.amount.taken"] = newAmt;
                            let loans = component.system.loaned;
                            let newLoans = loans.filter(
                                (loan) => loan.knightId !== knight.id && loan.itemId !== item.id
                            );
                            componentUpdate["system.loaned"] = newLoans;
                            await component.update(componentUpdate);
                        }

                        let array = objectByString(chassis, path).map(function (id) {
                            if (id === item.id) {
                                return "";
                            }
                        });

                        let chassisUpdate = {};
                        chassisUpdate[path] = array;

                        await chassis.update(chassisUpdate);

                        await knight.deleteEmbeddedDocuments("Item", [item.id]);
                    } else if (type === "damagedcore") {
                        let quality = item.system.quality.value;
                        let maxInt = game.fortyk.FORTYK.coreIntegrities[quality];
                        await item.update({ "system.state.value": maxInt });
                    } else if (type === "firedamage") {
                        await knight.setFlag("fortyk", "firedamage", 0);
                    } else if (type === "armordmg") {
                        let armorDmgIds = entry.effectIds;
                        armorDmgIds.forEach(async function (effectId) {
                            let armorEffect = fromUuidSync(effectId);
                            await armorEffect.delete();
                        });
                    } else {
                        await item.delete();
                    }
                });
                SimpleCalendar.api.removeNote(repair.system.calendar.noteId);

                let queue = house.system.repairBays.queue;
                let newCurrent = currentRepairIds.filter(function (id) {
                    return id !== repairId;
                });

                if (queue.length > 0) {
                    newCurrent.push(queue.pop());
                    let newCurrentRepairId = newCurrent[newCurrent.length - 1];
                    let newCurrentRepair = house.getEmbeddedDocument("Item", newCurrentRepairId);
                    let time = newCurrentRepair.system.time.value;
                    let calendar = SimpleCalendar.api.getCurrentCalendar();
                    let currentTime = SimpleCalendar.api.timestamp(calendar.id);

                    let noteTime = currentTime + time;

                    let formattedTime = SimpleCalendar.api.timestampToDate(noteTime, calendar.id);

                    let note = await SimpleCalendar.api.addNote(
                        newCurrentRepair.name,
                        repair.system.description.value,
                        formattedTime,
                        formattedTime,
                        true,
                        false,
                        ["Repairs"],
                        calendar.id,
                        "",
                        ["default"],
                        [game.user.id]
                    );
                    await newCurrentRepair.update({ "system.calendar.noteId": note.id });
                }
                let chatMsg = {
                    author: game.user._id,
                    speaker: { house, alias: game.user.character.name },
                    content: repair.system.description.value,
                    classes: ["fortyk"],
                    flavor: `Repair entry for ${knight.name} has completed successfully`
                };
                await ChatMessage.create(chatMsg, {});
                await house.update({ "system.repairBays.current": newCurrent, "system.repairBays.queue": queue });
                await repair.delete();
            }
        });
    });
});
Hooks.once("enhancedTerrainLayer.ready", (RuleProvider) => {
    class FortykSystemRuleProvider extends RuleProvider {
        calculateCombinedCost(terrain, options) {
            if (terrain.length === 0) {
                return 1;
            }

            let cost = terrain[0].cost;
            if (!cost) {
                cost = 1;
            }
            let token = options.token;
            let actor;
            if (token) {
                actor = token.actor;
            }

            if (
                actor &&
                (actor.getFlag("fortyk", "jump") ||
                 actor.getFlag("fortyk", "crawler") ||
                 actor.getFlag("fortyk", "hoverer") ||
                 actor.getFlag("fortyk", "flyer") ||
                 actor.getFlag("fortyk", "skimmer"))
            ) {
                cost = 1;
            }
            return cost;
        }
    }
    enhancedTerrainLayer.registerSystem("fortyk", FortykSystemRuleProvider);
});
Hooks.once("item-piles-ready", async () => {
    let priceString = "system.price.value";
    let currencyName = "Imperial Eagle";
    let currencyAbrv = "IE";
    if (game.settings.get("fortyk", "bonds")) {
        priceString = "system.price.bonds";
        currencyName = "Imperial Bond";
        currencyAbrv = "IB";
    }

    const baseConfig = {
        // These keys and setting are unlikely to ever change

        // The actor class type is the type of actor that will be used for the default item pile actor that is created on first item drop.
        ACTOR_CLASS_TYPE: "spaceship",

        // The item class type is the type of item that will be used for the default loot item
        ITEM_CLASS_LOOT_TYPE: "wargear",

        // The item class type is the type of item that will be used for the default weapon item
        ITEM_CLASS_WEAPON_TYPE: "meleeWeapon",

        // The item class type is the type of item that will be used for the default equipment item
        ITEM_CLASS_EQUIPMENT_TYPE: "wargear",

        // The item quantity attribute is the path to the attribute on items that denote how many of that item that exists
        ITEM_QUANTITY_ATTRIBUTE: "system.amount.value",

        // The item price attribute is the path to the attribute on each item that determine how much it costs
        ITEM_PRICE_ATTRIBUTE: `${priceString}`,
        UNSTACKABLE_ITEM_TYPES: [],
        // Item filters actively remove items from the item pile inventory UI that users cannot loot, such as spells, feats, and classes
        ITEM_FILTERS: [
            {
                path: "type",
                filters:
                "psychicPower,skill,mutation,malignancy,disorder,injury,talentntrait,advancement,mission,cadetHouse,repairEntry,outpost,knightSpirit,eliteAdvance"
            }
        ],

        PILE_DEFAULTS: {
            merchantColumns: [
                {
                    label: '<i class="fa-solid fa-shield"></i>',
                    path: "system.equipped",
                    formatting: "{#}",
                    buying: false,
                    selling: true,
                    mapping: {
                        true: "✔",
                        false: ""
                    }
                },
                {
                    label: "Rarity",
                    path: "system.rarity.value",
                    formatting: "{#}",
                    buying: true,
                    selling: true,
                    mapping: {
                        60: "Ubiquitous",
                        30: "Abundant",
                        20: "Plentiful",
                        10: "Common",
                        0: "Average",
                        "-10": "Scarce",
                        "-20": "Rare",
                        "-30": "Very Rare",
                        "-40": "Extremely Rare",
                        "-50": "Near Unique",
                        "-60": "Unique"
                    }
                }
            ]
        },

        // Item similarities determines how item piles detect similarities and differences in the system
        ITEM_SIMILARITIES: ["name", "type", "system.quality.value"],

        // Currencies in item piles is a versatile system that can accept actor attributes (a number field on the actor's sheet) or items (actual items in their inventory)
        // In the case of attributes, the path is relative to the "actor.system"
        // In the case of items, it is recommended you export the item with `.toObject()` and strip out any module data
        CURRENCIES: [
            {
                type: "attribute",
                name: `${currencyName}`,
                img: "icons/commodities/currency/coin-inset-snail-silver.webp",
                abbreviation: `${currencyAbrv}`,
                data: {
                    path: "system.currency.value"
                },
                primary: true,
                exchangeRate: 1
            }
        ],

        VAULT_STYLES: [
            {
                path: "system.rarity.value",
                value: -60,
                styling: {
                    "box-shadow": "inset 0px 0px 7px 0px rgba(255,191,0,1)"
                }
            },
            {
                path: "system.rarity.value",
                value: -50,
                styling: {
                    "box-shadow": "inset 0px 0px 7px 0px rgba(255,119,0,1)"
                }
            },
            {
                path: "system.rarity.value",
                value: -40,
                styling: {
                    "box-shadow": "inset 0px 0px 7px 0px rgba(255,0,247,1)"
                }
            },
            {
                path: "system.rarity.value",
                value: -30,
                styling: {
                    "box-shadow": "inset 0px 0px 7px 0px rgba(0,136,255,1)"
                }
            },
            {
                path: "system.rarity.value",
                value: -20,
                styling: {
                    "box-shadow": "inset 0px 0px 7px 0px rgba(0,255,9,1)"
                }
            }
        ]
    };
    game.itempiles.API.addSystemIntegration(baseConfig, game.system.version);
});
/*"SYSTEM_HOOKS": () => {

            Hooks.on("dnd5e.getItemContextOptions", (item, options) => {
                options.push({
                    name: game.i18n.localize("ITEM-PILES.ContextMenu.GiveToCharacter"),
                    icon: "<i class='fa fa-user'></i>",
                    callback: async () => {
                        return game.itempiles.API.giveItem(item);
                    },
                    condition: !game.itempiles.API.isItemInvalid(item)
                })
            });

        },*/

// This function is an optional system handler that specifically transforms an item when it is added to actors
/*"ITEM_TRANSFORMER": async (itemData) => {
            ["equipped", "proficient", "prepared"].forEach(key => {
                if (itemData?.system?.[key] !== undefined) {
                    delete itemData.system[key];
                }
            });
            foundry.utils.setProperty(itemData, "system.attunement", Math.min(CONFIG.DND5E.attunementTypes.REQUIRED, itemData?.system?.attunement ?? 0));
            if (itemData.type === "spell") {
                try {
                    const scroll = await Item.implementation.createScrollFromSpell(itemData);
                    itemData = scroll.toObject();
                } catch (err) {
                }
            }
            return itemData;
        },*/

/*"PRICE_MODIFIER_TRANSFORMER": ({
            buyPriceModifier,
            sellPriceModifier,
            actor = false,
            actorPriceModifiers = []} = {}) => {

        const modifiers = {
            buyPriceModifier,
            sellPriceModifier
        };

        if (!actor) return modifiers;

        const groupModifiers = actorPriceModifiers
        .map(data => ({ ...data, actor: fromUuidSync(data.actorUuid) }))
        .filter(data => {
            return data.actor && data.actor.type === "group" && data.actor.system.members.some(member => member === actor)
        });

        modifiers.buyPriceModifier = groupModifiers.reduce((acc, data) => {
            return data.override ? data.buyPriceModifier ?? acc : acc * data.buyPriceModifier;
        }, buyPriceModifier);

        modifiers.sellPriceModifier = groupModifiers.reduce((acc, data) => {
            return data.override ? data.sellPriceModifier ?? acc : acc * data.sellPriceModifier;
        }, sellPriceModifier);

        return modifiers;

    },*/

/*"ITEM_TYPE_HANDLERS": {
            "GLOBAL": {
                [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED]: ({ item }) => {
                    const itemData = item instanceof Item ? item.toObject() : item;
                    return !!itemData?.system?.container;
                },
                    [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.IS_CONTAINED_PATH]: "system.container"
            },
                "container": {
                    [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.HAS_CURRENCY]: true,
                        [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.CONTENTS]: ({ item }) => {
                            return item.system.contents;
                        },
                            [game.itempiles.CONSTANTS.ITEM_TYPE_METHODS.TRANSFER]: ({ item, items, raw = false } = {}) => {
                                for (const containedItem of item.system.contents) {
                                    items.push(raw ? containedItem : containedItem.toObject());
                                }
                            }
                }
        }/*,

            "ITEM_COST_TRANSFORMER": (item, currencies) => {
                const overallCost = Number(foundry.utils.getProperty(item, "system.price.value")) ?? 0;
                const priceDenomination = foundry.utils.getProperty(item, "system.price.denomination");
                if (priceDenomination) {
                    const currencyDenomination = currencies
                    .filter(currency => currency.type === "attribute")
                    .find(currency => {
                        return currency.data.path.toLowerCase().endsWith(priceDenomination);
                    });
                    if (currencyDenomination) {
                        return overallCost * currencyDenomination.exchangeRate;
                    }
                }
                return overallCost ?? 0;
            }*/

/*for (const [version, data] of Object.entries(VERSIONS)) {
    await game.itempiles.API.addSystemIntegration(data, version);
}*/
