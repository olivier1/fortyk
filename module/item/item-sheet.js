/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */

import { objectByString } from "../utilities.js";
import { ActiveEffectDialog } from "../dialog/activeEffect-dialog.js";
import { ManageRequirementsDialog } from "../dialog/manageRequirements-dialog.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class FortyKItemSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
    /** @override */
    static DEFAULT_OPTIONS= {
        tag:"form",
        form:{
            handler: FortyKItemSheet._onSubmitForm,
            submitOnChange: true
        },
        classes: ["fortyk", "sheet", "item"],
        position:{width: 520,
                  height: "auto"},
        window: {
            controls: [
                {
                    icon: 'fas fa-asterisk',
                    label: 'Manage AEs',
                    action: 'manageAEs',
                    visible: this.isGM // Only show if the user is the owner (GM)
                }
            ]
        },
        actions: {

            manageAEs: this._onModifierClick
        }

    }
    static PARTS = {
        form: {
            template: 'systems/fortyk/templates/item/item-sheet.html',
            scrollable: ['']
        },
        ammunitionMain: {
            template: 'systems/fortyk/templates/item/itemParts/ammunition-main.html'
        },
        mods: {
            template: 'systems/fortyk/templates/item/itemParts/mods.html'
        },
        description: {
            template: 'systems/fortyk/templates/item/itemParts/description.html'
        },
        armorMain: {
            template: 'systems/fortyk/templates/item/itemParts/armor-main.html'
        },
        armor: {
            template: 'systems/fortyk/templates/item/itemParts/armor.html'
        },
        armorMods: {
            template: 'systems/fortyk/templates/item/itemParts/armor-mods.html'
        },
        eaMain: {
            template: 'systems/fortyk/templates/item/itemParts/eliteAdvance-main.html'
        },
        eaChars: {
            template: 'systems/fortyk/templates/item/itemParts/eliteAdvance-chars.html'
        },
        eaPB: {
            template: 'systems/fortyk/templates/item/itemParts/eliteAdvance-pointBuy.html'
        },
        eaPath: {
            template: 'systems/fortyk/templates/item/itemParts/eliteAdvance-path.html'
        },
        meleeMain: {
            template: 'systems/fortyk/templates/item/itemParts/meleeWeapon-main.html'
        },
        weaponMods: {
            template: 'systems/fortyk/templates/item/itemParts/weapon-mods.html'
        },
        altProfile: {
            template: 'systems/fortyk/templates/item/itemParts/alternate-profile.html'
        },
        rangedMain: {
            template: 'systems/fortyk/templates/item/itemParts/rangedWeapon-main.html'
        },
    }
    static TABS = {
        sheet:{
            tabs:[

            ]
        }
    }
    _getTabsConfig(group) {
        const tabs = foundry.utils.deepClone(super._getTabsConfig(group));

        const item = this.document;
        const itemType=item.type;
        console.log(itemType);
        // Modify tabs based on document properties
        switch(itemType){
            case "ammunition":

                tabs.tabs.push( { id: 'ammunitionMain', group: 'sheet', label: `Main` });
                if(!item.system.default.value){
                    tabs.tabs.push({ id: 'mods', group: 'sheet', label: `Mods` });
                }
                tabs.tabs.push({ id: 'description', group: 'sheet', label: `Description` });
                tabs.initial="ammunitionMain";
                break;
            case "armor":

                tabs.tabs.push( { id: 'armorMain', group: 'sheet', label: `Main` });
                tabs.tabs.push({ id: 'armor', group: 'sheet', label: `Armor` });
                tabs.tabs.push({ id: 'armorMods', group: 'sheet', label: `Mods` });

                tabs.tabs.push({ id: 'description', group: 'sheet', label: `Description` });
                tabs.initial="armorMain";
                break;
            case "eliteAdvance":
                const eaType=item.system.type.value;
                tabs.initial="eaMain";
                tabs.tabs.push( { id: 'eaMain', group: 'sheet', label: `Main` });
                switch(eaType){
                    case "charactertype":

                        tabs.tabs.push( { id: 'eaChars', group: 'sheet', label: `Characteristics` });
                        tabs.tabs.push( { id: 'eaPB', group: 'sheet', label: `Point Buy` });
                        break;
                    case "planet":

                        tabs.tabs.push( { id: 'eaChars', group: 'sheet', label: `Characteristics` });
                        break;
                    case "background":

                        tabs.tabs.push( { id: 'eaChars', group: 'sheet', label: `Characteristics` });
                        break;
                    case "role":

                        break;
                    case "ea":

                        tabs.tabs.push( { id: 'eaChars', group: 'sheet', label: `Characteristics` });
                        break;
                    case "asuryanipath":

                        tabs.tabs.push( { id: 'eaPath', group: 'sheet', label: `Path Req &amp; Abilities` });
                        break;
                }
                tabs.tabs.push( { id: 'description', group: 'sheet', label: `Description` });
                break;
            case "meleeWeapon":
                tabs.tabs.push( { id: 'meleeMain', group: 'sheet', label: `Main` });
                tabs.tabs.push({ id: 'weaponMods', group: 'sheet', label: `Mods` });
                tabs.tabs.push({ id: 'altProfile', group: 'sheet', label: `Alternate Profiles` });

                tabs.tabs.push({ id: 'description', group: 'sheet', label: `Description` });
                tabs.initial="meleeMain";
                break;
            case "rangedWeapon":
                tabs.tabs.push( { id: 'rangedMain', group: 'sheet', label: `Main` });
                tabs.tabs.push({ id: 'weaponMods', group: 'sheet', label: `Mods` });
                tabs.tabs.push({ id: 'altProfile', group: 'sheet', label: `Alternate Profiles` });

                tabs.tabs.push({ id: 'description', group: 'sheet', label: `Description` });
                tabs.initial="rangedMain";
                break;
        }


        return tabs;
    }
    _configureRenderOptions(options){
        super._configureRenderOptions(options);
        const parts=options.parts;
        const item = this.document;
        const itemType=item.type;
        let filter;
        let filteredArray;
        switch(itemType){
            case "ammunition":
                filter=['form',
                        'ammunitionMain',
                        'mods',
                        'description'];
                filteredArray = parts.filter(item => filter.includes(item));

                break;
            case "armor":
                filter=['form',
                        'armorMain',
                        'armor',
                        'armorMods',
                        'description'];
                filteredArray = parts.filter(item => filter.includes(item));

                break;
            case "eliteAdvance":
                filter=['form',
                        'eaMain',
                        'eaChars',
                        'eaPB',
                        'eaPath',
                        'description'];
                filteredArray = parts.filter(item => filter.includes(item));

                break;
            case "meleeWeapon":
                filter=['form',
                        'meleeMain',
                        'weaponMods',
                        'altProfile',
                        'description'];
                filteredArray = parts.filter(item => filter.includes(item));

                break;
            case "rangedWeapon":
                filter=['form',
                        'rangedMain',
                        'weaponMods',
                        'altProfile',
                        'description'];
                filteredArray = parts.filter(item => filter.includes(item));

                break;
            default:
                filter=['form'];
                filteredArray = parts.filter(item => filter.includes(item));
        }
        options.parts=filteredArray;
        return options;
    }
    _configureRenderParts(options) {
        const parts = foundry.utils.deepClone(this.constructor.PARTS);
        Object.values(parts).forEach(p => p.templates ??= []);
        const item = this.document; // Access the item document
        const templatePath = `systems/fortyk/templates/item/item-${item.type}-sheet.html`;

        // Update the part's template dynamically
        parts.form.template = templatePath;
        return parts;
    }



    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(options) {

        const item = this.document;
        const data = this.document;
        data.tabs=this._prepareTabs("sheet");
        data.enrichedDescription= await foundry.applications.ux.TextEditor.implementation.enrichHTML(data.system.description.value,
                                                                                                     {
            // Only show secret blocks to owner
            secrets: this.document.isOwner,
            // For Actors and Items
            relativeTo: this.document
        });
        if(game.user.isGM){
            data.enrichedGMDescription= await foundry.applications.ux.TextEditor.implementation.enrichHTML(data.system.description.gm,
                                                                                                           {
                // Only show secret blocks to owner
                secrets: this.document.isOwner,
                // For Actors and Items
                relativeTo: this.document
            });
        }
        data.mods = data.effects.filter((item) => item.flags?.fortyk?.modsystem);
        if (this.document.type === "skill") {
            //GET THE SKILLS WITH CHILDREN
            if (this.actor) {
                data.skillgroups = this.actor.items.filter(function (item) {
                    if (item.type === "skill") {
                        return item.system.hasChildren.value;
                    } else {
                        return false;
                    }
                });
            }
        }
        if (this.actor && item.type === "repairEntry") {
            data.knights = [];
            let knights = this.actor.system.knights;

            for (let i = 0; i < knights.length; i++) {
                let actor = game.actors.get(knights[i]);

                if (actor) {
                    data.knights.push(actor.name);
                }
            }
        }
        if (this.actor && this.actor.type === "vehicle") {
            data.vehicle = true;
        }
        if (this.document.type === "eliteAdvance") {
            if (this.document.system.type.value === "planet") {
                data.chars = foundry.utils.duplicate(game.fortyk.FORTYK.skillCharsInf);
                data.chars.any = { name: "any", caps: "ANY" };
            }
            if(this.document.system.type.value === "asuryanipath"){
                data.paths=await this.getAsuryaniPathAbilities();
                data.asuryani=item.system.asuryani;
            }

            data.compendiums = game.packs
                .values()
                .toArray()
                .map((x) => (x = x.metadata));
            data.chosenPack = this.chosenPack;
            if (this.chosenPack) {
                let items = await game.packs.get(this.chosenPack);

                data.compendiumItems = await items.getDocuments();

                data.compendiumItems.sort(function compare(a, b) {
                    let valueA = a._source.name;
                    let valueB = b._source.name;
                    if (valueA < valueB) {
                        return -1;
                    }
                    if (valueA > valueB) {
                        return 1;
                    }
                    // a must be equal to b
                    return 0;
                });


            } else {
                data.compendiumItems = [];
            }
        }
        if (this.document.type === "psychicPower") {
            let macroCompendium = game.packs.get("fortyk.fortykmacros");
            let psyFolder = macroCompendium.folders.get("MQBztfL3KvhTnCw9");
            let content = psyFolder.contents;
            data.psyMacros = content;
            data.macroUser = [
                { value: "gm", label: "GM" },
                { value: "user", label: "User" }
            ];
            if(this.document.system.class.value==="Psychic Bolt"||this.document.system.class.value==="Psychic Barrage"||this.document.system.class.value==="Psychic Storm"||this.document.system.class.value==="Psychic Blast"||this.document.system.class.value==="Navigator Gaze"){
                data.attack=true;
            }else{
                data.attack=false;
            }
        }
        if (item.getFlag("fortyk", "alternateprofiles")) {
            data.rangedWeapons = await this.getRangedWeapons();
            data.meleeWeapons = await this.getMeleeWeapons();
        }
        if (item.type === "knightChassis") {
            data.quirks = await this.getQuirks();
        }
        data.item = this.document;
        data.isGM = game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.FORTYK = game.fortyk.FORTYK;
        data.editable = this.isEditable;
        return data;
    }
    async getQuirks() {
        let chassis = await game.packs.get("fortyk.knight-chassis");
        let chassisDocuments = await chassis.getDocuments();
        chassisDocuments.sort(function compare(a, b) {
            let valueA = a.name;
            let valueB = b.name;
            if (valueA < valueB) {
                return -1;
            }
            if (valueA > valueB) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let quirks = chassisDocuments.reduce(function (quirks, document) {
            if (document.type === "talentntrait") {
                quirks[document.uuid] = document;
            }

            return quirks;
        }, {});

        quirks = Object.values(quirks);

        return quirks;
    }
    async getAsuryaniPathAbilities(){
        let abilityPack= await game.packs.get("fortyk.custom-bonus-and-drawbacks");
        let abilityDocuments= await abilityPack.getDocuments();
        let asuryaniPaths=abilityDocuments.filter((ability)=>ability?.folder?.name==="Path Bonuses");
        return asuryaniPaths;
    }
    async getRangedWeapons() {
        let wargear = await game.packs.get("fortyk.wargear");
        let wargearDocuments = await wargear.getDocuments();
        let knightComponents = await game.packs.get("fortyk.knight-components");
        let knightComponentDocuments = await knightComponents.getDocuments();
        let wargearbeta = await game.packs.get("fortyk.wargear-beta");
        let wargearbetaDocuments = await wargearbeta.getDocuments();
        let documents = wargearDocuments.concat(knightComponentDocuments, wargearbetaDocuments);
        documents.sort(function compare(a, b) {
            let valueA = a._source.name;
            let valueB = b._source.name;
            if (valueA < valueB) {
                return -1;
            }
            if (valueA > valueB) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let rangedWeapons = documents.reduce(function (rangedWeapons, document) {
            if (document.type === "rangedWeapon") {
                rangedWeapons[document.uuid] = document;
            }

            return rangedWeapons;
        }, {});

        rangedWeapons = Object.values(rangedWeapons);

        return rangedWeapons;
    }
    async getMeleeWeapons() {
        let wargear = await game.packs.get("fortyk.wargear");
        let wargearDocuments = await wargear.getDocuments();
        let knightComponents = await game.packs.get("fortyk.knight-components");
        let knightComponentDocuments = await knightComponents.getDocuments();
        let wargearbeta = await game.packs.get("fortyk.wargear-beta");
        let wargearbetaDocuments = await wargearbeta.getDocuments();
        let documents = wargearDocuments.concat(knightComponentDocuments, wargearbetaDocuments);
        documents.sort(function compare(a, b) {
            let valueA = a._source.name;
            let valueB = b._source.name;
            if (valueA < valueB) {
                return -1;
            }
            if (valueA > valueB) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        let meleeWeapons = documents.reduce(function (meleeWeapons, document) {
            if (document.type === "meleeWeapon") {
                meleeWeapons[document.uuid] = document;
            }

            return meleeWeapons;
        }, {});

        meleeWeapons = Object.values(meleeWeapons);
        return meleeWeapons;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = $(this.element).find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        const html=$(this.element);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;
        html.find(".skill-type").change(this._onParentChange.bind(this));
        html.find(".skill-children").click(this._onChildrenClick.bind(this));
        html.find(".special").click(this._onSpecialClick.bind(this));
        html.find(".addProfile").click(this._onAddProfileClick.bind(this));
        html.find(".removeProfile").click(this._onRemoveProfileClick.bind(this));
        html.find(".clone").click(this._onCloneClick.bind(this));
        html.find(".make-ammo").click(this._onMakeAmmoClick.bind(this));
        html.find(".knight-Hardpoint").keydown(this._onHardpointEnter.bind(this));
        html.find(".knight-Hardpoint").focusout(this._onHardpointEdit.bind(this));
        html.find(".profile-select").change(this._onProfileChange.bind(this));
        html.find(".compendium-select").change(this._onCompendiumChange.bind(this));
        html.find(".item-select").change(this._onItemChange.bind(this));
        html.find(".add").click(this._onAddItemClick.bind(this));
        html.find(".delete-index").click(this._onDeleteIndexClick.bind(this));
        html.find(".remove-last").click(this._onRemoveItemClick.bind(this));
        html.find(".delete-mod").click(this._onDeleteModClick.bind(this));
        html.find(".manage-reqs").click(this._onManageReqsClick.bind(this));
        html.find(".manage-mastery-reqs").click(this._onManageMasteryReqsClick.bind(this));
        html.find(".navflagconfirm").click(this._onNavFlagConfirmClick.bind(this));
        html.find(".add-path-item").click(this._onAddPathAbilityClick.bind(this));
        //handles melee weapon mod

        html.find(".weapon-mod").focusout(this._weaponModEdit.bind(this));
        html.find(".weapon-mod").keydown(this._weaponModEnter.bind(this));
        // Autoselect entire text
        $("input[type=text]").focusin(function () {
            $(this).select();
        });
        //stop the change event on all inputs because its jank
        $("input[type=text]").change(function (event){
            event.stopImmediatePropagation();
            event.preventDefault();
        });
        $("input[type=number]").change(function (event){
            event.stopImmediatePropagation();
            event.preventDefault();
        });
        $("select:not([class])").change(function (event){
            event.stopImmediatePropagation();
            event.preventDefault();
        });
    }
    async _onNavFlagConfirmClick(event){
        let navFlagInput=document.getElementById("navpowerflaginput");
        let flag=navFlagInput.value;
        let navPowerFlag=this.document.getFlag("fortyk","navpowerflag");
        if(flag!==navPowerFlag){
            this.document.setFlag("fortyk","navpowerflag",flag);
            if(navPowerFlag){
                this.document.setFlag("fortyk",navPowerFlag,false);
            }

            this.document.setFlag("fortyk",flag,true);
        }
    }
    async _onManageReqsClick(event) {
        event.preventDefault();
        let dialog = new ManageRequirementsDialog({ item: this.document, flag:"requirements" });
        dialog.render(true, { title: "Manage Requirements" });
    }
    async _onManageMasteryReqsClick(event){
        event.preventDefault();
        let dialog = new ManageRequirementsDialog({ item: this.document, flag:"masteryrequirements" });
        dialog.render(true, { title: "Manage Mastery Requirements" });
    }
    async _onDeleteModClick(event) {
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        let item = this.document;
        let activeEffect = await this.document.getEmbeddedDocument("ActiveEffect", itemId);

        let renderedTemplate = foundry.applications.handlebars.renderTemplate("systems/fortyk/templates/actor/dialogs/delete-item-dialog.html");
        renderedTemplate.then((content) => {
            new Dialog({
                title: "Deletion Confirmation",
                content: content,
                buttons: {
                    submit: {
                        label: "Yes",
                        callback: async (dlg) => {
                            if (activeEffect.getFlag("fortyk", "modsystem")) {
                                if (!activeEffect.getFlag("fortyk", "modsystem").isOneUse) {
                                    let modData = { system: activeEffect.getFlag("fortyk", "modsystem") };
                                    modData.name = activeEffect.name;
                                    modData.type = "mod";
                                    modData.effects = [foundry.utils.duplicate(activeEffect)];
                                    if (item.parent) {

                                        await item.parent.createEmbeddedDocuments("Item", [modData]);

                                    }
                                }
                            } 
                            await this.document.deleteEmbeddedDocuments("ActiveEffect", [itemId]);
                            this.render(true);
                            let apps = item.parent.apps;
                            for (const appKey in apps) {
                                apps[appKey].render(true);
                            }
                            this.render(true);
                        }
                    },
                    cancel: {
                        label: "No",
                        callback: null
                    }
                },
                default: "submit"
            }).render(true);
        });
    }
    _onCompendiumChange(event) {
        let compendium = event.target.value;
        this.chosenPack = compendium;
        this._render();
    }
    _onItemChange(event) {
        let item = event.target.value;
        let name = event.target.selectedOptions[0].innerText;
        this.chosenItem = item;
        this.chosenItemName = name;
        document.getElementById("add").removeAttribute("disabled");
    }

    async _onAddPathAbilityClick(event){
        let pathSelect=document.getElementById("path-ability-select");
        let uuid = pathSelect.value;
        let name = pathSelect.options[pathSelect.selectedIndex].text;
        let typeSelect=document.getElementById("path-ability-type-select");
        let abilityType=typeSelect.value;
        let item=this.document;
        let updatePath=`system.asuryani.${abilityType}`;
        let update={};
        update[updatePath]={id:uuid, name:name};
        item.update(update);
    }
    async _onAddItemClick(event) {
        let bonuses = this.document.system.items;
        let isORInput = document.getElementById("OR");
        let isOR = isORInput?.checked;
        let isANDInput = document.getElementById("AND");
        let isAND = isANDInput?.checked;
        let item = await fromUuid(this.chosenItem);

        let spec = item.system.specialisation?.value;

        let bonus = { uuid: this.chosenItem, name: this.chosenItemName, isOR: isOR, isAND: isAND };

        if (typeof spec === "string" && spec !== "N/A") {
            let chosenSpec = await Dialog.prompt({
                title: `Choose specialisation for ${item.name}`,
                content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${item.system.specialisation.value}" autofocus/></p>`,

                callback: async (html) => {
                    const choosenSpec = $(html).find('input[name="spec"]').val();
                    return choosenSpec;
                },

                width: 100
            });
            bonus.spec = chosenSpec;
            bonus.name += `: ${chosenSpec}`;
        }
        let amount = item.system.amount?.value;
        if (amount) {
            let newAmount = await Dialog.prompt({
                title: `Choose amount for ${item.name}`,
                content: `<p><label>Amount:</label> <input id="amountInput" type="text" name="amount" value="${item.system.amount.value}" autofocus/></p>`,

                callback: async (html) => {
                    const chosenAmount = parseInt($(html).find('input[name="amount"]').val());
                    return chosenAmount;
                },

                width: 100
            });
            if (newAmount > 1) {
                bonus.amount = newAmount;
            }
        }

        bonuses.push(bonus);
        this.document.update({ "system.items": bonuses });
        this.chosenItem = null;
        this.chosenItemName = null;
        document.getElementById("add").setAttribute("disabled", "");
        this.render();
    }
    _onRemoveItemClick(event) {
        let bonuses = this.document.system.items;
        if (bonuses.length) {
            bonuses.pop();
            this.document.update({ "system.items": bonuses });
        }
    }
    _onDeleteIndexClick(event) {
        let bonuses = this.document.system.items;
        let node = event.currentTarget;
        let index = parseInt(node.dataset.index);
        bonuses.splice(index, 1);
        this.document.update({ "system.items": bonuses });
    }
    _onCloneClick(event) {
        let item = this.document.clone();
        Item.create(foundry.utils.duplicate(item));
    }
    async _onAddProfileClick(event) {
        let item = this.document;
        if (!item.getFlag("fortyk", "profiles")) {
            await item.setFlag("fortyk", "profiles", [""]);
        } else {
            let profiles = item.getFlag("fortyk", "profiles");
            profiles.push("");
            await item.setFlag("fortyk", "profiles", profiles);
        }
    }
    async _onRemoveProfileClick(event) {
        let item = this.document;

        let profiles = item.getFlag("fortyk", "profiles");
        profiles.pop();
        await item.setFlag("fortyk", "profiles", profiles);
    }
    _onProfileChange(event) {
        event.preventDefault();
        const dataset = event.currentTarget.dataset;
        const uuid = event.currentTarget.value;
        let index = dataset.index;
        let item = this.document;
        let profiles = item.getFlag("fortyk", "profiles");
        profiles.splice(index, 1, uuid);
        item.setFlag("fortyk", "profiles", profiles);
    }
    async _onMakeAmmoClick(event) {
        let weapon = this.document._source;
        let ammoData = {};
        let actor = this.actor;
        ammoData["name"] = `${weapon.name} Ammunition`;
        ammoData["type"] = "ammunition";
        ammoData["flags"] = weapon.flags;
        ammoData["system.class.value"] = weapon.system.class.value;
        ammoData["system.damageType.value"] = weapon.system.damageType.value;
        ammoData["system.type.value"] = weapon.system.type.value;
        // Math.round((data.knight.armorValues.value*armorRatio + Number.EPSILON) * 100) / 100;
        if (actor.system.knight) {
            ammoData["system.weight.value"] = 1;
            ammoData["system.space.value"] = 1;
        } else {
            ammoData["system.weight.value"] =
                Math.round((parseFloat(weapon.system.weight.value) * 0.1 + Number.EPSILON) * 100) / 100;
        }

        ammoData["system.damageFormula.formula"] = weapon.system.damageFormula.formula;
        ammoData["system.pen.formula"] = weapon.system.pen.formula;
        ammoData["system.range.formula"] = weapon.system.range.formula;
        let ammo = await actor.createEmbeddedDocuments("Item", [ammoData], { renderSheet: true });

        if (actor.system.knight) {
            let components = actor.system.knight.components;
            components[components.length - 1] = ammo[0].id;
            components.push("");
            await actor.update({ "system.knight.components": components });
        }
    }
    static async _onModifierClick(event) {
        /*let item=this.document;

        if(item.effects.size===0){
            let disabled=false;
            if(this.document.type==="psychicPower"){
                disabled=true;
            }
            let modifiersData={
                id: "modifiers",
                label: this.document.name,
                changes:[],
                transfer:true,
                disabled:disabled}
            await item.createEmbeddedDocuments("ActiveEffect",[modifiersData]);
        }
        let ae=item.effects.entries().next().value[1];





        new ActiveEffectConfig(ae).render(true);*/
        let item = this.document;
        let sheet = this;

        var options = {
            id: "aeDialog"
        };
        var d = new ActiveEffectDialog(
            {
                title: "Active Effects",
                item: item,
                buttons: {
                    button: {
                        label: "Ok",
                        callback: async (html) => {
                            sheet.item.dialog = undefined;
                        }
                    }
                },
                close: function () {
                    sheet.item.dialog = undefined;
                }
            },
            options
        ).render(true);
        sheet.item.dialog = d;
    }

    async _onSpecialClick(event) {
        let item = this.document;
        let specials = {};
        if (this.document.type === "armor") {
            specials = foundry.utils.duplicate(game.fortyk.FORTYK.armorFlags);
        } else {
            specials = foundry.utils.duplicate(game.fortyk.FORTYK.weaponFlags);
        }


        let flags = this.document._source.flags.fortyk;

        for (const flag in flags) {
            if (specials[flag]) {
                if (specials[flag].num !== undefined) {

                    specials[flag].num = flags[flag];
                    specials[flag].value = true;

                } else {
                    specials[flag].value = flags[flag];
                }
            }
        }
        let templateOptions = { specials: specials };
        let renderedTemplate = foundry.applications.handlebars.renderTemplate(
            "systems/fortyk/templates/item/dialogs/weapon-special-dialog.html",
            templateOptions
        );

        renderedTemplate.then((content) => {
            foundry.applications.api.DialogV2.wait({
                window:{title: "Weapon Special Qualities"},
                content: content,
                buttons: [
                    {
                        label: "Confirm",
                        callback: async (event) => {
                            let html=event.target.form.elements;
                            for (let [key, spec] of Object.entries(specials)) {
                                let bool = false;
                                let value = html[key].checked;
                                if (value !== spec.value) {
                                    bool = true;
                                }

                                if (bool && spec.num === undefined) {
                                    await this.document.setFlag("fortyk", key, value);
                                }

                                let num = false;
                                let number;
                                if (spec.num !== undefined && value) {
                                    number = html[`${key}num`].value;
                                    if (isNaN(parseFloat(number))) {
                                        if (number !== spec.num) {
                                            num = true;
                                        }
                                    } else {
                                        number = parseFloat(number);
                                    }
                                    if (value || number !== parseInt(spec.num)) {
                                        num = true;
                                    }
                                } else if (
                                    spec.num !== undefined &&
                                    !value &&
                                    this.document.getFlag("fortyk", key) !== undefined
                                ) {
                                    await this.document.setFlag("fortyk", key, false);
                                }

                                if (num) {
                                    await this.document.setFlag("fortyk", key, number);
                                }
                            }
                        }
                    }
                ],
                default: "submit"
            });
        });
    }
    async _weaponModEdit(event) {
        event.preventDefault();
        if (!this.updateObj) {
            this.updateObj = {};
        }
        let item = this.document;
        let target = event.target.attributes["data-target"].value;
        let newAmt = event.target.value;
        let type = event.target.attributes["data-dtype"]?.value;
        type??="String";
        if (type === "Number") {
            newAmt = parseFloat(newAmt);
            if (isNaN(newAmt)) {
                newAmt = 0;
                event.target.value = 0;
            }
        }
        let oldValue = objectByString(item, target);

        if (oldValue != newAmt) {
            this.updateObj[target] = newAmt;
        }
        let updateNmbr = Object.keys(this.updateObj).length;

        if (
            updateNmbr > 0 &&
            (!event.relatedTarget || $(event.relatedTarget).prop("class").indexOf("weapon-mod") === -1)
        ) {
            await item.update(this.updateObj);
            this.updateObj = undefined;
        }
    }
    async _weaponModEnter(event) {
        if (event.keyCode == 13) {
            if (!this.updateObj) {
                this.updateObj = {};
            }
            let item = this.document;
            let target = event.target.attributes["data-target"].value;
            let newAmt = event.target.value;
            let type = event.target.attributes["data-dtype"].value;
            if (type === "Number") {
                newAmt = parseFloat(newAmt);
                if (isNaN(newAmt)) {
                    newAmt = 0;
                    event.target.value = 0;
                }
            }
            let oldValue = objectByString(item, target);
            if (oldValue != newAmt) {
                this.updateObj[target] = newAmt;
                await item.update(this.updateObj);
                this.updateObj = undefined;
            }
        }
    }
    //when changing parents check to see if the skill is part of a group if it is change the value of children to false
    async _onParentChange(event) {
        /*let value=event.currentTarget.value;

        if(value!==""){
            let item=this.document;
            if(item.system.hasChildren){
                let children=this.actor.items.filter(item=>function(item){
                    return item.system.parent.value===this.document.system.name.value});
                for(let i of children){
                    await i.update({'system.parent.value':""});

                }
                await this.document.update({'system.hasChildren.value':false});
            }




        }*/
    }
    async _onChildrenClick(event) {
        let value = event.currentTarget.checked;
        if (value) {
            await this.document.update({ "system.parent.value": "" });
        }
    }
    async _onHardpointEdit(event) {
        event.preventDefault();
        if (!this.updateObj) {
            this.updateObj = {};
        }
        let item = this.document;
        let location = event.target.attributes["data-location"].value;
        let type = event.target.attributes["data-type"].value;
        let newAmt = event.target.value;

        newAmt = parseFloat(newAmt);
        if (isNaN(newAmt)) {
            return;
        }
        let target = `system.hardPoints.${location}.${type}`;
        let oldValue = item.system.hardPoints[location][type].length;
        let oldArray = item.system.hardPoints[location][type];

        if (newAmt > oldValue) {
            for (let i = oldValue; i < newAmt; i++) {
                oldArray.push("");
            }
            this.updateObj[target] = oldArray;
        } else if (oldValue > newAmt) {
            for (let i = oldValue; i > newAmt; i--) {
                oldArray.pop();
            }
            this.updateObj[target] = oldArray;
        }
        let updateNmbr = Object.keys(this.updateObj).length;
        if (
            updateNmbr > 0 &&
            (!event.relatedTarget || $(event.relatedTarget).prop("class").indexOf("knight-Hardpoint") === -1)
        ) {
            await item.update(this.updateObj);
            this.updateObj = undefined;
        }
    }
    async _onHardpointEnter(event) {
        if (event.keyCode == 13) {
            if (!this.updateObj) {
                this.updateObj = {};
            }
            let item = this.document;
            let location = event.target.attributes["data-location"].value;
            let type = event.target.attributes["data-type"].value;
            let newAmt = event.target.value;

            newAmt = parseFloat(newAmt);
            if (isNaN(newAmt)) {
                return;
            }
            let target = `system.hardPoints.${location}.${type}`;
            let oldValue = item.system.hardPoints[location][type].length;
            let oldArray = item.system.hardPoints[location][type];

            if (newAmt > oldValue) {
                for (let i = oldValue; i < newAmt; i++) {
                    oldArray.push("");
                }
                this.updateObj[target] = oldArray;

                await item.update(this.updateObj);
                this.updateObj = undefined;
            } else if (oldValue > newAmt) {
                for (let i = oldValue; i > newAmt; i--) {
                    oldArray.pop();
                }
                this.updateObj[target] = oldArray;
                await item.update(this.updateObj);
                this.updateObj = undefined;
            }
        }
    }
    static async _onSubmitForm(event, form, formData){
        console.log(event,formData);
        event.preventDefault();
        let object=formData.object;
        let description=object.system?.description?.value;
        let GMDescription=object.system?.description?.gm;

        if(description){
            object.system.description.value=foundry.utils.cleanHTML(description);

        }
        if(GMDescription){
            object.system.description.gm=foundry.utils.cleanHTML(GMDescription);

        }
        await this.document.update(formData.object);
    }
}
