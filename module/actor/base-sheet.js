/*abstract class that is not used, sets most of the functions that are common to all sheets of the system*/
import { FortykRollDialogs } from "../FortykRollDialogs.js";
import { FortykRolls } from "../FortykRolls.js";
import { objectByString } from "../utilities.js";
import { setNestedKey } from "../utilities.js";
import { tokenDistance } from "../utilities.js";
import { getVehicleFacing } from "../utilities.js";
import { FortyKItem } from "../item/item.js";
import { getBlastTargets } from "../utilities.js";
import { ActiveEffectDialog } from "../dialog/activeEffect-dialog.js";
import { tntDialog } from "../dialog/tnt-dialog.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { DragDrop } = foundry.applications.ux;

export default class FortyKBaseActorSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
    #dragDrop;
    /** @override */
    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: FortyKBaseActorSheet._onSubmitForm,
            submitOnChange: true
        },
        dragDrop: [
            {
                dragSelector: '[data-drag="true"]',
                dropSelector: ".drop-zone"
            }
        ],
        actions: {
            editImage: this.#onEditImage,
            manageAEs: this._manageAEs
        },
        window: {
            controls: [
                {
                    icon: "fas fa-asterisk",
                    label: "Manage AEs",
                    action: "manageAEs",
                    visible: this.isGM // Only show if the user is the owner (GM)
                }
            ]
        }
    };
    constructor(options = {}) {
        super(options);
        this.#dragDrop = this.#createDragDropHandlers();
    }
    static async #onEditImage(event, target) {
        const field = target.dataset.field || "img";
        const current = foundry.utils.getProperty(this.document, field);

        const fp = new foundry.applications.apps.FilePicker({
            type: "image",
            current: current,
            callback: (path) => this.document.update({ [field]: path })
        });

        fp.render(true);
    }
    #createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this)
            };
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                drop: this._onDrop.bind(this)
            };
            return new DragDrop(d);
        });
    }

    _canDragStart(selector) {
        return this.document.isOwner && this.isEditable;
    }

    _canDragDrop(selector) {
        return this.document.isOwner && this.isEditable;
    }

    _onDragOver(event) {
        // Optional: handle dragover events if needed
    }
    /* -------------------------------------------- */
    /** @override */
    async _prepareContext(options) {
        const data = this.document;
        data.actor = await this.document.prepare();
        data.isGM = game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.races = game.fortyk.FORTYK.races;
        data.advances = game.fortyk.FORTYK.advances;
        data.aptitudes = game.fortyk.FORTYK.aptitudes;
        data.size = game.fortyk.FORTYK.size;
        data.skillChars = game.fortyk.FORTYK.skillChars;
        data.skillTraining = game.fortyk.FORTYK.skillTraining;
        data.psyDisciplines = game.fortyk.FORTYK.psychicDisciplines;
        data.psykerTypes = game.fortyk.FORTYK.psykerTypes;
        if (!data?.eliteAdvances?.length) {
            data.eliteAdvances = undefined;
        }
        data.owner = this.isOwner;
        data.editable = this.isEditable;
        data.money = game.settings.get("fortyk", "dhMoney");
        data.alternateWounds = game.settings.get("fortyk", "alternateWounds");
        data.bcCorruption = game.settings.get("fortyk", "bcCorruption");
        data.coverTypes = game.fortyk.FORTYK.coverTypes;

        return data;
    }
    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        const html = $(this.element);
        //right click profile img
        html.find(".profile-img").contextmenu(this._onImgRightClick.bind(this));

        // Everything below here is only needed if the sheet is editable
        //get item description
        html.find(".item-descr").click(this._onItemDescrGet.bind(this));

        if (!this.isEditable) return;

        //handles combat tab resources

        html.find(".combat-resources").focusout(this._combatResourceEdit.bind(this));
        html.find(".combat-resources").keydown(this._combatResourceEnter.bind(this));
        //Add item to actor
        html.find(".item-create").click(this._onItemCreate.bind(this));
        //edit item on actor
        html.find(".item-edit").click(this._onItemEdit.bind(this));
        //delete item on actor
        html.find(".item-delete").click(this._onItemDelete.bind(this));

        //change item property via text input
        html.find(".item-text-input").focusout(this._itemTextInputEdit.bind(this));
        html.find(".item-text-input").keydown(this._itemTextInputEnter.bind(this));

        //handles maximal checkbox
        html.find(".maximal").click(this._onMaximalClick.bind(this));
        //handles lasmode select
        html.find(".lasMode").change(this._onLasModeChange.bind(this));
        //toggles display of malice corruption input
        html.find(".malice-secret").click(this._onMaliceClick.bind(this));
        //handles chaning armor
        html.find(".armor-select").change(this._onArmorChange.bind(this));
        //handles changing forcefield
        html.find(".force-field").change(this._onForceFieldChange.bind(this));
        //Damage rolls
        html.find(".damage-roll").click(this._onDamageRoll.bind(this));
        //Psychic power buff/debuffs
        html.find(".buff-debuff").click(this._onBuffDebuff.bind(this));
        //Cancel Sustained buffs/debuffs
        html.find(".cancel-buff").click(this._onCancelBuffs.bind(this));
        //Psychic power macros
        html.find(".psy-macro").click(this._onPsyMacro.bind(this));
        //autofcus modifier input
        html.find(".rollable").click(this._onRoll.bind(this));
        //repair forcefield
        html.find(".repairForcefield").click(this._onRepairForcefield.bind(this));
        //force damage roll
        html.find(".force-roll").click(this._onForceRoll.bind(this));
        //creating a tnt
        html.find(".tnt-create").click(this._onTntCreate.bind(this));
        html.find(".profile-select").change(this._onWeaponProfileChange.bind(this));
        //sorting
        html.find(".sort-button").click(this._onSortClick.bind(this));
        html.find(".drag").each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", this._onDragListItem, false);
            li.addEventListener("dragover", this._onDragOverListItem, false);
            li.addEventListener("drop", this._onDropListItem.bind(this), false);
        });

        // Autoselect entire text
        $("input[type=text]").focusin(function (event) {
            $(this).select();
        });
        $("input[type=number]").focusin(function (event) {
            $(this).select();
        });
        //stop the change event on all inputs because its jank
        $("input[type=number]").change(function (event) {
            event.stopImmediatePropagation();
            event.preventDefault();
        });
        $("input[type=text]").change(function (event) {
            event.stopImmediatePropagation();
            event.preventDefault();
        });
        $("select:not([class])").change(function (event) {
            event.stopImmediatePropagation();
            event.preventDefault();
        });

        this.#dragDrop.forEach((d) => d.bind(this.element));
    }
    _onDragListItem(event) {
        let data = {};
        data.id = event.target.dataset["id"];
        data.uuid = event.target.dataset["uuid"];
        data.type = event.target.dataset["type"];
        event.dataTransfer.setData("text/plain", JSON.stringify(data));
    }
    _onDragOverListItem(event) {
        event.preventDefault();
    }

    async _onDropListItem(event) {
        let data = JSON.parse(event.dataTransfer.getData("text"));
        let draggedId = data.id;

        let targetId = event.target.dataset["id"];
        if (draggedId !== targetId) {
            let draggedItem = await this.actor.items.get(draggedId);

            let targetItem = await this.actor.items.get(targetId);

            let sortDrag = draggedItem.sort;
            let sortTarget = targetItem.sort;
            if (sortTarget > sortDrag) {
                sortDrag = sortTarget;
                sortTarget -= 1;
            } else {
                sortDrag = sortTarget;
                sortTarget += 1;
            }
            let itemType = draggedItem.type;
            let items = this.actor.itemTypes[itemType].sort(function (a, b) {
                return a.sort - b.sort;
            });

            /*data.items=*/
            let previous = null;
            let update = [];
            update.push({ _id: draggedId, sort: sortDrag });
            update.push({ _id: targetId, sort: sortTarget });
            items.forEach((value, key) => {
                let sort = value.sort;
                if (value.id === draggedId) {
                    sort = sortDrag;
                } else if (value.id === targetId) {
                    sort = sortTarget;
                }
                if (sort === previous) {
                    sort++;
                    update.push({ _id: value.id, sort: sort });
                }
                previous = sort;
            });
            await this.actor.updateEmbeddedDocuments("Item", update);
        }
    }
    _onImgRightClick(event) {
        event = event || window.event;

        var options = {
            width: "auto",
            height: "auto"
        };
        let img = this.actor.img;
        let dlg = foundry.applications.api.DialogV2.wait(
            {
                window: { title: `Profile Image` },
                content: `<img src="${img}"  width="auto" height="auto">`,
                buttons: [
                    {
                        label: "OK",
                        callback: null
                    }
                ]
            },
            options
        );
    }
    //handles the duplicate inputs for wounds fatigue fate points etc on the combat tab

    async _combatResourceEdit(event) {
        event.preventDefault();
        if (!this.updateObj) {
            this.updateObj = {};
        }
        let actor = this.actor;
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
        let oldValue = objectByString(actor, target);

        if (oldValue != newAmt) {
            this.updateObj[target] = newAmt;
        }
        let updateNmbr = Object.keys(this.updateObj).length;
        if (
            updateNmbr > 0 &&
            (!event.relatedTarget || $(event.relatedTarget).prop("class").indexOf("combat-resources") === -1)
        ) {
            await actor.update(this.updateObj);
            this.updateObj = undefined;
        }
    }
    async _combatResourceEnter(event) {
        if (event.keyCode == 13) {
            if (!this.updateObj) {
                this.updateObj = {};
            }
            let actor = this.actor;
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
            let oldValue = objectByString(actor, target);
            if (oldValue != newAmt) {
                this.updateObj[target] = newAmt;
                await actor.update(this.updateObj);
                this.updateObj = undefined;
            }
        }
    }
    async _onSortClick(event) {
        let sortType = event.target.dataset["sortType"];
        let path = event.target.dataset["path"];
        let itemType = event.target.dataset["itemType"];
        let actor = this.actor;
        let items = actor[itemType];
        let update = {};
        let updatePath = "system.sort." + itemType;

        update[updatePath] = {};
        update[updatePath].type = sortType;
        update[updatePath].path = path;
        if (
            !actor.system.sort[itemType] ||
            actor.system.sort[itemType].type !== sortType ||
            actor.system.sort[itemType].reverse
        ) {
            update[updatePath].reverse = false;
        } else {
            update[updatePath].reverse = true;
        }

        await this.actor.update(update);
    }
    _onMaliceClick(event) {
        let malice = this.actor.getFlag("fortyk", "malice");
        if (malice) {
            this.actor.setFlag("fortyk", "malice", false);
        } else {
            this.actor.setFlag("fortyk", "malice", true);
        }
    }
    //Handle the popup when user clicks item name to show item description
    async _onItemDescrGet(event) {
        event.preventDefault();
        let descr = event.currentTarget.attributes["data-item-descr"].value;
        var options = {
            width: 300,
            height: "auto"
        };
        var name = event.currentTarget.dataset["name"];
        let dlg = foundry.applications.api.DialogV2.wait(
            {
                window: { title: `${name} Description` },
                position: { height: "auto", width: 300 },
                content: "<div class='description-popup'>" + descr + "</div>",
                buttons: [
                    {
                        label: "OK",
                        callback: null
                    }
                ]
            },
            options
        );
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
        let item = await new FortyKItem(itemData, { temporary: true });
        await this.actor.createEmbeddedDocuments("Item", [foundry.utils.duplicate(item)], { renderSheet: true });
    }
    //provides an interface to add new talents and apply the corresponding flags
    async _onTntCreate(event) {
        event.preventDefault();
        var actor = this.actor;

        new tntDialog({
            window: { title: "Add Talents, Traits and Bonus" },
            position: { width: 666, height: "auto" },
            actor: actor,
            classes: []
        }).render(true);
    }
    //Edits the item that was clicked
    async _onItemEdit(event) {
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        const item = this.actor.items.find((i) => i._id == itemId);
        item.sheet.render(true);
    }
    //deletes the selected item from the actor
    async _onItemDelete(event) {
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-item-id"].value;
        let item = await this.actor.getEmbeddedDocument("Item", itemId);

        let renderedTemplate = foundry.applications.handlebars.renderTemplate(
            "systems/fortyk/templates/actor/dialogs/delete-item-dialog.html"
        );
        renderedTemplate.then((content) => {
            foundry.applications.api.DialogV2.wait({
                title: "Deletion Confirmation",
                content: content,
                buttons: [
                    {
                        label: "Ok",
                        callback: async (dlg) => {
                            await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
                            this.render(true);
                        }
                    }
                ],
                default: "submit"
            }).render(true);
        });
    }

    //handles editing text inputs that are linked to owned items
    async _itemTextInputEdit(event) {
        let actor = this.actor;
        let newAmt = event.target.value;

        let dataItemId = event.target.attributes["data-item-id"].value;
        let target = event.target.attributes["data-target"].value.toString();
        let item = actor.getEmbeddedDocument("Item", dataItemId);
        let oldValue = event.target.defaultValue;
        if (oldValue != newAmt) {
            let update = {};
            update[target] = newAmt;
            await item.update(update);
        }
    }
    //handles editing text inputs that are linked to owned items
    async _itemTextInputEnter(event) {
        if (event.keyCode == 13) {
            let actor = this.actor;
            let newAmt = event.target.value;

            let dataItemId = event.target.attributes["data-item-id"].value;
            let target = event.target.attributes["data-target"].value.toString();
            let item = actor.getEmbeddedDocument("Item", dataItemId);
            let oldValue = event.target.defaultValue;
            if (oldValue != newAmt) {
                let update = {};
                update[target] = newAmt;
                await item.update(update);
            }
        }
    }
    //handles firing mode change for maximal weapons
    async _onMaximalClick(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        let dataset = event.currentTarget.dataset;
        let weaponID = dataset["itemId"];
        let fortykWeapon = this.actor.items.get(weaponID);

        if (fortykWeapon.getFlag("fortyk", "maximalMode")) {
            await fortykWeapon.setFlag("fortyk", "maximalMode", false);
            await fortykWeapon.setFlag("fortyk", "recharge", false);

            if (fortykWeapon.getFlag("fortyk", "blast")) {
                await fortykWeapon.setFlag("fortyk", "blast", parseInt(fortykWeapon.getFlag("fortyk", "blast")) - 2);
            }
        } else {
            await fortykWeapon.setFlag("fortyk", "maximalMode", true);
            await fortykWeapon.setFlag("fortyk", "recharge", true);
            if (fortykWeapon.getFlag("fortyk", "blast")) {
                await fortykWeapon.setFlag("fortyk", "blast", parseInt(fortykWeapon.getFlag("fortyk", "blast")) + 2);
            }
        }
    }
    //handles firing mode change for las weapons
    async _onLasModeChange(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const data = this.actor.system;
        let dataset = event.currentTarget.dataset;

        let actor = this.actor;
        let weaponID = dataset["itemId"];
        let fireMode = parseInt(event.currentTarget.value);
        let weapon = actor.items.get(weaponID);
        await weapon.update({ "flags.fortyk.lasMode": fireMode });
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
        let testType = dataset["rollType"];
        var testTarget = parseInt(dataset["target"]);

        let modifierTracker = [];

        var testLabel = dataset["label"];
        var testChar = dataset["char"];
        let rating = dataset["rating"];

        if (rating !== undefined) {
            testTarget += parseInt(rating);
            modifierTracker.push({ value: rating, label: "Rating" });
        }
        var item = null;

        //ensure actor is prepared
        if (!this.actor.system.isPrepared) {
            this.actor.prepareData();
        }
        if (dataset["itemId"]) {
            item = await this.actor.items.get(dataset["itemId"]);
            //ensure item is prepared
            if (!item.system.isPrepared) {
                await item.prepareData();
            }
        }
        if (testType === "forcefield") {
            let forcefieldId = dataset["id"];
            let forcefield = this.actor.getEmbeddedDocument("Item", forcefieldId);
            await FortykRollDialogs.callForcefieldDialog(forcefield, this.actor);
            return;
        }
        if (
            testType !== "focuspower" &&
            testType !== "rangedAttack" &&
            testType !== "meleeAttack" &&
            testType !== "sprayAttack" &&
            testType !== "torrentAttack"
        ) {
            await FortykRollDialogs.callRollDialog(
                testChar,
                testType,
                testTarget,
                this.actor,
                testLabel,
                item,
                false,
                "",
                false,
                modifierTracker
            );
            return;
        }
        let attackOptions = {};
        let targets = game.user.targets;
        if (targets.size > 0 && this.actor.type !== "spaceship") {
            let targetIt = targets.values();
            let target = targetIt.next().value;
            let attacker = this.actor.getActiveTokens()[0];
            let targetActor = target.actor;

            if (targetActor.type === "vehicle") {
                attackOptions.vehicle = true;
                attackOptions.facing = getVehicleFacing(target, attacker);
            }
            attackOptions.prone = targetActor.getFlag("core", "prone");
            attackOptions.stunned = targetActor.getFlag("core", "stunned");
            attackOptions.totalDef = targetActor.getFlag("core", "totalDef");
            attackOptions.running = targetActor.getFlag("core", "running");
            attackOptions.size = targetActor.system.secChar.size.value;
            attackOptions.selfProne = this.actor.getFlag("core", "prone");
            attackOptions.selfEvasion = this.actor.system.evasion;
            attackOptions.tarEvasion = targetActor.system.evasion;
            if (targetActor.getFlag("core", "unconscious") || targetActor.getFlag("core", "snare")) {
                attackOptions.helpless = true;
            } else {
                attackOptions.helpless = false;
            }
            attackOptions.selfBlind = this.actor.getFlag("core", "blind");
            attackOptions.distance = tokenDistance(target, attacker);

            let attackerElevation = attacker.elevation;
            let targetElevation = target.elevation;
            attackOptions.elevation = attackerElevation - targetElevation;
        }
        if (testType === "meleeAttack") {
            FortykRollDialogs.callMeleeAttackDialog(
                testChar,
                testType,
                testTarget,
                this.actor,
                testLabel,
                item,
                attackOptions,
                modifierTracker
            );
            return;
        }
        if (testType === "rangedAttack") {
            FortykRollDialogs.callRangedAttackDialog(
                testChar,
                testType,
                testTarget,
                this.actor,
                testLabel,
                item,
                attackOptions,
                modifierTracker
            );
            return;
        }
        if (testType === "focuspower") {
            if (this.actor.system.psykana.psykerType.value !== "navigator") {
                let pr = dataset["pr"];
                testLabel += ` at PR ${pr}`;
            } else {
                let training = item.system.training.value;

                modifierTracker.push({ value: training, label: "Power Training" });
                FortykRollDialogs.callNavigatorPowerDialog(
                    testChar,
                    testType,
                    testTarget,
                    this.actor,
                    testLabel,
                    item,
                    this,
                    attackOptions,
                    modifierTracker
                );
                return;
            }

            FortykRollDialogs.callFocusPowerDialog(
                testChar,
                testType,
                testTarget,
                this.actor,
                testLabel,
                item,
                attackOptions,
                modifierTracker
            );
            return;
        }

        if (testType === "sprayAttack") {
            FortykRollDialogs.callSprayAttackDialog(this.actor, testLabel, item, attackOptions, this);
        }
        if (testType === "torrentAttack") {
            FortykRollDialogs.callTorrentAttackDialog(this.actor, testLabel, item, attackOptions, this);
        }
    }
    //handles weapon damage rolls
    async _onDamageRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.weapon) {
            let actor = this.actor;
            let fortykWeapon = actor.items.get(dataset.weapon);
            if (!fortykWeapon.system.isPrepared) {
                await fortykWeapon.prepareData();
            }
            let blast = false;
            if (Number.isInteger(parseInt(fortykWeapon.getFlag("fortyk", "blast")))) {
                blast = true;
            }
            if (blast) {
                this._onBlastDamageRoll(event, fortykWeapon);
                return;
            }
            let weapon = fortykWeapon;
            let dfa = false;
            if (actor.getFlag("fortyk", "deathfromabove") && actor.system.secChar.lastHit.attackType === "charge") {
                dfa = true;
            }

            let dmg = 0;
            if (actor.getFlag("fortyk", "brutalcharge") && actor.system.secChar.lastHit.attackType === "charge") {
                dmg = parseInt(actor.getFlag("fortyk", "brutalcharge"));
            }
            if (
                fortykWeapon.getFlag("fortyk", "brutalcharge") &&
                actor.system.secChar.lastHit.attackType === "charge"
            ) {
                dmg += parseInt(fortykWeapon.getFlag("fortyk", "brutalcharge"));
            }
            if (
                actor.getFlag("fortyk", "twohandedbrutality") &&
                fortykWeapon.system.twohanded.value &&
                (actor.system.secChar.lastHit.attackType === "charge" ||
                    actor.system.secChar.lastHit.attackType === "allout")
            ) {
                dmg += actor.system.characteristics.s.bonus;
            }
            if (actor.getFlag("fortyk", "versatile") && actor.getFlag("fortyk", "lethality")) {
                let damBonus;
                if (actor.system.secChar.lastHit.type === "rangedAttack") {
                    if (actor.type === "vehicle") {
                        damBonus = Math.ceil(actor.system.crew.ws / 20);
                    } else {
                        damBonus = Math.ceil(actor.system.characteristics.ws.bonus / 2);
                    }
                } else if (actor.system.secChar.lastHit.type === "meleeAttack") {
                    if (actor.type === "vehicle") {
                        damBonus = Math.ceil(actor.system.crew.bs / 20);
                    } else {
                        damBonus = Math.ceil(actor.system.characteristics.bs.bonus / 2);
                    }
                }
                if (actor.type === "vehicle" && actor.getFlag("fortyk", "terribleoffensive")) {
                    damBonus = damBonus * 3;
                }
                dmg += damBonus;
            }
            let options = { dfa: dfa };
            options.dmg = dmg;
            let hits = actor.system.secChar.lastHit.hits;
            if (!hits) {
                hits = 1;
            }
            options.hits = hits;
            let reroll = 0;
            if (this.actor.getFlag("fortyk", "wrothful")) {
                reroll++;
            }
            options.reroll = reroll;
            let renderedTemplate = foundry.applications.handlebars.renderTemplate(
                "systems/fortyk/templates/actor/dialogs/damage-dialog.html",
                options
            );
            let formula = foundry.utils.duplicate(weapon.system.damageFormula);
            renderedTemplate.then((content) => {
                foundry.applications.api.DialogV2.wait({
                    window: { title: `Number of Hits & Bonus Damage` },
                    content: content,
                    position: { width: 100 },
                    buttons: [
                        {
                            label: "OK",
                            callback: async (event) => {
                                let el = event.target.form;
                                const hits = parseInt(Number($(el).find('input[name="hits"]').val()));
                                const dmg = $(el).find('input[name="dmg"]').val();
                                const pen = parseInt(Number($(el).find('input[name="pen"]').val()));
                                const magdmg = parseInt(Number($(el).find('input[name="magdmg"]').val()));
                                const rerollNum = parseInt(Number($(el).find('input[name="reroll"]').val()));

                                formula.value += `+${dmg}`;

                                if (game.user.isGM) {
                                    await FortykRolls.damageRoll(
                                        formula,
                                        actor,
                                        fortykWeapon,
                                        hits,
                                        false,
                                        false,
                                        magdmg,
                                        pen,
                                        rerollNum
                                    );
                                    actor.deleteAfterAttackEffects();
                                } else {
                                    //if user isnt GM use socket to have gm process the damage roll
                                    let targets = game.user.targets.ids;
                                    let lastHit = this.actor.system.secChar.lastHit;
                                    let socketOp = {
                                        type: "damageRoll",
                                        package: {
                                            formula: formula,
                                            actor: actor.id,
                                            fortykWeapon: fortykWeapon.id,
                                            hits: hits,
                                            magdmg: magdmg,
                                            pen: pen,
                                            user: game.user.id,
                                            lastHit: lastHit,
                                            targets: targets,
                                            rerollNum: rerollNum
                                        }
                                    };
                                    game.socket.emit("system.fortyk", socketOp);
                                }
                            }
                        }
                    ]
                });
            });
        } else if (dataset.formula) {
            let roll = new Roll(dataset.formula, this.actor.system);
            let label = dataset.label ? `Rolling ${dataset.label} damage.` : "";
            await roll.roll();
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });
        }
    }
    async _onBlastDamageRoll(event, weapon) {
        let scene = game.scenes.active;
        let templates = scene.templates.reduce(function (templates, template) {
            if (template.isOwner) {
                templates.push(template);
            }
            return templates;
        }, []);

        let targets = getBlastTargets(templates);
        let actor = this.actor;
        let oldTargets = game.user.targets;
        let options = { dfa: false };
        let hits;
        let dmg;
        let pen;
        let magdmg;
        let rerollNum;
        options.dmg = 0;
        options.blast = true;
        options.hits = 1;
        let reroll = 0;
        if (this.actor.getFlag("fortyk", "wrothful")) {
            reroll++;
        }
        options.reroll = reroll;

        let renderedTemplate = foundry.applications.handlebars.renderTemplate(
            "systems/fortyk/templates/actor/dialogs/damage-dialog.html",
            options
        );
        let formula = foundry.utils.duplicate(weapon.system.damageFormula);
        renderedTemplate.then((content) => {
            foundry.applications.api.DialogV2.wait({
                window: { title: `Number of Hits & Bonus Damage` },
                content: content,
                buttons: [
                    {
                        label: "OK",
                        callback: async (event) => {
                            let el = event.target.form;
                            hits = parseInt(Number($(el).find('input[name="hits"]').val()));
                            dmg = parseInt(Number($(el).find('input[name="dmg"]').val()));
                            pen = parseInt(Number($(el).find('input[name="pen"]').val()));
                            magdmg = parseInt(Number($(el).find('input[name="magdmg"]').val()));
                            rerollNum = parseInt(Number($(el).find('input[name="reroll"]').val()));
                            if (dmg > 0) {
                                formula.value += `+${dmg}`;
                            }
                            let name = actor.getName();
                            let chatBlast = {
                                author: game.user._id,
                                speaker: { actor, alias: name },
                                content: `Starting Blast weapon damage rolls`,
                                classes: ["fortyk"],
                                flavor: `Blast Weapon Damage`
                            };
                            await ChatMessage.create(chatBlast, {});
                            if (game.user.isGM) {
                                for (let i = 0; i < targets.length; i++) {
                                    let curTargets = targets[i].targets;
                                    weapon.template = targets[i].template;
                                    let targetNames = "";
                                    let targetTokens = canvas.tokens.placeables.filter((token) =>
                                        curTargets.includes(token.id)
                                    );
                                    for (let j = 0; j < targetTokens.length; j++) {
                                        let token = targetTokens[j];
                                        if (j === targetTokens.length - 1) {
                                            targetNames += token.name;
                                        } else if (j === targetTokens.length - 2) {
                                            targetNames += token.name + " and ";
                                        } else {
                                            targetNames += token.name + ", ";
                                        }
                                    }
                                    if (curTargets.length !== 0) {
                                        game.user._onUpdateTokenTargets([]);
                                        for (let target of targetTokens) {
                                            target.setTarget(true, {
                                                user: game.user,
                                                releaseOthers: false,
                                                groupSelection: true
                                            });
                                        }

                                        let name = actor.getName();
                                        let chatBlast2 = {
                                            author: game.user._id,
                                            speaker: { actor, alias: name },
                                            content: `Template #${i + 1} hits ` + targetNames,
                                            classes: ["fortyk"],
                                            flavor: `Blast Weapon Damage`
                                        };
                                        await ChatMessage.create(chatBlast2, {});
                                        await FortykRolls.damageRoll(
                                            formula,
                                            actor,
                                            weapon,
                                            hits,
                                            false,
                                            false,
                                            magdmg,
                                            pen,
                                            rerollNum
                                        );

                                        for (let target of targetTokens) {
                                            target.setTarget(false, {
                                                user: game.user,
                                                releaseOthers: false,
                                                groupSelection: true
                                            });
                                        }
                                        game.user.broadcastActivity({ targets: game.user.targets.ids });
                                        //clean templates after
                                        let scene = game.scenes.active;
                                        let templates = scene.templates;
                                        for (const template of templates) {
                                            if (template.isOwner) {
                                                await template.delete();
                                            }
                                        }
                                    }
                                }
                                actor.deleteAfterAttackEffects();
                            } else {
                                //if user isnt GM use socket to have gm process the damage roll

                                let lastHit = this.actor.system.secChar.lastHit;
                                let socketOp = {
                                    type: "blastDamageRoll",
                                    package: {
                                        formula: formula,
                                        actor: actor.id,
                                        fortykWeapon: weapon.id,
                                        hits: hits,
                                        magdmg: magdmg,
                                        pen: pen,
                                        user: game.user.id,
                                        lastHit: lastHit,
                                        targets: targets,
                                        rerollNum: rerollNum
                                    }
                                };
                                await game.socket.emit("system.fortyk", socketOp);
                            }
                        }
                    }
                ],
                default: "submit",
                width: 100
            }).render(true);
        });
    }

    //handles applying active effects from psychic powers
    async _onBuffDebuff(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        let targets = game.user.targets;
        let powerId = dataset["power"];
        let power = this.actor.getEmbeddedDocument("Item", powerId);
        let powerClass = power.system.class.value;
        if (powerClass === "Aura") {
            return FortyKItem.applyAura(this.actor.uuid, powerId);
        }
        let affects = power.system.affects.value;
        if (affects === "self") {
            FortyKItem.applyPsyBuffs(this.actor.uuid, powerId, targets.ids);
        } else if (targets.size > 0) {
            FortyKItem.applyPsyBuffs(this.actor.uuid, powerId, targets.ids);
        } else {
            ui.notifications.error("You must have targets to apply buffs or debuffs.");
        }
    }
    //handles cancelling buff/debuffs
    async _onCancelBuffs(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        let powerId = dataset["power"];
        FortyKItem.cancelPsyBuffs(this.actor.uuid, powerId);
    }
    //handles executing psychic power macros
    async _onPsyMacro(event) {
        event.preventDefault();
        let powerId = event.currentTarget.attributes["data-power"].value;
        let macroId = event.currentTarget.attributes["data-macro"].value;
        let targetIds = game.user.targets.ids;
        let power = this.actor.getEmbeddedDocument("Item", powerId);
        let affects = power.system.affects.value;
        if (affects !== "self" && targetIds.length === 0) {
            ui.notifications.error("You must have targets to run psychic power macros.");
            return;
        }

        let user = power.system.macro.user;
        if (user === "user" || game.user.isGM) {
            FortyKItem.executePsyMacro(powerId, macroId, this.actor.uuid, targetIds);
        } else {
            //if user isnt GM use socket to have gm process the damage roll

            let socketOp = {
                type: "psyMacro",
                package: { powerId: powerId, macroId: macroId, actorId: this.actor.uuid, targetIds: targetIds }
            };
            await game.socket.emit("system.fortyk", socketOp);
        }
    }
    //handles repairing broken forcefields
    async _onRepairForcefield(event) {
        event.preventDefault();
        let itemId = event.currentTarget.attributes["data-id"].value;
        const item = this.actor.items.find((i) => i._id == itemId);
        await item.update({ "system.broken.value": false });
    }
    async _onWeaponProfileChange(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        let uuid = event.currentTarget.value;
        let itemId = event.currentTarget.attributes["data-id"].value;
        let item = this.actor.getEmbeddedDocument("Item", itemId);

        await item.setFlag("fortyk", "currentprofile", uuid);
    }
    //handle enabling and disabling active effects associated with armor
    async _onArmorChange(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        let actor = this.actor;
        let newArmorId = event.currentTarget.value;
        let newArmor = actor.getEmbeddedDocument("Item", newArmorId);
        let oldArmorId = this.actor.system.secChar.wornGear.armor._id;

        let oldArmor = this.actor.system.secChar.wornGear.armor;
        let updates = [];

        if (!jQuery.isEmptyObject(oldArmor)) {
            updates.push({ _id: oldArmorId, "system.isEquipped": false });
        }
        if (!jQuery.isEmptyObject(newArmor)) {
            updates.push({ _id: newArmorId, "system.isEquipped": true });
        }

        if (updates.length > 0) {
            await this.actor.updateEmbeddedDocuments("Item", updates);
        }
    }
    async _onForceFieldChange(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        let actor = this.actor;
        let newForceFieldId = event.currentTarget.value;
        let newForceField = actor.getEmbeddedDocument("Item", newForceFieldId);
        let oldForceFieldId = this.actor.system.secChar.wornGear.forceField._id;
        let oldForceField = this.actor.system.secChar.wornGear.forceField;
        let updates = [];
        if (!jQuery.isEmptyObject(oldForceField)) {
            updates.push({ _id: oldForceFieldId, "system.isEquipped": false });
        }
        if (!jQuery.isEmptyObject(newForceField)) {
            updates.push({ _id: newForceFieldId, "system.isEquipped": true });
        }
        if (updates.length > 0) {
            await this.actor.updateEmbeddedDocuments("Item", updates);
        }
    }
    //handles force weapon special damage rolls
    async _onForceRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        let actor = this.actor;
        foundry.applications.api.DialogV2.wait({
            window: { title: `Force Attack` },
            content: `<p><label>Number of Dice:</label> <input type="text" id="modifier" name="hits" value="1" data-dtype="Number" autofocus/></p>`,
            buttons: {
                submit: {
                    label: "OK",
                    callback: async (event) => {
                        let el = event.target.form;
                        const hits = parseInt(Number($(el).find('input[name="hits"]').val()));

                        let forceData = { name: "Force", type: "psychicPower" };
                        forceData.flags = {
                            fortyk: {
                                ignoreSoak: true
                            }
                        };
                        forceData.system = { damageFormula: { value: `${hits}d10` }, damageType: { value: "Energy" } };
                        let force = await new Item(forceData, { temporary: true });

                        if (game.user.isGM) {
                            FortykRolls.damageRoll(force.system.damageFormula, actor, force, 1);
                        } else {
                            let forceObj = force.toObject();
                            let targets = game.user.targets.ids;
                            let lastHit = this.actor.system.secChar.lastHit;
                            let socketOp = {
                                type: "damageWithJSONWeapon",
                                package: {
                                    user: game.user.id,
                                    lastHit: lastHit,
                                    hits: 1,
                                    targets: targets,
                                    formula: forceObj.system.damageFormula.value,
                                    actor: actor.id,
                                    fortykWeapon: JSON.stringify(forceObj)
                                }
                            };
                            await game.socket.emit("system.fortyk", socketOp);
                        }
                    }
                }
            },
            default: "submit",
            width: 100
        }).render(true);
    }
    //OVERRIDE
    async _onDropItem(event, data) {
        if (!this.actor.isOwner) return false;
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();
        itemData.id = itemData._id;
        const sameActor = this.actor.uuid === item.parent?.uuid;
        //make sure the copy wont be equipped by default
        if (itemData.system.isEquipped) itemData.system.isEquipped = false;
        if (itemData.type === "mod") {
            if (this.actor.type !== "spaceship") {
                let applied = await this._applyModToItem(item, sameActor);

                if (applied) {
                    return false;
                }
                if (itemData.system.amount.value > 1) {
                    itemData.system.amount.value = 1;
                }
            }
        }
        // Handle item sorting within the same Actor
        if (sameActor) return super._onSortItem(event, item);

        // Create the owned item

        const result = await this.actor.createEmbeddedDocuments("Item", [itemData])[0];
        return result ?? null;
    }
    async _applyModToItem(originItem, sameActor) {
        async function deleteOrigin() {
            let originUuid = originItem.uuid;
            if (originUuid.indexOf("Item") !== 0 && originUuid.indexOf("Compendium") === -1) {
                let origin = await fromUuid(originUuid);
                var amount = origin.system.amount.value;
                if (amount > 1) {
                    amount--;
                    origin.update({ "system.amount.value": amount });
                } else {
                    origin.delete();
                }
            }
        }
        if (originItem.effects.length === 0) {
            if (!sameActor) {
                ui.notifications.warn("The Mod has no active effect, it has not been added!");
            }
            return true;
        }
        let modType = originItem.system.type.value;
        let items;
        let actor = this.actor;
        switch (modType) {
            case "": {
                items = actor.items;
                break;
            }
            case "weapon": {
                items = actor.itemTypes.rangedWeapon.concat(actor.itemTypes.meleeWeapon);
                break;
            }
            case "rangedWeapon": {
                items = actor.itemTypes.rangedWeapon;
                break;
            }
            case "meleeWeapon": {
                items = actor.itemTypes.meleeWeapon;
                break;
            }
            case "armor": {
                items = actor.itemTypes.armor;
                break;
            }
        }
        items = items.filter((item) => item.system.mods.max > item.getModCount());
        if (items.length === 0) {
            if (!sameActor) {
                ui.notifications.warn("There are no suitable items to apply the mod to.");
                deleteOrigin();
            }
            return false;
        }
        let content = "";
        let i = 0;
        for (const item of items) {
            if (i === 0) {
                content += `<div><input class="itemradio" name="item" type="radio" value="${item.id}" checked="checked"/> <span>${item.name}</span></div>`;
            } else {
                content += `<div><input class="itemradio" name="item" type="radio" value="${item.id}"/> <span>${item.name}</span></div>`;
            }
            i++;
        }
        async function applyMod(actor, itemId) {
            let item = actor.getEmbeddedDocument("Item", itemId);
            let effect = originItem.effects.entries().next().value[1];
            let effectData = foundry.utils.duplicate(effect);
            effectData["flags.fortyk.modsystem"] = originItem.system;

            effectData.description = originItem.system.description.value;
            let ae = await item.createEmbeddedDocuments("ActiveEffect", [effectData]);
            item.applyActiveEffects();
            item.prepareData();

            item.applyModWeight();

            item.system.weight.total = (
                parseInt(item.system.amount.value) * parseFloat(item.system.weight.value)
            ).toFixed(2);
            deleteOrigin();
        }
        return foundry.applications.api.DialogV2.wait({
            window: { title: "Choose item to apply upgrade" },
            position: { width: 100 },
            content: content,
            actions: {
                inventory: async function addToInventory(event) {
                    let html = event.target.form;
                    if (!sameActor) {
                        deleteOrigin();
                    }
                    return false;
                }
            },
            buttons: [
                {
                    label: "Add to item",
                    callback: (event) => {
                        let html = event.target.form;
                        let itemId = $(html).find(".itemradio:checked")[0].value;
                        if (!itemId) {
                            if (!sameActor) {
                                deleteOrigin();
                            }
                            return false;
                        } else {
                            applyMod(actor, itemId);
                            this.render(true);
                            return true;
                        }
                    }
                },
                {
                    label: "Add to inventory",
                    action: "inventory"
                }
            ]
        });
    }
    static async _manageAEs() {
        let actor = this.document;
        if (this.token) {
            actor = this.token.actor;
        }

        var options = {
            id: "aeDialog"
        };
        var d = new ActiveEffectDialog(
            {
                title: "Active Effects",
                actor: actor,
                buttons: {
                    button: {
                        label: "Ok",
                        callback: async (html) => {
                            this.document.dialog = undefined;
                        }
                    }
                },
                close: function () {
                    this.document.dialog = undefined;
                }
            },
            options
        ).render(true);
        this.document.dialog = d;
    }
    static async _onSubmitForm(event, form, formData) {
        event.preventDefault();
        let object = formData.object;
        let background = object.system?.notesAndBackground?.background;
        let notes = object.system?.notesAndBackground?.notes;
        let description = object.system?.description?.value;
        let skills = object.system?.skills?.value;
        let equipment = object.system?.equipment?.value;

        if (description) {
            object.system.description.value = foundry.utils.cleanHTML(description);
        }
        if (skills) {
            object.system.skills.value = foundry.utils.cleanHTML(skills);
        }
        if (equipment) {
            object.system.equipment.value = foundry.utils.cleanHTML(equipment);
        }
        if (background) {
            object.system.notesAndBackground.background = foundry.utils.cleanHTML(background);
        }
        if (notes) {
            object.system.notesAndBackground.notes = foundry.utils.cleanHTML(notes);
        }
        await this.document.update(formData.object);
    }
}
