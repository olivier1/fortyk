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
            height: 480
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
        
       
        
        const item=this.item;
        const data = super.getData().data;
        if(this.item.type==="skill"){
            //GET THE SKILLS WITH CHILDREN
            if(this.actor!==null&&this.actor.data!==undefined){
                data['skillgroups']=this.actor.items.filter(function(item){

                    if(item.type==="skill"){return item.data.data.hasChildren.value}else{return false;}})
            }



        }
         data.item=this.item.data;
        data.isGM=game.user.isGM;
        data.isOwner=this.item.isOwner;
        data.dtypes = ["String", "Number", "Boolean"];
        data.FORTYK=game.fortyk.FORTYK;
        data.editable = this.options.editable;
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
        html.find('.weapon-special').click(this._onSpecialClick.bind(this));
        // Autoselect entire text 
        $("input[type=text]").focusin(function() {
            $(this).select();
        });


    }

    async _onSpecialClick(event){

        let specials=duplicate(game.fortyk.FORTYK.itemFlags);

        let flags=this.item.data.flags.fortyk;
       
        for(const flag in flags){
           
            if(specials[flag]){
                if(specials[flag].num===undefined){
                    specials[flag].value=flags[flag];
                }else{
                    specials[flag].num=flags[flag];
                }
            }
        }
        let templateOptions={"specials":specials};
        let renderedTemplate=renderTemplate('systems/fortyk/templates/item/dialogs/weapon-special-dialog.html', templateOptions);


        renderedTemplate.then(content => { 
            new Dialog({
                title: "Weapon Special Qualities",
                content: content,
                buttons:{
                    submit:{
                        label:"Yes",
                        callback: async html => {
                            for (let [key, spec] of Object.entries(specials)){

                                let bool=false;
                                let value=html.find(`input[id=${key}]`).is(":checked");
                                if(value!==spec.value){bool=true}

                                if(bool){
                                   
                                    await this.item.setFlag("fortyk",key,value);
                                }

                                let num=false;
                                let number
                                if(spec.num!==undefined){
                                    number=parseInt(html.find(`input[id=${key}num]`).val());
                                    if(number!==parseInt(spec.num)){
                                        
                                        num=true};
                                    if(num&&number<0){
                                        number=false;
                                    }

                                }
                            
                               
                                if(num){
                                    
                                    await this.item.setFlag("fortyk",key,number);
                                }

                            }


                        }
                    }
                },
                default: "submit"
            }).render(true)

        });
       
    }
    //when changing parents check to see if the skill is part of a group if it is change the value of children to false
    async _onParentChange(event){

        /*let value=event.currentTarget.value;

        if(value!==""){
            let item=this.item;
            console.log(item);
            if(item.data.data.hasChildren){
                let children=this.actor.items.filter(item=>function(item){
                    console.log(this);
                    console.log(item);
                    return item.data.data.parent.value===this.item.data.data.name.value});
                console.log(children);
                for(let i of children){
                    await i.update({'data.parent.value':""});

                }
                await this.item.update({'data.hasChildren.value':false});
            }




        }*/

    } 
    async _onChildrenClick(event){

        let value=event.currentTarget.checked;
        if(value){
            await this.item.update({'data.parent.value':""});
        }
    }
}
