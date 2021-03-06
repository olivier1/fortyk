/*abstract class that is not used, sets most of the functions that are common to all sheets of the system*/
import {FortykRollDialogs} from "../FortykRollDialogs.js";
import {FortykRolls} from "../FortykRolls.js";
import {objectByString} from "../utilities.js";
import {setNestedKey} from "../utilities.js";
import {tokenDistance} from "../utilities.js";
export default class FortyKBaseActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            scrollY: [
                ".main",
                ".skills",
                ".tnt",
                ".exp",
                ".combat",
                ".gear",
                ".psykana"
            ]

        });
    }
    /* -------------------------------------------- */
    /** @override */
    getData() {
        const data = super.getData().data;
        data.actor=this.actor.prepare();
        data.isGM=game.user.isGM;
        data.isOwner=this.actor.isOwner;
        data.dtypes = ["String", "Number", "Boolean"];
        data.races=game.fortyk.FORTYK.races;
        data.aptitudes=game.fortyk.FORTYK.aptitudes;
        data.size=game.fortyk.FORTYK.size;
        data.skillChars=game.fortyk.FORTYK.skillChars;
        data.skillTraining=game.fortyk.FORTYK.skillTraining;
        data.editable = this.options.editable;
        return data;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;
        //Add item to actor
        html.find('.item-create').click(this._onItemCreate.bind(this));
        //edit item on actor
        html.find('.item-edit').click(this._onItemEdit.bind(this));
        //delete item on actor
        html.find('.item-delete').click(this._onItemDelete.bind(this));
        //change item property via text input
        html.find('.item-text-input').focusout(this._itemTextInputEdit.bind(this));
        //get item description
        html.find('.item-descr').click(this._onItemDescrGet.bind(this));
        //handles maximal checkbox
        html.find('.maximal').click(this._onMaximalClick.bind(this));
        //handles lasmode select
        html.find('.lasMode').change(this._onLasModeChange.bind(this));
        //reset cover fields
        html.find('.cover-reset').click(this._onCoverReset.bind(this));
        //Damage rolls
        html.find('.damage-roll').click(this._onDamageRoll.bind(this));
        //autofcus modifier input
        html.find('.rollable').click(this._onRoll.bind(this));
        //force damage roll
        html.find('.force-roll').click(this._onForceRoll.bind(this));
        //creating a tnt
        html.find('.tnt-create').click(this._onTntCreate.bind(this));

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

            let sortDrag=draggedItem.data.sort;
            let sortTarget=targetItem.data.sort;
            if(sortTarget>sortDrag){

                sortDrag=sortTarget;
                sortTarget-=1;
            }else{
                sortDrag=sortTarget;
                sortTarget+=1;
            }
            await this.actor.updateItem([{"_id":draggedId,"sort":sortDrag},{"_id":targetId,"sort":sortTarget}]);

        }



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
        const itemData = {
            name: `new ${type}`,
            type: type
        };
        
        await this.actor.createEmbeddedDocuments("Item",[itemData],{"renderSheet":true});
        
    }
    //provides an interface to add new talents and apply the corresponding flags
    async _onTntCreate(event){
        event.preventDefault();
        var actor=this.actor;
        const dh2Talents=await game.packs.get("fortyk.talent-core-dh2");
        let tnts=await dh2Talents.getDocuments();
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
        //load different packs depending on actor type
        if(actor.data.type==="dhPC"){
            var dh2CoreBonus=await game.packs.get("fortyk.role-homeworld-and-background-bonuscore-dh2");
            tnts=tnts.concat(await dh2CoreBonus.getDocuments());
            var dh2EnemiesWithinBonus=await game.packs.get("fortyk.role-homeworld-and-background-bonusenemies-within");
            tnts=tnts.concat(await dh2EnemiesWithinBonus.getDocuments());
            var dh2EnemiesWithoutBonus=await game.packs.get("fortyk.role-homeworld-and-background-bonusenemies-without");
            tnts=tnts.concat(await dh2EnemiesWithoutBonus.getDocuments());
            var dh2EnemiesBeyondBonus=await game.packs.get("fortyk.role-homeworld-and-background-bonusenemies-beyond");
            tnts=tnts.concat(await dh2EnemiesBeyondBonus.getDocuments());
        }else if(actor.data.type==="dwPC"){
            var dwBonus=await game.packs.get("fortyk.deathwatch-bonus-and-drawbacks");
            tnts=tnts.concat(await dwBonus.getDocuments());
        }else if(actor.data.type==="owPC"){
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
            width: 250,
            height: 600,
            classes:["systems/fortyk/css/fortyk.css"]
        };

        renderedTemplate.then(content => { 
            new Dialog({
                title: "Talents, Traits and Bonus",
                content: content,
                buttons:{
                    submit:{
                        label:"Add selected to Actor",
                        callback: async html => {

                            let selectedIds=$(html).find('#tntselect').val();
                            let $selectedCompendiums= $('option:selected',html).map(function(){
                                return this.getAttribute('data-compendium');
                            }).get();
                            let talentsNTraits=[];
                            for(let i=0;i<selectedIds.length;i++){
                                let tnt=null;
                                switch($selectedCompendiums[i]){
                                    case"fortyk.talent-core-dh2":
                                        tnt=await dh2Talents.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.traits-core-dh2":
                                        tnt=await dh2Traits.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-enemies-within":
                                        tnt=await dh2EnemyWithinTalents.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-enemies-without":
                                        tnt=await dh2EnemyWithoutTalents.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-enemies-beyond":
                                        tnt=await dh2EnemyBeyondTalents.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.role-homeworld-and-background-bonuscore-dh2":
                                        tnt=await dh2CoreBonus.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.role-homeworld-and-background-bonusenemies-without":
                                        tnt=await dh2EnemiesWithoutBonus.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.role-homeworld-and-background-bonusenemies-within":
                                        tnt=await dh2EnemiesWithinBonus.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.role-homeworld-and-background-bonusenemies-beyond":
                                        tnt=await dh2EnemiesBeyondBonus.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.deathwatch-bonus-and-drawbacks":
                                        tnt=await dwBonus.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-ow-core":
                                        tnt=await owCoreTalents.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.talents-hammer-of-the-emperor":
                                        tnt=await owHOTETalents.getEntity(selectedIds[i]);

                                        break;
                                    case "fortyk.talents-shield-of-humanity":
                                        tnt=await owShieldOfHumanityTalents.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.homeworld-and-specialty-abilities-core-ow":
                                        tnt=await owCoreAbilities.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.homeworld-and-specialty-abilities-hammer-of-the-emperor":
                                        tnt=await owHOTEAbilities.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.orders-hammer-of-the-emperor":
                                        tnt=await owHOTEOrders.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.homeworld-and-specialty-abilities-shield-of-humanity":
                                        tnt=await owShieldOfHumanityAbilities.getEntity(selectedIds[i]);
                                        break;
                                    case "fortyk.orders-shield-of-humanity":
                                        tnt=await owShieldOfHumanityOrders.getEntity(selectedIds[i]);
                                        break;
                                }
                                let itemData=tnt.data;
                                let tntData=itemData.data;
                                let spec=tntData.specialisation.value;
                                let flag=tntData.flagId.value;
                                if(!actor.getFlag("fortyk",flag)){

                                    if(spec==="N/A"){

                                        await actor.setFlag("fortyk",flag,true);
                                    }else{
                                        let chosenSpec= Dialog.prompt({
                                            title: "Choose specialisation",
                                            content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${tntData.specialisation.value}" autofocus/></p>`,



                                            callback: async(html) => {
                                                const choosenSpec = $(html).find('input[name="spec"]').val();
                                                await actor.setFlag("fortyk",flag,choosenSpec);
                                                return choosenSpec;
                                            },






                                            width:100}
                                                                     );
                                        setTimeout(function() {document.getElementById('specInput').select();}, 50);
                                        tntData.specialisation.value=await chosenSpec;
                                    }
                                    talentsNTraits.push(itemData);
                                }


                            }
                            await actor.createEmbeddedDocuments("Item",talentsNTraits);
                        }
                    }
                },
                default: "submit"
            },options).render(true)
        });
        setTimeout(function() {document.getElementById('tntfilter').select();}, 50);
    }
    //Edits the item that was clicked
    async _onItemEdit(event){
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        const item = this.actor.items.find(i => i.data._id == itemId);
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
                            if(item.type==="talentntrait"){
                                await this.actor.setFlag("fortyk",item.data.data.flagId.value,false);
                            }
                            this.actor.deleteEmbeddedDocuments("Item",[itemId]);
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
        let oldValue=objectByString(item,target);
        if(oldValue!=newAmt){
            let update={};
            update[target]=newAmt;
            item.update(update);
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
        const data=this.actor.data.data;
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
        var testLabel=dataset["label"];
        var testChar=dataset["char"];
        var item=null;
        let attackOptions={
        }
        let targets=game.user.targets;
        if(targets.size>0){
            let targetIt=targets.values();
            let target=targetIt.next().value;
            let attacker=this.actor.getActiveTokens()[0];
            let targetActor=target.actor;


            attackOptions.prone=targetActor.getFlag("core","prone");
            attackOptions.stunned=targetActor.getFlag("core","stunned");
            attackOptions.totalDef=targetActor.getFlag("core","totalDef");
            attackOptions.running=targetActor.getFlag("core","running");
            attackOptions.size=targetActor.data.data.secChar.size.value;
            attackOptions.selfProne=this.actor.getFlag("core","prone");
            if(targetActor.getFlag("core","unconscious")||targetActor.getFlag("core","snare")){
                attackOptions.helpless=true;
            }else{
                attackOptions.helpless=false;
            }
            attackOptions.selfBlind=this.actor.getFlag("core","blind");
            attackOptions.distance=tokenDistance(target, attacker);

        }
        if(dataset["itemId"]){
            item=this.actor.items.get(dataset["itemId"]);
        }
        if(testType!=="focuspower"&&testType!=="rangedAttack"&&testType!=="meleeAttack"){
            await FortykRollDialogs.callRollDialog(testChar, testType, testTarget, this.actor, testLabel, item, false);
            
        }else if(testType==="meleeAttack"){
            FortykRollDialogs.callMeleeAttackDialog(testChar, testType, testTarget, this.actor, testLabel, item, attackOptions);
        }else if(testType==="rangedAttack"){
            FortykRollDialogs.callRangedAttackDialog(testChar, testType, testTarget, this.actor, testLabel, item, attackOptions);
        }else if(testType==="focuspower"){
            FortykRollDialogs.callFocusPowerDialog(testChar, testType, testTarget, this.actor, testLabel, item, attackOptions);
        }
        //autofocus the input after it is rendered.
        setTimeout(function() {document.getElementById('modifier').select();}, 100);
    }
    //handles weapon damage rolls
    async _onDamageRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        if(dataset.weapon){

            let actor=this.actor;
            let fortykWeapon=actor.items.get(dataset.weapon);
            console.log(fortykWeapon);
            let weapon=fortykWeapon.data;
            console.log(weapon);
            let formula=duplicate(weapon.data.damageFormula);
            new Dialog({
                title: `Number of Hits & Bonus Damage`,
                content: `<div class="flexcol">
<div class="flexrow"><label>Number of Hits:</label> <input type="text" id="modifier" name="hits" value="1" data-dtype="Number" autofocus/></div>
<div class="flexrow"><label>Bonus Damage:</label> <input type="text" id="dmg" name="dmg" value="0" data-dtype="Number" /></div>
</div>`,
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: (el) => {
                            const hits = parseInt(Number($(el).find('input[name="hits"]').val()));
                            const dmg = parseInt(Number($(el).find('input[name="dmg"]').val()));
                            if(dmg>0){
                                formula.value+=`+${dmg}`
                            }
                            FortykRolls.damageRoll(formula,actor,fortykWeapon,hits);
                        }
                    }
                },
                default: "submit",
                width:100}
                      ).render(true);
            setTimeout(function() {document.getElementById('modifier').select();}, 50);
        }else if(dataset.formula){
            let roll = new Roll(dataset.formula, this.actor.data.data);
            let label = dataset.label ? `Rolling ${dataset.label} damage.` : '';
            roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });
        }
    }
    //handles resetting cover values to zero
    async _onCoverReset(event){
        let actor=this.actor;
        let data=duplicate(actor.data);
        data.data.secChar.cover.value=0;
        data.data.characterHitLocations.head.cover=false;
        data.data.characterHitLocations.body.cover=false;
        data.data.characterHitLocations.rArm.cover=false;
        data.data.characterHitLocations.lArm.cover=false;
        data.data.characterHitLocations.rLeg.cover=false;
        data.data.characterHitLocations.lLeg.cover=false;
        actor.update(data);
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

                        force.data.flags.fortyk={};
                        force.data.flags.fortyk.ignoreSoak=true;
                        force.data.data.damageFormula.value=`${hits}d10`;
                        force.data.data.damageType.value="Energy";
                        FortykRolls.damageRoll(force.data.data.damageFormula,actor,force,1);
                    }
                }
            },
            default: "submit",
            width:100}
                  ).render(true);
        setTimeout(function() {document.getElementById('modifier').select();}, 50);
    }


}