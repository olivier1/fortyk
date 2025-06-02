let chatScatter={author: game.user._id,
                 speaker:{actor,alias:game.user.name},
                 content:`Scatter! <img class="fortyk" src="../systems/fortyk/icons/scatter.png">`,
                 flavor:"Rolling Scatters!"};
await ChatMessage.create(chatScatter,{});
let distanceRoll=new Roll("1d5");
await distanceRoll.evaluate();
await distanceRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: "Rolling for scatter distance."
});
let directionRoll=new Roll("1d10");
await directionRoll.evaluate();
await directionRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: "Rolling for scatter direction."
});