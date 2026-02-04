let applyChanges = false;

new Dialog({
    title: `Roll Weather`,
    content: `
<section>
<div class="form-group">
<label>Season</label>
<select id="season" name="season">
<option value="Weather-Spring">Spring</option>
<option value="Weather-Summer">Summer</option>
<option value="Weather-Autumn">Autumn</option>
<option value="Weather-Winter">Winter</option>
</select>
</div>
<div class="form-group">
<label>Season Time</label>
<select id="seasontime" name="seasontime">
<option value="0">Height</option>
<option value="-1">Early</option>
<option value="1">Late</option>
</select>
</div>
</section>
`,
    buttons: {
        yes: {
            icon: "<i class='fas fa-check'></i>",
            label: `Roll`,
            callback: async () => applyChanges = true
        },
    },
    default: "yes",
    close:  async (html) =>  {
        let season= html.find('[name="season"]')[0].value;
        let mod= parseInt(html.find('[name="seasontime"]')[0].value);

        const table = game.tables.find(t => t.name === season);
        let roll = new Roll(`3d6 + ${mod}`); 
        let result = await table.draw({roll});



    }
}).render(true);
