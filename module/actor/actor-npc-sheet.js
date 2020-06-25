import {FortykRolls} from "../FortykRolls.js";
import {FORTYK} from "../FortykConfig.js";

export class FortyKNPCSheet extends ActorSheet {

    static async create(data, options) {
        data.skillFilter="";
        super.create(data,options);
    }
    /** @override */

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["fortyk", "sheet", "actor"],
            template: "systems/fortyk/templates/actor/actor-npc-sheet.html",
            width: 600,
            height: 660,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
            default:null
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {



        const data = super.getData();
        mergeObject(data.actor,this.actor.prepare());
        data.isGM=game.user.isGM;
        data.dtypes = ["String", "Number", "Boolean"];
        data.aptitudes=FORTYK.aptitudes;
        data.size=FORTYK.size;
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        html.find('.rollable').click(this._onRoll.bind(this));

        //Damage rolls
        html.find('.damage-roll').click(this._onDamageRoll.bind(this));

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


        new Dialog({
            title: `${testLabel} Test`,
            content: `<p><label>Modifier:</label> <input type="text" name="modifier" value="0" data-dtype="Number" autofocus/></p>`,
            buttons: {
                submit: {
                    label: 'OK',
                    callback: (el) => {
                        const bonus = Number($(el).find('input[name="modifier"]').val());

                        testTarget+=parseInt(bonus);
                        FortykRolls.fortykTest(testChar, testType, testTarget, this.actor, testLabel);
                    }
                }
            },
            default: "submit",


            width:100}
                  ).render(true);



    }
    _onDamageRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.formula) {
            let roll = new Roll(dataset.formula, this.actor.data.data);
            let label = dataset.label ? `Rolling ${dataset.label} damage.` : '';
            roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });
        }
    }
    _onFilterChange(event){


    }

}