export class ActiveEffectDialog extends Dialog {



    activateListeners(html) {
        super.activateListeners(html);
       
        //if (!this.options.editable) return;

        html.find('.ae').click(this._onAeClick.bind(this));
        html.find('.ae-create').click(this._onAeCreate.bind(this));
        html.find('.ae-delete').click(this._onAeDelete.bind(this));


    } 
    async _onAeClick(event){
        let effectId = event.currentTarget.attributes["data-ae-id"].value;
        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let actor = game.actors.get(actorId);
        let effect = actor.effects.get(effectId);
        new ActiveEffectConfig(effect).render(true);
    }
    async _onAeCreate(event){
        console.log(event);
        console.log(game);
        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let actor = game.actors.get(actorId);
        console.log(this);
        console.log(actor);

        await actor.createEmbeddedDocuments("ActiveEffect",[{name:"newActiveEffect","data.label":"newActiveEffect"}]);
        let templateOptions={actor:actor};

        let renderedTemplate=await renderTemplate('systems/fortyk/templates/actor/dialogs/activeEffects-dialog.html', templateOptions);
        this.data.content=renderedTemplate;
        
        this.render(true);


    }
    async _onAeDelete(event){

        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let actor = game.actors.get(actorId);
        let effectId = event.currentTarget.attributes["data-ae-id"].value;
        let effect = actor.effects.get(effectId);
        await effect.delete();
        let templateOptions={actor:actor};

        let renderedTemplate=await renderTemplate('systems/fortyk/templates/actor/dialogs/activeEffects-dialog.html', templateOptions);
        this.data.content=renderedTemplate;
        
        this.render(true);




    }
}