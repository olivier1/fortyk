import { FortykRolls } from "./FortykRolls.js";
import { getActorToken } from "./utilities.js";
import { tokenDistance } from "./utilities.js";
export class FortykRollDialogs {
    //activate chatlisteners
    static chatListeners(html) {
        html.on("mouseup", ".reroll", this._onReroll.bind(this));
        html.on("click", ".overheat", this._onOverheat.bind(this));
        html.on("click", ".popup", this._onTestPoppup.bind(this));
        html.on("click", ".spray-torrent-ping", this._onSprayTorrentClick.bind(this));
        html.on("mouseup", ".reroll-popup", this._onPopupReroll.bind(this));
        html.on("click", ".blast-ping", this._onBlastClick.bind(this));
        html.on("click", ".ping-template", this._onTemplateClick.bind(this));
    }
    static async _onTemplateClick(event) {
        const dataset = event.currentTarget.dataset;
        const x = parseInt(dataset.x);
        const y = parseInt(dataset.y);
        var pingPoint = { x: x, y: y };
        await canvas.animatePan(pingPoint);
        game.canvas.ping(pingPoint, { duration: 2000 });
    }
    static async _onBlastClick(event) {
        const dataset = event.currentTarget.dataset;
        const tokenId = dataset.token;
        const token = canvas.tokens.get(tokenId);
        await canvas.animatePan({ x: token.center.x, y: token.center.y });
        game.canvas.ping({ x: token.center.x, y: token.center.y }, { duration: 2000 });
    }
    //handles spray and torrent attack results
    static async _onSprayTorrentClick(event) {
        const dataset = event.currentTarget.dataset;
        const tokenId = dataset.token;
        const weaponId = dataset.weapon;
        let hits = dataset.hits;
        hits = parseInt(hits);
        const token = canvas.tokens.get(tokenId);
        await canvas.animatePan({ x: token.center.x, y: token.center.y });
        game.canvas.ping({ x: token.center.x, y: token.center.y }, { duration: 2000 });
        if (game.user.isGM) {
            var targetElement = event.currentTarget;
            const messageId = $(targetElement).closest(".chat-message")[0].dataset.messageId;
            let messageContent = $(targetElement).closest(".message-content")[0];
            const message = game.messages.get(messageId);
            let htmlLine = targetElement.parentElement;
            const userId = dataset.user;
            const user = game.users.get(userId);
            let targets = user.targets;
            if (hits === 0) return;
            let actor = token.actor;
            let weapon = actor.items.get(weaponId);
            let line =
                `<a class="spray-torrent-ping" data-user="${userId}" data-hits="${0}" data-remaining-hits={{hits}} data-token="${tokenId}">` +
                actor.getName() +
                "</a> ";

            let forcefielded = false;
            let forcefield = actor.system.secChar.wornGear.forceField;
            if (!jQuery.isEmptyObject(forcefield) && !forcefield.system.broken.value) {
                let fieldResult = await FortykRolls.fortykForcefieldTest(forcefield, actor, hits, true);
                foundry.audio.AudioHelper.play(
                    { src: "sounds/dice.wav", volume: 1, autoplay: true, loop: false },
                    true
                );
                hits = fieldResult.hits;
                line += fieldResult.template;
                forcefielded = true;
            }

            if (hits === 0) {
                htmlLine.innerHTML = line;
                message.update({ content: messageContent.innerHTML });
                if (user.id !== game.user.id) {
                    let socketOp = { type: "removeTarget", package: { user: userId, token: token.id } };
                    game.socket.emit("system.fortyk", socketOp);
                } else {
                    token.setTarget(false, { releaseOthers: false });
                }

                return;
            }
            if (forcefielded) line += `</br>${actor.getName()}`;
            let dodge = 0;
            let label = "Dodge";
            if (actor.type === "npc") {
                dodge = actor.system.dodge.total;
            } else if (actor.type === "vehicle") {
                dodge = actor.system.crew.jink;
                label = "Jink";
            } else {
                dodge = actor.system.skills.dodge;
            }

            let result = await this.callRollDialog("agi", "evasion", dodge, actor, label, weapon, false, "", true);
            foundry.audio.AudioHelper.play({ src: "sounds/dice.wav", volume: 1, autoplay: true, loop: false }, true);

            let hitlabel = "hit";
            if (hits > 1) hitlabel += "s";
            if (result.value && result.dos >= hits) {
                line += `passed ${result.template} and must move out of the area to not take damage`;
                if (user.id !== game.user.id) {
                    let socketOp = { type: "removeTarget", package: { user: userId, token: token.id } };
                    game.socket.emit("system.fortyk", socketOp);
                } else {
                    token.setTarget(false, { releaseOthers: false });
                }
            } else if (result.value && result.dos < hits) {
                hits -= result.dos;
                line += `passed ${result.template} but ${hits} ${hitlabel} remain`;
            } else {
                line += `failed ${result.template} and suffers ${hits} ${hitlabel}`;
            }

            htmlLine.innerHTML = line.replace("{{hits}}", hits);
            message.update({ content: messageContent.innerHTML });
            return;
        }
    }
    //handles test rerolls
    static async _onPopupReroll(event) {
        event.preventDefault();
        var button = event.currentTarget;
        button.style.display = "none";
        const dataset = button.dataset;
        const chatContentNode = $(button).closest(".message-content")[0];
        const chatMessageNode = $(button).closest(".chat-message")[0];
        const actor = game.actors.get(dataset["actor"]);
        const char = dataset["char"];
        const type = dataset["rollType"];

        const target = parseInt(dataset["target"]);
        const label = dataset["label"];

        const weapon = actor.items.get(dataset["weapon"]);
        const fireRate = dataset["fire"];
        let result = await this.callRollDialog(char, type, target, actor, label, weapon, true, fireRate, true);
        foundry.audio.AudioHelper.play({ src: "sounds/dice.wav", volume: 1, autoplay: true, loop: false }, true);
        const popupNode = $(button).closest(".popup")[0];

        const pingSibling = $(popupNode).siblings(".spray-torrent-ping")[0];
        const lineNode = $(popupNode).closest(".chat-target")[0];
        if (pingSibling) {
            let pingDataset = pingSibling.dataset;
            let remainingHits = pingDataset.remainingHits;
            if (remainingHits) {
                const tokenId = pingDataset.token;
                const token = canvas.tokens.get(tokenId);
                const weaponId = pingDataset.weapon;
                const userId = pingDataset.user;
                const user = game.users.get(userId);
                let line =
                    `<a class="spray-torrent-ping" data-user="${userId}" data-hits="${0}" data-token="${tokenId}">` +
                    actor.getName() +
                    "</a> ";

                let hitlabel = "hit";
                let hits = parseInt(remainingHits);
                if (hits > 1) hitlabel += "s";
                if (result.value && result.dos >= hits) {
                    line += `passed ${result.template} and must move out of the area to not take damage`;
                    if (user.id !== game.user.id) {
                        let socketOp = { type: "removeTarget", package: { user: userId, token: token.id } };
                        game.socket.emit("system.fortyk", socketOp);
                    } else {
                        token.setTarget(false, { releaseOthers: false });
                    }
                } else if (result.value && result.dos < hits) {
                    hits -= result.dos;
                    line += `passed ${result.template} but ${hits} ${hitlabel} remain`;
                } else {
                    line += `failed ${result.template} and suffers ${hits} ${hitlabel}`;
                }
                lineNode.innerHTML = line;
            } else {
                popupNode.outerHTML = result.template;
            }
        } else {
            popupNode.outerHTML = result.template;
        }

        $(chatContentNode).find(".popuptext").removeClass("show");
        const messageId = chatMessageNode.dataset.messageId;
        const message = game.messages.get(messageId);
        if (message) {
            message.update({ content: chatContentNode.innerHTML });
        }
    }
    //handles test rerolls
    static async _onReroll(event) {
        event.preventDefault();
        event.currentTarget.style.display = "none";
        const dataset = event.currentTarget.dataset;

        const actor = game.actors.get(dataset["actor"]);
        const char = dataset["char"];
        const type = dataset["rollType"];

        const target = dataset["target"];
        const label = dataset["label"];

        const weapon = actor.items.get(dataset["weapon"]);
        const fireRate = dataset["fire"];
        await this.callRollDialog(char, type, target, actor, label, weapon, true, fireRate);

        const chatContent = event.currentTarget.parentElement;
        const chatMessage = chatContent.parentElement;
        const messageId = chatMessage.dataset.messageId;
        const message = game.messages.get(messageId);

        if (message) {
            message.update({ content: chatContent.innerHTML });
        }
    }

