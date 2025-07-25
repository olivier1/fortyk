export const registerSystemSettings = function() {
    //Register if the user wants to disable sounds effects or not
    game.settings.register("fortyk","soundEffects",{
        name: "System Sound Effects",
        hint: "Enable system sound effects.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
    });
    //Setting if the DM wants the game to obfuscate the damage dealt and taken
    game.settings.register("fortyk","privateDamage",{
        name: "Damage Report",
        hint: "Obfuscate damage report.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
    });
    //Setting if the DM wants the game to obfuscate the perils of the warp results
    game.settings.register("fortyk","privatePerils",{
        name: "Perils Report",
        hint: "Obfuscate perils of the warp report.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
    });
    //Setting to disable the money on dark heresy sheets
    game.settings.register("fortyk","dhMoney",{
        name: "Dark Heresy Money",
        hint: "Enable a section on the dark heresy sheet if using money variant rules.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
    });
    //Setting to enable split corruption for black crusade
    game.settings.register("fortyk","bcCorruption",{
        name: "Black Crusade Corruption",
        hint: "Enable split corruption tracking for Black Crusade",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
    });
    //Setting to modify the deathwatch sheet for grey knights play
    game.settings.register("fortyk","greyKnights",{
        name: "Grey Knights",
        hint: "Modify Deathwatch character sheets for Grey Knight use.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
    });
    //Setting to change the wound rules
    game.settings.register("fortyk","alternateWounds",{
        name: "Alternate Wounds Rules",
        hint: "Changes maximum wounds to be equal to toughness bonus times willpower bonus.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
    });
    //Setting to use bonds over regular eagles
    game.settings.register("fortyk","bonds",{
        name: "Use Imperial Bonds",
        hint: "Changes monetary system to Imperial bonds instead of Eagles.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
    });
};