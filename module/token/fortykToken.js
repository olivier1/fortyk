import { turnOffActorAuras } from "../utilities.js";
export class FortyKToken extends CONFIG.Token.documentClass {
    //OVERRIDE
    
    _onUpdate(changed, options, userId){
        super._onUpdate(changed, options, userId);
    }
   
    async _onDelete(options, userId){
        await super._onDelete(options, userId);

        await turnOffActorAuras(this);
    }
}