let token=scope.event.data.token;
let actor=token.actor;
for(const effect of actor.effects){
if(effect.statuses.has("rough"))effect.delete();
}