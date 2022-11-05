new Dialog({
    title: "Speed Modifier",
    content: `<div><label>Modifier:</label> <input id="speed" type="text" name="speed" value="0" autofocus/></div>`,
    buttons: {
        submit: {
            label: 'OK',
            callback: async(html) => {
                let speed = $(html).find('input[name="speed"]').val();
                console.log(speed)

                let aeData={};
                aeData.id="speed";
                aeData.label= "Speed";
                aeData.icon= "systems/fortyk/icons/speed.png";



                aeData.flags= { core: { statusId: "speed" } }
                aeData.duration={

                    rounds:0
                };
                aeData.changes=[
                    {key: "system.evasion", value: speed, mode:game.fortyk.FORTYK.ACTIVE_EFFECT_MODES.ADD}            
                ]
                for(let target of canvas.tokens.controlled){

                    let actor
                    if(token instanceof Token){
                        actor=token.actor;
                    }else{
                        actor=token;
                    }
                    await actor.createEmbeddedDocuments("ActiveEffect",[aeData]);
                }
            }
        }
    },
    default: "submit",


    width:100,
    render: (html)=>{
        console.log("hi")
        html.find('input[name="speed"]').focus()
    }}
          ).render(true);