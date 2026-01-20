let applyChanges = false;

new Dialog({
    title: `Roll Weather`,
    content: `
<form>


<div class="form-group">
<label>Additional Modifier</label>
<input type="text" name="mod" value="0">
</div>
</form>
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
       
        let mod=parseInt(html.find('[name="mod"]')[0].value);

        const table = game.tables.find(t => t.name === "Warp Encounter");
        let roll = new Roll(`1d100 + ${mod}`); 
        let result = await table.draw({roll});



    }
}).render(true);