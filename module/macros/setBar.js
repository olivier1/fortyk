
new Dialog({
    title: "Set Elevation",
    content: `<div><label>Value:</label> <input id="elevation" type="text" name="max" value="0" autofocus/></div>
    `,
    buttons: {
        submit: {
            label: 'OK',
            callback: async(html) => {
                let max = Number($(html).find('input[name="max"]').val());

                for(let token of canvas.tokens.controlled){


                    token.document.update({
                        "flags.barbrawl.resourceBars": {
                            "bar1": {
                                id: "bar1",
                                attribute: "custom",
                                ownerVisibility: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
                                otherVisibility: CONST.TOKEN_DISPLAY_MODES.ALWAYS,
                                gmVisibility: -1,
                                hideCombat: false,
                                hideNoCombat: false,
                                hideEmpty: false,
                                hideFull: false,
                                hideHud: false,
                                value: max,
                                max: max,
                                mincolor: "#FF0000",
                                maxcolor: "#80FF00",
                                position: "bottom-inner",
                                indentLeft: 0,
                                indentRight: 0,
                                shareHeight: false,
                                style: "user",
                                opacity: 80,
                                ignoreMin: false,
                                ignoreMax: false,
                                invert: false,
                                invertDirection: false,
                                label: "",
                                subdivisions: 0,
                                subdivisionsOwner: false,
                                fgImage: "",
                                bgImage: ""

                            }
                        }
                    }
                                         );


                }

            }
        }
    },
    default: "",
    render: (html)=>{
        html.find("input[id='elevation']").select();},


    width:100}
          ).render(true);
switchCase(item.avail,'0',true,'1',type%10==1|type%10==2,'2',item.avail==type%10,'3',item.avail==type%10)
    
