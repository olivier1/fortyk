import {FortyKItem} from "../item/item.js";
export class SpendExpDialog extends Application {
    /** @override */

    static get defaultOptions() {

        return mergeObject(super.defaultOptions, {
            classes: ["fortyk"],
            template: "systems/fortyk/templates/actor/dialogs/spendExp-dialog.html",
            width: 666,
            height: 810,
            mode:"Custom",
            default:null
        });
    }
    getData(){
        this.data=super.getData();
        let data=this.data;
        if(!this.options.cost){this.options.cost=0}
        data.cost=this.options.cost;
        data.FORTYK=game.fortyk.FORTYK;
        data.mode=this.options.mode;

        return this.data;
    }
    activateListeners(html) {
        console.log("hey")
        super.activateListeners(html);
        //select dialog mode
        html.find('.mode').change(this._onModeChange.bind(this));
        //input custom cost
        html.find('.custom-cost').keyup(this._onCustomCost.bind(this));
        //create advance
        html.find('.submit').click(this._onSubmit.bind(this));
        // html.find('.ae').click(this._onAeClick.bind(this));


    } 
    async _onSubmit(event){
        let actor=this.options.actor;
        if(this.options.mode==="Custom"){
            const type = "advancement";
            const name = document.getElementById("custom-name").value;
            const itemData = {
                name: `${name}`,
                type: type,
                data:{
                    type:{value:"Custom"},
                    cost:{value:this.options.cost}
                }
            };

            let item=await FortyKItem.create(itemData,{temporary:true});
            await actor.createEmbeddedDocuments("Item",[item.data]);
        }
        this.close();
    }
    async _onModeChange(event){
        event.preventDefault();
        let newMode=event.target.value;
        this.options.mode=newMode;
        this.options.cost=0;
        this._updateCost();
        this.render(true);
    }
    async _onCustomCost(event){
        let newcost=parseInt(event.target.value);

        if(isNaN(newcost)){newcost=0}
        this.options.cost=newcost;
        this._updateCost();
        console.log(document);
    }
    _updateCost(){
        document.getElementById("cost").textContent=this.options.cost;
    }
}