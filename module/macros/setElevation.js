new Dialog({
    title: "Set Elevation",
    content: `<div><label>Elevation:</label> <input id="elevation" type="text" name="elevation" value="0" autofocus/></div>`,
    buttons: {
        submit: {
            label: 'OK',
            callback: async(html) => {
                let elevation = Number($(html).find('input[name="elevation"]').val());

                for(let token of canvas.tokens.controlled){
                   
                    token.document.update({elevation: elevation});
                }

            }
        }
    },
    default: "submit",


    width:100}
          ).render(true);