import FortyKBaseActorSheet from "./base-sheet.js";
export class FortyKOWComradeSheet extends FortyKBaseActorSheet {
    
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/comradeOW-sheet.html",
            width: 666,
            height: 220,
            default:null

        });
    }
    /** @override */
    getData(){
        const context = super.getData();
        context.races=game.fortyk.FORTYK.races;
        context.ranks=game.fortyk.FORTYK.comradeRanks;
        return context;
    }
}