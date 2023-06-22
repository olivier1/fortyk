let stack=game.cards.filter(cards => cards.name==="Emperor's Tarot")[0];
await stack.recall();
await stack.shuffle();
let hands=game.cards.filter(cards => cards.type==="hand");
console.log(hands);
for(let i=0; i<hands.length;i++){
    let hand=hands[i];
    let owners=hand.ownership
    for(const id in owners){
        let user=game.users.get(id);
        
        if(user&&!user.isGM){
            let actor=user.character;
            let fateSize=actor.system.secChar.fate.max;
            await stack.deal([hand],fateSize);
        }
    }
}