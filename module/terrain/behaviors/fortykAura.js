import { getActorToken } from "../../utilities.js";
const {
    BooleanField, HTMLField, SchemaField, NumberField, StringField, FilePathField, ArrayField
} = foundry.data.fields;

export class FortyKAuraBehavior extends foundry.data.regionBehaviors.ApplyActiveEffectRegionBehaviorType {

    static defineSchema() {
        const commonData=super.defineSchema();
        return {
            ...commonData,
            "auraType": new StringField({ initial: "indiscriminate",
                                         choices:{
                                             "indiscriminate":"Indiscriminate",
                                             "friendly":"Friendly",
                                             "hostile":"Hostile"
                                         },
                                         label:"Aura Type",
                                         "localize":false
                                        }),
            "los": new BooleanField({required: true, 
                                     initial:false,
                                     label:"Requires Line of Sight",
                                     localize:false}),
            "notSelf": new BooleanField({required: true, 
                                         initial:false,
                                         label:"Targets self",
                                         localize:false}),
            "reqFlags": new StringField({ initial: "",
                                         label:"Required Flags",
                                         localize:false}),
            "negReqFlags": new StringField({ initial: "",
                                            label:"Negative Flags",
                                            localize:false}),
            "status": new StringField({ initial: "",
                                       label:"Status Flag",
                                       localize:false}),
            "originId": new StringField({ initial: "",
                                         label:"Origin Actor Id",
                                         readonly:true,
                                         localize:false})
        };
    }
    #getEffectsToCreate(actor, effects) {
        const toCreate = [];
        for ( const effect of effects ) {
            const data = effect.toObject();
            delete data._id;
            if ( effect.compendium ) {
                data._stats.duplicateSource = null;
                data._stats.compendiumSource = effect.uuid;
            } else {
                data._stats.duplicateSource = effect.uuid;
                data._stats.compendiumSource = null;
            }
            data._stats.exportSource = null;
            data.origin = this.behavior.uuid;
            toCreate.push(data);
        }
        return toCreate;
    }
    static async #onTokenEnter(event) {
        if ( !event.user.isSelf ) return;
        const {token, movement} = event.data;
        const actor = token.actor;
        if ( !actor ) return;
        if(actor.statuses.has(this.status))return;
        const casterId=this.originId;
        const casterActor = await fromUuid(casterId);
        if(!casterActor) return;
        const casterToken = getActorToken(casterActor).document;
        if(!casterToken) return;
        
        if (casterActor && casterActor.getFlag("core", "dead")) return;
        if( this.notSelf && actor.id===casterActor.id)return;
        const auraType=this.auraType;
        switch (auraType) {
            case "friendly":
                if (token.disposition !== casterToken.disposition) return;
                break;
            case "hostile":
                if (token.disposition === casterToken.disposition) return;
        }
        let reqFlags=this.reqFlags.split(",");
        let negReqFlags=this.negReqFlags.split(",");
        let skip=false;

        for(let reqFlag of reqFlags){
            reqFlag=reqFlag.trim();
            if(reqFlag==="")continue;
            if(!actor.getFlag("fortyk",reqFlag))skip=true;
        }
        for(let negReqFlag of negReqFlags){
            negReqFlag=negReqFlag.trim();
            if(negReqFlag==="")continue;
            if(actor.getFlag("fortyk",negReqFlag))skip=true;
        }
        if(skip)return;
        if(this.los){
            const collision = CONFIG.Canvas.polygonBackends['sight'].testCollision(token._object.center, casterToken._object.center, {mode:"any", type:"sight"});
            if(collision)return;
        }

        const resumeMovement = movement ? token.pauseMovement() : undefined;
        const effects = await Promise.all(this.effects.map(fromUuid));
        const toCreate = this.#getEffectsToCreate(actor, effects);
        for(let create of toCreate){
            create.disabled=false;
            create.showIcon=2;
            create.statuses.push(create.name);
            actor.statuses.add(create.name);
            actor.flags.core[create.name]=true;
        }
        if ( toCreate.length ) await actor.createEmbeddedDocuments("ActiveEffect", toCreate);
        await resumeMovement?.();
    }
    #getEffectsToDelete(actor) {
        return actor.effects.reduce((ids, effect) => {
            if ( effect.origin === this.behavior.uuid ) ids.push(effect.id);
            return ids;
        }, []);
    }
    static async #onTokenExit(event) {
        if ( !event.user.isSelf ) return;
        const {token, movement} = event.data;
        const actor = token.actor;
        if ( !actor ) return;
        const toDelete = this.#getEffectsToDelete(actor);
        if ( !toDelete.length ) return;
        const resumeMovement = movement ? token.pauseMovement() : undefined;
        await actor.deleteEmbeddedDocuments("ActiveEffect", toDelete);
        await resumeMovement?.();
    }
    static events = {
        [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#onTokenEnter,
        [CONST.REGION_EVENTS.TOKEN_EXIT]: this.#onTokenExit,
        [CONST.REGION_EVENTS.TOKEN_MOVE_WITHIN]: this.#onTokenEnter,
        [CONST.REGION_EVENTS.TOKEN_ROUND_START]: this.#onTokenEnter


    }
}