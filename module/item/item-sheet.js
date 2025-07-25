/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */

import {objectByString} from "../utilities.js";
import {ActiveEffectDialog} from "../dialog/activeEffect-dialog.js";
import {ManageRequirementsDialog} from "../dialog/manageRequirements-dialog.js";
export class FortyKItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "item"],
            width: 520,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
            default:null
        });
    }

    /** @override */
    get template() {

        let type = this.item.type;
        return `systems/fortyk/templates/item/item-${type}-sheet.html`;


        // Return a single sheet for all item types.

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.

        // return `${path}/${this.item.system.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    async getData() {



        const item=this.item;
        const data = this.item;
        data.mods=data.effects.filter((item)=> item.flags?.fortyk?.modsystem);
        if(this.item.type==="skill"){
            //GET THE SKILLS WITH CHILDREN
            if(this.actor){
                data.skillgroups=this.actor.items.filter(function(item){

                    if(item.type==="skill"){return item.system.hasChildren.value;}else{return false;}});
            }



        }
        if(this.actor&&item.type==="repairEntry"){

            data.knights=[];
            let knights=this.actor.system.knights;

            for(let i=0;i<knights.length;i++){
                let actor=game.actors.get(knights[i]);

                if(actor){

                    data.knights.push(actor.name);
                }

            }
        }
        if(this.actor&&this.actor.type==="vehicle"){
            data.vehicle=true;
        }
        if(this.item.type==="eliteAdvance"){
            if(this.item.system.type.value==="planet"){
                data.chars=foundry.utils.duplicate(game.fortyk.FORTYK.skillCharsInf);
                data.chars.any={name:"any",caps:"ANY"};
            }
            
            data.compendiums=game.packs.values().toArray().map((x)=>x=x.metadata);
            data.chosenPack=this.chosenPack;
            if(this.chosenPack){
                let items=await game.packs.get(this.chosenPack);

                data.compendiumItems=await items.getDocuments();

                data.compendiumItems.sort(function compare(a, b) {
                    let valueA=a.name;
                    let valueB=b.name;
                    if (valueA<valueB) {
                        return -1;
                    }
                    if (valueA>valueB) {
                        return 1;
                    }
                    // a must be equal to b
                    return 0;
                });
            }else{
                data.compendiumItems=[];
            }
            
        }
        if(this.item.type==="psychicPower"){
            let macroCompendium=game.packs.get("fortyk.fortykmacros");
            let psyFolder=macroCompendium.folders.get("MQBztfL3KvhTnCw9");
            let content=psyFolder.contents;
            data.psyMacros=content;
            data.macroUser=[{value:"gm","label":"GM"},{value:"user","label":"User"}];
        }
        if(item.getFlag("fortyk","alternateprofiles")){
            data.rangedWeapons=await this.getRangedWeapons();
            data.meleeWeapons=await this.getMeleeWeapons();
        }
        if(item.type==="knightChassis"){
            data.quirks= await this.getQuirks();
        }
        data.item=this.item;
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.FORTYK=game.fortyk.FORTYK;
        data.editable = this.options.editable;
        return data;
    }
    async getQuirks(){
        let chassis=await game.packs.get("fortyk.knight-chassis");
        let chassisDocuments=await chassis.getDocuments();
        chassisDocuments.sort(function compare(a, b) {
            let valueA=a.name;
            let valueB=b.name;
            if (valueA<valueB) {
                return -1;
            }
            if (valueA>valueB) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let quirks=chassisDocuments.reduce(function(quirks,document){
            if(document.type==="talentntrait"){
                quirks[document.uuid]=document;  
            }

            return quirks;
        },{});

        quirks=Object.values(quirks);

        return quirks;
    }
    async getRangedWeapons(){
        let wargear=await game.packs.get("fortyk.wargear");
        let wargearDocuments=await wargear.getDocuments();
        let knightComponents=await game.packs.get("fortyk.knight-components");
        let knightComponentDocuments=await knightComponents.getDocuments();
        let wargearbeta=await game.packs.get("fortyk.wargear-beta");
        let wargearbetaDocuments=await wargearbeta.getDocuments();
        let documents=wargearDocuments.concat(knightComponentDocuments,wargearbetaDocuments);
        documents.sort(function compare(a, b) {
            let valueA=a.name;
            let valueB=b.name;
            if (valueA<valueB) {
                return -1;
            }
            if (valueA>valueB) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let rangedWeapons=documents.reduce(function(rangedWeapons,document){
            if(document.type==="rangedWeapon"){
                rangedWeapons[document.uuid]=document;  
            }

            return rangedWeapons;
        },{});

        rangedWeapons=Object.values(rangedWeapons);

        return rangedWeapons;
    }
    async getMeleeWeapons(){
        let wargear=await game.packs.get("fortyk.wargear");
        let wargearDocuments=await wargear.getDocuments();
        let knightComponents=await game.packs.get("fortyk.knight-components");
        let knightComponentDocuments=await knightComponents.getDocuments();
        let wargearbeta=await game.packs.get("fortyk.wargear-beta");
        let wargearbetaDocuments=await wargearbeta.getDocuments();
        let documents=wargearDocuments.concat(knightComponentDocuments,wargearbetaDocuments);
        documents.sort(function compare(a, b) {
            let valueA=a.name;
            let valueB=b.name;
            if (valueA<valueB) {
                return -1;
            }
            if (valueA>valueB) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let meleeWeapons=documents.reduce(function(meleeWeapons,document){
            if(document.type==="meleeWeapon"){
                meleeWeapons[document.uuid]=document;  
            }

            return meleeWeapons;
        },{});

        meleeWeapons=Object.values(meleeWeapons);
        return meleeWeapons;
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
        html.find('.special').click(this._onSpecialClick.bind(this));
        html.find('.modifier').click(this._onModifierClick.bind(this));
        html.find('.addProfile').click(this._onAddProfileClick.bind(this));
        html.find('.removeProfile').click(this._onRemoveProfileClick.bind(this));
        html.find('.clone').click(this._onCloneClick.bind(this));
        html.find('.make-ammo').click(this._onMakeAmmoClick.bind(this));
        html.find('.knight-Hardpoint').keydown(this._onHardpointEnter.bind(this));
        html.find('.knight-Hardpoint').focusout(this._onHardpointEdit.bind(this));
        html.find('.profile-select').change(this._onProfileChange.bind(this));
        html.find('.compendium-select').change(this._onCompendiumChange.bind(this));
        html.find('.item-select').change(this._onItemChange.bind(this));
        html.find('.add').click(this._onAddItemClick.bind(this));
        html.find('.delete-index').click(this._onDeleteIndexClick.bind(this));
        html.find('.remove-last').click(this._onRemoveItemClick.bind(this));
        html.find('.delete-mod').click(this._onDeleteModClick.bind(this));
        html.find('.manage-reqs').click(this._onManageReqsClick.bind(this));
        //handles melee weapon mod

        html.find('.weapon-mod').focusout(this._weaponModEdit.bind(this));
        html.find('.weapon-mod').keydown(this._weaponModEnter.bind(this));
        // Autoselect entire text 
        $("input[type=text]").focusin(function() {
            $(this).select();
        });


    }
    async _onManageReqsClick(event){
         event.preventDefault();
        let dialog=new ManageRequirementsDialog({item:this.item});
        dialog.render(true,{title:"Manage Requirements"});
    }
    async _onDeleteModClick(event){
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        let item=this.item;
        let activeEffect=await this.item.getEmbeddedDocument("ActiveEffect",itemId);

        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/delete-item-dialog.html');
        renderedTemplate.then(content => {
            new Dialog({
                title: "Deletion Confirmation",
                content: content,
                buttons:{
                    submit:{
                        label:"Yes",
                        callback: async dlg => { 
                            if(activeEffect.getFlag("fortyk","modsystem")){
                                if(!activeEffect.getFlag("fortyk","modsystem").isOneUse){
                                    let modData={system:activeEffect.getFlag("fortyk","modsystem")};
                                    modData.name=activeEffect.name;
                                    modData.type="mod";
                                    modData.effects=[foundry.utils.duplicate(activeEffect)];
                                    if(item.parent){

                                        await item.parent.createEmbeddedDocuments("Item",[modData]);
                                    }
                                } 
                            }


                            await this.item.deleteEmbeddedDocuments("ActiveEffect",[itemId]);
                            this.render(true);
                        }
                    },
                    cancel:{
                        label: "No",
                        callback: null
                    }
                },
                default: "submit"
            }).render(true);
        });
    }
    _onCompendiumChange(event){
        let compendium=event.target.value;
        this.chosenPack=compendium;
        this._render();
    }
    _onItemChange(event){
        let item=event.target.value;
        let name=event.target.selectedOptions[0].innerText;
        this.chosenItem=item;
        this.chosenItemName=name;
        document.getElementById("add").removeAttribute('disabled');
    }
    async _onAddItemClick(event){
        let bonuses=this.item.system.items;
        let isORInput=document.getElementById("OR");
        let isOR=isORInput?.checked;
        let isANDInput=document.getElementById("AND");
        let isAND=isANDInput?.checked;
        let item= await fromUuid(this.chosenItem);
       
        let spec=item.system.specialisation?.value;

        let bonus={"uuid":this.chosenItem,"name":this.chosenItemName, "isOR":isOR, "isAND":isAND};
        
        if(typeof spec==="string" && spec!=="N/A"){

            let chosenSpec=await Dialog.prompt({
                title: `Choose specialisation for ${item.name}`,
                content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${item.system.specialisation.value}" autofocus/></p>`,



                callback: async(html) => {
                    const choosenSpec = $(html).find('input[name="spec"]').val();
                    return choosenSpec;
                },






                width:100});
            bonus.spec= chosenSpec;
            bonus.name+=`: ${chosenSpec}`;

        }
        let amount=item.system.amount?.value;
        if(amount){
            let newAmount=await Dialog.prompt({
                title: `Choose amount for ${item.name}`,
                content: `<p><label>Amount:</label> <input id="amountInput" type="text" name="amount" value="${item.system.amount.value}" autofocus/></p>`,



                callback: async(html) => {
                    const chosenAmount = parseInt($(html).find('input[name="amount"]').val());
                    return chosenAmount;
                },






                width:100});
            if(newAmount>1){
                bonus.amount=newAmount;
            }
            
        }





        bonuses.push(bonus);
        this.item.update({"system.items":bonuses});
        this.chosenItem=null;
        this.choseItemName=null;
        document.getElementById("add").setAttribute('disabled',"");
        this.render();
    }
    _onRemoveItemClick(event){
        let bonuses=this.item.system.items;
        if(bonuses.length){
            bonuses.pop();
            this.item.update({"system.items":bonuses});
        }

    }
    _onDeleteIndexClick(event){
        let bonuses=this.item.system.items;
        let node=event.currentTarget;
        let index=parseInt(node.dataset.index);
        console.log(index, node)
        bonuses.splice(index, 1);
        this.item.update({"system.items":bonuses});
    }
    _onCloneClick(event){
        let item=this.item.clone();
        Item.create(foundry.utils.duplicate(item));
    }
    async _onAddProfileClick(event){
        let item=this.item;
        if(!item.getFlag("fortyk","profiles")){
            await item.setFlag("fortyk","profiles",[""]); 
        }else{
            let profiles=item.getFlag("fortyk","profiles");
            profiles.push("");
            await item.setFlag("fortyk","profiles",profiles); 
        }

    }
    async _onRemoveProfileClick(event){
        let item=this.item;

        let profiles=item.getFlag("fortyk","profiles");
        profiles.pop();
        await item.setFlag("fortyk","profiles",profiles); 


    }
    _onProfileChange(event){
        event.preventDefault();
        const dataset=event.currentTarget.dataset;
        const uuid=event.currentTarget.value;
        let index=dataset.index;
        let item=this.item;
        let profiles=item.getFlag("fortyk","profiles");
        profiles.splice(index,1,uuid);
        item.setFlag("fortyk","profiles",profiles);
    }
    async _onMakeAmmoClick(event){
        let weapon=this.item._source;
        let ammoData={};
        let actor=this.actor;
        ammoData["name"]=`${weapon.name} Ammunition`;
        ammoData["type"]="ammunition";
        ammoData["flags"]=weapon.flags;
        ammoData["system.class.value"]=weapon.system.class.value;
        ammoData["system.damageType.value"]=weapon.system.damageType.value;
        ammoData["system.type.value"]=weapon.system.type.value;
        // Math.round((data.knight.armorValues.value*armorRatio + Number.EPSILON) * 100) / 100;
        if(actor.system.knight){
            ammoData["system.weight.value"]=1;
            ammoData["system.space.value"]=1;
        }else{
            ammoData["system.weight.value"]=Math.round((parseFloat(weapon.system.weight.value)*0.1 + Number.EPSILON) * 100) / 100; 
        }

        ammoData["system.damageFormula.formula"]=weapon.system.damageFormula.formula;
        ammoData["system.pen.formula"]=weapon.system.pen.formula;
        ammoData["system.range.formula"]=weapon.system.range.formula;
        let ammo=await actor.createEmbeddedDocuments("Item",[ammoData],{"renderSheet":true});

        if(actor.system.knight){
            let components=actor.system.knight.components;
            components[components.length-1]=ammo[0].id;
            components.push("");
            await actor.update({"system.knight.components":components});
        }

    }
    async _onModifierClick(event){
        /*let item=this.item;

        if(item.effects.size===0){
            let disabled=false;
            if(this.item.type==="psychicPower"){
                disabled=true;
            }
            let modifiersData={
                id: "modifiers",
                label: this.item.name,
                changes:[],
                transfer:true,
                disabled:disabled}
            await item.createEmbeddedDocuments("ActiveEffect",[modifiersData]);
        }
        let ae=item.effects.entries().next().value[1];





        new ActiveEffectConfig(ae).render(true);*/
        let item=this.item;
        let sheet=this;

        var options = {
            id:"aeDialog"
        };
        var d=new ActiveEffectDialog({
            title: "Active Effects",
            item:item,
            buttons:{
                button:{
                    label:"Ok",
                    callback: async html => {
                        sheet.item.dialog=undefined;
                    }
                },
            },
            close:function(){
                sheet.item.dialog=undefined;
            }
        },options).render(true);
        sheet.item.dialog=d;


    }


    async _onSpecialClick(event){
        let item=this.item;
        let specials={};
        if(this.item.type==="armor"){
            specials=foundry.utils.duplicate(game.fortyk.FORTYK.armorFlags);
        }else{
            specials=foundry.utils.duplicate(game.fortyk.FORTYK.weaponFlags);
        }


        let flags=this.item._source.flags.fortyk;

        for(const flag in flags){

            if(specials[flag]){

                if(specials[flag].num!==undefined){
                    if(isNaN(parseInt(flags[flag]))){
                        specials[flag].num=0;
                    }else{
                        specials[flag].num=flags[flag];
                        specials[flag].value=true;
                    }

                }else{
                    specials[flag].value=flags[flag]; 
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
                                if(value!==spec.value){bool=true;}

                                if(bool&&spec.num===undefined){

                                    await this.item.setFlag("fortyk",key,value);
                                }

                                let num=false;
                                let number;
                                if(spec.num!==undefined&&value){
                                    number=html.find(`input[id=${key}num]`).val();
                                    if(isNaN(parseFloat(number))&&number.toLowerCase().indexOf("pr")!==-1){
                                        if(number!==spec.num){

                                            num=true;
                                        }
                                    }else{
                                        number=parseFloat(number);
                                    }
                                    if(value||number!==parseInt(spec.num)){

                                        num=true;
                                    }


                                }
                                else if(spec.num!==undefined&&!value&&this.item.getFlag("fortyk",key)!==undefined){
                                    await this.item.setFlag("fortyk",key,false);
                                }


                                if(num){

                                    await this.item.setFlag("fortyk",key,number);
                                }

                            }


                        }
                    }
                },
                default: "submit"
            }).render(true);

        });

    }
    async _weaponModEdit(event){

        event.preventDefault();
        if(!this.updateObj){
            this.updateObj={};
        }
        let item=this.item;
        let target=event.target.attributes["data-target"].value;
        let newAmt=event.target.value;
        let type=event.target.attributes["data-dtype"].value;
        if(type==="Number"){
            newAmt=parseFloat(newAmt);
            if(isNaN(newAmt)){
                newAmt=0;
                event.target.value=0;
            }
        }
        let oldValue=objectByString(item,target);

        if((oldValue!=newAmt)){

            this.updateObj[target]=newAmt;




        }
        let updateNmbr=Object.keys(this.updateObj).length;

        if(updateNmbr>0&&(!event.relatedTarget||($(event.relatedTarget).prop("class").indexOf("weapon-mod") === -1))) {

            await item.update(this.updateObj);
            this.updateObj=undefined;

        }

    }
    async _weaponModEnter(event){
        if (event.keyCode == 13){
            if(!this.updateObj){
                this.updateObj={};
            }
            let item=this.item;
            let target=event.target.attributes["data-target"].value;
            let newAmt=event.target.value;
            let type=event.target.attributes["data-dtype"].value;
            if(type==="Number"){
                newAmt=parseFloat(newAmt);
                if(isNaN(newAmt)){
                    newAmt=0;
                    event.target.value=0;
                }
            }
            let oldValue=objectByString(item,target);
            if(oldValue!=newAmt){
                this.updateObj[target]=newAmt;
                await item.update(this.updateObj);
                this.updateObj=undefined;



            }
        }
    }
    //when changing parents check to see if the skill is part of a group if it is change the value of children to false
    async _onParentChange(event){

        /*let value=event.currentTarget.value;

        if(value!==""){
            let item=this.item;
            if(item.system.hasChildren){
                let children=this.actor.items.filter(item=>function(item){
                    return item.system.parent.value===this.item.system.name.value});
                for(let i of children){
                    await i.update({'system.parent.value':""});

                }
                await this.item.update({'system.hasChildren.value':false});
            }




        }*/

    } 
    async _onChildrenClick(event){

        let value=event.currentTarget.checked;
        if(value){
            await this.item.update({'system.parent.value':""});
        }
    }
    async _onHardpointEdit(event){
        event.preventDefault();
        if(!this.updateObj){
            this.updateObj={};
        }
        let item=this.item;
        let location=event.target.attributes["data-location"].value;
        let type=event.target.attributes["data-type"].value;
        let newAmt=event.target.value;

        newAmt=parseFloat(newAmt);
        if(isNaN(newAmt)){
            return;
        }
        let target=`system.hardPoints.${location}.${type}`;
        let oldValue=item.system.hardPoints[location][type].length;
        let oldArray=item.system.hardPoints[location][type];


        if((newAmt>oldValue)){
            for(let i=oldValue;i<newAmt;i++){
                oldArray.push("");
            }
            this.updateObj[target]=oldArray;




        }else if(oldValue>newAmt){
            for(let i=oldValue;i>newAmt;i--){
                oldArray.pop();
            }
            this.updateObj[target]=oldArray;
        }
        let updateNmbr=Object.keys(this.updateObj).length;
        if(updateNmbr>0&&(!event.relatedTarget||($(event.relatedTarget).prop("class").indexOf("knight-Hardpoint") === -1))) {

            await item.update(this.updateObj);
            this.updateObj=undefined;

        }
    }
    async _onHardpointEnter(event){
        if (event.keyCode == 13){
            if(!this.updateObj){
                this.updateObj={};
            }
            let item=this.item;
            let location=event.target.attributes["data-location"].value;
            let type=event.target.attributes["data-type"].value;
            let newAmt=event.target.value;

            newAmt=parseFloat(newAmt);
            if(isNaN(newAmt)){
                return;
            }
            let target=`system.hardPoints.${location}.${type}`;
            let oldValue=item.system.hardPoints[location][type].length;
            let oldArray=item.system.hardPoints[location][type];


            if((newAmt>oldValue)){
                for(let i=oldValue;i<newAmt;i++){
                    oldArray.push("");
                }
                this.updateObj[target]=oldArray;




                await item.update(this.updateObj);
                this.updateObj=undefined;



            }else if(oldValue>newAmt){
                for(let i=oldValue;i>newAmt;i--){
                    oldArray.pop();
                }
                this.updateObj[target]=oldArray;
                await item.update(this.updateObj);
                this.updateObj=undefined;
            }
        }
    }
}
