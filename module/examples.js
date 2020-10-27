const EXAMPLE_TRANSFERRED_EFFECT = {
        label: "Werewolf Transformation",
        icon: "icons/All-Devin-Night-Tokens/M_Werewolf_02_hi.png",
        changes: [
            { key: "data.abilities.con.value", value: 18, mode: EFFECTMODES.UPGRADE },
            { key: "data.abilities.int.value", value: 6, mode: EFFECTMODES.DOWNGRADE },
            { key: "data.attributes.speed.value", value: "40 ft", mode: EFFECTMODES.OVERRIDE },
            { key: "data.traits.di.custom", value: "floogle", mode: EFFECTMODES.CUSTOM },
            { key: "data.traits.languages.value", value: "all", mode: EFFECTMODES.CUSTOM },
            { key: "data.attributes.ac.value", value: "2", mode: EFFECTMODES.ADD },
            { key: "data.abilities.con.mod", value: "@data.abilities.str.value", mode: EFFECTMODES.UPGRADE }
        ],
        transfer: true,
    };