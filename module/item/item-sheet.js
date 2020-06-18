/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */

export class FortyKItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
        });
    }

    /** @override */
    get template() {

        let type = this.item.type;
        return `systems/fortyk/templates/item/item-${type}-sheet.html`;


        // Return a single sheet for all item types.

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.

        // return `${path}/${this.item.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();

        if(this.item.type==="skill"){
            //GET THE SKILLS WITH CHILDREN

            data['skillgroups']=this.actor.items.filter(function(item){return item.data.data.hasChildren.value});

        }
        return data;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;
        html.find('.skill-type').change(this._onParentChange.bind(this));
        html.find('.skill-children').click(this._onChildrenClick.bind(this));

        // Roll handlers, click handlers, etc. would go here.

    }
    //when changing parents check to see if the skill is part of a group if it is change the value of children to false
    async _onParentChange(event){
        event.preventDefault();
        let value=event.currentTarget.value;
        
        if(value!==""){
            let item=this.item;
            if(item.data.data.hasChildren){
                let children=this.actor.items.filter(item=>function(item){return item.data.data.parent.value===this.item.data.data.name.value});
                for(let i of children){
                    await i.update({'data.parent.value':""});
                    
                }
                await this.item.update({'data.hasChildren.value':false});
            }

            


        }

    } 
    async _onChildrenClick(event){
        event.preventDefault();
        let value=event.currentTarget.checked;
        if(value){
            await this.item.update({'data.parent.value':""});
        }
    }
}
