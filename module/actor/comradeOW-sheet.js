import FortyKBaseActorSheet from "./base-sheet.js";
export class FortyKOWComradeSheet extends FortyKBaseActorSheet {
    
    /** @override */
    static DEFAULT_OPTIONS={
            tag: 'form',
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/comradeOW-sheet.html",
            width: 666,
            height: 220,
            default:null


    }
    /** @override */
    _prepareContext(options){
        const context = super._prepareContext(options);
        context.races=game.fortyk.FORTYK.races;
        context.ranks=game.fortyk.FORTYK.comradeRanks;
        return context;
    }
}
