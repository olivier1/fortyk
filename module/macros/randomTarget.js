let combatants=game.combat.combatants.entries().toArray();
let size=combatants.length;
let roll=new Roll(`1d${size}`);
                await roll.roll();
let index=roll.total;
let combatant=combatants[index-1][1];
game.canvas.ping({x:combatant.token.x,y:combatant.token.y});
let chatScatter= {author: game.user,
                  content:combatant.name,
                                      flavor:"Random Target"};
                    ChatMessage.create(chatScatter,{});