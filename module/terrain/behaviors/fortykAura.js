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
    #getEffectsToCreate(actor, effects, caster) {
        const toCreate = [];
        for ( const effect of effects ) {
            if(actor.statuses.has(this.status)||actor.getFlag("core", this.status))continue;
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
            data.disabled=false;
            data.showIcon=2;
            data.statuses.push(data.name);
            data.origin=caster.uuid;
            data.flags={fortyk:{temp:true, regionOrigin:this.behavior.uuid}};
            actor.statuses.add(data.name);
            actor.flags.core[data.name]=true;
            toCreate.push(data);
        }
        return toCreate;
    }
    async _addEffects(actor, casterActor, token, casterToken, movement) {
        if(actor.statuses.has(this.status)||actor.getFlag("core", this.status))return;
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
            let dest=token._object.center;
            if(movement){
                dest=movement.destination;
            }
            const collision = CONFIG.Canvas.polygonBackends['sight'].testCollision(dest, casterToken._object.center, {mode:"any", type:"sight"});
            if(collision)return;
        }



        const resumeMovement = movement ? token.pauseMovement() : undefined;

        const effects = await Promise.all(this.effects.map(fromUuid));
        const toCreate = this.#getEffectsToCreate(actor, effects, casterActor);

        if ( toCreate.length ) await actor.createEmbeddedDocuments("ActiveEffect", toCreate);
        await resumeMovement?.();
    }

    static async #onTokenEnter(event) {
        if ( !event.user.isSelf ) return;
        const {token, movement} = event.data;
        const actor = token.actor;
        if ( !actor ) return;
        const casterId=this.originId;
        const casterActor = await fromUuid(casterId);
        if(!casterActor) return;
        const casterToken = getActorToken(casterActor).document;
        if(!casterToken) return;
        return this._addEffects(actor, casterActor, token, casterToken, movement);
    }
    #getEffectsToDelete(actor) {
        return actor.effects.reduce((ids, effect) => {
            if ( effect.getFlag("fortyk", "regionOrigin") === this.behavior.uuid ) ids.push(effect.id);
            return ids;
        }, []);
    }
    _onDelete(options, userId){

    }
    async _deleteEffects(token, movement) {
        const isDeleted = !canvas.scene?.tokens.has(token.id);
        if(isDeleted) return;
        const actor = token.actor;
        if ( !actor ) return;
        const toDelete = this.#getEffectsToDelete(actor);
        if ( !toDelete.length ) return;
        const resumeMovement = movement ? token.pauseMovement() : undefined;

        await actor.deleteEmbeddedDocuments("ActiveEffect", toDelete);

        await resumeMovement?.();
    }

    static async #onTokenExit(event) {
        if ( !event.user.isSelf ) return;
        const {token, movement} = event.data;
        return this.deleteEffects(token, movement);
    }
    static async #onTokenInside(event){
        if ( !event.user.isSelf ) return;
        const los=this.los;
        const {token, movement} = event.data;
        const actor = token.actor;
        if ( !actor ) return;
        const casterId=this.originId;
        const casterActor = await fromUuid(casterId);
        if(!casterActor) return;
        const casterToken = getActorToken(casterActor).document;
        if(!casterToken) return;
        if(this.los){
            let dest=token._object.center;
            if(movement){
                dest=movement.destination;
            }
            const collision = CONFIG.Canvas.polygonBackends['sight'].testCollision(dest, casterToken._object.center, {mode:"any", type:"sight"});
            if(collision){
               return this._deleteEffects(token, movement);
            }
        }
        this._addEffects(actor, casterActor, token, casterToken, movement);
        

    }
    static events = {
        [CONST.REGION_EVENTS.TOKEN_ENTER]: this.#onTokenEnter,
        [CONST.REGION_EVENTS.TOKEN_EXIT]: this.#onTokenExit,
        [CONST.REGION_EVENTS.TOKEN_MOVE_WITHIN]: this.#onTokenInside,
        [CONST.REGION_EVENTS.TOKEN_ROUND_START]: this.#onTokenInside


    }
}