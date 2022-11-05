let token=canvas.tokens.controlled;
let actorId=token[0].actorId;
let actor=game.actors.get(actorId);
for(let i=1;i<9;i++){
   game.fortyk.FortykRolls.energyHeadCrits(actor,i,false); 
}