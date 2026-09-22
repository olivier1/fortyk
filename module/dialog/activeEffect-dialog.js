const { DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;
import FortyKActiveEffectConfig from "../activeEffect/activeEffectConfig.js";
export class ActiveEffectDialog extends HandlebarsApplicationMixin(DialogV2) {

    static DEFAULT_OPTIONS = {

        tag: 'dialog',
        classes: ["fortyk"],
        template: "systems/fortyk/templates/actor/dialogs/activeEffects-dialog.html",
        default:null,
        position:{height:"auto",
                  width:"auto"},
        dragDrop: [
            { 
                dragSelector: ".effects-list .effect-item", // CSS selector for your items
                dropSelector: ".effects-list"              // CSS selector for the drop zone
            }
        ]

    }
    static PARTS = {
        form:{
            template:"systems/fortyk/templates/actor/dialogs/activeEffects-dialog.html"
        }
    }
    _onDragStart(event) {
        const li = event.currentTarget;
        if ( li.dataset.effectId ) {
            const effect = this.actor.effects.get(li.dataset.effectId);
            if ( !effect ) return;

            // Foundry expects a clean object structure to trigger drop events
            const dragData = {
                type: "ActiveEffect",
                uuid: effect.uuid
            };

            event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        }
    }
    async _preRender(context, options) {
        await super._preRender(context, options);

        // If the window is being detached or re-rendered from scratch, 
        // force a reset of the listener binding flag
        if (options.isFirstRender || options.renderContext || options.detached) {
            this._listenersBound = false;
        }
    }
    _onRender(context, options) {
        super._onRender(context, options);
        if (this._listenersBound) return;
        const html=$(this.element);


        html.find('.ae').click(this._onAeClick.bind(this));
        html.find('.ae-create').click(this._onAeCreate.bind(this));
        html.find('.ae-delete').click(this._onAeDelete.bind(this));

        this._listenersBound=true;
    } 
    async _prepareContext(options){
        let context=await super._prepareContext(options);
        context.actor=this.options.actor;
        context.item=this.options.item;
        if(context.actor===context.item){
            context.actor=undefined;
        }
        return context;
    }
    async _onAeClick(event){
        let effectId = event.currentTarget.attributes["data-ae-id"].value;


        let effect = await fromUuid(effectId);
        let options= {"document":effect};
        new FortyKActiveEffectConfig(options).render({force:true});
    }
    async _onAeCreate(event){
        let actorId = event.currentTarget.attributes["data-actor-id"].value;
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        let tokenId = event.currentTarget.attributes["data-token-id"].value;
        let actor = game.actors.get(actorId);
        let document;
        let effectData={name:"newActiveEffect","label":"newActiveEffect"};
        if(actorId){
            document= await fromUuid(actorId);
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
        new foundry.applications.api.DialogV2({
            window:{title: `Delete ${effect.name}?`},
            content: "Are you sure you want to delete this Active Effect?",
            actor:actor,
            buttons:[
                {
                    action:"submit",
                    label:"Yes",
                    callback: async dlg => { 




                        await effect.delete();

                        this.updateDialog(actor,item);
                    }
                },
                {
                    action:"cancel",
                    label: "No",
                    callback: null
                }
            ],
            default: "submit"
        }).render({force:true});






    }
    async updateDialog(actor,item){

        let templateOptions={actor:actor,item:item};

        let renderedTemplate=await foundry.applications.handlebars.renderTemplate('systems/fortyk/templates/actor/dialogs/activeEffects-dialog.html', templateOptions);
        this.content=renderedTemplate;

        this.render({force:true, renderContext:"refresh"});
    }
}
