/*abstract class that is not used, sets most of the functions that are common to all sheets of the system*/
import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import {tokenDistance} from "../utilities.js";
import {getVehicleFacing} from "../utilities.js";
import {FortyKItem} from "../item/item.js";
export default class FortyKBaseActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            scrollY: [
                ".main",
                ".skills",
                ".tnt",
                ".exp",
                ".combat",
                ".gear",
                ".psykana",
                ".sheet-skills"
            ]

        });
    }
    /* -------------------------------------------- */
    /** @override */
    async getData() {
        const data = await super.getData().actor;
        data.actor=await this.actor.prepare();
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.races=game.fortyk.FORTYK.races;
        data.advances=game.fortyk.FORTYK.advances;
        data.aptitudes=game.fortyk.FORTYK.aptitudes;
        data.size=game.fortyk.FORTYK.size;
        data.skillChars=game.fortyk.FORTYK.skillChars;
        data.skillTraining=game.fortyk.FORTYK.skillTraining;
        data.psyDisciplines=game.fortyk.FORTYK.psychicDisciplines;
        data.psykerTypes=game.fortyk.FORTYK.psykerTypes;
        data.editable = this.options.editable;
        data.money=game.settings.get("fortyk","dhMoney");
        data.bcCorruption=game.settings.get("fortyk","bcCorruption");
        data.coverTypes=game.fortyk.FORTYK.coverTypes;

        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        //right click profile img
        html.find('.profile-img').contextmenu(this._onImgRightClick.bind(this));

        // Everything below here is only needed if the sheet is editable
        //get item description
        html.find('.item-descr').click(this._onItemDescrGet.bind(this));
        if (!this.options.editable) return;

        //handles combat tab resources

        html.find('.combat-resources').focusout(this._combatResourceEdit.bind(this));
        html.find('.combat-resources').keydown(this._combatResourceEnter.bind(this));
        //Add item to actor
        html.find('.item-create').click(this._onItemCreate.bind(this));
        //edit item on actor
        html.find('.item-edit').click(this._onItemEdit.bind(this));
        //delete item on actor
        html.find('.item-delete').click(this._onItemDelete.bind(this));

        //change item property via text input
        html.find('.item-text-input').focusout(this._itemTextInputEdit.bind(this));
        html.find('.item-text-input').keydown(this._itemTextInputEnter.bind(this));

        //handles maximal checkbox
        html.find('.maximal').click(this._onMaximalClick.bind(this));
        //handles lasmode select
        html.find('.lasMode').change(this._onLasModeChange.bind(this));

        //handles chaning armor
        html.find('.armor-select').change(this._onArmorChange.bind(this));
        //handles changing forcefield
        html.find('.force-field').change(this._onForceFieldChange.bind(this));
        //Damage rolls
        html.find('.damage-roll').click(this._onDamageRoll.bind(this));
        //Psychic power buff/debuffs
        html.find('.buff-debuff').click(this._onBuffDebuff.bind(this));
        //Cancel Sustained buffs/debuffs
        html.find('.cancel-buff').click(this._onCancelBuffs.bind(this));
        //Psychic power macros
        html.find('.psy-macro').click(this._onPsyMacro.bind(this));
        //autofcus modifier input
        html.find('.rollable').click(this._onRoll.bind(this));
        //repair forcefield
        html.find('.repairForcefield').click(this._onRepairForcefield.bind(this));
        //force damage roll
        html.find('.force-roll').click(this._onForceRoll.bind(this));
        //creating a tnt
        html.find('.tnt-create').click(this._onTntCreate.bind(this));
        html.find('.profile-select').change(this._onWeaponProfileChange.bind(this));
        //sorting
        html.find('.sort-button').click(this._onSortClick.bind(this));
        html.find('.drag').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", this._onDragListItem, false);
            li.addEventListener("dragover", this._onDragOverListItem, false);
            li.addEventListener("drop", this._onDropListItem.bind(this), false);
        });

        // Autoselect entire text 
        $("input[type=text]").focusin(function() {
            $(this).select();
        });
    }
    _onDragListItem(event){

        event.dataTransfer.setData("text", event.target.dataset["id"]);


    }
    _onDragOverListItem(event){

        event.preventDefault();

    }

    async _onDropListItem(event){

        let draggedId=event.dataTransfer.getData("text");

        let targetId=event.target.dataset["id"];
        if(draggedId!==targetId){
            let draggedItem=await this.actor.items.get(draggedId);

            let targetItem=await this.actor.items.get(targetId);

            let sortDrag=draggedItem.sort;
            let sortTarget=targetItem.sort;
            if(sortTarget>sortDrag){

                sortDrag=sortTarget;
                sortTarget-=1;
            }else{
                sortDrag=sortTarget;
                sortTarget+=1;
            }
            let itemType=draggedItem.type;
            let items=this.actor.itemTypes[itemType].sort(function(a,b){
                return a.sort-b.sort});

            /*data.items=*/
            let previous=null;
            let update=[];
            update.push({"_id":draggedId,"sort":sortDrag});
            update.push({"_id":targetId,"sort":sortTarget});
            items.forEach((value,key)=>{
                let sort=value.sort;
                if(value.id===draggedId){
                    sort=sortDrag;
                }else if(value.id===targetId){
                    sort=sortTarget;
                }
                if(sort===previous){
                    sort++
                    update.push({"_id":value.id,"sort":sort}) 
                }
                previous=sort;
            });
            await this.actor.updateEmbeddedDocuments("Item",update);

        }



    }
    _onImgRightClick(event){

        event = event || window.event;


        var options = {
            width: "auto",
            height: "auto"
        };
        let img=this.actor.img
        let dlg = new Dialog({
            title: `Profile Image`,
            content: `<img src="${img}"  width="auto" height="auto">`,
            buttons: {
                submit: {
                    label: "OK",
                    callback: null
                }
            },
            default: "submit",
        }, options);
        dlg.render(true);


    }
    //handles the duplicate inputs for wounds fatigue fate points etc on the combat tab

    async _combatResourceEdit(event){

        event.preventDefault();
        if(!this.updateObj){
            this.updateObj={};
        }
        let actor=this.actor;
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
        let oldValue=objectByString(actor,target);

        if((oldValue!=newAmt)){

            this.updateObj[target]=newAmt;




        }
        let updateNmbr=Object.keys(this.updateObj).length;
        if(updateNmbr>0&&(!event.relatedTarget||($(event.relatedTarget).prop("class").indexOf("combat-resources") === -1))) {

            await actor.update(this.updateObj);
            this.updateObj=undefined;

        }

    }
    async _combatResourceEnter(event){
        if (event.keyCode == 13){
            if(!this.updateObj){
                this.updateObj={};
            }
            let actor=this.actor;
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
            let oldValue=objectByString(actor,target);
            if(oldValue!=newAmt){
                this.updateObj[target]=newAmt;
                await actor.update(this.updateObj);
                this.updateObj=undefined;



            }
        }
    }
    async _onSortClick(event){

        let sortType=event.target.dataset["sortType"];
        let path=event.target.dataset["path"];
        let itemType=event.target.dataset["itemType"];
        let actor=this.actor;
        let items=actor[itemType];
        let update={};
        let updatePath="system.sort."+itemType;

        update[updatePath]={};
        update[updatePath].type=sortType;
        update[updatePath].path=path;
        if(!actor.system.sort[itemType]||actor.system.sort[itemType].type!==sortType||actor.system.sort[itemType].reverse){
            update[updatePath].reverse=false;
        }else{
            update[updatePath].reverse=true;
        }

        await this.actor.update(update);

    }
    //Handle the popup when user clicks item name to show item description
    async _onItemDescrGet(event){
        event.preventDefault();
        let descr = event.target.attributes["data-item-descr"].value;
        var options = {
            width: 300,
            height: 400
        };
        var name=event.currentTarget.dataset["name"];
        let dlg = new Dialog({
            title: `${name} Description`,
            content: "<p>"+descr+"</p>",
            buttons: {
                submit: {
                    label: "OK",
                    callback: null
                }
            },
            default: "submit",
        }, options);
        dlg.render(true);
    }
    //Handle creating a new item, will sort the item type before making the new item
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset["type"];
        const sort = this.actor.itemTypes[type].length;
        const itemData = {
            name: `new ${type}`,
            type: type,
            sort: sort
        };
        let item=await FortyKItem.create(itemData,{temporary:true});
        await this.actor.createEmbeddedDocuments("Item",[foundry.utils.duplicate(item)],{"renderSheet":true});

    }
    //provides an interface to add new talents and apply the corresponding flags
    async _onTntCreate(event){
        event.preventDefault();
        var actor=this.actor;
        let tnts
        if(actor.type==="vehicle"){
            var vehicleTraits=await game.packs.get("fortyk.vehicle-traits");
            tnts=await vehicleTraits.getDocuments();
        }else{
            var dh2Talents=await game.packs.get("fortyk.talent-core-dh2");
            tnts=await dh2Talents.getDocuments();
            var dh2Traits=await game.packs.get("fortyk.traits-core-dh2");
            tnts=tnts.concat(await dh2Traits.getDocuments());
            var dh2EnemyWithinTalents=await game.packs.get("fortyk.talents-enemies-within");
            tnts=tnts.concat(await dh2EnemyWithinTalents.getDocuments());
            var dh2EnemyWithoutTalents=await game.packs.get("fortyk.talents-enemies-without");
            tnts=tnts.concat(await dh2EnemyWithoutTalents.getDocuments());
            var dh2EnemyBeyondTalents=await game.packs.get("fortyk.talents-enemies-beyond");
            tnts=tnts.concat(await dh2EnemyBeyondTalents.getDocuments());
            var owCoreTalents=await game.packs.get("fortyk.talents-ow-core");
            tnts=tnts.concat(await owCoreTalents.getDocuments());
            var owHOTETalents=await game.packs.get("fortyk.talents-hammer-of-the-emperor");
            tnts=tnts.concat(await owHOTETalents.getDocuments());
            var owShieldOfHumanityTalents=await game.packs.get("fortyk.talents-shield-of-humanity");
            tnts=tnts.concat(await owShieldOfHumanityTalents.getDocuments());
            var customTalents=await game.packs.get("fortyk.custom-talents");
            tnts=tnts.concat(await customTalents.getDocuments());
            var customBonus=await game.packs.get("fortyk.custom-bonus-and-drawbacks");
            tnts=tnts.concat(await customBonus.getDocuments());
        }

        //load different packs depending on actor type
        if(actor.type==="dhPC"||actor.type==="npc"){
            var dh2CoreBonus=await game.packs.get("fortyk.role-homeworld-and-background-bonuscore-dh2");
            tnts=tnts.concat(await dh2CoreBonus.getDocuments());
            var dh2EnemiesWithinBonus=await game.packs.get("fortyk.role-homeworld-and-background-bonusenemies-within");
            tnts=tnts.concat(await dh2EnemiesWithinBonus.getDocuments());
            var dh2EnemiesWithoutBonus=await game.packs.get("fortyk.role-homeworld-and-background-bonusenemies-without");
            tnts=tnts.concat(await dh2EnemiesWithoutBonus.getDocuments());
            var dh2EnemiesBeyondBonus=await game.packs.get("fortyk.role-homeworld-and-background-bonusenemies-beyond");
            tnts=tnts.concat(await dh2EnemiesBeyondBonus.getDocuments());
        }else if(actor.type==="dwPC"||actor.type==="npc"){
            var dwBonus=await game.packs.get("fortyk.deathwatch-bonus-and-drawbacks");
            tnts=tnts.concat(await dwBonus.getDocuments());
            var dwTalents=await game.packs.get("fortyk.deathwatch-talents");
            tnts=tnts.concat(await dwTalents.getDocuments());
        }else if(actor.type==="owPC"||actor.type==="npc"){
            var owCoreAbilities=await game.packs.get("fortyk.homeworld-and-specialty-abilities-core-ow");
            tnts=tnts.concat(await owCoreAbilities.getDocuments());
            var owHOTEAbilities=await game.packs.get("fortyk.homeworld-and-specialty-abilities-hammer-of-the-emperor");
            tnts=tnts.concat(await owHOTEAbilities.getDocuments());
            var owHOTEOrders=await game.packs.get("fortyk.orders-hammer-of-the-emperor");
            tnts=tnts.concat(await owHOTEOrders.getDocuments());
            var owShieldOfHumanityAbilities=await game.packs.get("fortyk.homeworld-and-specialty-abilities-shield-of-humanity");
            tnts=tnts.concat(await owShieldOfHumanityAbilities.getDocuments());
            var owShieldOfHumanityOrders=await game.packs.get("fortyk.orders-shield-of-humanity");
            tnts=tnts.concat(await owShieldOfHumanityOrders.getDocuments());
        }
        tnts=tnts.sort(function compare(a, b) {
            if (a.name<b.name) {
                return -1;
            }
            if (a.name>b.name) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let templateOptions={"tnts":tnts};

        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/tnt-dialog.html', templateOptions);
        var options = {
            width: 666,
            height: 600,
            classes:["systems/fortyk/css/fortyk.css","tntdialog"]
        };

        renderedTemplate.then(content => { 
            new Dialog({
                title: "Add Talents, Traits and Bonus",
                content: content,
                buttons:{
                    submit:{
                        label:"Add selected to Character",
                        callback: async html => {
                            let selectedIds=[];
                            $(html).find('input:checked').each(function(){
                                selectedIds.push($(this).val());
                            })

                            let $selectedCompendiums= $('input:checked',html).map(function(){
                                return this.getAttribute('data-compendium');
                            }).get();

                            let talentsNTraits=[];
                            for(let i=0;i<selectedIds.length;i++){
                                let tnt=null;
                                switch($selectedCompendiums[i]){
                                    case"fortyk.talent-core-dh2":
                                        tnt=await dh2Talents.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.traits-core-dh2":
                                        tnt=await dh2Traits.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-enemies-within":

                                        tnt=await dh2EnemyWithinTalents.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-enemies-without":
                                        tnt=await dh2EnemyWithoutTalents.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-enemies-beyond":
                                        tnt=await dh2EnemyBeyondTalents.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.role-homeworld-and-background-bonuscore-dh2":
                                        tnt=await dh2CoreBonus.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.role-homeworld-and-background-bonusenemies-without":
                                        tnt=await dh2EnemiesWithoutBonus.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.role-homeworld-and-background-bonusenemies-within":
                                        tnt=await dh2EnemiesWithinBonus.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.role-homeworld-and-background-bonusenemies-beyond":
                                        tnt=await dh2EnemiesBeyondBonus.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.deathwatch-bonus-and-drawbacks":
                                        tnt=await dwBonus.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.deathwatch-talents":
                                        tnt=await dwTalents.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-ow-core":
                                        tnt=await owCoreTalents.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-hammer-of-the-emperor":
                                        tnt=await owHOTETalents.getDocument(selectedIds[i]);

                                        break;
                                    case "fortyk.talents-shield-of-humanity":
                                        tnt=await owShieldOfHumanityTalents.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.homeworld-and-specialty-abilities-core-ow":
                                        tnt=await owCoreAbilities.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.homeworld-and-specialty-abilities-hammer-of-the-emperor":
                                        tnt=await owHOTEAbilities.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.orders-hammer-of-the-emperor":
                                        tnt=await owHOTEOrders.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.homeworld-and-specialty-abilities-shield-of-humanity":
                                        tnt=await owShieldOfHumanityAbilities.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.orders-shield-of-humanity":
                                        tnt=await owShieldOfHumanityOrders.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.custom-talents":
                                        tnt=await customTalents.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.custom-bonus-and-drawbacks":
                                        tnt=await customBonus.getDocument(selectedIds[i]);
                                        break;
                                    case "fortyk.vehicle-traits":
                                        tnt=await vehicleTraits.getDocument(selectedIds[i]);
                                        break;
                                }
                                let itemData= foundry.utils.duplicate(tnt);

                                let spec=itemData.system.specialisation.value;
                                let flag=itemData.system.flagId.value;
                                if(!actor.getFlag("fortyk",flag)){

                                    if(spec==="N/A"){

                                        await actor.setFlag("fortyk",flag,true);
                                    }else{
                                        let chosenSpec=await Dialog.prompt({
                                            title: `Choose specialisation for ${tnt.name}`,
                                            content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${itemData.system.specialisation.value}" autofocus/></p>`,



                                            callback: async(html) => {
                                                const choosenSpec = $(html).find('input[name="spec"]').val();
                                                await actor.setFlag("fortyk",flag,choosenSpec);
                                                return choosenSpec;
                                            },






                                            width:100});
                                        itemData.system.specialisation.value= chosenSpec;

                                    }
                                    talentsNTraits.push(itemData);
                                }


                            }
                            await actor.createEmbeddedDocuments("Item",talentsNTraits);
                            this.render(true);
                        }
                    }
                },
                default: "submit"
            },options).render(true)
        });
    }
    //Edits the item that was clicked
    async _onItemEdit(event){
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        const item = this.actor.items.find(i => i._id == itemId);
        item.sheet.render(true);
    }
    //deletes the selected item from the actor
    async _onItemDelete(event){
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        let item=await this.actor.getEmbeddedDocument("Item",itemId);

        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/delete-item-dialog.html');
        renderedTemplate.then(content => {
            new Dialog({
                title: "Deletion Confirmation",
                content: content,
                buttons:{
                    submit:{
                        label:"Yes",
                        callback: async dlg => { 

                            await this.actor.deleteEmbeddedDocuments("Item",[itemId]);
                            this.render(true);
                        }
                    },
                    cancel:{
                        label: "No",
                        callback: null
                    }
                },
                default: "submit"
            }).render(true)
        });
    }

    //handles editing text inputs that are linked to owned items 
    async _itemTextInputEdit(event){

        let actor= this.actor;
        let newAmt=event.target.value;

        let dataItemId=event.target.attributes["data-item-id"].value;
        let target=event.target.attributes["data-target"].value.toString();
        let item= actor.getEmbeddedDocument("Item", dataItemId);
        let oldValue=event.target.defaultValue;
        if(oldValue!=newAmt){
            let update={};
            update[target]=newAmt;
            await item.update(update);
        }
    }
    //handles editing text inputs that are linked to owned items 
    async _itemTextInputEnter(event){
        if (event.keyCode == 13){
            let actor= this.actor;
            let newAmt=event.target.value;

            let dataItemId=event.target.attributes["data-item-id"].value;
            let target=event.target.attributes["data-target"].value.toString();
            let item= actor.getEmbeddedDocument("Item", dataItemId);
            let oldValue=event.target.defaultValue;
            if(oldValue!=newAmt){
                let update={};
                update[target]=newAmt;
                await item.update(update);
            }
        }

    }
    //handles firing mode change for maximal weapons
    async _onMaximalClick(event){
        let dataset=event.currentTarget.dataset;
        let weaponID=dataset["itemId"];
        let fortykWeapon=this.actor.items.get(weaponID);


        if(fortykWeapon.getFlag("fortyk","maximalMode")){
            await fortykWeapon.setFlag("fortyk","maximalMode",false);
            await fortykWeapon.setFlag("fortyk","recharge",false);

            if(fortykWeapon.getFlag("fortyk","blast")){
                await fortykWeapon.setFlag("fortyk","blast",parseInt(fortykWeapon.getFlag("fortyk","blast"))-2);

            }
        }else{
            await fortykWeapon.setFlag("fortyk","maximalMode",true);
            await fortykWeapon.setFlag("fortyk","recharge",true);
            if(fortykWeapon.getFlag("fortyk","blast")){
                await fortykWeapon.setFlag("fortyk","blast",parseInt(fortykWeapon.getFlag("fortyk","blast"))+2);
            }
        }
    }
    //handles firing mode change for las weapons
    async _onLasModeChange(event){
        event.preventDefault;
        const data=this.actor.system;
        let dataset=event.currentTarget.dataset;

        let actor=this.actor;
        let weaponID=dataset["itemId"];
        let fireMode=parseInt(event.currentTarget.value);
        let weapon=actor.items.get(weaponID);
        await weapon.update({"flags.fortyk.lasMode":fireMode});


    }
    /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
    async _onRoll(event) {
        event.preventDefault();

        const element = event.currentTarget;
        const dataset = element.dataset;
        let testType=dataset["rollType"];
        var testTarget=parseInt(dataset["target"]);
        console.log(dataset, testTarget);
        let tempMod=this.actor.system.secChar.tempMod.value;
        if(tempMod){
            testTarget+=this.actor.system.secChar.tempMod.value;
            this.actor.update({"system.secChar.tempMod.value":0});
        }


        var testLabel=dataset["label"];
        var testChar=dataset["char"];
        let rating=dataset["rating"];
        if(rating!==undefined){
            testTarget+=parseInt(rating);
        }
        var item=null;

        //ensure actor is prepared
        if(!this.actor.isPrepared){
            this.actor.prepareData();
        }
        if(dataset["itemId"]){
            item=await this.actor.items.get(dataset["itemId"]);
            //ensure item is prepared
            if(!item.system.isPrepared){
                await item.prepareData();
            }
        }
        if(testType==="forcefield"){
            let forcefieldId=dataset["id"];
            let forcefield=this.actor.getEmbeddedDocument("Item",forcefieldId);
            await FortykRollDialogs.callForcefieldDialog(forcefield,this.actor);
            return;
        }
        if(testType!=="focuspower"&&testType!=="rangedAttack"&&testType!=="meleeAttack"&&testType!=="sprayAttack"&&testType!=="torrentAttack"){

            await FortykRollDialogs.callRollDialog(testChar, testType, testTarget, this.actor, testLabel, item, false);
            return;
        }
        let attackOptions={
        }
        let targets=game.user.targets;
        if(targets.size>0&&this.actor.type!=="spaceship"){
            let targetIt=targets.values();
            let target=targetIt.next().value;
            let attacker=this.actor.getActiveTokens()[0];
            let targetActor=target.actor;

            if(targetActor.type==="vehicle"){
                attackOptions.vehicle=true;
                attackOptions.facing=getVehicleFacing(target,attacker);
            }
            attackOptions.prone=targetActor.getFlag("core","prone");
            attackOptions.stunned=targetActor.getFlag("core","stunned");
            attackOptions.totalDef=targetActor.getFlag("core","totalDef");
            attackOptions.running=targetActor.getFlag("core","running");
            attackOptions.size=targetActor.system.secChar.size.value;
            attackOptions.selfProne=this.actor.getFlag("core","prone");
            attackOptions.selfEvasion=this.actor.system.evasion;
            attackOptions.tarEvasion=targetActor.system.evasion;
            if(targetActor.getFlag("core","unconscious")||targetActor.getFlag("core","snare")){
                attackOptions.helpless=true;
            }else{
                attackOptions.helpless=false;
            }
            attackOptions.selfBlind=this.actor.getFlag("core","blind");
            attackOptions.distance=tokenDistance(target, attacker);

            let attackerElevation=attacker.elevation;
            let targetElevation=target.elevation;
            attackOptions.elevation=attackerElevation-targetElevation;


        }
        if(testType==="meleeAttack"){
            FortykRollDialogs.callMeleeAttackDialog(testChar, testType, testTarget, this.actor, testLabel, item, attackOptions);
            return;
        }
        if(testType==="rangedAttack"){
            FortykRollDialogs.callRangedAttackDialog(testChar, testType, testTarget, this.actor, testLabel, item, attackOptions);
            return;
        }
        if(testType==="focuspower"){
            if(this.actor.system.psykana.psykerType.value!=="navigator"){
                let pr=dataset["pr"];
                testLabel+=` at PR ${pr}`; 
            }else{
                let training=item.system.training.value;
                testLabel+=` at ${training} training`; 
            }

            FortykRollDialogs.callFocusPowerDialog(testChar, testType, testTarget, this.actor, testLabel, item, attackOptions);
            return;
        }

        if(testType==="sprayAttack"){
            FortykRollDialogs.callSprayAttackDialog(this.actor, testLabel, item, attackOptions,this);
        }
        if(testType==="torrentAttack"){
            FortykRollDialogs.callTorrentAttackDialog(this.actor, testLabel, item, attackOptions, this);
        }


    }
    //handles weapon damage rolls
    async _onDamageRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if(dataset.weapon){

            let actor=this.actor;
            let fortykWeapon=actor.items.get(dataset.weapon);
            if(!fortykWeapon.system.isPrepared){
                await fortykWeapon.prepareData();

            }
            let blast=false;
            if(Number.isInteger(parseInt(fortykWeapon.getFlag("fortyk","blast")))){
                blast=true;
            }
            if(blast){
                this._onBlastDamageRoll(event,fortykWeapon);
                return;
            }
            let weapon=fortykWeapon;
            let dfa=false;
            if(actor.getFlag("fortyk","deathfromabove")&&actor.system.secChar.lastHit.attackType==="charge"){
                dfa=true;
            }

            let dmg=0;
            if(actor.getFlag("fortyk","brutalcharge")&&actor.system.secChar.lastHit.attackType==="charge"){
                dmg=parseInt(actor.getFlag("fortyk","brutalcharge"));
            }
            if(fortykWeapon.getFlag("fortyk","brutalcharge")&&actor.system.secChar.lastHit.attackType==="charge"){
                dmg+=parseInt(fortykWeapon.getFlag("fortyk","brutalcharge"));
            }
            if(actor.getFlag("fortyk","twohandedbrutality")&&fortykWeapon.system.twohanded.value&&(actor.system.secChar.lastHit.attackType==="charge"||actor.system.secChar.lastHit.attackType==="allout")){
                dmg+=actor.system.characteristics.s.bonus;
            }
            if(actor.getFlag("fortyk","versatile")&&actor.getFlag("fortyk","lethality")){
                let damBonus
                if(actor.system.secChar.lastHit.type==="rangedAttack"){
                    if(actor.type==="vehicle"){
                        damBonus=Math.ceil(actor.system.crew.ws/20);
                    }else{
                        damBonus=Math.ceil(actor.system.characteristics.ws.bonus/2);
                    }
                }else if(actor.system.secChar.lastHit.type==="meleeAttack"){
                    if(actor.type==="vehicle"){
                        damBonus=Math.ceil(actor.system.crew.bs/20);
                    }else{
                        damBonus=Math.ceil(actor.system.characteristics.bs.bonus/2);
                    }
                }
                if(actor.type==="vehicle"&&actor.getFlag("fortyk","terribleoffensive")){
                    damBonus=damBonus*3;
                }
                dmg+=damBonus;
            }
            let options={dfa:dfa};
            options.dmg=dmg;
            let hits=actor.system.secChar.lastHit.hits;
            if(!hits){hits=1};
            options.hits=hits;
            let reroll=0;
            if(this.actor.getFlag("fortyk","wrothful")){
                reroll++;
            }
            options.reroll=reroll;
            let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/damage-dialog.html', options);
            let formula=foundry.utils.duplicate(weapon.system.damageFormula);
            renderedTemplate.then(content => {new Dialog({
                title: `Number of Hits & Bonus Damage`,
                content: content,
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: (el) => {
                            const hits = parseInt(Number($(el).find('input[name="hits"]').val()));
                            const dmg = $(el).find('input[name="dmg"]').val();
                            const pen = parseInt(Number($(el).find('input[name="pen"]').val()));
                            const magdmg = parseInt(Number($(el).find('input[name="magdmg"]').val()));
                            const rerollNum = parseInt(Number($(el).find('input[name="reroll"]').val()));

                            formula.value+=`+${dmg}`;

                            if(game.user.isGM){
                                FortykRolls.damageRoll(formula,actor,fortykWeapon,hits,false,false,magdmg,pen,rerollNum); 
                            }else{
                                //if user isnt GM use socket to have gm process the damage roll
                                let targets=game.user.targets.ids;
                                let lastHit=this.actor.system.secChar.lastHit
                                let socketOp={type:"damageRoll",package:{formula:formula,actor:actor.id,fortykWeapon:fortykWeapon.id,hits:hits,magdmg:magdmg,pen:pen,user:game.user.id,lastHit:lastHit,targets:targets,rerollNum:rerollNum}};
                                game.socket.emit("system.fortyk",socketOp);
                            }

                        }
                    }
                },
                default: "submit",
                width:100}).render(true)
                                             });
        }else if(dataset.formula){
            let roll = new Roll(dataset.formula, this.actor.system);
            let label = dataset.label ? `Rolling ${dataset.label} damage.` : '';
            await roll.roll();
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });
        }
    }
    async _onBlastDamageRoll(event, weapon){
        let scene=game.scenes.active;
        let templates=scene.templates.reduce(function(templates,template){
            if(template.isOwner){
                templates.push(template);
            }
            return templates;
        },[]);

        let targets=this.getBlastTargets(templates, scene);
        let actor=this.actor;
        let oldTargets=game.user.targets;
        let options={dfa:false};
        let hits 
        let dmg 
        let pen 
        let magdmg
        let rerollNum 
        options.dmg=0;
        options.blast=true;
        options.hits=1;
        let reroll=0;
        if(this.actor.getFlag("fortyk","wrothful")){
            reroll++;
        }
        options.reroll=reroll;

        let renderedTemplate=renderTemplate('systems/fortyk/templates/actor/dialogs/damage-dialog.html', options);
        let formula=foundry.utils.duplicate(weapon.system.damageFormula);
        renderedTemplate.then(content => {new Dialog({
            title: `Number of Hits & Bonus Damage`,
            content: content,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: async (el) => {

                        hits = parseInt(Number($(el).find('input[name="hits"]').val()));
                        dmg = parseInt(Number($(el).find('input[name="dmg"]').val()));
                        pen = parseInt(Number($(el).find('input[name="pen"]').val()));
                        magdmg = parseInt(Number($(el).find('input[name="magdmg"]').val()));
                        rerollNum = parseInt(Number($(el).find('input[name="reroll"]').val()));
                        if(dmg>0){
                            formula.value+=`+${dmg}`
                        }
                        let chatBlast={user: game.user._id,
                                       speaker:{actor,alias:actor.name},
                                       content:`Starting Blast weapon damage rolls`,
                                       classes:["fortyk"],
                                       flavor:`Blast Weapon Damage`,
                                       author:actor.id};
                        await ChatMessage.create(chatBlast,{});
                        if(game.user.isGM){
                            for(let i=0; i<targets.length;i++){
                                let curTargets=targets[i].targets;
                                weapon.template=targets[i].template;
                                let targetNames="";
                                let targetTokens=game.canvas.tokens.children[0].children.filter(token=>curTargets.includes(token.id));
                                for(let j=0; j<targetTokens.length;j++){
                                    let token=targetTokens[j];
                                    if(j===targetTokens.length-1){

                                        targetNames+=token.name;
                                    }else if(j===targetTokens.length-2){
                                        targetNames+=token.name+" and "
                                    }else{
                                        targetNames+=token.name+", " 
                                    }
                                }
                                if(curTargets.length!==0){

                                    game.user.updateTokenTargets(curTargets);

                                    let chatBlast2={user: game.user._id,
                                                    speaker:{actor,alias:actor.name},
                                                    content:`Template #${i+1} hits `+targetNames,
                                                    classes:["fortyk"],
                                                    flavor:`Blast Weapon Damage`,
                                                    author:actor.id};
                                    await ChatMessage.create(chatBlast2,{});
                                    await FortykRolls.damageRoll(formula,actor,weapon,hits,false,false,magdmg,pen,rerollNum); 
                                    game.user.updateTokenTargets();
                                    //clean templates after
                                    let scene=game.scenes.active;
                                    let templates=scene.templates;
                                    for(const template of templates){
                                        if(template.isOwner){

                                            await template.delete()
                                        }
                                    }
                                }




                            }

                        }else{
                            //if user isnt GM use socket to have gm process the damage roll

                            let lastHit=this.actor.system.secChar.lastHit
                            let socketOp={type:"blastDamageRoll",package:{formula:formula,actor:actor.id,fortykWeapon:weapon.id,hits:hits,magdmg:magdmg,pen:pen,user:game.user.id,lastHit:lastHit,targets:targets,rerollNum:rerollNum}};
                            await game.socket.emit("system.fortyk",socketOp);

                        }

                    }
                }
            },
            default: "submit",
            width:100}).render(true)});



    }
    getBlastTargets(templates, scene){
        let tokens=scene.tokens;
        let targets=[];
        let gridRatio=scene.dimensions.size/scene.dimensions.distance;

        for(let i=0;i<templates.length;i++){
            let targetted=[];
            let template=templates[i];
            let bounds=template._object._computeShape();
            bounds.x=template.x;
            bounds.y=template.y;
            console.log(bounds)

            tokens.forEach((token,id,tokens)=>{

                let tokenBounds=token._object.bounds;
                let bottomIn=false;
                let topIn=false;
                let rightIn=false;
                let leftIn=false;
                let tempInToken=false;
                let tokenInTemp=bounds.contains(token._object.center.x-template.x,token._object.center.y-template.y);
                if(bounds.x>tokenBounds.left&&bounds.x<tokenBounds.right&&bounds.y>tokenBounds.top&&bounds.y<tokenBounds.bottom){
                    tempInToken=true;
                }

                let bottomIntersect=lineCircleIntersection(tokenBounds.bottomEdge.A,tokenBounds.bottomEdge.B,{x:bounds.x,y:bounds.y},bounds.radius);
                bottomIn=!bottomIntersect.outside;
                let topIntersect=lineCircleIntersection(tokenBounds.topEdge.A,tokenBounds.topEdge.B,{x:bounds.x,y:bounds.y},bounds.radius);
                topIn=!topIntersect.outside;
                let leftIntersect=lineCircleIntersection(tokenBounds.leftEdge.A,tokenBounds.leftEdge.B,{x:bounds.x,y:bounds.y},bounds.radius);
                leftIn=!leftIntersect.outside;
                let rightIntersect=lineCircleIntersection(tokenBounds.rightEdge.A,tokenBounds.rightEdge.B,{x:bounds.x,y:bounds.y},bounds.radius);
                rightIn=!rightIntersect.outside;
                if(tokenInTemp||bottomIn||topIn||leftIn||rightIn||tempInToken){
                    targetted.push(token.id);
                }
                //console.log(bounds.overlaps(tokenBounds))
                /*if(bounds.overlaps(tokenBounds)){
                    targetted.push(token.id);
                }*/
            });
            let blastTargets={template:{x:template.x,y:template.y},targets:targetted}
            targets.push(blastTargets);
        }

        return targets;
    }
    //handles applying active effects from psychic powers
    async _onBuffDebuff(event){
        event.preventDefault();
        let targets=game.user.targets;
        if(targets.size>0){



            const element = event.currentTarget;
            const dataset = element.dataset;
            let powerId=dataset["power"];

            FortyKItem.applyPsyBuffs(this.actor.uuid, powerId, targets.ids)
        }else{
            ui.notifications.error("You must have targets to apply buffs or debuffs.");
        }
    }
    //handles cancelling buff/debuffs
    async _onCancelBuffs(event){
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        let powerId=dataset["power"];
        FortyKItem.cancelPsyBuffs(this.actor.uuid, powerId);
    }
    //handles executing psychic power macros
    async _onPsyMacro(event){
        event.preventDefault();
        let powerId=event.currentTarget.attributes["data-power"].value;
        let macroId=event.currentTarget.attributes["data-macro"].value;
        let targetIds=game.user.targets.ids;
        if(targetIds.size===0){
            ui.notifications.error("You must have targets to run psychic power macros.");
            return;
        }
        if(game.user.isGM){

            FortyKItem.executePsyMacro(powerId, macroId, this.actor.uuid, targetIds);
        }else{
            //if user isnt GM use socket to have gm process the damage roll


            let socketOp={type:"psyMacro",package:{powerId:powerId, macroId:macroId, actorId:this.actor.uuid, targetIds:targetIds}};
            await game.socket.emit("system.fortyk",socketOp);
        }

    }
    //handles repairing broken forcefields
    async _onRepairForcefield(event){
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-id"].value;
        const item = this.actor.items.find(i => i._id == itemId);
        await item.update({"system.broken.value":false});
    }
    async _onWeaponProfileChange(event){
        event.preventDefault();
        let uuid=event.currentTarget.value;
        let itemId=event.currentTarget.attributes["data-id"].value;
        let item=this.actor.getEmbeddedDocument("Item",itemId);

        await item.setFlag("fortyk","currentprofile",uuid);

    }
    //handle enabling and disabling active effects associated with armor
    async _onArmorChange(event){
        let actor=this.actor;
        let newArmorId=event.currentTarget.value;
        let newArmor=actor.getEmbeddedDocument("Item",newArmorId);
        let oldArmorId=this.actor.system.secChar.wornGear.armor._id;

        let oldArmor=this.actor.system.secChar.wornGear.armor
        let updates=[];

        if(!jQuery.isEmptyObject(oldArmor)){
            updates.push({"_id":oldArmorId,"system.isEquipped":false});
        }
        if(!jQuery.isEmptyObject(newArmor)){
            updates.push({"_id":newArmorId,"system.isEquipped":true});
        }

        if(updates.length>0){
            await this.actor.updateEmbeddedDocuments("Item",updates);
        }


    }
    async _onForceFieldChange(event){
        let actor=this.actor;
        let newForceFieldId=event.currentTarget.value;
        let newForceField=actor.getEmbeddedDocument("Item",newForceFieldId);
        let oldForceFieldId=this.actor.system.secChar.wornGear.forceField._id;
        let oldForceField=this.actor.system.secChar.wornGear.forceField
        let updates=[];
        if(!jQuery.isEmptyObject(oldForceField)){
            updates.push({"_id":oldForceFieldId,"system.isEquipped":false});
        }
        if(!jQuery.isEmptyObject(newForceField)){
            updates.push({"_id":newForceFieldId,"system.isEquipped":true});
        }
        if(updates.length>0){
            await this.actor.updateEmbeddedDocuments("Item",updates);
        }


    }
    //handles force weapon special damage rolls
    async _onForceRoll(event){
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        let actor=this.actor;
        new Dialog({
            title: `Force Attack`,
            content: `<p><label>Number of Dice:</label> <input type="text" id="modifier" name="hits" value="1" data-dtype="Number" autofocus/></p>`,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: async (el) =>  {
                        const hits = parseInt(Number($(el).find('input[name="hits"]').val()));

                        let forceData={name:"Force",type:"rangedWeapon"}
                        let force=await Item.create(forceData, {temporary: true});

                        force.flags.fortyk={};
                        force.flags.fortyk.ignoreSoak=true;
                        force.system.damageFormula.value=`${hits}d10`;
                        force.system.damageType.value="Energy";
                        FortykRolls.damageRoll(force.system.damageFormula,actor,force,1);
                    }
                }
            },
            default: "submit",
            width:100}
                  ).render(true);
    }


}