export class ActiveEffectDialog extends Dialog {

    static get defaultOptions() {

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk"],
            template: "systems/fortyk/templates/actor/dialogs/activeEffects-dialog.html",
            default:null
        });
    }

    activateListeners(html) {
        super.activateListeners(html);


        html.find('.ae').click(this._onAeClick.bind(this));
        html.find('.ae-create').click(this._onAeCreate.bind(this));
        html.find('.ae-delete').click(this._onAeDelete.bind(this));


    } 
    getData(){
       
        return this.data;
    }
    async _onAeClick(event){
        let effectId = event.currentTarget.attributes["data-ae-id"].value;


        let effect = await fromUuid(effectId);

        new ActiveEffectConfig(effect).render(true);
    }
    async _onAeCreate(event){
        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        let tokenId = event.currentTarget.attributes["data-token-id"].value;
        let actor = game.actors.get(actorId);
        let document
        if(actorId){
            document=game.actors.get(actorId);
        }else if(itemId){
            document=await fromUuid(itemId);
        }else if(tokenId){
            let token =canvas.tokens.get(tokenId);
            document= token.actor;
            actorId=actor.id;  
        }
        


        await document.createEmbeddedDocuments("ActiveEffect",[{name:"newActiveEffect","label":"newActiveEffect"}]);
        this.updateDialog(document);


    }
    async _onAeDelete(event){
        let actor=this.actor;
        let item=this.item;
        new Dialog({
            title: "Deletion Confirmation",
            content: "Are you sure you want to delete this Active Effect?",
            buttons:{
                submit:{
                    label:"Yes",
                    callback: async dlg => { 


                        let effectId = event.currentTarget.attributes["data-ae-id"].value;
                        let effect = await fromUuid(effectId);

                        await effect.delete();

                        this.updateDialog(actor,item);
                    }
                },
                cancel:{
                    label: "No",
                    callback: null
                }
            },
            default: "submit"
        }).render(true)






    }
    async updateDialog(actor,item){

        let templateOptions={actor:actor,item:item};

        let renderedTemplate=await renderTemplate('systems/fortyk/templates/actor/dialogs/activeEffects-dialog.html', templateOptions);
        this.content=renderedTemplate;

        this.render(true);
    }
}