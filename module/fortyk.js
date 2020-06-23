// Import Modules
import { FortyKActor } from "./actor/actor.js";
import { FortyKActorSheet } from "./actor/actor-sheet.js";
import { FortyKItem } from "./item/item.js";
import { FortyKItemSheet } from "./item/item-sheet.js";
import { preloadHandlebarsTemplates} from "./utilities.js";
import {FortykRolls} from "./FortykRolls.js";
import { FortyKNPCSheet} from "./actor/actor-npc-sheet.js";

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
        formula: "1d10 + @characteristics.agi.bonus + (@characteristics.agi.value / 100)",
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
//HOOKS
Hooks.once('ready', async function() {

});
Hooks.on('renderChatLog', (log, html, data) => FortykRolls.chatListeners(html));