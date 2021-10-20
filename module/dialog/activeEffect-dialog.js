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
        let tokenId = event.currentTarget.attributes["data-token-id"].value;
        let actor = game.actors.get(actorId);
        console.log(tokenId)
        if(tokenId){
           let token =canvas.tokens.get(tokenId);
            actor= token.actor;
             actorId=actor.id;
        }
        
        let effect = actor.effects.get(effectId);
        
        new ActiveEffectConfig(effect).render(true);
    }
    async _onAeCreate(event){
     
        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let tokenId = event.currentTarget.attributes["data-token-id"].value;
        let actor = game.actors.get(actorId);
        console.log(tokenId)
        if(tokenId){
           let token =canvas.tokens.get(tokenId);
            actor= token.actor;
             actorId=actor.id;
        }
     

        await actor.createEmbeddedDocuments("ActiveEffect",[{name:"newActiveEffect","label":"newActiveEffect"}]);
        this.updateDialog(actor);


    }
    async _onAeDelete(event){

        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let tokenId = event.currentTarget.attributes["data-token-id"].value;
        let actor = game.actors.get(actorId);
        console.log(tokenId)
        if(tokenId){
           let token =canvas.tokens.get(tokenId);
            actor= token.actor;
            actorId=actor.id;
        }
        let effectId = event.currentTarget.attributes["data-ae-id"].value;
        let effect = actor.effects.get(effectId);
        console.log(actor,effect);
        await effect.delete();
        let templateOptions={actor:actor};

        let renderedTemplate=await renderTemplate('systems/fortyk/templates/actor/dialogs/activeEffects-dialog.html', templateOptions);
        this.data.content=renderedTemplate;
        
        this.updateDialog(actor);




    }
    async updateDialog(actor){
        
        let templateOptions={actor:actor};

        let renderedTemplate=await renderTemplate('systems/fortyk/templates/actor/dialogs/activeEffects-dialog.html', templateOptions);
        this.data.content=renderedTemplate;
        
        this.render(true);
    }
}