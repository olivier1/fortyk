export default class FortyKActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

    /** @override */
    static DEFAULT_OPTIONS = {
        // Optionally declare custom styling classes or window features here
        classes: ["fortyk", "active-effect-config"],
        position:{
            width:"auto"
        },
        actions: {
            deleteChange: this.#onDeleteChange,
            addChange: this.#onAddChange
        }
    };

    /** @override */
    static PARTS = {
        header: {template: "templates/sheets/active-effect/header.hbs"},
        tabs: {template: "templates/generic/tab-navigation.hbs"},
        details: {template: "templates/sheets/active-effect/details.hbs", scrollable: [""]},
        duration: {template: "templates/sheets/active-effect/duration.hbs"},
        changes: {
            template: "systems/fortyk/templates/activeEffect/changes.hbs",
            templates: ["systems/fortyk/templates/activeEffect/change.hbs"],
            scrollable: ["ol[data-changes]"]
        },
        footer: {template: "templates/generic/form-footer.hbs"}
    };
    async _prepareContext(options) {
        // 1. Get the baseline context provided by Core Foundry
        const context = await super._prepareContext(options);

        // 2. Map core or system-defined phases into an accessible object/array
        context.effectPhases = {
            "prebase":"PreBase",
            "preitem": "PreItem",
            "prederived":"PreDerived",
            "final": "Final"
        };

        // 3. Ensure the underlying document's phase values map correctly to the rows
        let renderedTemplates=[];
        let changeTypes=foundry.utils.duplicate(ActiveEffect.CHANGE_TYPES);
        for(let changeType in changeTypes){
            changeTypes[changeType].label=game.i18n.localize(changeTypes[changeType].label);
        }
        let index=0;
        for(let change of context.document.changes){
            change.index=index;
            change.phase = this.document.changes[index]?.phase || "prederived";
            change.changeType=change.type;
            change.changeTypes=changeTypes;
            change.effectPhases=context.effectPhases;
            let rendered=await foundry.applications.handlebars.renderTemplate("systems/fortyk/templates/activeEffect/change.hbs",change);
            renderedTemplates.push(rendered);
            index++;
        }
        context.changesmkek = renderedTemplates;

        return context;
    }
    static async #onAddChange() {
        const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
        const changes = Object.values(submitData?.changes ?? {});
        changes.push(this.document.system.schema.fields.changes.element.getInitialValue());
        return this.submit({updateData: {system: {changes}}});
    }

    static async #onDeleteChange(event) {
        const submitData = this._processFormData(null, this.form, new FormDataExtended(this.form));
        const changes = Object.values(submitData.changes);
        const row = event.target.closest("li");
        const index = Number(row.dataset.index) || 0;
        changes.splice(index, 1);
        return this.submit({updateData: {system: {changes}}});
    }
}
