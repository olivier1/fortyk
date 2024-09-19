let chatScatter={user: game.user._id,
                 speaker:{actor,alias:game.user.name},
                 content:`Scatter! <img class="fortyk" src="../systems/fortyk/icons/scatter.png">`,
                 flavor:"Rolling Scatters!",
                 author:game.user.id};
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