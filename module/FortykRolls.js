/* provides functions for doing tests or damage rolls, will eventually take into account talents and special qualities but not yet
*/
import {FORTYKTABLES} from "./FortykTables.js"
export class FortykRolls{
    /*The base test function, will roll against the target and return the success and degree of failure/success, the whole roll message is handled by the calling function.
@char: a characteristic object that contains any unattural characteristic the object may have
@type: the type of test, skills, psy powers, and ranged attacks can have some extra effects
@target: the target number for the test
@actor: the calling actor
@label: what to name the test
@rangedRoF: for ranged attacks the rof determines jam chance
@rangedWeapon: certain ranged weapons will have properties that negate jams or deal damage instead of jamming
returns the roll message*/
    static async fortykTest(char, type, target, actor, label, reroll=false, weapon=null){
        //cap target at 100
        if(target>100){
            target=100;
        }

        let roll=new Roll("1d100ms<@tar",{tar:target});
        roll.roll();

        let template='systems/fortyk/templates/chat/chat-test.html';
        var templateOptions={
            title:"",
            rollResult:"",
            target:"",
            pass:"",
            dos:"",
            reroll:reroll

        }
        if(!reroll){
            templateOptions["actor"]=actor._id;
            templateOptions["char"]=char;
            templateOptions["type"]=type;
            templateOptions["targetNumber"]=target;
            templateOptions["label"]=label;
        }
        //prepare chat output
        if(reroll){
            templateOptions["title"]="Rerolling "+label+" test.";
        }else{
            templateOptions["title"]="Rolling "+label+" test.";
        }
        
        
        const testRoll=roll.dice[0].rolls[0].roll;

        templateOptions["rollResult"]="Roll: "+testRoll.toString();
        templateOptions["target"]="Target: "+target.toString();
        const rollResult=target-testRoll;
        const testResult=rollResult>=0;
        const charObj=actor.data.data.characteristics[char];
        //calculate degrees of failure and success
        if(testResult&&testRoll<96||testRoll===1){

            const testDos=Math.floor(Math.abs(roll._result)/10)+1+charObj.uB;
            templateOptions["dos"]="with "+testDos.toString()+" degrees of success!";
            templateOptions["pass"]="Pass!";
            templateOptions["success"]=true;
        }else{

            const testDos=Math.floor(Math.abs(roll._result)/10)+1;
            templateOptions["dos"]="with "+testDos.toString()+" degrees of failure!";
            templateOptions["success"]=false;
            if(testRoll>=96){
                templateOptions["pass"]="96+ is an automatic failure!"
            }else{
                templateOptions["pass"]="Failure!"; 
            }

        }

        //give the chat object options and stuff
        let renderedTemplate= await renderTemplate(template,templateOptions);

        var chatOptions={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:renderedTemplate,
                         classes:["fortyk"],
                         roll:roll,
                         author:actor.name};
        ChatMessage.create(chatOptions,{});

        if(type==="focuspower"){
            
        }

    }
    static chatListeners(html){
        html.on("click",".reroll", this._onReroll.bind(this));
        
    }
    static async _onReroll(event){
        event.preventDefault();
        
        const dataset=event.currentTarget.dataset;
        const actor=game.actors.get(dataset["actor"]);
        const char=dataset["char"];
        const type=dataset["type"];
        var target=dataset["target"];
        const label=dataset["label"];
        
        
        new Dialog({
                title: `${label} Reroll`,
                content: `<p><label>Modifier:</label> <input type="text" name="modifier" value="0" autofocus/></p>`,
                buttons: {
                    submit: {
                        label: 'OK',
                        callback: (el) => {
                            let bonus = Number($(el).find('input[name="modifier"]').val());
                            console.log(target)
                            target=parseInt(target)+parseInt(bonus);
                            FortykRolls.fortykTest(char, type, target, actor, label, true);
                        }
                    }
                },
                default: "submit",
                

                width:100}
            ).render(true);
    }

}
