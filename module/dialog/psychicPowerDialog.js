import { FortykRolls } from "../FortykRolls.js";
import { getActorToken } from "../utilities.js";
import { tokenDistance } from "../utilities.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
export class psychicPowerDialog extends HandlebarsApplicationMixin(ApplicationV2) {
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
            template:"systems/fortyk/templates/actor/dialogs/psychic-power-dialog.html",
            scrollable:['']
        }
    }

    async _prepareContext(options){
        let context=await super._prepareContext(options);
        let data=this.options.data;
        let actor=data.actor;
        let psykerTypes=game.fortyk.FORTYK.psykerTypes;
        let psykerType=psykerTypes[actor.system.psykana.psykerType.value];
        let effectivePR=actor.system.psykana.pr.effective;
        let maxPush=psykerType.push;

        let maxPR=maxPush+effectivePR;
        data.maxPR=maxPR;
        data.effectivePR=effectivePR;
        let power=data.power;
        let powerPR=data.powerPR;
        if(!powerPR){
            powerPR=Math.min(power.system.curPR.value, maxPR);
            data.powerPR=powerPR;
        }
        if(powerPR>effectivePR){
            context.push=true;
        }
        let phenomenaMod=actor.system.psykana.phenomena.value+Math.max(powerPR-effectivePR,0)*psykerType.perils;
        context.effectivePR=effectivePR;
        context.maxPR=maxPR;
        context.phenomenaMod=phenomenaMod;
        context.currentPR=powerPR;
        context.leverage=data.leverage;


        let modifiers=actor.system.psykana.mod.value+Math.abs(powerPR-effectivePR)*10+power.system.testMod.value;
        data.psyMod=modifiers;    

        let inputModifier=data.inputMod;
        if(inputModifier){
            modifiers+=inputModifier;
        }else{
            data.inputMod=0;
        }
        data.modifiers=modifiers;
        context.modifiers=modifiers;
        context.testTarget=data.testTarget;


        return context;
    }
    updateAllNumbers(){
        let data=this.options.data;
        let actor=data.actor;
        let powerPR=data.powerPR;
        let effectivePR=data.effectivePR;
        let modifiers=data.modifiers;
        let totalModLabel=document.getElementById("modifierLabel");
        totalModLabel.innerHTML=modifiers;
        let psykerTypes=game.fortyk.FORTYK.psykerTypes;
        let psykerType=psykerTypes[actor.system.psykana.psykerType.value];
        let phenomenaMod=actor.system.psykana.phenomena.value+Math.max(powerPR-effectivePR,0)*psykerType.perils;
        let phenomenaLabel=document.getElementById("phenomenaModLabel");
        let power=data.power;
        phenomenaLabel.innerHTML=phenomenaMod;
        let psyniscience = 0;
        let derivedPR=Math.abs(data.powerPR-data.effectivePR);
        try {
            psyniscience = actor.system.skills.psyniscience;
        } catch (err) {}
        let testChar = power.system.testChar.value;
        let char = 0;
        let leverage = document.getElementById("leveragebox")?.checked;


        if(leverage){
            testChar="inf";
            let inf=actor.system.characteristics.inf.total;
            char=inf;
        }else if (testChar === "psy") {
            char = psyniscience;
        } else {
            char = parseInt(actor.system.characteristics[testChar].total);
        }
        data.testBase=char;
        data.testTarget=char+data.modifiers;
        data.testChar=testChar;
        let targetLabel=document.getElementById("targetLabel");
        targetLabel.innerHTML=data.testTarget;
    }
    _onRender(context, options) {
        super._onRender(context, options);
        const html=$(this.element);
        html.find(".submitBtn").click(this._onSubmit.bind(this));
        html.find("#prInput").keyup(this._onPRChange.bind(this));
        html.find("#modifier").keyup(this._onModifierChange.bind(this));
    }
    _onModifierChange(event){
        let value=parseInt(event.target.value);
        let data=this.options.data;
        data.inputMod=value;
        let totalMod=data.inputMod+data.psyMod;
        data.modifiers=totalMod;
        this.updateAllNumbers();
    }
    _onPRChange(event){
        let value=parseInt(event.target.value);
        if(isNaN(value))return;
        
        let data=this.options.data;
        let maxPR=data.maxPR;
        let actor=data.actor;
        let power=data.power;
        let powerPR=data.powerPR;
        let effectivePR=actor.system.psykana.pr.effective;
        let confirmBtn=document.getElementById("confirmBtn");
        value=Math.min(value,maxPR);
        if(value<=0)value=1;
        if(value>effectivePR){
            confirmBtn.innerHTML="Confirm Push";
            confirmBtn.classList.add("power-push");
        }else{
            confirmBtn.innerHTML="Confirm";
            confirmBtn.classList.remove("power-push");
        }
        
        event.target.value=value;
        data.powerPR=value;
        powerPR=value;
        let modifiers=actor.system.psykana.mod.value+Math.abs(powerPR-effectivePR)*10+power.system.testMod.value;
        data.psyMod=modifiers;

        let inputModifier=data.inputMod;
        if(inputModifier){
            modifiers+=inputModifier;
        }
        data.modifiers=modifiers;
        this.updateAllNumbers();

    }

    async _onSubmit(event){
        this.updateAllNumbers();
        let html = document.getElementById(this.id);
        let data=this.options.data;
        let modifierTracker=data.modifierTracker;
        let power=data.power;
        let actor=data.actor;
        let char=data.testBase;
        let derivedPR=Math.abs(data.powerPR-data.effectivePR);
        modifierTracker.push({ value: char, label: "Power Base" });
        power.system.target.value = parseInt(char);
        if (!actor.getFlag("core", "Aether Duldrums: Adept")) {
            modifierTracker.push({ value: derivedPR * 10, label: "Psy Rating" });
        }

        modifierTracker.push({ value: parseInt(power.system.testMod.value), label: "Power Modifier" });
        modifierTracker.push({ value: parseInt(actor.system.psykana.mod.value), label: "Psykana Modifier" });
        modifierTracker.push({ value: data.inputMod, label: "Input Modifier" });

        let testTarget = data.testTarget;
        let testChar= data.testChar;
        let testType=data.testType;
        let testLabel=`${power.name} at PR ${data.powerPR}`;
        await power.update({"system.curPR.value":data.powerPR});
        power.system.curPR.value=data.powerPR;
        let test = await FortykRolls.fortykTest(
            testChar,
            testType,
            testTarget,
            actor,
            testLabel,
            power,
            false,
            "",
            false,
            modifierTracker
        );
        if (actor.getFlag("fortyk", "soulblaze") && test.value) {
            let pr = actor.system.psykana.pr.effective;
            this.soulBlaze(actor, pr, actor.getFlag("fortyk", "iconofburningflame"));
        }
        this.close();
    }
    async soulBlaze(actor, pr, icon) {
        let tokens = canvas.tokens.placeables;

        let sourceToken = getActorToken(actor);
        let messageContent = "";
        let tests = [];
        for (let token of tokens) {
            let tokenActor = token.actor;
            if (token.id === sourceToken.id) continue;
            if (tokenActor.getFlag("fortyk", "daemonic")) {
                let distance = tokenDistance(token, sourceToken);
                if (distance > pr)continue;
                const collision = CONFIG.Canvas.polygonBackends['move'].testCollision(token.center, sourceToken.center, {mode:"any", type:"move"});
                if (collision) continue;
                let test = await FortykRolls.fortykTest(
                    "wp",
                    "char",
                    tokenActor.system.characteristics.wp.total,
                    tokenActor,
                    "Soulblaze",
                    null,
                    false,
                    "",
                    true,
                    []
                );
                messageContent +=
                    `<div class="chat-target"><a class="blast-ping" data-token="${token.id}">` +
                    token.name +
                    `'s</a> ` +
                    test.template +
                    `</div>`;
                test.token = token;
                test.tokenActor = tokenActor;
                tests.push(test);

            }
        }
        if (!messageContent) return;
        let chatOptions = {
            author: game.user._id,
            speaker: { actor, alias: actor.getName() },
            content: messageContent,
            classes: ["fortyk"],
            sound: "sounds/dice.wav",
            flavor: `Soul Blaze Tests`
        };

        await ChatMessage.create(chatOptions, {});
        for (let test of tests) {
            if (!test.value) {
                let token = test.token;
                let tokenActor = test.tokenActor;

                let fireData = { name: "Purifying Fire", type: "rangedWeapon" };
                let fire = await Item.create(fireData, { temporary: true });

                fire.system.damageType.value = "Energy";
                fire.system.pen.value = 99999;

                fire.flags.fortyk = { ignoreSoak: true };
                fire.system.damageFormula.value = `${pr}`;

                await FortykRolls.damageRoll(fire.system.damageFormula, tokenActor, fire, 1, true);
                let fireActiveEffect = foundry.utils.duplicate(
                    game.fortyk.FORTYK.StatusEffects[game.fortyk.FORTYK.StatusEffectsIndex.get("purifyingflame")]
                );
                fireActiveEffect.flags = {
                    fortyk: { damageString: `1d10+${pr}` }
                };
                fireActiveEffect.flags.fortyk.pr = pr;
                if (icon) {
                    fireActiveEffect.flags.fortyk.iconofburningflame = true;
                }
                FortykRolls.applyActiveEffect(token, [fireActiveEffect], false);
            }
        }
    }
}