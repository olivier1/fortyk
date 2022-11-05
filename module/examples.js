const EXAMPLE_TRANSFERRED_EFFECT = {
        label: "Werewolf Transformation",
        icon: "icons/All-Devin-Night-Tokens/M_Werewolf_02_hi.png",
        changes: [
            { key: "system.abilities.con.value", value: 18, mode: EFFECTMODES.UPGRADE },
            { key: "system.abilities.int.value", value: 6, mode: EFFECTMODES.DOWNGRADE },
            { key: "system.attributes.speed.value", value: "40 ft", mode: EFFECTMODES.OVERRIDE },
            { key: "system.traits.di.custom", value: "floogle", mode: EFFECTMODES.CUSTOM },
            { key: "system.traits.languages.value", value: "all", mode: EFFECTMODES.CUSTOM },
            { key: "system.attributes.ac.value", value: "2", mode: EFFECTMODES.ADD },
            { key: "system.abilities.con.mod", value: "@data.abilities.str.value", mode: EFFECTMODES.UPGRADE }
        ],
        transfer: true,
    };