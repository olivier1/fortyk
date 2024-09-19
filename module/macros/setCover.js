new Dialog({
    title: "Set Cover",
    content: `<div><label>Cover:</label> <select id="cover"  name="cover">

<option value="0">None</option>
<option value="0.1">Light Cover</option>
<option value="0.3">Medium Cover</option>
<option value="0.5">Heavy Cover</option>

</select></div>`,
    buttons: {
        submit: {
            label: 'OK',
            callback: async(html) => {
                let coverSelect = $(html).find('#cover option:selected');
                let label=coverSelect.text();
                console.log(coverSelect);
                let cover=parseFloat(coverSelect.val());
                console.log(label, cover);
                for(let token of canvas.tokens.controlled){
                    let actor=token.actor;
                    actor.update({"system.secChar.cover.value":cover});
                }
                let chatCover={user: game.user._id,
                                 speaker:{actor,alias:game.user.name},
                                 content:`Set ${label} on selected`,
                                 flavor:"Cover Set",
                                 author:game.user.id};
                await ChatMessage.create(chatCover,{});

            }
        }
    },
    default: "submit",


    width:100}
          ).render(true);