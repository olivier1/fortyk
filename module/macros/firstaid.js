new Dialog({
    title: "First Aid",
    content: `<div><label>Modifier:</label> <input id="modifier" type="text" name="modifier" value="0" autofocus/></div>`,
    buttons: {
        submit: {
            label: 'OK',
            callback: async(html) => {
                let mod = Number($(html).find('input[name="modifier"]').val());
                let targetToken=game.user.targets.first();
                let characterActor=game.user.character;
                if(targetToken===undefined){
                    ui.notifications.error("This macro requires a target.");
                    return;
                }
                let targetActor=targetToken.actor;
                if(characterActor===undefined){
                    ui.notifications.error("This macro requires a player character to be impersonated.");
                    return; 
                }
                let medicae=characterActor.system.skills.medicae+mod;
                let pass=false;
                let dos=0;
                let tarWounds=targetActor.system.secChar.wounds.value;
                if(!targetActor.getFlag("fortyk","hardy")){
                    if(characterActor.getFlag("fortyk","superiorchirurgeon")){
                        if(tarWounds<0){
                            medicae-=10;
                        }
                    }else{
                        if(tarWounds<0){
                            medicae+=10*tarWounds;
                        }else if(targetActor.system.secChar.wounds.heavy){
                            medicae-=10;
                        }
                    } 
                }
                let test=await game.fortyk.FortykRolls.fortykTest(`int`,"int" , medicae, characterActor, `First Aid on ${targetActor.name}`);
                let chatFirstAid={user: game.users.current,
                                  speaker:{user: game.users.current},
                                  content:"",
                                  classes:["fortyk"],
                                  flavor:`First Aid result on ${targetActor.name}`,
                                  author:game.users.current.id
                                 }


                if(test.value){
                    let healing=test.dos+characterActor.system.characteristics.int.bonus;

                    if(characterActor.getFlag("fortyk","narthecium")){
                        let narthForm="1d5"
                        let narthRoll=new Roll(narthForm,{});
                        await narthRoll.evaluate({async: false});
                        narthRoll.toMessage({flavor:"Rolling narthecium healing"});
                        healing+=narthRoll._total;
                    }
                    chatFirstAid.content=`${characterActor.name} successfully healed ${targetActor.name} for ${healing} wounds!`
                    tarWounds=Math.min(tarWounds+healing,targetActor.system.secChar.wounds.max);
                    if(game.user.isGM||targetActor.isOwner){
                        await targetActor.update({"system.secChar.wounds.value":tarWounds});
                    }else{
                        let tokenId=targetToken.id;

                        let socketOp={type:"updateValue",package:{token:tokenId,value:tarWounds,path:"system.secChar.wounds.value"}}
                        await game.socket.emit("system.fortyk",socketOp);
                    }
                }else{
                    chatFirstAid.content=`${characterActor.name} failed to heal ${targetActor.name}...` 
                }
                await ChatMessage.create(chatFirstAid,{});

            }
        }
    },
    default: "submit",


    width:100}
          ).render(true);