    //handles dealing damage if the actor doesnt drop the weapon on overheat
    static async _onOverheat(event) {
        event.preventDefault();
        const dataset = event.currentTarget.dataset;
        const actor = game.actors.get(dataset["actor"]);

        const weapon = actor.getEmbeddedDocument("Item", dataset["weapon"]);

        let newWeapon = weapon.clone();
        const formula = weapon.system.damageFormula;
        newWeapon.system.pen.value = 0;

        await FortykRolls.damageRoll(formula, actor, newWeapon, 1, true, true);
    }
    static async _onTestPoppup(event) {
        event.preventDefault();
        const dataset = event.currentTarget.dataset;
        let poppupId = dataset["id"];
        let poppup = document.getElementById(poppupId);
        poppup.classList.toggle("show");
    }
    static async callRollDialog(
        testChar,
        testType,
        testTarget,
        actor,
        testLabel,
        item,
        reroll,
        title = "",
        template = false,
        modifierTracker = []
    ) {
        if (reroll) {
            title += `${testLabel} ` + "Reroll";
        } else {
            title += `${testLabel} ` + "Test";
        }
        let modifier = 0;

        if (testChar) {
            let char = actor.system.characteristics[testChar];
            let base = char.value;
            let adv = char.advance;
            let mod = char.mod;
            modifierTracker.push({ value: base, label: "Characteristic Base" });
            modifierTracker.push({ value: adv, label: "Caracteristic Advance" });
            modifierTracker.push({ value: mod, label: "Characteristic Modifier" });
        }

        let global = actor.system.globalMOD.value;
        modifierTracker.push({ value: global, label: "Global modifier" });
        if (testType === "skill" || testType === "evasion") {
            let training = item?.system?.value;
            let skillMod = item?.system?.mod?.value;
            modifierTracker.push({ value: training, label: "Skill Training" });
            modifierTracker.push({ value: skillMod, label: "Skill Modifier" });
        }
        if (testType === "evasion") {
            let evadeCount = parseInt(actor.getFlag("core", "evasion"));
            let maxEvade = actor.system.reactions;
            if (!reroll && evadeCount >= maxEvade) {
                ui.notifications.warn("Out of reactions!");
                return { value: false, dos: 0, template: "Out of reactions!" };
            }
            if (actor.getFlag("fortyk", "evadeMod")) {
                testTarget += parseInt(actor.getFlag("fortyk", "evadeMod"));
                modifierTracker.push({ value: actor.getFlag("fortyk", "evadeMod"), label: "Evasion Modifier" });
            }
            if (actor.getFlag("core", "luminagen")) {
                testTarget -= 10;
                modifierTracker.push({ value: -10, label: "Luminagen" });
            }
            if (actor.getFlag("core", "holyShield")) {
                modifierTracker.push({ value: 10, label: "Guarded Action" });
                testTarget += 10;
            }
            if (actor.getFlag("fortyk", "versatile") && actor.getFlag("fortyk", "expertise")) {
                testTarget += 10;
                modifierTracker.push({ value: 10, label: "Versatility" });
            }
        }

        return await Dialog.wait({
            title: title,
            content: `<p><label>Modifier:</label> <input id="modifier" type="number" name="modifier" value="${modifier}" autofocus/></p>`,
            buttons: {
                submit: {
                    label: "OK",
                    callback: async (html) => {
                        const bonus = Number($(html).find('input[name="modifier"]').val());
                        if (isNaN(bonus)) {
                            this.callRollDialog(
                                testChar,
                                testType,
                                testTarget,
                                actor,
                                testLabel,
                                item,
                                reroll,
                                "Invalid Number "
                            );
                        } else {
                            modifierTracker.push({ value: bonus, label: "Input Modifier" });
                            testTarget = parseInt(testTarget) + parseInt(bonus);
                            if (testType === "fear") {
                                testTarget += parseInt(actor.system.secChar.fearMod);
                                if (
                                    actor.getFlag("fortyk", "resistance") &&
                                    actor.getFlag("fortyk", "resistance").toLowerCase().includes("fear")
                                ) {
                                    testTarget += 10;
                                    modifierTracker.push({ value: 10, label: "Resistance" });
                                }
                            }
                            if (!reroll) {
                                if (testType === "evasion") {
                                    if (actor.getFlag("fortyk", "evadeMod")) {
                                        await actor.setFlag("fortyk", "evadeMod", false);
                                    }
                                    let aeData = {};
                                    aeData.id = "evasion";
                                    aeData.name = "Evasion";
                                    if (!actor.getFlag("core", "evasion")) {
                                        aeData.icon = "systems/fortyk/icons/evasion.png";
                                        aeData.flags = { fortyk: { evasion: 1 } };
                                        aeData.statuses = ["evasion"];
                                        aeData.duration = {
                                            rounds: 0
                                        };
                                        await FortykRolls.applyActiveEffect(actor, [aeData]);
                                    } else {
                                        for (let ae of actor.effects) {
                                            if (ae.statuses.has("evasion")) {
                                                let count = actor.getFlag("core", "evasion");
                                                count++;
                                                if (count > 9) {
                                                    count = 9;
                                                }
                                                let update = {};
                                                update["icon"] = `systems/fortyk/icons/evasion${count}.png`;
                                                update["flags.fortyk.evasion"] = count;
                                                await ae.update(update);
                                                await actor.setFlag("core", "evasion", count);
                                            }
                                        }
                                    }
                                }
                            }
                            return await FortykRolls.fortykTest(
                                testChar,
                                testType,
                                testTarget,
                                actor,
                                testLabel,
                                item,
                                reroll,
                                "",
                                template,
                                modifierTracker
                            );
                        }
                    }
                }
            },
            default: "submit",

            width: 100
        });
    }
    static async callMeldDialog(actor, testTarget) {
        let modifier = 0;

        return await Dialog.prompt({
            title: "Melding test",
            content: `<p><label>Modifier:</label> <input id="modifier" type="number" name="modifier" value="${modifier}" autofocus/></p>`,
            callback: async (html) => {
                const bonus = Number($(html).find('input[name="modifier"]').val());
                if (isNaN(bonus)) {
                    return await this.callMeldDialog(actor, testTarget);
                } else {
                    testTarget = parseInt(testTarget) + parseInt(bonus);
                    return await FortykRolls.fortykTest("wp", "skill", testTarget, actor, "Melding", null, false);
                }
            },
            default: "submit",

            width: 100
        });
    }
    static checkMelee(target) {
        let tokens = canvas.tokens.children[0].children;
        let targetDispositon = target.document.disposition;
        for (const token of tokens) {
            if (token.id === target.id) continue;
            if (this.cantAssistFlags(token.actor)) continue;
            if (token.document.disposition !== targetDispositon) {
                let distance = tokenDistance(target, token);
                let reach = token.actor.system.reach;
                if (distance <= reach) {
                    return true;
                }
            }
        }
        return false;
    }
    static checkCanAssist(assistant, target) {
        if (assistant.actor.getFlag("fortyk", "guard")) return true;
        let tokens = canvas.tokens.children[0].children;
        let assistantDispositon = assistant.document.disposition;
        for (const token of tokens) {
            if (token.id === target.id) continue;
            if (token.document.disposition !== assistantDispositon) {
                let distance = tokenDistance(assistant, token);
                let reach = token.actor.system.reach;
                if (distance <= reach) {
                    return false;
                }
            }
        }
        return true;
    }
    static cantAssistFlags(actor) {
        if (actor.getFlag("core", "dead")) return true;
        if (actor.getFlag("core", "running")) return true;
        if (actor.getFlag("core", "stunned")) return true;
        if (actor.getFlag("core", "snare")) return true;
        if (actor.getFlag("core", "unconscious")) return true;
        if (actor.getFlag("core", "blind") && !actor.getFlag("fortyk", "blindfight")) return true;
        return false;
    }
    static findAssists(target, attacker) {
        let targetDisposition = target.document.disposition;
        let attackerDisposition = attacker.document.disposition;
        let tokens = canvas.tokens.children[0].children;
        let assistCount = 0;
        let doubleTeam = false;
        for (const token of tokens) {
            if (token.id === target.id) continue;
            if (token.id === attacker.id) continue;
            if (this.cantAssistFlags(token.actor)) continue;
            let tokenDisposition = token.document.disposition;
            if (tokenDisposition === attackerDisposition && tokenDisposition !== targetDisposition) {
                let tokenReach = token.actor.system.reach;
                let distance = tokenDistance(token, target);
                if (distance <= tokenReach) {
                    let canAssist = this.checkCanAssist(token, target);
                    if (canAssist) {
                        assistCount++;
                        if (token.actor.getFlag("fortyk", "doubleteam")) doubleTeam = true;
                    }
                }
            }
        }
        assistCount = Math.min(2, assistCount);
        return { assistCount: assistCount, doubleTeam: doubleTeam };
    }
    //handles the melee attack dialog WHEW
    static async callMeleeAttackDialog(
        testChar,
        testType,
        testTarget,
        actor,
        testLabel,
        item,
        modifiers,
        modifierTracker = []
    ) {
        let itemData = item;
        let template = "systems/fortyk/templates/actor/dialogs/melee-attack-dialog.html";
        let templateOptions = {};

        let miscMods = 0;
        templateOptions["modifiers"] = foundry.utils.duplicate(actor.system.secChar.attacks);
        templateOptions["modifiers"].testMod = 0;
        modifierTracker.push({ value: `${testTarget}`, label: `Base Target Value` });
        miscMods += item.system.testMod.value;
        if (miscMods !== 0) {
            modifierTracker.push({ value: `${miscMods}`, label: "Weapon Bonus" });
        }
        templateOptions["options"] = {};
        if (item.getFlag("fortyk", "heavy")) {
            templateOptions["options"].swift = false;
        } else {
            templateOptions["options"].swift = actor.getFlag("fortyk", "swiftattack");
        }

        if (actor.getFlag("fortyk", "versatility")) {
            var versatile = false;
            let previousAttackType = actor.system.secChar.lastHit.type;
            if (previousAttackType === "rangedAttack") {
                miscMods += 10;
                modifierTracker.push({ value: `10`, label: "Versatility Bonus" });
                versatile = true;
            }
        }
        if (
            item.getFlag("fortyk", "heavy") ||
            item.getFlag("fortyk", "unwieldy") ||
            item.getFlag("fortyk", "unbalanced")
        ) {
            templateOptions["options"].lightning = false;
        } else {
            templateOptions["options"].lightning = actor.getFlag("fortyk", "lightningattack");
        }

        templateOptions["options"].prone = modifiers.prone;
        templateOptions["options"].selfProne = modifiers.selfProne;
        templateOptions["options"].stunned = modifiers.stunned;
        templateOptions["options"].helpless = modifiers.helpless;
        if (modifiers.size !== undefined) {
            templateOptions["options"].size = modifiers.size;
        } else {
            templateOptions["options"].size = actor.system.secChar.size.value;
        }

        templateOptions["options"].blindfight = actor.getFlag("fortyk", "blindfight");
        templateOptions["options"].counter = actor.getFlag("fortyk", "counterattack");
        templateOptions["options"].running = modifiers.running;
        templateOptions["options"].totalDef = modifiers.totalDef;
        //templateOptions["options"].rough=actor.getFlag("core","rough");
        //templateOptions["options"].tough=actor.getFlag("core","tough");
        //templateOptions["options"].severe=actor.getFlag("core","severe");
        if (
            !(templateOptions["options"].rough && templateOptions["options"].tough && templateOptions["options"].severe)
        ) {
            templateOptions["options"].normal = true;
        } else {
            templateOptions["options"].normal = false;
        }
        if (!templateOptions["options"].blindfight) {
            templateOptions["options"].selfBlind = modifiers.selfBlind;
        }

        //elevation stuff
        if (modifiers.elevation > 0) {
            templateOptions["options"].prone = true;
        } else if (modifiers.elevation < 0) {
            templateOptions["options"].selfProne = true;
        }
        templateOptions["size"] = game.fortyk.FORTYK.size;

        if (actor.type !== "vehicle" && actor.system.formation.value) {
            let unitStr = actor.system.secChar.wounds.value;
            templateOptions["modifiers"].charge = Math.min(10 + unitStr * 5, 60);
            templateOptions["modifiers"].standard = Math.min(unitStr * 5, 60);
        }
        if (actor.type !== "vehicle" && actor.system.horde.value) {
            let hordeSize = actor.system.secChar.wounds.value;

            if (
                (actor.getFlag("fortyk", "massAssault") && item.type === "meleeWeapon") ||
                (actor.getFlag("fortyk", "focusedFire") && item.type === "rangedWeapon")
            ) {
                miscMods += Math.min(30, hordeSize);
                modifierTracker.push({ value: `+${Math.min(30, hordeSize)}`, label: "Horde Trait Bonus" });
            }
        }
        templateOptions["options"].outnumber = 0;
        let targets = game.user.targets;
        let target = targets.values().next().value;
        let vehicle = false;
        if (targets.size > 0) {
            if (modifiers.distance > item.system.range.value) {
                ui.notifications.warn("Target out of reach!");
            }
            let speed = modifiers.tarEvasion;
            if (actor.getFlag("fortyk", "ignorespeed")) {
                let ignoreSpeed = parseInt(actor.getFlag("fortyk", "ignorespeed"));
                speed = Math.max(0, speed - ignoreSpeed);
            }
            miscMods += -speed;
            if (modifiers.tarEvasion) {
                modifierTracker.push({ value: `${-speed}`, label: "Target Speed Modifier" });
            }
            let tarActor = target.actor;
            let tar = tarActor;
            if (tar.getFlag("fortyk", "combatmaster")) {
                templateOptions["options"].combatmaster = true;
            } else {
                let outnumber = this.findAssists(target, getActorToken(actor));
                templateOptions["options"].outnumber = outnumber.assistCount;
                if (actor.getFlag("fortyk", "doubleteam") && outnumber.doubleTeam) {
                    templateOptions["modifiers"].gangup[1] += 10;
                    templateOptions["modifiers"].gangup[2] += 10;
                }
            }
            if (!actor.getFlag("fortyk", "blindfight") && tarActor.getFlag("fortyk", "invisible")) {
                miscMods += parseInt(tarActor.getFlag("fortyk", "invisible"));
                modifierTracker.push({ value: tarActor.getFlag("fortyk", "invisible"), label: "Invisible" });
            }
            if (!actor.getFlag("fortyk", "blindfight") && tarActor.getFlag("fortyk", "dark")) {
                templateOptions.options.targetDark = true;
            }
            if (tarActor.type === "vehicle") {
                vehicle = true;
                templateOptions.vehicle = true;
            }
            if (!vehicle) {
                if (tar.system.horde.value) {
                    let hordeSize = tar.system.secChar.wounds.value;
                    if (hordeSize >= 120) {
                        miscMods += 60;
                        modifierTracker.push({ value: `60`, label: "Horde Size Modifier" });
                    } else if (hordeSize >= 90) {
                        miscMods += 50;
                        modifierTracker.push({ value: `50`, label: "Horde Size Modifier" });
                    } else if (hordeSize >= 60) {
                        miscMods += 40;
                        modifierTracker.push({ value: `40`, label: "Horde Size Modifier" });
                    } else if (hordeSize >= 30) {
                        miscMods += 30;
                        modifierTracker.push({ value: `30`, label: "Horde Size Modifier" });
                    }
                }

                if (!vehicle && actor.getFlag("fortyk", "fieldvivisection")) {
                    var tarRace = tarActor.system.race.value.toLowerCase();
                    if (actor.getFlag("fortyk", "fieldvivisection").includes(tarRace)) {
                        templateOptions["modifiers"].called += actor.system.fieldVivisection;
                        if (actor.getFlag("fortyk", "fieldpractitioner")) {
                            let praticeArray = [];
                            var practiceMax = Math.ceil(actor.system.characteristics.int.bonus / 2);
                            for (let i = 1; i <= practiceMax; i++) {
                                praticeArray.push(i);
                            }
                            templateOptions.fieldPractice = praticeArray;
                        }
                    }
                }
            }
        }
        templateOptions["modifiers"].miscMods = miscMods;
        let renderedTemplate = await renderTemplate(template, templateOptions);

        new Dialog({
            title: `${item.name} Melee Attack Test.`,
            classes: "fortky",
            content: renderedTemplate,
            buttons: {
                submit: {
                    label: "OK",
                    callback: async (html) => {
                        const attackTypeBonus = Number($(html).find('input[name="attack-type"]:checked').val());

                        let guarded = Number($(html).find('input[name="guarded"]:checked').val());
                        let counter = Number($(html).find('input[name="counter"]:checked').val());
                        const aimBonus = Number($(html).find('input[name="aim-type"]:checked').val());
                        let aimType = html.find("input[name=aim-type]:checked")[0].attributes["aimtype"].value;
                        const outnumberBonus = Number($(html).find('input[name="outnumber"]:checked').val());
                        let outnumberType = html.find("input[name=outnumber]:checked")[0].attributes["outnumbertype"]
                        .value;
                        //const terrainBonus = Number($(html).find('input[name="terrain"]:checked').val());
                        //let terrainType = html.find('input[name=terrain]:checked')[0].attributes["terraintype"].value;
                        const visibilityBonus = Number($(html).find('input[name="visibility"]:checked').val());
                        let visibilityType = html.find("input[name=visibility]:checked")[0].attributes["visibilitytype"]
                        .value;
                        let defensive = Number($(html).find('input[name="defensive"]:checked').val());
                        let prone = Number($(html).find('input[name="prone"]:checked').val());
                        let high = Number($(html).find('input[name="high"]:checked').val());
                        let surprised = Number($(html).find('input[name="surprised"]:checked').val());
                        let stunned = Number($(html).find('input[name="stunned"]:checked').val());
                        let running = Number($(html).find('input[name="running"]:checked').val());
                        let size = Number($(html).find('select[name="size"]').val());
                        //adjust size penalty
                        size = (size - actor.system.secChar.size.value) * 10;
                        if (actor.getFlag("fortyk", "preysense")) {
                            if (size < 0) {
                                let preysense = parseInt(actor.getFlag("fortyk", "preysense")) * 10;
                                size = Math.min(0, size + preysense);
                            }
                        }
                        if (actor.getFlag("fortyk", "versatility")) {
                            actor.setFlag("fortyk", "versatile", versatile);
                        }
                        let other = Number($(html).find('input[name="other"]').val());
                        let addLabel = html.find("input[name=attack-type]:checked")[0].attributes["label"].value;

                        let attackType = html.find("input[name=attack-type]:checked")[0].attributes["attacktype"].value;
                        let attacklabel = html.find("input[name=attack-type]:checked")[0].attributes["label"].value;
                        let update = {};
                        update["system.secChar.lastHit.attackType"] = attackType;
                        if (attackType === "allout") {
                            let aeData = {};
                            aeData.id = "evasion";
                            aeData.name = "Evasion";
                            if (!actor.getFlag("core", "evasion")) {
                                aeData.icon = "systems/fortyk/icons/evasion.png";
                                aeData.flags = { fortyk: { evasion: 99 } };
                                aeData.statuses = ["evasion"];
                                aeData.duration = {
                                    rounds: 0
                                };
                                await FortykRolls.applyActiveEffect(actor, [aeData]);
                            } else {
                                for (let ae of actor.effects) {
                                    if (ae.statuses.has("evasion")) {
                                        let count = 9;
                                        count++;
                                        if (count > 9) {
                                            count = 9;
                                        }
                                        let update = {};
                                        update["icon"] = `systems/fortyk/icons/evasion${count}.png`;
                                        update["flags.fortyk.evasion"] = count;
                                        await ae.update(update);
                                        await actor.setFlag("core", "evasion", count);
                                    }
                                }
                            }
                        }

                        if (guarded) {
                            let guardActiveEffect = foundry.utils.duplicate(
                                game.fortyk.FORTYK.StatusEffects[
                                    game.fortyk.FORTYK.StatusEffectsIndex.get("holyShield")
                                ]
                            );
                            guardActiveEffect.duration = {
                                rounds: 0
                            };
                            FortykRolls.applyActiveEffect(actor, [guardActiveEffect]);
                        }
                        if (attackType === "called") {
                            update["system.secChar.lastHit.called"] = $(html)
                                .find('select[name="calledLoc"] option:selected')
                                .val();
                            if (
                                !vehicle &&
                                actor.getFlag("fortyk", "fieldvivisection") &&
                                actor.getFlag("fortyk", "fieldvivisection").includes(tarRace) &&
                                actor.getFlag("fortyk", "fieldpractitioner")
                            ) {
                                update["system.secChar.lastHit.fieldPractice"] = $(html)
                                    .find('select[name="fieldPracticeAmt"] option:selected')
                                    .val();
                            } else {
                                update["system.secChar.lastHit.fieldPractice"] = null;
                            }
                        } else {
                            update["system.secChar.lastHit.fieldPractice"] = null;
                        }
                        await actor.update(update);
                        if (html.find('input[name="guarded"]').is(":checked")) {
                            addLabel = html.find('input[name="guarded"]')[0].attributes["label"].value + " " + addLabel;
                        }
                        if (html.find('input[name="counter"]').is(":checked")) {
                            addLabel = html.find('input[name="counter"]')[0].attributes["label"].value + " " + addLabel;
                        }
                        testLabel = addLabel + " " + testLabel;
                        if (isNaN(running)) {
                            running = 0;
                        } else {
                            modifierTracker.push({ value: `${running}`, label: `Running Target Modifier` });
                        }
                        if (isNaN(guarded)) {
                            guarded = 0;
                        } else {
                            modifierTracker.push({ value: `${guarded}`, label: `Guarded Action Modifier` });
                        }
                        if (isNaN(counter)) {
                            counter = 0;
                        } else {
                            modifierTracker.push({ value: `${counter}`, label: `Counter Attack Modifier` });
                        }
                        if (isNaN(defensive)) {
                            defensive = 0;
                        } else {
                            modifierTracker.push({ value: `${defensive}`, label: `Total Defense Modifier` });
                        }
                        if (isNaN(prone)) {
                            prone = 0;
                        } else {
                            modifierTracker.push({ value: `${prone}`, label: `Prone Target Modifier` });
                        }
                        if (isNaN(high)) {
                            high = 0;
                        } else {
                            modifierTracker.push({ value: `${high}`, label: `Higher Ground Modifier` });
                        }
                        if (isNaN(surprised)) {
                            surprised = 0;
                        } else {
                            modifierTracker.push({ value: `${surprised}`, label: `Surprised Target Modifier` });
                        }
                        if (isNaN(stunned)) {
                            stunned = 0;
                        } else {
                            modifierTracker.push({ value: `${stunned}`, label: `Stunned Target Modifier` });
                        }
                        if (isNaN(other)) {
                            other = 0;
                        } else {
                            modifierTracker.push({ value: `${other}`, label: `Other Modifiers` });
                        }

                        modifierTracker.push({ value: `${attackTypeBonus}`, label: `${attacklabel} Attack Modifier` });
                        modifierTracker.push({ value: `${aimBonus}`, label: `${aimType} Aim Modifier` });
                        modifierTracker.push({
                            value: `${visibilityBonus}`,
                            label: `${visibilityType} Visibility Modifier`
                        });
                        //modifierTracker.push({"value":`${terrainBonus}`,"label":`${terrainType} Terrain Modifier`});
                        modifierTracker.push({ value: `${outnumberBonus}`, label: `${outnumberType} Modifier` });
                        modifierTracker.push({ value: `${size}`, label: `Size Modifier` });
                        testTarget =
                            miscMods +
                            parseInt(testTarget) +
                            parseInt(running) +
                            parseInt(attackTypeBonus) +
                            parseInt(guarded) +
                            parseInt(counter) +
                            parseInt(aimBonus) +
                            parseInt(outnumberBonus) /*+parseInt(terrainBonus)*/ +
                            parseInt(visibilityBonus) +
                            parseInt(defensive) +
                            parseInt(prone) +
                            parseInt(high) +
                            parseInt(surprised) +
                            parseInt(stunned) +
                            parseInt(size) +
                            parseInt(other);
                        actor.system.secChar.lastHit.attackRange = "melee";
                        actor.system.secChar.lastHit.vehicle = vehicle;
                        actor.system.secChar.lastHit.facing = modifiers.facing;
                        FortykRolls.fortykTest(
                            testChar,
                            testType,
                            testTarget,
                            actor,
                            testLabel,
                            item,
                            false,
                            "",
                            false,
                            modifierTracker
                        );
                    }
                }
            },
            default: "submit",

            width: 400
        }).render(true);
    }
    static async callRangedAttackDialog(
        testChar,
        testType,
        testTarget,
        actor,
        testLabel,
        item,
        modifiers,
        modifierTracker = []
    ) {
        //check if in melee
        if (item.system.class.value !== "Pistol" && this.checkMelee(getActorToken(actor))) {
            return ui.notifications.warn("You are enegaged in melee!");
        }
        if (actor.getFlag("core", "blind")) {
            return ui.notification.warn("You are blind and can't shoot!");
        }
        let template = "systems/fortyk/templates/actor/dialogs/ranged-attack-dialog.html";
        let templateOptions = {};
        let itemData = item;
        let miscMods = 0;
        templateOptions["modifiers"] = foundry.utils.duplicate(actor.system.secChar.attacks);
        templateOptions["size"] = game.fortyk.FORTYK.size;

        if (item.system.rof[1].value || item.system.rof[2].value) {
            templateOptions["modifiers"].supp = true;
        } else {
            templateOptions["modifiers"].supp = false;
        }

        templateOptions["modifiers"].suppressive = parseInt(item.system.attackMods.suppressive);
        templateOptions["modifiers"].full = parseInt(item.system.attackMods.full);
        templateOptions["modifiers"].semi = parseInt(item.system.attackMods.semi);
        templateOptions["modifiers"].standard = parseInt(item.system.attackMods.single);
        templateOptions["modifiers"].aim = item.system.attackMods.aim;
        templateOptions["modifiers"].testMod = 0;
        modifierTracker.push({ value: `${testTarget}`, label: `Base Target Value` });
        modifierTracker.push({ value: `${item.system.testMod.value}`, label: "Weapon Bonus" });
        miscMods += item.system.testMod.value;
        if (actor.getFlag("fortyk", "versatility")) {
            let previousAttackType = actor.system.secChar.lastHit.type;
            var versatile = false;
            if (previousAttackType === "meleeAttack") {
                miscMods += 10;
                modifierTracker.push({ value: `10`, label: "Versatility Bonus" });
                await actor.setFlag("fortyk", "versatile", true);
                versatile = true;
            }
        }
        if (item.getFlag("fortyk", "twinlinked")) {
            miscMods += 20;
            modifierTracker.push({ value: "20", label: "Twin-Linked" });
        }

        if (actor.type !== "vehicle" && actor.system.formation.value) {
            let unitStr = actor.system.secChar.wounds.value;
            templateOptions["modifiers"].standard = Math.min(unitStr * 5, 60);
        }
        if (actor.type !== "vehicle" && actor.system.horde.value) {
            let hordeSize = actor.system.secChar.wounds.value;

            if (
                (actor.getFlag("fortyk", "massAssault") && item.type === "meleeWeapon") ||
                (actor.getFlag("fortyk", "focusedFire") && item.type === "rangedWeapon")
            ) {
                miscMods += Math.min(30, hordeSize);
                modifierTracker.push({ value: `${Math.min(30, hordeSize)}`, label: "Horde Trait Bonus" });
            }
        }
        templateOptions["modifiers"].inaccurate = item.getFlag("fortyk", "innacurate");

        for (let [key, rng] of Object.entries(templateOptions.modifiers.range)) {
            let wepMod = item.system.attackMods.range[key];
            templateOptions.modifiers.range[key] = Math.max(wepMod, rng);
        }
        //set flags for rate of fire
        let curAmmo = parseInt(item.system.clip.value);
        let consump = parseInt(item.system.clip.consumption);

        let rofSingle = item.system.rof[0].value;
        let rofSemi = parseInt(item.system.rof[1].value);

        let rofFull = parseInt(item.system.rof[2].value);
        let canShoot = false;
        if (parseInt(rofSingle) === 0 || rofSingle === "-") {
            templateOptions["single"] = false;
        } else {
            rofSingle = 1;
            if (rofSingle * consump > curAmmo) {
                templateOptions["single"] = false;
            } else {
                templateOptions["single"] = true;
                canShoot = true;
            }
        }
        if (rofSemi === 0 || Number.isNaN(rofSemi)) {
            templateOptions["semi"] = false;
        } else {
            if (rofSemi * consump > curAmmo) {
                templateOptions["semi"] = false;
            } else {
                templateOptions["semi"] = true;
                canShoot = true;
            }
        }
        if (rofFull === 0 || Number.isNaN(rofFull)) {
            templateOptions["full"] = false;
        } else {
            if (rofFull * consump > curAmmo) {
                templateOptions["full"] = false;
            } else {
                templateOptions["full"] = true;
                canShoot = true;
            }
        }
        //if cant shoot return
        if (!canShoot) {
            return ui.notification.warn("You are out of ammunition, reload!");
        }
        templateOptions["options"] = {};
        templateOptions["options"].prone = modifiers.prone;
        templateOptions["options"].stunned = modifiers.stunned;
        templateOptions["options"].helpless = modifiers.helpless;
        if (modifiers.size !== undefined) {
            templateOptions["options"].size = modifiers.size;
        } else {
            templateOptions["options"].size = actor.system.secChar.size.value;
        }
        templateOptions["options"].targetselection = actor.getFlag("fortyk", "targetselection");
        templateOptions["options"].running = modifiers.running;
        templateOptions["options"].normal = true;
        //elevation stuff
        if (modifiers.elevation > 0) {
            templateOptions["options"].high = true;
        } else if (modifiers.elevation < 0) {
            templateOptions["options"].prone = true;
        }
        //target specific changes
        let targets = game.user.targets;
        let vehicle = false;
        if (targets.size > 0) {
            if (actor.getFlag("fortyk", "gyro")) {
                let gyro = parseInt(actor.getFlag("fortyk", "gyro")) * 10;
                let speed = modifiers.tarEvasion;
                if (actor.getFlag("fortyk", "ignorespeed")) {
                    let ignoreSpeed = parseInt(actor.getFlag("fortyk", "ignorespeed"));
                    speed = Math.max(0, speed - ignoreSpeed);
                }
                miscMods += -speed;
                miscMods += -Math.max(0, modifiers.selfEvasion - gyro);

                if (-Math.max(0, modifiers.selfEvasion - gyro)) {
                    modifierTracker.push({
                        value: `${-Math.max(0, modifiers.selfEvasion - gyro)}`,
                        label: "Speed Modifier"
                    });
                }
                if (modifiers.tarEvasion) {
                    modifierTracker.push({ value: `${-speed}`, label: "Target Speed Modifier" });
                }
            } else {
                let speed = modifiers.tarEvasion;
                if (actor.getFlag("fortyk", "ignorespeed")) {
                    let ignoreSpeed = parseInt(actor.getFlag("fortyk", "ignorespeed"));
                    speed = Math.max(0, speed - ignoreSpeed);
                }
                miscMods += -speed;
                miscMods += -modifiers.selfEvasion;
                if (modifiers.selfEvasion) {
                    modifierTracker.push({ value: `${-modifiers.selfEvasion}`, label: "Speed Modifier" });
                }
                if (modifiers.tarEvasion) {
                    modifierTracker.push({ value: `${-speed}`, label: "Target Speed Modifier" });
                }
            }

            let target = targets.values().next().value;
            let tarActor = target.actor;
            let tar = tarActor;
            templateOptions["options"].inmelee = this.checkMelee(target);
            if (tarActor.getFlag("fortyk", "dark")) {
                templateOptions.options.targetDark = true;
            }
            if (tarActor.type === "vehicle") {
                vehicle = true;
                templateOptions.vehicle = true;
            }
            if (tarActor.getFlag("fortyk", "hardtargetEvasion")) {
                miscMods += -20;
                modifierTracker.push({ value: `-20`, label: "Hard target modifier" });
            }
            templateOptions["hardTarget"] = tarActor.getFlag("fortyk", "hardtarget");

            if (tarActor.getFlag("fortyk", "invisible")) {
                miscMods += parseInt(tarActor.getFlag("fortyk", "invisible"));
                modifierTracker.push({ value: tarActor.getFlag("fortyk", "invisible"), label: "Invisible" });
            }
            if (!vehicle && tar.system.horde.value) {
                let hordeSize = tar.system.secChar.wounds.value;
                if (hordeSize >= 120) {
                    miscMods += 60;
                    modifierTracker.push({ value: `60`, label: "Horde Size Modifier" });
                } else if (hordeSize >= 90) {
                    miscMods += 50;
                    modifierTracker.push({ value: `50`, label: "Horde Size Modifier" });
                } else if (hordeSize >= 60) {
                    miscMods += 40;
                    modifierTracker.push({ value: `40`, label: "Horde Size Modifier" });
                } else if (hordeSize >= 30) {
                    miscMods += 30;
                    modifierTracker.push({ value: `30`, label: "Horde Size Modifier" });
                }
            }
            if (tarActor.getFlag("fortyk", "supersonic")) {
                if (actor.getFlag("fortyk", "skyfire") || item.getFlag("fortyk", "skyfire")) {
                    templateOptions["options"].prone = false;
                } else {
                    miscMods -= 60;

                    modifierTracker.push({ value: `-60`, label: "Supersonic Target Modifier" });
                }
            } else {
                if (item.getFlag("fortyk", "skyfire")) {
                    templateOptions["options"].prone = false;
                    miscMods -= 20;

                    modifierTracker.push({ value: `-20`, label: "Skyfire against ground Modifier" });
                }
            }
        }
        if (actor.getFlag("fortyk", "fieldvivisection") && targets.size > 0) {
            let targetIt = targets.values();
            let target = targetIt.next().value;

            let targetActor = target.actor;
            if (!vehicle) {
                var tarRace = targetActor.system.race.value.toLowerCase();
                if (actor.getFlag("fortyk", "fieldvivisection").includes(tarRace)) {
                    templateOptions["modifiers"].called += actor.system.fieldVivisection;
                    if (actor.getFlag("fortyk", "fieldpractitioner")) {
                        let praticeArray = [];
                        var practiceMax = Math.ceil(actor.system.characteristics.int.bonus / 2);
                        for (let i = 1; i <= practiceMax; i++) {
                            praticeArray.push(i);
                        }
                        templateOptions.fieldPractice = praticeArray;
                    }
                }
            }
        }
        //distance shenanigans
        let attackRange = "normal";
        if (modifiers.distance) {
            let distance = modifiers.distance;
            let pointblank = false;
            let short = false;
            let normal = false;
            let long = false;
            let extreme = false;
            let range = item.system.range.value;
            if (item.system.class.value === "Pistol" && distance <= 1) {
                normal = true;
            } else if (distance <= 2 || distance <= 2 * canvas.dimensions.distance) {
                pointblank = true;
                attackRange = "pointBlank";
            } else if (distance <= parseInt(range) / 2) {
                short = true;
                attackRange = "short";
            } else if (distance <= 2 * range) {
                normal = true;
                attackRange = "normal";
            } else if (distance <= 3 * range) {
                long = true;
                attackRange = "long";
            } else if (distance <= 4 * range) {
                extreme = true;
                attackRange = "extreme";
            } else {
                new Dialog({
                    title: `Out of range`,
                    classes: "fortky",
                    content: "You are out of range!",
                    buttons: {
                        submit: {
                            label: "OK",
                            callback: null
                        }
                    },
                    default: "submit",

                    width: 400
                }).render(true);
                return;
            }
            templateOptions["options"].pointblank = pointblank;
            templateOptions["options"].short = short;
            templateOptions["options"].normal = normal;
            templateOptions["options"].long = long;
            templateOptions["options"].extreme = extreme;
        }
        templateOptions["modifiers"].miscMods = miscMods;
        let renderedTemplate = await renderTemplate(template, templateOptions);

        new Dialog({
            title: `${item.name} Ranged Attack Test.`,
            classes: "fortky",
            content: renderedTemplate,
            buttons: {
                submit: {
                    label: "OK",
                    callback: async (html) => {
                        const attackTypeBonus = Number($(html).find('input[name="attack-type"]:checked').val());

                        let guarded = Number($(html).find('input[name="guarded"]:checked').val());
                        let overwatch = Number($(html).find('input[name="overwatch"]:checked').val());
                        let aimBonus = Number($(html).find('input[name="aim-type"]:checked').val());
                        try {
                            var aimType = html.find("input[name=aim-type]:checked")[0].attributes["aimtype"].value;
                        } catch (e) {
                            var aimType = 0;
                        }
                        const rangeBonus = Number($(html).find('input[name="distance"]:checked').val());
                        let rangeType = html.find("input[name=distance]:checked")[0].attributes["rangetype"].value;
                        if (isNaN(aimBonus)) {
                            aimBonus = 0;
                        }

                        const visibilityBonus = Number($(html).find('input[name="visibility"]:checked').val());
                        let visibilityType = html.find("input[name=visibility]:checked")[0].attributes["visibilitytype"]
                        .value;
                        let concealed = Number($(html).find('input[name="concealed"]:checked').val());
                        let prone = Number($(html).find('input[name="prone"]:checked').val());
                        let high = Number($(html).find('input[name="high"]:checked').val());
                        let surprised = Number($(html).find('input[name="surprised"]:checked').val());
                        let running = Number($(html).find('input[name="running"]:checked').val());
                        let stunned = Number($(html).find('input[name="stunned"]:checked').val());
                        let size = Number($(html).find('select[name="size"]').val());
                        //adjust size penalty
                        size = (size - actor.system.secChar.size.value) * 10;
                        if (actor.getFlag("fortyk", "preysense")) {
                            if (size < 0) {
                                let preysense = parseInt(actor.getFlag("fortyk", "preysense")) * 10;
                                size = Math.min(0, size + preysense);
                            }
                        }
                        if (item.getFlag("fortyk", "scatter")) {
                            if (size < 0) {
                                size = 0;
                            }
                        }
                        if (actor.getFlag("fortyk", "versatility")) {
                            actor.setFlag("fortyk", "versatile", versatile);
                        }
                        if (guarded) {
                            let guardActiveEffect = foundry.utils.duplicate(
                                game.fortyk.FORTYK.StatusEffects[
                                    game.fortyk.FORTYK.StatusEffectsIndex.get("holyShield")
                                ]
                            );
                            guardActiveEffect.duration = {
                                rounds: 0
                            };
                            FortykRolls.applyActiveEffect(actor, [guardActiveEffect]);
                        }
                        let other = Number($(html).find('input[name="other"]').val());
                        let melee = Number($(html).find('input[name="melee"]:checked').val());
                        //get attack type name for title

                        let addLabel = html.find("input[name=attack-type]:checked")[0].attributes["label"].value;
                        if (html.find('input[name="guarded"]').is(":checked")) {
                            addLabel = html.find('input[name="guarded"]')[0].attributes["label"].value + " " + addLabel;
                        }
                        if (html.find('input[name="overwatch"]').is(":checked")) {
                            addLabel =
                                html.find('input[name="overwatch"]')[0].attributes["label"].value + " " + addLabel;
                        }
                        testLabel = addLabel + " " + testLabel;

                        let attackType = html.find("input[name=attack-type]:checked")[0].attributes["attacktype"].value;
                        let attacklabel = html.find("input[name=attack-type]:checked")[0].attributes["label"].value;
                        let update = {};
                        update["system.secChar.lastHit.attackType"] = attackType;
                        if (attackType === "called") {
                            update["system.secChar.lastHit.called"] = $(html)
                                .find('select[name="calledLoc"] option:selected')
                                .val();

                            if (
                                !vehicle &&
                                actor.getFlag("fortyk", "fieldvivisection") &&
                                actor.getFlag("fortyk", "fieldvivisection").includes(tarRace) &&
                                actor.getFlag("fortyk", "fieldpractitioner")
                            ) {
                                update["system.secChar.lastHit.fieldPractice"] = $(html)
                                    .find('select[name="fieldPracticeAmt"] option:selected')
                                    .val();
                            } else {
                                update["system.secChar.lastHit.fieldPractice"] = null;
                            }
                        } else {
                            update["system.secChar.lastHit.fieldPractice"] = null;
                        }
                        await actor.update(update);
                        //spend ammo on gun
                        let rofIndex = parseInt(
                            html.find("input[name=attack-type]:checked")[0].attributes["index"].value
                        );

                        let rof = 0;
                        if (rofIndex === 3) {
                            rof = Math.max(rofSemi, rofFull) * consump;
                        } else if (rofIndex === 2) {
                            rof = rofFull * consump;
                        } else if (rofIndex === 1) {
                            rof = rofSemi * consump;
                        } else if (rofIndex === 0) {
                            rof = rofSingle * consump;
                        }

                        await item.update({ "system.clip.value": curAmmo - rof });

                        //convert unchosen checkboxes into 0s
                        if (isNaN(running)) {
                            running = 0;
                        } else {
                            modifierTracker.push({ value: `${running}`, label: `Running Target Modifier` });
                        }
                        if (isNaN(guarded)) {
                            guarded = 0;
                        } else {
                            modifierTracker.push({ value: `${guarded}`, label: `Guarded Action Modifier` });
                        }
                        if (isNaN(overwatch)) {
                            overwatch = 0;
                        } else {
                            modifierTracker.push({ value: `${overwatch}`, label: `Overwatch Action Modifier` });
                        }
                        if (isNaN(prone)) {
                            prone = 0;
                        } else {
                            modifierTracker.push({ value: `${prone}`, label: `Prone Target Modifier` });
                        }
                        if (isNaN(high)) {
                            high = 0;
                        } else {
                            modifierTracker.push({ value: `${high}`, label: `Higher Ground Modifier` });
                        }
                        if (isNaN(surprised)) {
                            surprised = 0;
                        } else {
                            modifierTracker.push({ value: `${surprised}`, label: `Surprised Target Modifier` });
                        }
                        if (isNaN(stunned)) {
                            stunned = 0;
                        } else {
                            modifierTracker.push({ value: `${stunned}`, label: `Stunned Target Modifier` });
                        }
                        if (isNaN(concealed)) {
                            concealed = 0;
                        } else {
                            modifierTracker.push({ value: `${concealed}`, label: `Concealed Target Modifier` });
                        }
                        if (isNaN(other)) {
                            other = 0;
                        } else {
                            modifierTracker.push({ value: `${other}`, label: `Other Modifiers` });
                        }
                        if (isNaN(melee)) {
                            melee = 0;
                        } else {
                            modifierTracker.push({ value: `${melee}`, label: `Melee Modifier` });
                        }
                        modifierTracker.push({ value: `${attackTypeBonus}`, label: `${attacklabel} Attack Modifier` });
                        modifierTracker.push({ value: `${aimBonus}`, label: `${aimType} Aim Modifier` });
                        modifierTracker.push({
                            value: `${visibilityBonus}`,
                            label: `${visibilityType} Visibility Modifier`
                        });
                        modifierTracker.push({ value: `${rangeBonus}`, label: `${rangeType} Range Modifier` });
                        modifierTracker.push({ value: `${size}`, label: `Size Modifier` });

                        testTarget =
                            miscMods +
                            parseInt(testTarget) +
                            parseInt(running) +
                            parseInt(attackTypeBonus) +
                            parseInt(guarded) +
                            parseInt(overwatch) +
                            parseInt(aimBonus) +
                            parseInt(visibilityBonus) +
                            parseInt(prone) +
                            parseInt(high) +
                            parseInt(surprised) +
                            parseInt(stunned) +
                            parseInt(size) +
                            parseInt(other) +
                            parseInt(concealed) +
                            parseInt(rangeBonus) +
                            parseInt(melee);
                        actor.system.secChar.lastHit.attackRange = attackRange;
                        actor.system.secChar.lastHit.vehicle = vehicle;
                        actor.system.secChar.lastHit.facing = modifiers.facing;
                        await FortykRolls.fortykTest(
                            testChar,
                            testType,
                            testTarget,
                            actor,
                            testLabel,
                            item,
                            false,
                            attackType,
                            false,
                            modifierTracker
                        );
                        if (aimBonus > 0) {
                            await actor.update({ "system.secChar.lastHit.aim": true });
                            actor.system.secChar.lastHit.aim = true;
                        } else {
                            await actor.update({ "system.secChar.lastHit.aim": false });
                        }
                    }
                }
            },
            default: "submit",

            width: 400
        }).render(true);
    }
    static async callFocusPowerDialog(
        testChar,
        testType,
        testTarget,
        actor,
        testLabel,
        item,
        modifiers,
        modifierTracker = []
    ) {
        let template = "systems/fortyk/templates/actor/dialogs/psychic-power-attack-dialog.html";
        let templateOptions = {};
        let actionType = item.system.action.value;
        if (actionType.toLowerCase() === "reaction") {
            let reactions = actor.system.reactions;
            let spentReactions = actor.getFlag("core", "evasion");
            if (spentReactions >= reactions) return ui.notifications.warn("Out of reactions!");
        }
        modifierTracker = modifierTracker.concat(item.system.modifiers);
        let renderedTemplate = await renderTemplate(template, templateOptions);

        new Dialog({
            title: `${item.name} Focus Power Test.`,
            classes: "fortky",
            content: renderedTemplate,
            buttons: {
                submit: {
                    label: "OK",
                    callback: async (html) => {
                        let other = Number($(html).find('input[name="other"]').val());
                        modifierTracker.push({ value: other, label: "Input Modifier" });

                        testTarget = parseInt(testTarget) + parseInt(other);

                        let test= await FortykRolls.fortykTest(
                            testChar,
                            testType,
                            testTarget,
                            actor,
                            testLabel,
                            item,
                            false,
                            "",
                            false,
                            modifierTracker
                        );
                        if(actor.getFlag("fortyk","soulblaze")&&test.value){
                            let pr=actor.system.psykana.pr.effective;
                            this.soulBlaze(actor, pr, actor.getFlag("fortyk","iconofburningflame"));
                        }
                    }
                }
            },
            default: "submit",

            width: 200
        }).render(true);
    }
    static async soulBlaze(actor, pr, icon){
        let tokens = canvas.tokens.children[0].children;
        
        let sourceToken=getActorToken(actor);
        for(let token of tokens){
            let tokenActor=token.actor;
            if(token.id===sourceToken.id)continue;
            if(tokenActor.getFlag("fortyk","daemonic")){
                let distance= tokenDistance(token,sourceToken);
                if(distance<=pr){
                    let test= await FortykRolls.fortykTest(
                        "wp",
                        "char",
                        tokenActor.system.characteristics.wp.total,
                        tokenActor,
                        "Soulblaze",
                        null,
                        false,
                        "",
                        false,
                        []
                    );
                    if(!test.value){
                        let fireData = { name: "Purifying Fire", type: "rangedWeapon" };
                        let fire = await Item.create(fireData, { temporary: true });

                        fire.system.damageType.value = "Energy";
                        fire.system.pen.value = 99999;

                        fire.flags.fortyk = { ignoreSoak: true };
                        fire.system.damageFormula.value = `${pr}`;




                        await FortykRolls.damageRoll(fire.system.damageFormula, tokenActor, fire, 1, true);
                        let fireActiveEffect = foundry.utils.duplicate(
                            game.fortyk.FORTYK.StatusEffects[
                                game.fortyk.FORTYK.StatusEffectsIndex.get("purifyingflame")
                            ]
                        );
                        fireActiveEffect.flags = {
                            fortyk: { damageString: `1d10+${pr}`}
                        };
                        fireActiveEffect.flags.fortyk.pr=pr;
                        if(icon){
                            fireActiveEffect.flags.fortyk.iconofburningflame=true;
                        }
                        FortykRolls.applyActiveEffect(token, [fireActiveEffect], false);
                    }
                }
            }
        }
    }
    static async callSprayAttackDialog(actor, testLabel, weapon, options, sheet, title = "Enter test modifier") {
        let modifier = 0;
        let pr = actor.system.psykana.pr.effective;
        let psy = false;
        let consumption;
        if (weapon.type === "psychicPower") {
            psy = true;
            consumption = 0;
        }else{
            consumption = weapon.system.clip.consumption;
        }

        if (!psy) {
            var ammo = weapon.system.clip.value;
            if (ammo < consumption) {
                return ui.notifications.warn("Out of ammunition!");
            }
        }
        if (weapon.getFlag("fortyk", "psyflame")) {
            modifier -= pr * 5;
        }
        if (actor.getFlag("fortyk", "psyboltattunement") && weapon.getFlag("fortyk", "force")) {
            modifier -= pr * 5;
        }
        new Dialog({
            title: title,
            content: `<p><label>Modifier:</label> <input id="modifier" type="text" name="modifier" value="${modifier}" autofocus/></p>`,
            buttons: {
                submit: {
                    label: "OK",
                    callback: async (html) => {
                        const templateData = {
                            t: "cone",

                            author: game.userId,

                            distance: weapon.system.range.value,

                            direction: 45,
                            angle: 30,

                            x: 1000,

                            y: 1000,

                            fillColor: game.user.color
                        };

                        const templateDoc = new MeasuredTemplateDocument(templateData, { parent: canvas.scene });

                        const template = new game.fortyk.FortykTemplate(templateDoc);
                        sheet.minimize();
                        await template.drawPreview();
                        sheet.maximize();

                        let scene = game.canvas.scene;
                        let targets = this.getSprayTargets(template, scene, actor)[0];

                        let mod = Number($(html).find('input[name="modifier"]').val());

                        if (targets.size === 0) {
                            this.callSprayAttackDialog(actor, testLabel, weapon, options, sheet, "No targets");
                            return;
                        }

                        if (isNaN(mod)) {
                            this.callSprayAttackDialog(actor, testLabel, weapon, options, sheet, "Invalid Number");
                            return;
                        }

                        let messageContent = "";
                        let updatedtargets = [];
                        let rolls = [];
                        let i = 1;
                        for (let tokenId of targets) {
                            let token = canvas.tokens.get(tokenId);
                            let tokenActor = token.actor;
                            if (tokenActor.id === actor.id) continue;
                            if (tokenActor.getFlag("core", "dead")) continue;
                            let tokenActorData = token.actor;
                            let data = token.actor.system;

                            let testTarget = 0;
                            if (tokenActor.type === "vehicle") {
                                testTarget = data.crew.ratingTotal + mod;
                            } else {
                                testTarget = data.characteristics.agi.total + mod;
                            }
                            let test = await game.fortyk.FortykRolls.fortykTest(
                                "agi",
                                "Test",
                                testTarget,
                                tokenActor,
                                "Avoid Spray Attack",
                                weapon,
                                false,
                                "",
                                true
                            );
                            let hit = 0;
                            if (!test.value) {
                                updatedtargets.push(token.id);
                                hit++;
                            }

                            messageContent +=
                                `<div class="chat-target"><a class="spray-torrent-ping" data-weapon="${weapon.id}" data-user="${game.user.id}" data-hits="${hit}" data-token="${tokenId}">${token.name}'s</a> ` +
                                test.template +
                                `</div>`;
                            let r = test.roll;
                            r.dice[0].options.rollOrder = i;
                            rolls.push(test.roll);
                            i++;
                        }
                        messageContent += `<div class="chat-target">Selected targets may attempt to evade if they have a reaction remaining and have enough movement from their half-move to exit the attack's area of effect.</div>`;
                        game.user.updateTokenTargets(updatedtargets);
                        game.user.broadcastActivity({ targets: updatedtargets });
                        let name;
                        if (actor.isToken) {
                            name = actor.token.name;
                        } else {
                            name = actor.name;
                        }
                        let chatOptions = {
                            author: game.user._id,
                            speaker: { actor, alias: name },
                            rolls: rolls,
                            content: messageContent,
                            classes: ["fortyk"],
                            sound: "sounds/dice.wav",
                            flavor: `Spray Attack result`
                        };

                        await ChatMessage.create(chatOptions, {});
                        if (!psy) {
                            await weapon.update({ "system.clip.value": ammo - consumption });
                        }
                    }
                }
            },
            default: "submit",

            width: 100
        }).render(true);
    }
    static async callTorrentAttackDialog(actor, testLabel, weapon, options, sheet, title = "Enter test modifier") {
        let torrent = weapon.getFlag("fortyk", "torrent");
        let storm = weapon.getFlag("fortyk", "storm");
        let rof = weapon.system.rof[2].value;
        let consumption = weapon.system.clip.consumption;
        let tesmod = rof * -5;
        if (storm) rof *= 2;
        let psy = false;
        if (weapon.type === "psychicPower") {
            psy = true;
        }
        let ammo;
        if (!psy) {
            ammo = weapon.system.clip.value;
            if (ammo < rof * consumption) {
                return;
            }
        }
        new Dialog({
            title: title,
            content: `<p><label>Modifier:</label> <input id="modifier" type="text" name="modifier" value="${tesmod}" autofocus/></p>`,
            buttons: {
                submit: {
                    label: "OK",
                    callback: async (html) => {
                        const templateData = {
                            t: "cone",

                            author: game.userId,

                            distance: weapon.system.range.value,

                            direction: 45,
                            angle: torrent,

                            x: 1000,

                            y: 1000,

                            fillColor: game.user.color
                        };

                        const templateDoc = new MeasuredTemplateDocument(templateData, { parent: canvas.scene });

                        const template = new game.fortyk.FortykTemplate(templateDoc);
                        sheet.minimize();
                        await template.drawPreview();
                        sheet.maximize();

                        let scene = game.canvas.scene;
                        let targets = this.getSprayTargets(template, scene, actor)[0];

                        let mod = Number($(html).find('input[name="modifier"]').val());

                        if (targets.size === 0) {
                            this.callSprayAttackDialog(actor, testLabel, weapon, options, sheet, "No targets");
                            return;
                        }

                        if (isNaN(mod)) {
                            this.callSprayAttackDialog(actor, testLabel, weapon, options, sheet, "Invalid Number");
                            return;
                        }

                        let messageContent = "";
                        let updatedtargets = [];
                        let rolls = [];
                        let i = 1;
                        let targetList = [];
                        for (let tokenId of targets) {
                            let token = canvas.tokens.get(tokenId);

                            let tokenActor = token.actor;
                            if (tokenActor.id === actor.id) continue;
                            if (tokenActor.getFlag("core", "dead")) continue;
                            let tokenActorData = token.actor;
                            let data = token.actor.system;

                            let testTarget = 0;
                            if (tokenActor.type === "vehicle") {
                                testTarget = data.crew.ratingTotal + mod;
                            } else {
                                testTarget = data.characteristics.agi.total + mod;
                            }
                            let test = await game.fortyk.FortykRolls.fortykTest(
                                "agi",
                                "Test",
                                testTarget,
                                tokenActor,
                                "Avoid Torrent Attack",
                                weapon,
                                false,
                                "",
                                true
                            );

                            if (!test.value) {
                                //updatedtargets.push(token.id);
                                targetList.push({ name: token.name, test: test, hits: 0, tokenId: tokenId });
                            } else {
                                messageContent +=
                                    `<div class="chat-target"><a class="spray-torrent-ping" data-weapon="${weapon.id}" data-user="${game.user.id}" data-hits="0" data-token="${tokenId}">${token.name}'s</a> ` +
                                    test.template +
                                    `</div>`;
                            }

                            let r = test.roll;
                            r.dice[0].options.rollOrder = i;
                            rolls.push(r);
                            i++;
                        }
                        let allocatedHits = 0;
                        let elligibleTargets = targetList.length;
                        targetList.sort((a, b) => {
                            if (a.test.dos > b.test.dos) {
                                return -1;
                            } else {
                                return 1;
                            }
                        });
                        let counter = 0;
                        while (allocatedHits < rof && elligibleTargets > 0) {
                            if (counter === targetList.length) {
                                counter = 0;
                            }

                            let target = targetList[counter];
                            let dos = target.test.dos;
                            if (storm) dos *= 2;
                            if (target.hits < dos) {
                                if (storm) {
                                    target.hits += 2;
                                    allocatedHits += 2;
                                } else {
                                    target.hits++;
                                    allocatedHits++;
                                }

                                if (target.hits === dos) {
                                    elligibleTargets--;
                                }
                            }
                            counter++;
                        }
                        for (const target of targetList) {
                            messageContent += `<div class="chat-target"><a class="spray-torrent-ping" data-weapon="${weapon.id}" data-user="${game.user.id}" data-hits="${target.hits}" data-token="${target.tokenId}">${target.name}'s</a> ${target.test.template} takes ${target.hits} hits!</div>`;
                        }
                        messageContent += `<div class="chat-target">Targets who suffer hits must pass an evasion test with degrees of success equal to the number of hits or take the remaining hits.</div>`;
                        game.user.updateTokenTargets(updatedtargets);
                        game.user.broadcastActivity({ targets: updatedtargets });
                        let name;
                        if (actor.isToken) {
                            name = actor.token.name;
                        } else {
                            name = actor.name;
                        }
                        let chatOptions = {
                            author: game.user._id,
                            speaker: { actor, alias: name },
                            rolls: rolls,
                            content: messageContent,
                            classes: ["fortyk"],
                            sound: "sounds/dice.wav",
                            flavor: `Torrent Attack result`,
                            flags: { fortyk: { targets: targetList } }
                        };
                        await ChatMessage.create(chatOptions, {});
                        if (!psy) {
                            let ammoConsumed = rof * consumption;
                            if (ammoConsumed > 0) {
                                let newAmmo = ammo - ammoConsumed;
                                await weapon.update({ "system.clip.value": newAmmo });
                            }
                        }
                    }
                }
            },
            default: "submit",

            width: 100
        }).render(true);
    }
    static getSprayTargets(template, scene, attacker) {
        let attackerToken = getActorToken(attacker);
        let tokens = scene.tokens;
        let targets = [];
        let gridRatio =  scene.dimensions.distance/scene.dimensions.size;

        let targetted = [];

        let bounds = template.shape;
        bounds.x = template.document.x;
        bounds.y = template.document.y;
        tokens.forEach((token, id, tokens) => {
            if (attackerToken.id === token.id) {
                return;
            }
            if (
                attacker.getFlag("fortyk", "divineprotection") &&
                token.document.disposition === attackerToken.document.disposition
            ) {
                return;
            }
            let tokenBounds = token._object.bounds;
            let isTargetted = false;

            if (
                bounds.contains(
                    token._object.center.x - template.document.x,
                    token._object.center.y - template.document.y
                )
            ) {
                isTargetted = true;
            }
            if (!isTargetted) {
                isTargetted = FortykRollDialogs.rectangleIntersectsPolygon(bounds, tokenBounds);
            }
            if (isTargetted) {
                targetted.push(token.id);
            }

            /*if(bounds.overlaps(tokenBounds)){
                    targetted.push(token.id);
                }*/
        });
        targets.push(targetted);

        return targets;
    }
    static rectangleIntersectsPolygon(polygon, rectangle) {
        let lineIntersect = function (rectangle, polygon, index) {
            let points = polygon.points;
            if (points[index + 2] === undefined) {
                return false;
            }
            let pX = polygon.x;
            let pY = polygon.y;
            let firstPoint = { x: pX + points[index], y: pY + points[index + 1] };
            let secondPoint = { x: pX + points[index + 2], y: pY + points[index + 3] };
            let topEdge = rectangle.topEdge;
            let bottomEdge = rectangle.bottomEdge;
            let leftEdge = rectangle.leftEdge;
            let rightEdge = rectangle.rightEdge;
            if (foundry.utils.lineSegmentIntersects(topEdge.A, topEdge.B, firstPoint, secondPoint)) {
                return true;
            }
            if (foundry.utils.lineSegmentIntersects(bottomEdge.A, bottomEdge.B, firstPoint, secondPoint)) {
                return true;
            }
            if (foundry.utils.lineSegmentIntersects(leftEdge.A, leftEdge.B, firstPoint, secondPoint)) {
                return true;
            }
            if (foundry.utils.lineSegmentIntersects(rightEdge.A, rightEdge.B, firstPoint, secondPoint)) {
                return true;
            }
            return lineIntersect(rectangle, polygon, index + 2);
        };
        return lineIntersect(rectangle, polygon, 0);
    }
    static async callForcefieldDialog(forcefield, actor, title = "Enter number of hits") {
        new Dialog({
            title: title,
            content: `<p><label>Number of Hits:</label> <input id="modifier" type="number" name="modifier" value="1" autofocus/></p>`,
            buttons: {
                submit: {
                    label: "OK",
                    callback: (html) => {
                        const hits = Number($(html).find('input[name="modifier"]').val());
                        if (isNaN(hits)) {
                            this.callForcefieldDialog(forcefield, actor, "Invalid Number");
                        } else {
                            FortykRolls.fortykForcefieldTest(forcefield, actor, hits);
                        }
                    }
                }
            },
            default: "submit",

            width: 100
        }).render(true);
    }
}
