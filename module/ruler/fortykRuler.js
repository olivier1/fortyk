import { applySceneAuras } from "../utilities.js";
import { tokenDistance } from "../utilities.js";
import { getActorToken } from "../utilities.js";
export class FortyKRuler extends Ruler{
    //OVERRIDE
    async _preMove(token){
        console.log("hello");
    }
    async _postMove(token){
        /*
        console.log(token);
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

        applySceneAuras(auras, token);
        */
    }
}
