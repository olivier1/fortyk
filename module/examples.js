const EXAMPLE_TRANSFERRED_EFFECT = {
        label: "Werewolf Transformation",
        icon: "icons/All-Devin-Night-Tokens/M_Werewolf_02_hi.png",
        changes: [
            { key: "system.abilities.con.value", value: 18, mode: EFFECTMODES.UPGRADE },
            { key: "system.abilities.int.value", value: 6, mode: EFFECTMODES.DOWNGRADE },
            { key: "system.attributes.speed.value", value: "40 ft", mode: EFFECTTYPES.override },
            { key: "system.traits.di.custom", value: "floogle", mode: EFFECTTYPES.custom },
            { key: "system.traits.languages.value", value: "all", mode: EFFECTTYPES.custom },
            { key: "system.attributes.ac.value", value: "2", mode: EFFECTTYPES.add },
            { key: "system.abilities.con.mod", value: "@data.abilities.str.value", mode: EFFECTMODES.UPGRADE }
        ],
        transfer: true,
    };