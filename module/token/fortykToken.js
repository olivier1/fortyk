import { turnOffActorAuras } from "../utilities.js";
export class FortyKToken extends CONFIG.Token.documentClass {
    //OVERRIDE
    async _onDelete(options, userId){
        await super._onDelete(options, userId);

        await turnOffActorAuras(this);
    }
}