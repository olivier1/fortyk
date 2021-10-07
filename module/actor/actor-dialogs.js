//utility functions to handle events on dialogs created from the actor sheets
export class ActorDialogs{
    static chatListeners(html){
        html.find('.tntfilter').keyup(this._onTntFilterChange.bind(this));
        /*html.find('.ae').click(this._onAeClick.bind(this));
        html.find('.ae-create').click(this._onAeCreate.bind(this));
        html.find('.ae-delete').click(this._onAeDelete.bind(this));*/
    }
    static _onTntFilterChange(event){

        let tnts=document.getElementsByName("tntEntry");

        let filterInput=document.getElementById("tntfilter");
        let filter=filterInput.value.toLowerCase();
        for(let i=0;i<tnts.length;i++){
            let tnt=tnts[i];

            let tntName=tnt.attributes["data-search"].value.toLowerCase();
            if(tntName.indexOf(filter)>-1){
                tnt.style.display="";
            }else{
                tnt.style.display="none";
            }
        }

    }
    static _onAeClick(event){
        console.log("hey");
        let effectId = event.currentTarget.attributes["data-ae-id"].value;
        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let actor = game.actors.get(actorId);
        let effect = actor.effects.get(effectId);
        new ActiveEffectConfig(effect).render(true);
    }
    static async _onAeCreate(event){
        console.log(event);
        console.log(game);
        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let actor = game.actors.get(actorId);
        console.log(actor);
        /*
        await actor.createEmbeddedDocuments("ActiveEffect",[{name:"newActiveEffect","data.label":"newActiveEffect"}])*/



    }
    static async _onAeDelete(event){

        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let actor = game.actors.get(actorId);
        let effectId = event.currentTarget.attributes["data-ae-id"].value;
        let effect = actor.effects.get(effectId);
        effect.delete();




    }
}
