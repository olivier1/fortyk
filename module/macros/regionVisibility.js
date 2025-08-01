new Dialog({
    title: "Select Layer Visibility",
    content: `<div><label>Layer Visibility:</label>
    <select name="visibility">
    
    <option value="${CONST.REGION_VISIBILITY.ALWAYS}">Always Visible</option>
    <option value="${CONST.REGION_VISIBILITY.LAYER}">Visible on Layer Only</option>
    <option value="${CONST.REGION_VISIBILITY.GAMEMASTER}">Always for GM</option>
    </select></div>
    `,
    buttons: {
        submit: {
            label: "OK",
            callback: async (html) => {
                let vis = Number($(html).find('select[name="visibility"]').val());

                let regions= game.scenes.current.regions;
                regions.forEach( (region)=>{
                    region.update({visibility:vis});
                });
            }
        }
    },
    default: "submit",

    width: 100
}).render(true);
