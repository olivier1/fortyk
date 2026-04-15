import {FortyKItem} from "../item/item.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export class tntDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    #compendiums = {};
    static DEFAULT_OPTIONS = {

        tag: 'form',
        classes: ["fortyk"],

        position:{
            width: 666,
            height: "auto"
        }



    }
    static PARTS = {
        form:{
            template:"systems/fortyk/templates/actor/dialogs/tnt-dialog.html",
            scrollable:['.tntgrid']
        }
    }

    async _prepareContext(options){
        let context=await super._prepareContext(options);
        let tnts;
        let actor=this.options.actor;
        if (actor.type === "vehicle") {
            var vehicleTraits = await game.packs.get("fortyk.vehicle-traits");
            this.#compendiums.vehicleTraits=vehicleTraits;
            tnts = await vehicleTraits.getDocuments();
        } else {
            var dh2Talents = await game.packs.get("fortyk.talent-core-dh2");
            this.#compendiums.dh2Talents=dh2Talents;
            tnts = await dh2Talents.getDocuments();

            var dh2Traits = await game.packs.get("fortyk.traits-core-dh2");
            tnts = tnts.concat(await dh2Traits.getDocuments());
            this.#compendiums.dh2Traits=dh2Traits;

            var dh2EnemyWithinTalents = await game.packs.get("fortyk.talents-enemies-within");
            tnts = tnts.concat(await dh2EnemyWithinTalents.getDocuments());
            this.#compendiums.dh2EnemyWithinTalents = dh2EnemyWithinTalents;

            var dh2EnemyWithoutTalents = await game.packs.get("fortyk.talents-enemies-without");
            tnts = tnts.concat(await dh2EnemyWithoutTalents.getDocuments());
            this.#compendiums.dh2EnemyWithoutTalents= dh2EnemyWithoutTalents;

            var dh2EnemyBeyondTalents = await game.packs.get("fortyk.talents-enemies-beyond");
            tnts = tnts.concat(await dh2EnemyBeyondTalents.getDocuments());
            this.#compendiums.dh2EnemyBeyondTalents = dh2EnemyBeyondTalents;

            var owCoreTalents = await game.packs.get("fortyk.talents-ow-core");
            tnts = tnts.concat(await owCoreTalents.getDocuments());
            this.#compendiums.owCoreTalents=owCoreTalents;

            var owHOTETalents = await game.packs.get("fortyk.talents-hammer-of-the-emperor");
            tnts = tnts.concat(await owHOTETalents.getDocuments());
            this.#compendiums.owHOTETalents = owHOTETalents;

            var owShieldOfHumanityTalents = await game.packs.get("fortyk.talents-shield-of-humanity");
            tnts = tnts.concat(await owShieldOfHumanityTalents.getDocuments());
            this.#compendiums.owShieldOfHumanityTalents = owShieldOfHumanityTalents;

            var customTalents = await game.packs.get("fortyk.custom-talents");
            tnts = tnts.concat(await customTalents.getDocuments());
            this.#compendiums.customTalents = customTalents;

            var customBonus = await game.packs.get("fortyk.custom-bonus-and-drawbacks");
            tnts = tnts.concat(await customBonus.getDocuments());
            this.#compendiums.customBonus = customBonus;
        }
        //load different packs depending on actor type
        if (actor.type === "dhPC" || actor.type === "npc") {
            var dh2CoreBonus = await game.packs.get("fortyk.role-homeworld-and-background-bonuscore-dh2");
            tnts = tnts.concat(await dh2CoreBonus.getDocuments());
            this.#compendiums.dh2CoreBonus = dh2CoreBonus;
            var dh2EnemiesWithinBonus = await game.packs.get(
                "fortyk.role-homeworld-and-background-bonusenemies-within"
            );
            tnts = tnts.concat(await dh2EnemiesWithinBonus.getDocuments());
            this.#compendiums.dh2EnemiesWithinBonus = dh2EnemiesWithinBonus;

            var dh2EnemiesWithoutBonus = await game.packs.get(
                "fortyk.role-homeworld-and-background-bonusenemies-without"
            );
            tnts = tnts.concat(await dh2EnemiesWithoutBonus.getDocuments());
            this.#compendiums.dh2EnemiesWithoutBonus= dh2EnemiesWithoutBonus;

            var dh2EnemiesBeyondBonus = await game.packs.get(
                "fortyk.role-homeworld-and-background-bonusenemies-beyond"
            );
            tnts = tnts.concat(await dh2EnemiesBeyondBonus.getDocuments());
            this.#compendiums.dh2EnemiesBeyondBonus=dh2EnemiesBeyondBonus;
        } else if (actor.type === "dwPC" || actor.type === "npc") {
            var dwBonus = await game.packs.get("fortyk.deathwatch-bonus-and-drawbacks");
            tnts = tnts.concat(await dwBonus.getDocuments());
            this.#compendiums.dwBonus=dwBonus;

            var dwTalents = await game.packs.get("fortyk.deathwatch-talents");
            tnts = tnts.concat(await dwTalents.getDocuments());
            this.#compendiums.dwTalents = dwTalents;
        } else if (actor.type === "owPC" || actor.type === "npc") {
            var owCoreAbilities = await game.packs.get("fortyk.homeworld-and-specialty-abilities-core-ow");
            tnts = tnts.concat(await owCoreAbilities.getDocuments());
            this.#compendiums.owCoreAbilities = owCoreAbilities;

            var owHOTEAbilities = await game.packs.get(
                "fortyk.homeworld-and-specialty-abilities-hammer-of-the-emperor"
            );
            tnts = tnts.concat(await owHOTEAbilities.getDocuments());
            this.#compendiums.owHOTEAbilities = owHOTEAbilities;

            var owHOTEOrders = await game.packs.get("fortyk.orders-hammer-of-the-emperor");
            tnts = tnts.concat(await owHOTEOrders.getDocuments());
            this.#compendiums.owHOTEOrders = owHOTEOrders;

            var owShieldOfHumanityAbilities = await game.packs.get(
                "fortyk.homeworld-and-specialty-abilities-shield-of-humanity"
            );
            tnts = tnts.concat(await owShieldOfHumanityAbilities.getDocuments());
            this.#compendiums.owShieldOfHumanityAbilities = owShieldOfHumanityAbilities;

            var owShieldOfHumanityOrders = await game.packs.get("fortyk.orders-shield-of-humanity");
            tnts = tnts.concat(await owShieldOfHumanityOrders.getDocuments());
            this.#compendiums.owShieldOfHumanityOrders = this.#compendiums.owShieldOfHumanityOrders;
        }
        tnts = tnts.sort(function compare(a, b) {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });
        tnts = tnts.filter((tnt) => !actor.getFlag("fortyk", tnt.system.flagId.value));
        context.tnts=tnts;

        return context;
    }
    _onRender(context, options) {
        super._onRender(context, options);
        const html=$(this.element);
        html.find(".tntfilter").keyup(this._onTntFilterChange.bind(this));
        html.find(".tntfilter").ready(this._onPopupReady.bind(this));
        html.find(".submitBtn").click(this._onSubmit.bind(this));
        html.find('.tntdescr-button').click(this._onTntDescrClick.bind(this));
    }
    _onTntDescrClick(event){
        event.preventDefault();
        let descr = event.target.attributes["data-description"].value;
       
        var name=event.currentTarget.dataset["name"];
        foundry.applications.api.DialogV2.prompt({
            window:{title: `${name} Description`,
                    width: 300,
                    height: 400},
            content: "<p>"+descr+"</p>"});



    }

    _onTntFilterChange(event) {
        let tnts=document.getElementsByName("tntEntry");

        let filterInput=document.getElementById("tntfilter");
        let filter=filterInput.value.toLowerCase();
        for(let i=0;i<tnts.length;i++){
            let tnt=tnts[i];

            let tntName=tnt.attributes["data-search"].value.toLowerCase();
            if(tntName.indexOf(filter)>-1){
                tnt.style.display="";
            }else{
                tnt.style.display="none";
            }
        }
    }
    _onPopupReady(event) {

        let input = document.getElementById("tntfilter");
        input?.select();

    }
    async _onSubmit(event){
        let actor=this.options.actor;
        let html = document.getElementById(this.id);
        let selectedIds = [];
        $(html)
            .find("input:checked")
            .each(function () {
            selectedIds.push($(this).val());
        });
        let $selectedCompendiums = $("input:checked", html)
        .map(function () {
            return this.getAttribute("data-compendium");
        })
        .get();

        let talentsNTraits = [];
        for (let i = 0; i < selectedIds.length; i++) {
            let tnt = null;
            switch ($selectedCompendiums[i]) {
                case "fortyk.talent-core-dh2":
                    tnt = await this.#compendiums.dh2Talents.getDocument(selectedIds[i]);
                    break;
                case "fortyk.traits-core-dh2":
                    tnt = await this.#compendiums.dh2Traits.getDocument(selectedIds[i]);
                    break;
                case "fortyk.talents-enemies-within":
                    tnt = await this.#compendiums.dh2EnemyWithinTalents.getDocument(selectedIds[i]);
                    break;
                case "fortyk.talents-enemies-without":
                    tnt = await this.#compendiums.dh2EnemyWithoutTalents.getDocument(selectedIds[i]);
                    break;
                case "fortyk.talents-enemies-beyond":
                    tnt = await this.#compendiums.dh2EnemyBeyondTalents.getDocument(selectedIds[i]);
                    break;
                case "fortyk.role-homeworld-and-background-bonuscore-dh2":
                    tnt = await this.#compendiums.dh2CoreBonus.getDocument(selectedIds[i]);
                    break;
                case "fortyk.role-homeworld-and-background-bonusenemies-without":
                    tnt = await this.#compendiums.dh2EnemiesWithoutBonus.getDocument(selectedIds[i]);
                    break;
                case "fortyk.role-homeworld-and-background-bonusenemies-within":
                    tnt = await this.#compendiums.dh2EnemiesWithinBonus.getDocument(selectedIds[i]);
                    break;
                case "fortyk.role-homeworld-and-background-bonusenemies-beyond":
                    tnt = await this.#compendiums.dh2EnemiesBeyondBonus.getDocument(selectedIds[i]);
                    break;
                case "fortyk.deathwatch-bonus-and-drawbacks":
                    tnt = await this.#compendiums.dwBonus.getDocument(selectedIds[i]);
                    break;
                case "fortyk.deathwatch-talents":
                    tnt = await this.#compendiums.dwTalents.getDocument(selectedIds[i]);
                    break;
                case "fortyk.talents-ow-core":
                    tnt = await this.#compendiums.owCoreTalents.getDocument(selectedIds[i]);
                    break;
                case "fortyk.talents-hammer-of-the-emperor":
                    tnt = await this.#compendiums.owHOTETalents.getDocument(selectedIds[i]);

                    break;
                case "fortyk.talents-shield-of-humanity":
                    tnt = await this.#compendiums.owShieldOfHumanityTalents.getDocument(selectedIds[i]);
                    break;
                case "fortyk.homeworld-and-specialty-abilities-core-ow":
                    tnt = await this.#compendiums.owCoreAbilities.getDocument(selectedIds[i]);
                    break;
                case "fortyk.homeworld-and-specialty-abilities-hammer-of-the-emperor":
                    tnt = await this.#compendiums.owHOTEAbilities.getDocument(selectedIds[i]);
                    break;
                case "fortyk.orders-hammer-of-the-emperor":
                    tnt = await this.#compendiums.owHOTEOrders.getDocument(selectedIds[i]);
                    break;
                case "fortyk.homeworld-and-specialty-abilities-shield-of-humanity":
                    tnt = await this.#compendiums.owShieldOfHumanityAbilities.getDocument(selectedIds[i]);
                    break;
                case "fortyk.orders-shield-of-humanity":
                    tnt = await this.#compendiums.owShieldOfHumanityOrders.getDocument(selectedIds[i]);
                    break;
                case "fortyk.custom-talents":
                    tnt = await this.#compendiums.customTalents.getDocument(selectedIds[i]);
                    break;
                case "fortyk.custom-bonus-and-drawbacks":
                    tnt = await this.#compendiums.customBonus.getDocument(selectedIds[i]);
                    break;
                case "fortyk.vehicle-traits":
                    tnt = await this.#compendiums.vehicleTraits.getDocument(selectedIds[i]);
                    break;
            }
            let itemData = foundry.utils.duplicate(tnt);

            let spec = itemData.system.specialisation.value;
            let flag = itemData.system.flagId.value;
            if (!actor.getFlag("fortyk", flag)) {
                if (spec === "N/A") {
                    //await actor.setFlag("fortyk",flag,true);
                } else {
                    let chosenSpec = await Dialog.prompt({
                        title: `Choose specialisation for ${tnt.name}`,
                        content: `<p><label>Specialisation:</label> <input id="specInput" type="text" name="spec" value="${itemData.system.specialisation.value}" autofocus/></p>`,
                        callback: async (html) => {
                            const choosenSpec = $(html).find('input[name="spec"]').val();
                            //await actor.setFlag("fortyk",flag,choosenSpec);
                            return choosenSpec;
                        },
                        width: 100
                    });
                    itemData.system.specialisation.value = chosenSpec;
                    if (itemData.system.isAura.value) {
                        itemData.system.isAura.range = parseInt(chosenSpec);
                    }
                }
                talentsNTraits.push(itemData);
            }
        }
        await actor.createEmbeddedDocuments("Item", talentsNTraits);
        this.close();
    }

}

