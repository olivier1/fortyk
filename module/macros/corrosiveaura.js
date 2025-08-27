console.log("hey")
for(let target of canvas.tokens.controlled){
    let ae=foundry.utils.duplicate(
                            game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("corrode")]
                        );
    let corrosiveRoll=new Roll("1d10");
    await corrosiveRoll.evaluate();
    await corrosiveRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: `Rolling armor damage for ${target.name}.`
    });
    let corrosiveAmount=corrosiveRoll.total*-1;
    let changes=[];
    let hitLocs=Object.keys(game.fortyk.FORTYK.extraHits);
    for(let key of hitLocs){
        let change = {
            key: `system.characterHitLocations.${key}.armorMod`,
            value: corrosiveAmount,
            mode: game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD
        };
        changes.push(change);
    }
    ae.changes=changes;
    game.fortyk.FortykRolls.applyActiveEffect(target,[ae]);

}