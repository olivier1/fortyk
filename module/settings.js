export const registerSystemSettings = function() {
    //Register if the user wants to disable sounds effects or not
    game.settings.register("fortyk","soundEffects",{
        name: "System Sound Effects",
        hint: "Enable system sound effects.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
    })
    //Setting if the DM wants the game to obfuscate the damage dealt and taken
    game.settings.register("fortyk","privateDamage",{
        name: "Damage Report",
        hint: "Obfuscate damage report.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
    })
    //Setting if the DM wants the game to obfuscate the perils of the warp results
    game.settings.register("fortyk","privatePerils",{
        name: "Perils Report",
        hint: "Obfuscate perils of the warp report.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
    })
}