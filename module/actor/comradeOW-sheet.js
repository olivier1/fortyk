export class FortyKOWComradeSheet extends ActorSheet {
    
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/comradeOW-sheet.html",
            width: 666,
            height: 220,
            default:null

        });
    }
    /** @override */
    getData(){
        const data = super.getData();
        data.races=game.fortyk.FORTYK.races;
        data.ranks=game.fortyk.FORTYK.comradeRanks;
        return data;
    }
}