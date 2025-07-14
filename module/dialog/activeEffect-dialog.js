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
        let document;
        let effectData={name:"newActiveEffect","label":"newActiveEffect"};
        if(actorId){
            document=game.actors.get(actorId);
        }else if(itemId){
            effectData.transfer=false;
            document=await fromUuid(itemId);
            if(document.type==='mod'){
                effectData['flags.fortyk.mod']=true;
            }
        }else if(tokenId){
            let token =canvas.tokens.get(tokenId);
            document= token.actor;
            actorId=actor.id;  
        }



        await document.createEmbeddedDocuments("ActiveEffect",[effectData]);
        this.updateDialog(document);


    }
    async _onAeDelete(event){
        let actor=this.actor;
        let item=this.item;
        let effectId = event.currentTarget.attributes["data-ae-id"].value;
        let effect = await fromUuid(effectId);
        new Dialog({
            title: `Delete ${effect.name}?`,
            content: "Are you sure you want to delete this Active Effect?",
            buttons:{
                submit:{
                    label:"Yes",
                    callback: async dlg => { 




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