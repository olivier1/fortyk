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
@Weapon: the weapon is needed for attack rolls, this is where psy powers are put also
@reroll: if the roll is a reroll or not
returns the roll message*/
    static async fortykTest(char, type, target, actor, label, weapon=null, reroll=false){
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
            success:false,
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

        if(type==="focuspower"||type==="rangedAttack"||type==="meleeAttack"){
            let perils=false;
            //reverse roll to get hit location
            let firstDigit=Math.floor(testRoll/10);
            
            let secondDigit=testRoll-firstDigit*10;
           
            let inverted=parseInt(secondDigit*10+firstDigit);
          
            let hitlocation=FORTYKTABLES.hitLocations[inverted];
            actor.data.data.secChar.lastHit.value=hitlocation.name;
            let chatOp={user: game.user._id,
                         speaker:{actor,alias:actor.name},
                         content:`Location: ${hitlocation.label}`,
                         classes:["fortyk"],
                        flavor:"Hit location",
                         author:actor.name};
            ChatMessage.create(chatOp,{});
            if(firstDigit===secondDigit&&type==="focuspower"){
                
            }
        }

    }
    //handles damage rolls, will eventually hook into dealing the damage on a target
    static async damageRoll(formula,actor,weapon=null,righteous=10){
        
        var form=formula.value;
        if(weapon !== null){
            
           
            if(weapon.type==="meleeWeapon"){
                form+="+"+actor.data.data.characteristics.s.bonus
            }
        }
        let roll=new Roll(form,actor.data.data);
        let label = weapon.name ? `Rolling ${weapon.name} damage.` : 'damage';

        roll.roll();
        //check for righteous fury
        var crit=false;
        for ( let r of roll.dice[0].rolls ) {
            
            
              
                
                if(r.roll>=righteous){
                    crit=true;
                    
                }

            }
        
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: actor }),
            flavor: label
        });
        //if righteous fury roll the d5 and spew out the crit result
        if(crit){
            let rightRoll=new Roll("1d5",actor.data.data);
            rightRoll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: actor }),
                flavor: "Righteous Fury!"
            });
            let res=rightRoll.dice[0].rolls[0].roll-1;
            
           
            let rightMes=FORTYKTABLES.crits[weapon.data.damageType.value][actor.data.data.secChar.lastHit.value][res];
            console.log(rightMes);
            
         
            var chatOptions={user: game.user._id,
                             speaker:{actor,alias:actor.name},
                             content:"hello",
                             classes:["fortyk"],
                             author:actor.name};
            ChatMessage.create(chatOptions,{});

        }

        
    }
    //handles test rerolls
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
                        FortykRolls.fortykTest(char, type, target, actor, label,null , true);
                    }
                }
            },
            default: "submit",


            width:100}
                  ).render(true);
    }
    //activate chatlisteners
    static chatListeners(html){
        html.on("click",".reroll", this._onReroll.bind(this));

    }

}
